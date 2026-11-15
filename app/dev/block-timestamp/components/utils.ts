import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { rpcRequest } from "../../evm-transaction-simulator/components/utils";

dayjs.extend(utc);

export interface BlockInfo {
  number: number;
  timestamp: number; // unix seconds
  hash: string;
}

/**
 * Fetches block headers over JSON-RPC and caches them, so the searches below
 * never ask for the same block twice. `calls` counts the requests sent.
 */
export class BlockReader {
  private cache = new Map<number, BlockInfo>();
  calls = 0;
  constructor(public rpc: string) {}

  private static parse(raw: { number: string; timestamp: string; hash: string }): BlockInfo {
    return { number: Number(BigInt(raw.number)), timestamp: Number(BigInt(raw.timestamp)), hash: raw.hash };
  }

  async get(tag: number | "latest"): Promise<BlockInfo> {
    if (typeof tag === "number") {
      const hit = this.cache.get(tag);
      if (hit) return hit;
    }
    this.calls++;
    const raw = await rpcRequest<{ number: string; timestamp: string; hash: string } | null>(
      this.rpc,
      "eth_getBlockByNumber",
      [typeof tag === "number" ? "0x" + tag.toString(16) : tag, false]
    );
    if (!raw) throw new Error(`Block ${tag} was not found on this chain`);
    const block = BlockReader.parse(raw);
    this.cache.set(block.number, block);
    return block;
  }

  /** Average seconds per block over the last `span` blocks (at least 1 block). */
  async avgBlockTime(latest: BlockInfo, span = 10_000): Promise<number> {
    const back = Math.max(0, latest.number - span);
    if (back === latest.number) return 0;
    const old = await this.get(back);
    // block 0 of some chains has timestamp 0; fall back to block 1 then
    const ref = old.timestamp === 0 && back === 0 && latest.number > 1 ? await this.get(1) : old;
    const blocks = latest.number - ref.number;
    return blocks > 0 ? (latest.timestamp - ref.timestamp) / blocks : 0;
  }

  /**
   * Largest block number in [lo, hi] whose header satisfies `pred`, given that
   * `pred(lo)` is true and the predicate is monotonic (true…true false…false).
   * Uses interpolation on timestamps, falling back to bisection when a guess
   * does not halve the range, so it needs ~log2(n) requests at worst and far
   * fewer on chains with a steady block time.
   */
  private async searchLast(
    lo: BlockInfo,
    hi: BlockInfo,
    target: number,
    pred: (b: BlockInfo) => boolean
  ): Promise<BlockInfo> {
    // invariant: pred(lo) true, pred(hi) false
    let bisectNext = false;
    while (hi.number - lo.number > 1) {
      const span = hi.number - lo.number;
      let guess: number;
      if (!bisectNext && hi.timestamp > lo.timestamp) {
        const frac = (target - lo.timestamp) / (hi.timestamp - lo.timestamp);
        guess = lo.number + Math.round(frac * span);
      } else {
        guess = lo.number + Math.floor(span / 2);
      }
      guess = Math.min(hi.number - 1, Math.max(lo.number + 1, guess));
      const b = await this.get(guess);
      if (pred(b)) lo = b;
      else hi = b;
      bisectNext = hi.number - lo.number > span / 2;
    }
    return lo;
  }

  /**
   * Blocks around a unix time:
   * - before: the last block with timestamp <= target (null if the chain is younger)
   * - after:  the first block with timestamp >= target (null if it is not mined yet)
   */
  async findByTime(target: number, latestBlock?: BlockInfo) {
    const latest = latestBlock ?? (await this.get("latest"));
    let first = await this.get(0);
    // Genesis blocks often carry timestamp 0; start from block 1 then
    if (first.timestamp === 0 && latest.number >= 1) first = await this.get(1);

    let before: BlockInfo | null = null;
    let after: BlockInfo | null = null;

    if (target < first.timestamp) {
      after = first;
    } else if (target >= latest.timestamp) {
      before = latest;
      if (latest.timestamp === target) after = await this.firstAtOrAfter(first, latest, target);
    } else {
      // first.ts <= target < latest.ts
      before = await this.searchLast(first, latest, target, (b) => b.timestamp <= target);
      after =
        before.timestamp === target
          ? await this.firstAtOrAfter(first, before, target)
          : await this.get(before.number + 1);
    }
    return { before, after, latest, first };
  }

  // first block with timestamp >= target, knowing upto.timestamp >= target
  private async firstAtOrAfter(first: BlockInfo, upto: BlockInfo, target: number) {
    if (first.timestamp >= target) return first;
    const last = await this.searchLast(first, upto, target - 1, (b) => b.timestamp < target);
    return last.number === upto.number ? upto : this.get(last.number + 1);
  }
}

// ---------------------------------------------------------------------------
// Time input
// ---------------------------------------------------------------------------

/**
 * Parse a time typed by the user into unix seconds. Accepts a unix timestamp
 * in seconds or milliseconds, or a date such as "2024-03-01 12:00",
 * "2024-03-01T12:00:00Z" or "2024-03-01T12:00:00+07:00". A date without an
 * offset is read in UTC or in the browser's time zone depending on `zone`.
 */
export function parseTimeInput(input: string, zone: "UTC" | "Local"): number | null {
  const s = input.trim();
  if (!s) return null;
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = Number(s);
    // 13+ digits = milliseconds
    return Math.floor(s.split(".")[0].length >= 12 ? n / 1000 : n);
  }
  const hasOffset = /(Z|[+-]\d{2}:?\d{2})$/i.test(s);
  const normalized = s.replace(/^(\d{4}-\d{2}-\d{2})\s+/, "$1T");
  const d = hasOffset ? dayjs(normalized) : zone === "UTC" ? dayjs.utc(normalized) : dayjs(normalized);
  if (!d.isValid()) return null;
  return Math.floor(d.valueOf() / 1000);
}

export function nowInputValue(zone: "UTC" | "Local"): string {
  const d = zone === "UTC" ? dayjs.utc() : dayjs();
  return d.format("YYYY-MM-DD HH:mm:ss");
}

export function parseBlockList(input: string): (number | "latest")[] {
  return input
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      if (/^latest$/i.test(s)) return "latest" as const;
      const clean = s.replace(/_/g, "");
      if (/^0x[0-9a-f]+$/i.test(clean)) return Number(BigInt(clean));
      if (/^\d+$/.test(clean)) return Number(clean);
      throw new Error(`"${s}" is not a block number`);
    });
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export const fmtUtc = (ts: number) => dayjs.utc(ts * 1000).format("YYYY-MM-DD HH:mm:ss") + " UTC";
export const fmtLocal = (ts: number) => dayjs(ts * 1000).format("YYYY-MM-DD HH:mm:ss [GMT]Z");
export const fmtIso = (ts: number) => dayjs.utc(ts * 1000).format("YYYY-MM-DDTHH:mm:ss[Z]");
export const toHex = (n: number) => "0x" + n.toString(16);

/** "3m 12s", "2d 4h" … for a number of seconds (sign ignored) */
export function fmtDuration(seconds: number): string {
  let s = Math.round(Math.abs(seconds));
  if (s === 0) return "0s";
  const units: [string, number][] = [
    ["y", 365 * 86400],
    ["d", 86400],
    ["h", 3600],
    ["m", 60],
    ["s", 1],
  ];
  const parts: string[] = [];
  for (const [u, size] of units) {
    if (s >= size) {
      parts.push(`${Math.floor(s / size)}${u}`);
      s %= size;
    }
    if (parts.length === 2) break;
  }
  return parts.join(" ");
}

/** "+12s" / "-3m 4s" relative to a reference */
export const fmtOffset = (seconds: number) =>
  seconds === 0 ? "exact" : `${seconds > 0 ? "+" : "-"}${fmtDuration(seconds)}`;

export const fmtRelative = (ts: number, now = Math.floor(Date.now() / 1000)) => {
  const d = ts - now;
  if (Math.abs(d) < 1) return "now";
  return d < 0 ? `${fmtDuration(d)} ago` : `in ${fmtDuration(d)}`;
};
