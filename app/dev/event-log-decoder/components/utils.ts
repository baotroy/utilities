import { Abi, AbiEvent, decodeEventLog, Hex, parseAbiItem, toEventSelector } from "viem";
import { formatParamType, lookupSignatures, shortError } from "@/common/evmTools";

export interface RawLog {
  address?: string;
  topics: Hex[];
  data: Hex;
  logIndex?: number;
}

export interface DecodedArg {
  name: string;
  type: string;
  indexed: boolean;
  value: unknown;
}

export interface DecodedLog {
  log: RawLog;
  name?: string;
  signature?: string;
  args?: DecodedArg[];
  source?: "abi" | "4byte";
  error?: string;
}

const HEX = /^0x[0-9a-fA-F]*$/;

/** Topics: one per line, or a JSON array. */
export function parseTopics(text: string): Hex[] {
  const t = text.trim();
  if (!t) return [];
  const list: string[] = t.startsWith("[") ? JSON.parse(t) : t.split(/[\s,]+/).filter(Boolean);
  return list.map((x) => {
    const v = String(x).replace(/^"|"$/g, "");
    if (!HEX.test(v) || v.length !== 66) throw new Error(`"${v}" is not a 32-byte topic`);
    return v.toLowerCase() as Hex;
  });
}

/** Accept one log object or an array of logs (e.g. receipt.logs). */
export function parseLogJson(text: string): RawLog[] {
  const json = JSON.parse(text);
  const list = Array.isArray(json) ? json : Array.isArray(json?.logs) ? json.logs : [json];
  return list.map((l: { address?: string; topics?: string[]; data?: string; logIndex?: string | number }) => {
    if (!Array.isArray(l?.topics)) throw new Error("Each log needs a topics array");
    return {
      address: l.address,
      topics: l.topics as Hex[],
      data: (l.data || "0x") as Hex,
      logIndex: l.logIndex === undefined ? undefined : Number(l.logIndex),
    };
  });
}

const toArgs = (event: AbiEvent, args: unknown): DecodedArg[] =>
  event.inputs.map((input, i) => ({
    name: input.name || `arg${i}`,
    type: formatParamType(input),
    indexed: !!input.indexed,
    value: Array.isArray(args)
      ? args[i]
      : (args as Record<string, unknown>)?.[input.name || String(i)],
  }));

const eventSignature = (e: AbiEvent) => `${e.name}(${e.inputs.map(formatParamType).join(",")})`;

/** All ways to pick k indexes out of n, in order. */
function combinations(n: number, k: number): number[][] {
  const out: number[][] = [];
  const walk = (start: number, acc: number[]) => {
    if (acc.length === k) return void out.push(acc);
    for (let i = start; i < n; i++) walk(i + 1, [...acc, i]);
  };
  walk(0, []);
  return out;
}

/**
 * A 4byte signature does not say which params are indexed: try every
 * placement that matches the number of topics until one decodes cleanly.
 */
function decodeWithSignature(sig: string, log: RawLog): { event: AbiEvent; args: unknown } | null {
  let base: AbiEvent;
  try {
    base = parseAbiItem(`event ${sig}`) as AbiEvent;
  } catch {
    return null;
  }
  const indexedCount = log.topics.length - 1;
  if (indexedCount > base.inputs.length) return null;
  for (const picks of combinations(base.inputs.length, indexedCount)) {
    const event: AbiEvent = {
      ...base,
      inputs: base.inputs.map((p, i) => ({ ...p, indexed: picks.includes(i) })),
    };
    try {
      const decoded = decodeEventLog({ abi: [event], topics: log.topics as [Hex, ...Hex[]], data: log.data, strict: true });
      return { event, args: decoded.args };
    } catch {
      // try the next placement
    }
  }
  return null;
}

export async function decodeLogs(logs: RawLog[], abi: Abi): Promise<DecodedLog[]> {
  const events = abi.filter((x): x is AbiEvent => x.type === "event");
  const bySelector = new Map(events.map((e) => [toEventSelector(e).toLowerCase(), e]));

  const results: DecodedLog[] = logs.map((log) => {
    const topic0 = log.topics[0]?.toLowerCase();
    const event = topic0 ? bySelector.get(topic0) : undefined;
    if (!event) return { log };
    try {
      const decoded = decodeEventLog({ abi: [event], topics: log.topics as [Hex, ...Hex[]], data: log.data });
      return { log, name: event.name, signature: eventSignature(event), args: toArgs(event, decoded.args), source: "abi" };
    } catch (e) {
      return { log, name: event.name, signature: eventSignature(event), error: shortError(e) };
    }
  });

  const missing = results.filter((r) => !r.name && r.log.topics[0]).map((r) => r.log.topics[0]);
  if (missing.length) {
    const found = await lookupSignatures([], missing);
    for (const r of results) {
      if (r.name || !r.log.topics[0]) continue;
      const sigs = found.events[r.log.topics[0].toLowerCase()] || [];
      for (const sig of sigs) {
        const hit = decodeWithSignature(sig, r.log);
        if (hit) {
          Object.assign(r, {
            name: hit.event.name,
            signature: eventSignature(hit.event),
            args: toArgs(hit.event, hit.args),
            source: "4byte",
          });
          break;
        }
      }
      if (!r.name) {
        r.error = sigs.length
          ? `Found ${sigs[0]} in 4byte, but it does not fit this log's topics and data.`
          : found.failed
            ? "Not in your ABI, and the 4byte signature database could not be reached: add the event to the ABI."
            : "Unknown event: add its ABI to decode it.";
      }
    }
  }
  for (const r of results) if (!r.log.topics[0] && !r.name) r.error = "Anonymous log (no topics): add its ABI to decode it.";
  return results;
}
