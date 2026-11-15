import { Abi, decodeErrorResult, Hex, parseAbiItem, PublicClient, toFunctionSelector } from "viem";
type AbiError = Extract<Abi[number], { type: "error" }>;
import { formatParamType, lookupSignatures, shortError } from "@/common/evmTools";

export const PANIC_CODES: Record<number, string> = {
  0x00: "Generic compiler panic",
  0x01: "assert() failed",
  0x11: "Arithmetic overflow or underflow",
  0x12: "Division or modulo by zero",
  0x21: "Conversion to an invalid enum value",
  0x22: "Incorrectly encoded storage byte array",
  0x31: "pop() on an empty array",
  0x32: "Array index out of bounds",
  0x41: "Out of memory (allocation too large)",
  0x51: "Call to an uninitialized internal function",
};

export interface DecodedRevert {
  data: Hex;
  kind: "empty" | "error-string" | "panic" | "custom" | "unknown";
  name?: string;
  signature?: string;
  message?: string;
  args?: { name: string; type: string; value: unknown }[];
  source?: "builtin" | "abi" | "4byte";
  candidates?: string[];
  lookupFailed?: boolean;
}

/**
 * Find revert data in whatever the user pasted: bare hex, a JSON-RPC error
 * object, or an error message with the data somewhere inside.
 */
export function extractRevertData(text: string): Hex {
  const t = text.trim();
  if (/^0x[0-9a-fA-F]*$/.test(t)) return t as Hex;
  if (/^[0-9a-fA-F]+$/.test(t) && t.length % 2 === 0) return `0x${t}` as Hex;
  try {
    const json = JSON.parse(t);
    const find = (v: unknown): string | undefined => {
      if (typeof v === "string" && /^0x[0-9a-fA-F]{8,}$/.test(v)) return v;
      if (v && typeof v === "object") {
        const o = v as Record<string, unknown>;
        for (const k of ["data", "error", "originalError", "cause", "info"]) {
          const hit = find(o[k]);
          if (hit) return hit;
        }
        for (const val of Object.values(o)) {
          const hit = find(val);
          if (hit) return hit;
        }
      }
      return undefined;
    };
    const hit = find(json);
    if (hit) return hit as Hex;
  } catch {
    // not JSON
  }
  const match = t.match(/0x[0-9a-fA-F]{8,}/g);
  if (match) return match.sort((a, b) => b.length - a.length)[0] as Hex;
  throw new Error("No hex revert data found in the input");
}

const argsOf = (item: AbiError, args: readonly unknown[] | undefined) =>
  item.inputs.map((p, i) => ({ name: p.name || `arg${i}`, type: formatParamType(p), value: args?.[i] }));

const sigOf = (e: AbiError) => `${e.name}(${e.inputs.map(formatParamType).join(",")})`;

export async function decodeRevert(data: Hex, abi: Abi): Promise<DecodedRevert> {
  if (data === "0x" || data.length < 10) return { data, kind: "empty" };
  const selector = data.slice(0, 10).toLowerCase();

  if (selector === "0x08c379a0") {
    const r = decodeErrorResult({ data });
    const message = String(r.args?.[0] ?? "");
    return { data, kind: "error-string", name: "Error", signature: "Error(string)", message, args: [{ name: "reason", type: "string", value: message }], source: "builtin" };
  }
  if (selector === "0x4e487b71") {
    const r = decodeErrorResult({ data });
    const code = Number(r.args?.[0] ?? 0);
    return {
      data,
      kind: "panic",
      name: "Panic",
      signature: "Panic(uint256)",
      message: `0x${code.toString(16).padStart(2, "0")}: ${PANIC_CODES[code] || "Unknown panic code"}`,
      args: [{ name: "code", type: "uint256", value: code }],
      source: "builtin",
    };
  }

  const errors = abi.filter((x): x is AbiError => x.type === "error");
  const own = errors.find((e) => toFunctionSelector(sigOf(e)).toLowerCase() === selector);
  if (own) {
    try {
      const r = decodeErrorResult({ abi: [own], data });
      return { data, kind: "custom", name: own.name, signature: sigOf(own), args: argsOf(own, r.args), source: "abi" };
    } catch (e) {
      return { data, kind: "custom", name: own.name, signature: sigOf(own), message: shortError(e), source: "abi" };
    }
  }

  const found = await lookupSignatures([selector]);
  const candidates = found.functions[selector] || [];
  for (const sig of candidates) {
    try {
      const item = parseAbiItem(`error ${sig}`) as AbiError;
      const r = decodeErrorResult({ abi: [item], data });
      return { data, kind: "custom", name: item.name, signature: sigOf(item), args: argsOf(item, r.args), source: "4byte", candidates };
    } catch {
      // next candidate
    }
  }
  return { data, kind: "unknown", candidates, lookupFailed: found.failed };
}

/** Replay a mined transaction with eth_call at its block to get the revert data. */
export async function revertDataFromTx(client: PublicClient, hash: Hex): Promise<{ data: Hex; status: string }> {
  const tx = await client.getTransaction({ hash });
  let status = "pending";
  try {
    const receipt = await client.getTransactionReceipt({ hash });
    status = receipt.status;
  } catch {
    // not mined yet
  }
  try {
    await client.call({
      account: tx.from,
      to: tx.to ?? undefined,
      data: tx.input,
      value: tx.value,
      gas: tx.gas,
      blockNumber: tx.blockNumber ? tx.blockNumber - BigInt(1) : undefined,
    });
    return { data: "0x", status };
  } catch (e) {
    let cur: unknown = e;
    while (cur) {
      const c = cur as { data?: unknown; cause?: unknown };
      if (typeof c.data === "string" && c.data.startsWith("0x")) return { data: c.data as Hex, status };
      if (c.data && typeof c.data === "object" && typeof (c.data as { data?: unknown }).data === "string") {
        return { data: (c.data as { data: Hex }).data, status };
      }
      cur = c.cause;
    }
    throw e;
  }
}
