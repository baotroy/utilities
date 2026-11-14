import { FunctionFragment, Interface, ParamType } from "ethers";
import { IDecodedParam, IDecodeResult, IFunctionFragement } from "./type";

const signatureDataApi = process.env.NEXT_PUBLIC_SIGNATURE_DATA_API;
const sourcify4ByteApi =
  "https://api.4byte.sourcify.dev/signature-database/v1/lookup?function=";

// Maximum recursion depth to prevent infinite loops
const MAX_DEPTH = 10;

export type DecodeErrorCode = "invalid" | "network" | "abi";

export class DecodeError extends Error {
  code: DecodeErrorCode;
  constructor(code: DecodeErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

interface SignatureEntry {
  name?: string;
  filtered?: boolean;
  hasVerifiedContract?: boolean;
}

// Both APIs answer with:
// { "result": { "function": { "0x...": [{ "name": "transfer(address,uint256)" }] } } }
// Throws when the service cannot be reached, returns [] when it knows nothing.
async function fetchSignatures(url: string, selector: string): Promise<string[]> {
  const response = await fetch(url + selector);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const list: SignatureEntry[] = data?.result?.function?.[selector];
  if (!Array.isArray(list)) return [];
  const rank = (e: SignatureEntry) =>
    (e.hasVerifiedContract ? 0 : 1) + (e.filtered ? 2 : 0);
  return [...list]
    .sort((a, b) => rank(a) - rank(b)) // verified, non-spam signatures first
    .map((item) => item?.name)
    .filter((name): name is string => !!name);
}

// Cache lookups per selector: nested calldata (multicall, batches) asks for
// the same selector many times, which used to fire one request each time
const signatureCache = new Map<string, Promise<string[]>>();

// All known signatures for a selector. Rejects only when every source failed.
export function lookupSignatures(selector: string): Promise<string[]> {
  selector = selector.toLowerCase();
  let cached = signatureCache.get(selector);
  if (!cached) {
    cached = (async () => {
      let failures = 0;
      const sources = [signatureDataApi, sourcify4ByteApi].filter(
        (url): url is string => !!url
      );
      for (const url of sources) {
        try {
          const result = await fetchSignatures(url, selector);
          if (result.length > 0) return result;
        } catch (error) {
          failures++;
          console.error("Signature lookup failed:", error);
        }
      }
      if (failures === sources.length) {
        throw new DecodeError(
          "network",
          "Could not reach the signature database. Check your connection and try again."
        );
      }
      return [];
    })();
    signatureCache.set(selector, cached);
    // do not keep failed/empty lookups, so a retry can succeed
    cached
      .then((list) => {
        if (list.length === 0) signatureCache.delete(selector);
      })
      .catch(() => signatureCache.delete(selector));
  }
  return cached;
}

/**
 * Clean up pasted calldata: trims, removes whitespace/quotes, adds the 0x
 * prefix and validates. Throws a DecodeError("invalid") with a clear reason.
 */
export function normalizeCalldata(input: string): string {
  let data = input.replace(/[\s"'`]/g, "");
  if (!data) throw new DecodeError("invalid", "Please enter calldata");
  if (/^0x/i.test(data)) data = data.slice(2);
  if (!/^[0-9a-fA-F]*$/.test(data)) {
    throw new DecodeError(
      "invalid",
      "Calldata must be a hex string (0-9, a-f), optionally starting with 0x"
    );
  }
  if (data.length % 2 !== 0) {
    throw new DecodeError("invalid", "Hex string has an odd number of characters");
  }
  if (data.length < 8) {
    throw new DecodeError(
      "invalid",
      "Calldata is too short: it must start with a 4-byte function selector"
    );
  }
  return "0x" + data;
}

// Split the arguments part into 32-byte words (raw view for unknown selectors)
function toWords(calldata: string): string[] {
  const body = calldata.slice(10);
  const words: string[] = [];
  for (let i = 0; i < body.length; i += 64) {
    words.push("0x" + body.slice(i, i + 64));
  }
  return words;
}

// Nested bytes are only tried as calldata when they look ABI-encoded:
// 4-byte selector followed by whole 32-byte words
function looksLikeCalldata(value: string): boolean {
  if (!/^0x[0-9a-fA-F]{8,}$/.test(value)) return false;
  if ((value.length - 10) % 64 !== 0) return false;
  // Skip null selector to avoid spam results
  return value.slice(0, 10) !== "0x00000000";
}

function toHexString(value: unknown): string {
  if (typeof value === "string") {
    return value.startsWith("0x") ? value : "0x" + value;
  }
  if (value instanceof Uint8Array) {
    return (
      "0x" +
      Array.from(value)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
  }
  return "";
}

// Text shown for a value of any type (arrays/tuples are joined recursively)
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "bigint" || typeof value === "boolean" || typeof value === "number") {
    return value.toString();
  }
  if (value instanceof Uint8Array) return toHexString(value);
  if (typeof (value as Iterable<unknown>)[Symbol.iterator] === "function") {
    return `[${Array.from(value as Iterable<unknown>).map(formatValue).join(", ")}]`;
  }
  return String(value);
}

/**
 * Parse the optional ABI entered by the user. Accepts a JSON ABI array, a
 * compiler artifact ({ "abi": [...] }) or human-readable lines such as
 * "function transfer(address to, uint256 amount)". Returns null when empty.
 */
export function parseAbi(text?: string): Interface | null {
  const input = (text || "").trim();
  if (!input) return null;
  try {
    let source: any;
    if (input.startsWith("[") || input.startsWith("{")) {
      const json = JSON.parse(input);
      source = Array.isArray(json) ? json : json?.abi;
      if (!Array.isArray(source)) throw new Error("no abi");
    } else {
      // one declaration per line; "function" may be left out
      source = input
        .split(/[\n;]+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) =>
          /^(function|event|error|constructor|fallback|receive)\b/.test(line)
            ? line
            : `function ${line}`
        );
    }
    return new Interface(source);
  } catch {
    throw new DecodeError(
      "abi",
      'The ABI is not valid. Use a JSON ABI array or lines like "function transfer(address to, uint256 amount)".'
    );
  }
}

// Functions of the user's ABI with this selector (normally 0 or 1)
function abiFunctions(abi: Interface | null, selector: string): FunctionFragment[] {
  if (!abi) return [];
  const found: FunctionFragment[] = [];
  abi.forEachFunction((fragment) => {
    if (fragment.selector === selector.toLowerCase()) found.push(fragment);
  });
  return found;
}

// Decode calldata with one specific signature (a database signature or a
// function of the user's ABI, which also carries the parameter names).
// Throws when it does not fit.
async function decodeWithSignatureAtDepth(
  calldata: string,
  signature: string | FunctionFragment,
  depth: number,
  abi: Interface | null
): Promise<IFunctionFragement> {
  const fromAbi = typeof signature !== "string";
  const iface = new Interface([fromAbi ? signature : `function ${signature}`]);
  const funcFrag = fromAbi
    ? iface.getFunction(signature.selector)
    : iface.getFunction(signature);
  if (!funcFrag) throw new Error("Invalid signature");

  const decoded = iface.decodeFunctionData(funcFrag, calldata);
  // ethers decodes lazily: re-encoding proves every value is readable.
  // A signature really fits when encoding the values gives the same bytes
  // back; a colliding selector (eg. many_msg_babbage(bytes1) for transfer)
  // "decodes" too but ignores most of the data.
  const reEncoded = iface.encodeFunctionData(funcFrag, decoded);
  if (reEncoded.length > calldata.length) {
    throw new Error("Signature does not match the calldata");
  }
  const exact = reEncoded.toLowerCase() === calldata.toLowerCase();

  const inputs: IDecodedParam[] = [];
  for (let i = 0; i < funcFrag.inputs.length; i++) {
    inputs.push(await toDecodedParam(funcFrag.inputs[i], decoded[i], depth, abi));
  }

  return {
    type: "function",
    name: funcFrag.name,
    signature: funcFrag.format("sighash"),
    selector: funcFrag.selector,
    inputs,
    exact,
    matchedLength: reEncoded.length,
    source: fromAbi ? "abi" : "database",
  };
}

/** Decode calldata with a signature chosen by the user. */
export const decodeWithSignature = (
  calldata: string,
  signature: string,
  abiText?: string
): Promise<IFunctionFragement> => {
  const data = normalizeCalldata(calldata);
  const abi = parseAbi(abiText);
  // prefer the ABI's own definition of this signature (parameter names)
  const own = abiFunctions(abi, data.slice(0, 10)).find(
    (fragment) => fragment.format("sighash") === signature
  );
  return decodeWithSignatureAtDepth(data, own || signature, 0, abi);
};

// Decode nested bytes as a call; null when unknown or not decodable
async function tryDecodeNested(
  value: string,
  depth: number,
  abi: Interface | null
): Promise<IFunctionFragement | null> {
  if (depth >= MAX_DEPTH || !looksLikeCalldata(value)) return null;
  // the user's ABI wins over the database (and needs no network)
  for (const fragment of abiFunctions(abi, value.slice(0, 10))) {
    try {
      return await decodeWithSignatureAtDepth(value, fragment, depth, abi);
    } catch {
      // does not fit: fall back to the database
    }
  }
  try {
    const candidates = await lookupSignatures(value.slice(0, 10));
    let loose: IFunctionFragement | null = null;
    for (const signature of candidates) {
      try {
        const decoded = await decodeWithSignatureAtDepth(value, signature, depth, abi);
        if (decoded.exact) return decoded;
        if (!loose || (decoded.matchedLength || 0) > (loose.matchedLength || 0)) {
          loose = decoded;
        }
      } catch {
        // try the next signature
      }
    }
    // non-canonical encoding: better than showing nothing
    return loose;
  } catch {
    // lookup failed: show the raw bytes
  }
  return null;
}

// Recursively convert an ethers ParamType + value into display data
async function toDecodedParam(
  paramType: ParamType,
  value: any,
  depth: number,
  abi: Interface | null
): Promise<IDecodedParam> {
  const param: IDecodedParam = {
    name: paramType.name || "",
    type: paramType.type,
    baseType: paramType.baseType,
    value: formatValue(value),
  };

  if (paramType.baseType === "array" && paramType.arrayChildren) {
    // type[], eg: uint256[], string[], address[], tuple[]
    const child = paramType.arrayChildren;
    param.arrayChildren = await Promise.all(
      Array.from(value as Iterable<unknown>).map((childValue) =>
        toDecodedParam(child, childValue, depth, abi)
      )
    );
  } else if (paramType.baseType === "tuple" && paramType.components) {
    param.components = await Promise.all(
      paramType.components.map((child, index) =>
        toDecodedParam(child, value[index], depth, abi)
      )
    );
  } else if (paramType.type === "bytes") {
    // dynamic bytes may hold another call (multicall, execute, proxies...)
    param.functionFragment = await tryDecodeNested(toHexString(value), depth + 1, abi);
  } else if (paramType.type === "bytes4") {
    // a bytes4 argument is very often a function selector: name it
    const selector = toHexString(value);
    if (selector !== "0x00000000" && selector !== "0xffffffff") {
      try {
        const own = abiFunctions(abi, selector).map((f) => f.format("sighash"));
        const signatures = own.length > 0 ? own : await lookupSignatures(selector);
        if (signatures.length > 0) param.selectorSignatures = signatures.slice(0, 3);
      } catch {
        // optional hint only
      }
    }
  }
  return param;
}

/**
 * Decode calldata without an ABI: looks the selector up in public signature
 * databases and tries every known signature (selectors can collide).
 * Throws DecodeError for invalid input or when the database is unreachable.
 * An unknown selector is not an error: the result then carries the raw words.
 *
 * With an ABI (see parseAbi) its functions are used first, for the call
 * itself and for nested calls; the database is only asked for selectors the
 * ABI does not have. A call fully covered by the ABI needs no network.
 */
export async function decodeCalldata(
  input: string,
  abiText?: string
): Promise<IDecodeResult> {
  const calldata = normalizeCalldata(input);
  const selector = calldata.slice(0, 10).toLowerCase();
  const abi = parseAbi(abiText);

  const fromAbi: IFunctionFragement[] = [];
  for (const fragment of abiFunctions(abi, selector)) {
    try {
      fromAbi.push(await decodeWithSignatureAtDepth(calldata, fragment, 0, abi));
    } catch {
      // the ABI has this selector but the data does not fit it
    }
  }
  if (fromAbi.length > 0) {
    return {
      selector,
      calldata,
      candidates: fromAbi.map((f) => f.signature || ""),
      fragment: fromAbi[0],
      words: toWords(calldata),
    };
  }

  const known = await lookupSignatures(selector);

  const exact: IFunctionFragement[] = [];
  const loose: IFunctionFragement[] = [];
  for (const signature of known) {
    try {
      const decoded = await decodeWithSignatureAtDepth(calldata, signature, 0, abi);
      (decoded.exact ? exact : loose).push(decoded);
    } catch {
      // this signature does not fit the data
    }
  }
  // Signatures that reproduce the calldata byte for byte win. The others
  // (non-canonical encoding, trailing data) are only offered when none does.
  // Among those, the one that accounts for most of the data comes first.
  loose.sort((a, b) => (b.matchedLength || 0) - (a.matchedLength || 0));
  const fitting = exact.length > 0 ? exact : loose;
  const candidates = Array.from(
    new Set(fitting.map((f) => f.signature || ""))
  ).filter(Boolean);

  return {
    selector,
    calldata,
    candidates,
    fragment: fitting[0] || null,
    words: toWords(calldata),
    notInAbi: abi !== null,
  };
}
