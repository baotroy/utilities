/**
 * Shared helpers for the EVM tools (ABI encoder, event/revert decoders,
 * signature verifier, address tools, storage reader): ABI parsing, a saved
 * ABI library in localStorage, chain list, 4byte lookups and argument parsing.
 */
import {
  Abi,
  AbiParameter,
  createPublicClient,
  getAddress,
  http,
  isHex,
  padHex,
  parseAbi,
  PublicClient,
  stringToHex,
} from "viem";

// ---------------------------------------------------------------------------
// Chains (public RPCs, no API key)
// ---------------------------------------------------------------------------

export interface EvmChain {
  id: number;
  name: string;
  rpc: string;
  explorer: string;
}

export const EVM_CHAINS: EvmChain[] = [
  { id: 1, name: "Ethereum", rpc: "https://ethereum-rpc.publicnode.com", explorer: "https://etherscan.io" },
  { id: 56, name: "BNB Smart Chain", rpc: "https://bsc-rpc.publicnode.com", explorer: "https://bscscan.com" },
  { id: 137, name: "Polygon", rpc: "https://polygon-bor-rpc.publicnode.com", explorer: "https://polygonscan.com" },
  { id: 42161, name: "Arbitrum One", rpc: "https://arbitrum-one-rpc.publicnode.com", explorer: "https://arbiscan.io" },
  { id: 10, name: "Optimism", rpc: "https://optimism-rpc.publicnode.com", explorer: "https://optimistic.etherscan.io" },
  { id: 8453, name: "Base", rpc: "https://base-rpc.publicnode.com", explorer: "https://basescan.org" },
  { id: 43114, name: "Avalanche C-Chain", rpc: "https://avalanche-c-chain-rpc.publicnode.com", explorer: "https://snowtrace.io" },
  { id: 11155111, name: "Sepolia", rpc: "https://ethereum-sepolia-rpc.publicnode.com", explorer: "https://sepolia.etherscan.io" },
];

export const getClient = (rpc: string): PublicClient =>
  createPublicClient({ transport: http(rpc.trim(), { timeout: 20_000 }) }) as PublicClient;

// ---------------------------------------------------------------------------
// ABI parsing
// ---------------------------------------------------------------------------

const KIND_PREFIX = /^(function|event|error|constructor|fallback|receive|struct)\b/;

/**
 * Parse an ABI given as JSON (an array, or an object with an `abi` field such
 * as a Hardhat/Foundry artifact) or as human-readable signatures, one per
 * line. Lines without a kind keyword are treated as functions.
 */
export function parseAbiText(text: string): Abi {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const json = JSON.parse(trimmed);
    const abi = Array.isArray(json) ? json : json.abi;
    if (!Array.isArray(abi)) throw new Error("JSON has no ABI array");
    return abi as Abi;
  }
  const lines = trimmed
    .split(/\n/)
    .map((l) => l.trim().replace(/;$/, ""))
    .filter((l) => l && !l.startsWith("//"))
    .map((l) => (KIND_PREFIX.test(l) ? l : `function ${l}`));
  return parseAbi(lines) as Abi;
}

/** Same as parseAbiText, but returns the error message instead of throwing. */
export function tryParseAbi(text: string): { abi: Abi; error: string } {
  try {
    return { abi: parseAbiText(text), error: "" };
  } catch (e) {
    return { abi: [], error: shortError(e) };
  }
}

export const shortError = (e: unknown): string => {
  const err = e as { shortMessage?: string; message?: string };
  return (err?.shortMessage || err?.message || String(e)).split("\n")[0];
};

// ---------------------------------------------------------------------------
// Saved ABI library, shared by every EVM tool
// ---------------------------------------------------------------------------

export interface SavedAbi {
  name: string;
  abi: string;
}

const LIBRARY_KEY = "evm-abi-library";

export function readAbiLibrary(): SavedAbi[] {
  try {
    const list = JSON.parse(localStorage.getItem(LIBRARY_KEY) || "[]");
    return Array.isArray(list)
      ? list.filter((x) => typeof x?.name === "string" && typeof x?.abi === "string")
      : [];
  } catch {
    return [];
  }
}

export function writeAbiLibrary(list: SavedAbi[]): void {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("evm-abi-library"));
  } catch {
    // storage unavailable: the library is optional
  }
}

// ---------------------------------------------------------------------------
// 4byte signature lookup (Sourcify, no API key)
// ---------------------------------------------------------------------------

const SIGNATURE_API = "https://api.4byte.sourcify.dev/signature-database/v1/lookup";

/** Look up function/error selectors (4 bytes) and event topics (32 bytes). */
export async function lookupSignatures(
  selectors: string[],
  topics: string[] = []
): Promise<{ functions: Record<string, string[]>; events: Record<string, string[]>; failed: boolean }> {
  const out = { functions: {} as Record<string, string[]>, events: {} as Record<string, string[]>, failed: false };
  const fns = Array.from(new Set(selectors.map((s) => s.toLowerCase())));
  const evs = Array.from(new Set(topics.map((s) => s.toLowerCase())));
  if (!fns.length && !evs.length) return out;
  const params = new URLSearchParams();
  if (fns.length) params.set("function", fns.join(","));
  if (evs.length) params.set("event", evs.join(","));
  params.set("filter", "true");
  try {
    const res = await fetch(`${SIGNATURE_API}?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const pick = (m: Record<string, { name: string }[] | null> | undefined, target: Record<string, string[]>) => {
      for (const [k, v] of Object.entries(m || {})) if (v?.length) target[k.toLowerCase()] = v.map((x) => x.name);
    };
    pick(json?.result?.function, out.functions);
    pick(json?.result?.event, out.events);
  } catch {
    // offline or API down: callers fall back to raw output
    out.failed = true;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------

/** JSON.stringify that prints bigints as decimal strings. */
export const stringifyValue = (value: unknown, space = 2): string =>
  JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? v.toString() : v), space) ?? "";

/** Display a decoded ABI value: scalars as text, arrays/tuples as JSON. */
export const formatValue = (value: unknown): string => {
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string") return value;
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  return stringifyValue(value, 0);
};

/** "1e18", "0x10", "1_000" -> bigint */
export function parseBigIntInput(raw: string): bigint {
  const s = raw.trim().replace(/[_,\s]/g, "");
  if (!s) throw new Error("empty number");
  if (/^-?0x[0-9a-f]+$/i.test(s)) {
    return s.startsWith("-") ? -BigInt(s.slice(1)) : BigInt(s);
  }
  const sci = s.match(/^(-?)(\d+)(?:\.(\d+))?e(\d+)$/i);
  if (sci) {
    const [, sign, int, frac = "", exp] = sci;
    const e = Number(exp);
    if (frac.length > e) throw new Error(`${raw} is not a whole number`);
    const v = BigInt(int + frac + "0".repeat(e - frac.length));
    return sign ? -v : v;
  }
  if (!/^-?\d+$/.test(s)) throw new Error(`"${raw}" is not an integer`);
  return BigInt(s);
}

const parseJsonLoose = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    // allow [0xabc, 12] without quotes
    return JSON.parse(raw.replace(/(?<=[[,\s])(0x[0-9a-fA-F]*)(?=[\],\s])/g, '"$1"'));
  }
};

/**
 * Turn user input for one ABI parameter into the value viem expects.
 * Arrays and tuples are written as JSON, e.g. [1,2] or ["0xabc", 5].
 */
export function parseAbiArg(param: AbiParameter, raw: unknown): unknown {
  const type = param.type;
  const arrayMatch = type.match(/^(.*)\[(\d*)\]$/);
  if (arrayMatch) {
    const list = typeof raw === "string" ? parseJsonLoose(raw.trim() || "[]") : raw;
    if (!Array.isArray(list)) throw new Error(`${param.name || type}: expected a JSON array`);
    const inner = { ...param, type: arrayMatch[1] } as AbiParameter;
    if (arrayMatch[2] && list.length !== Number(arrayMatch[2])) {
      throw new Error(`${param.name || type}: expected ${arrayMatch[2]} items, got ${list.length}`);
    }
    return list.map((item) => parseAbiArg(inner, item));
  }
  if (type === "tuple") {
    const components = (param as { components?: readonly AbiParameter[] }).components || [];
    const value = typeof raw === "string" ? parseJsonLoose(raw.trim() || "[]") : raw;
    if (Array.isArray(value)) {
      if (value.length !== components.length) {
        throw new Error(`${param.name || "tuple"}: expected ${components.length} fields`);
      }
      return components.map((c, i) => parseAbiArg(c, value[i]));
    }
    if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      return Object.fromEntries(components.map((c, i) => [c.name || i, parseAbiArg(c, obj[c.name || i])]));
    }
    throw new Error(`${param.name || "tuple"}: expected a JSON array or object`);
  }
  const text = raw === undefined || raw === null ? "" : String(raw).trim();
  if (/^u?int\d*$/.test(type)) {
    try {
      return parseBigIntInput(text);
    } catch (e) {
      throw new Error(`${param.name || type}: ${text ? (e as Error).message : "enter a number"}`);
    }
  }
  if (type === "bool") {
    if (/^(true|1|yes)$/i.test(text)) return true;
    if (/^(false|0|no|)$/i.test(text)) return false;
    throw new Error(`${param.name || type}: expected true or false`);
  }
  if (type === "address") {
    try {
      const body = text.slice(2);
      const sameCase = body === body.toLowerCase() || body === body.toUpperCase();
      return getAddress(sameCase ? text.toLowerCase() : text);
    } catch {
      throw new Error(`${param.name || type}: "${text}" is not a valid address`);
    }
  }
  if (type === "bytes") {
    if (isHex(text)) return text;
    return stringToHex(text);
  }
  const fixed = type.match(/^bytes(\d+)$/);
  if (fixed) {
    const size = Number(fixed[1]);
    const hex = isHex(text) ? text : stringToHex(text);
    if ((hex.length - 2) / 2 > size) throw new Error(`${param.name || type}: longer than ${size} bytes`);
    return isHex(text) && (hex.length - 2) / 2 === size ? hex : padHex(hex, { size, dir: isHex(text) ? "left" : "right" });
  }
  return text; // string
}

/** Readable parameter list: "address to, uint256 amount" */
export const describeParams = (params: readonly AbiParameter[]): string =>
  params.map((p) => `${formatParamType(p)}${p.name ? ` ${p.name}` : ""}`).join(", ");

export const formatParamType = (p: AbiParameter): string => {
  if (p.type.startsWith("tuple")) {
    const comps = (p as { components?: readonly AbiParameter[] }).components || [];
    return `(${comps.map(formatParamType).join(",")})${p.type.slice(5)}`;
  }
  return p.type;
};

/** Placeholder text for an input of this type. */
export const placeholderFor = (p: AbiParameter): string => {
  if (p.type.endsWith("]")) return "JSON array, e.g. [1, 2]";
  if (p.type === "tuple") return "JSON array or object of the fields";
  if (p.type === "address") return "0x…";
  if (p.type === "bool") return "true / false";
  if (/^u?int/.test(p.type)) return "123, 0x7b or 1e18";
  if (p.type.startsWith("bytes")) return "0x… or text";
  return "text";
};
