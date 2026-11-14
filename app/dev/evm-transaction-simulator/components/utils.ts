import type { Abi, AbiEvent, AbiFunction, Hex } from "viem";
import {
  decodeErrorResult,
  decodeEventLog,
  decodeFunctionData,
  decodeFunctionResult,
  formatUnits,
  hexToString,
  isHex,
  parseAbi,
  parseAbiItem,
  trim,
} from "viem";

// ---------------------------------------------------------------------------
// Chains
// ---------------------------------------------------------------------------

export interface ChainPreset {
  id: number;
  name: string;
  symbol: string;
  rpc: string;
  explorer: string;
}

// Public RPCs that do not need an API key and allow browser (CORS) requests.
export const CHAINS: ChainPreset[] = [
  { id: 1, name: "Ethereum", symbol: "ETH", rpc: "https://ethereum-rpc.publicnode.com", explorer: "https://etherscan.io" },
  { id: 56, name: "BNB Smart Chain", symbol: "BNB", rpc: "https://bsc-rpc.publicnode.com", explorer: "https://bscscan.com" },
  { id: 137, name: "Polygon", symbol: "POL", rpc: "https://polygon-bor-rpc.publicnode.com", explorer: "https://polygonscan.com" },
  { id: 42161, name: "Arbitrum One", symbol: "ETH", rpc: "https://arbitrum-one-rpc.publicnode.com", explorer: "https://arbiscan.io" },
  { id: 10, name: "Optimism", symbol: "ETH", rpc: "https://optimism-rpc.publicnode.com", explorer: "https://optimistic.etherscan.io" },
  { id: 8453, name: "Base", symbol: "ETH", rpc: "https://base-rpc.publicnode.com", explorer: "https://basescan.org" },
  { id: 43114, name: "Avalanche C-Chain", symbol: "AVAX", rpc: "https://avalanche-c-chain-rpc.publicnode.com", explorer: "https://snowtrace.io" },
  { id: 11155111, name: "Sepolia", symbol: "ETH", rpc: "https://ethereum-sepolia-rpc.publicnode.com", explorer: "https://sepolia.etherscan.io" },
];

export const CUSTOM_CHAIN = "Custom RPC";

// ---------------------------------------------------------------------------
// JSON-RPC
// ---------------------------------------------------------------------------

export class RpcError extends Error {
  code?: number;
  data?: unknown;
  constructor(message: string, code?: number, data?: unknown) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

let rpcId = 0;
export async function rpcRequest<T = any>(
  url: string,
  method: string,
  params: unknown[]
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
    });
  } catch (e) {
    throw new RpcError(
      `Cannot reach RPC (${e instanceof Error ? e.message : "network error"}). The RPC may be down or block browser requests (CORS).`
    );
  }
  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new RpcError(`RPC returned HTTP ${res.status} with a non-JSON body`);
  }
  if (json.error) {
    throw new RpcError(
      json.error.message || "RPC error",
      json.error.code,
      json.error.data
    );
  }
  return json.result as T;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TxRequest {
  from: string;
  to?: string;
  value: bigint;
  data: Hex;
  gas?: bigint;
}

export interface CallFrame {
  type: string;
  from: string;
  to?: string;
  value?: Hex;
  gas?: Hex;
  gasUsed?: Hex;
  input: Hex;
  output?: Hex;
  error?: string;
  revertReason?: string;
  calls?: CallFrame[];
  logs?: TraceLog[];
}

export interface TraceLog {
  address: string;
  topics: Hex[];
  data: Hex;
}

export interface SimulationResult {
  success: boolean;
  returnData?: Hex;
  revertData?: Hex;
  errorMessage?: string;
  gasEstimate?: bigint;
  gasUsed?: bigint;
  gasPrice?: bigint;
  trace?: CallFrame;
  traceError?: string;
  logs: TraceLog[];
  blockNumber?: bigint;
  chainId?: number;
  durationMs: number;
  warnings: string[];
}

export interface SimulateOptions {
  block: string; // "latest" or decimal number
  overrideBalance: boolean;
  trace: boolean;
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

const toQuantity = (v: bigint) => "0x" + v.toString(16);
const HUGE_BALANCE = "0x" + (10n ** 30n).toString(16);

export function blockTagOf(block: string): string {
  const b = block.trim().toLowerCase();
  if (!b || b === "latest") return "latest";
  if (["pending", "safe", "finalized", "earliest"].includes(b)) return b;
  if (/^0x[0-9a-f]+$/.test(b)) return b;
  if (/^\d+$/.test(b)) return toQuantity(BigInt(b));
  throw new Error(`Invalid block: ${block}`);
}

// Pull revert data out of the many shapes RPC providers use.
export function extractRevertData(err: unknown): Hex | undefined {
  const seen = new Set<unknown>();
  const walk = (v: unknown): Hex | undefined => {
    if (v == null || seen.has(v)) return undefined;
    if (typeof v === "string") {
      if (isHex(v) && v.length >= 10) return v as Hex;
      // e.g. "execution reverted: 0x08c379a0..." in the message/data text
      const m = v.match(/0x[0-9a-fA-F]{8,}/);
      return m && v.toLowerCase().includes("revert") ? (m[0] as Hex) : undefined;
    }
    if (typeof v === "object") {
      seen.add(v);
      const o = v as Record<string, unknown>;
      for (const key of ["data", "originalError", "error", "result"]) {
        const r = walk(o[key]);
        if (r) return r;
      }
    }
    return undefined;
  };
  if (err instanceof RpcError) return walk(err.data);
  return walk(err);
}

export async function simulateTransaction(
  rpc: string,
  tx: TxRequest,
  opts: SimulateOptions
): Promise<SimulationResult> {
  const started = performance.now();
  const warnings: string[] = [];
  const blockTag = blockTagOf(opts.block);

  const call: Record<string, string> = {
    from: tx.from,
    value: toQuantity(tx.value),
    data: tx.data,
  };
  if (tx.to) call.to = tx.to;
  if (tx.gas) call.gas = toQuantity(tx.gas);

  const overrides = opts.overrideBalance
    ? { [tx.from]: { balance: HUGE_BALANCE } }
    : undefined;
  const withOverride = (params: unknown[]) =>
    overrides ? [...params, overrides] : params;

  // Chain id + resolved block number (in parallel)
  const [chainIdHex, blockHex] = await Promise.all([
    rpcRequest<Hex>(rpc, "eth_chainId", []).catch(() => undefined),
    blockTag.startsWith("0x")
      ? Promise.resolve(blockTag as Hex)
      : rpcRequest<{ number: Hex }>(rpc, "eth_getBlockByNumber", [blockTag, false])
          .then((b) => b?.number)
          .catch(() => undefined),
  ]);
  // Pin every request to the same block so results are consistent
  const pinnedTag = blockHex ?? blockTag;

  const result: SimulationResult = {
    success: false,
    logs: [],
    warnings,
    durationMs: 0,
    chainId: chainIdHex ? Number(BigInt(chainIdHex)) : undefined,
    blockNumber: blockHex ? BigInt(blockHex) : undefined,
  };

  // 1. eth_call -> success / revert + return data
  try {
    result.returnData = await rpcRequest<Hex>(
      rpc,
      "eth_call",
      withOverride([call, pinnedTag])
    );
    result.success = true;
  } catch (e) {
    result.success = false;
    result.revertData = extractRevertData(e);
    result.errorMessage = e instanceof Error ? e.message : String(e);
  }

  // 2. gas estimate + gas price (in parallel with trace)
  const estimate = async () => {
    if (!result.success) return;
    const params = [{ ...call, gas: undefined }, pinnedTag];
    try {
      result.gasEstimate = BigInt(
        await rpcRequest<Hex>(rpc, "eth_estimateGas", withOverride(params))
      );
    } catch (e) {
      if (overrides) {
        // Some nodes do not accept state overrides for estimateGas
        try {
          result.gasEstimate = BigInt(
            await rpcRequest<Hex>(rpc, "eth_estimateGas", params)
          );
          return;
        } catch {}
      }
      warnings.push(
        `eth_estimateGas failed: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  };
  const gasPrice = async () => {
    try {
      result.gasPrice = BigInt(await rpcRequest<Hex>(rpc, "eth_gasPrice", []));
    } catch {}
  };

  // 3. debug_traceCall (callTracer) -> call tree, logs, exact gas used
  const trace = async () => {
    if (!opts.trace) return;
    const config: Record<string, unknown> = {
      tracer: "callTracer",
      tracerConfig: { withLog: true },
    };
    if (overrides) config.stateOverrides = overrides;
    try {
      const frame = await rpcRequest<CallFrame>(rpc, "debug_traceCall", [
        call,
        pinnedTag,
        config,
      ]);
      result.trace = frame;
      if (frame?.gasUsed) result.gasUsed = BigInt(frame.gasUsed);
      result.logs = collectLogs(frame);
      if (!result.success && !result.revertData && frame?.output && frame.output !== "0x") {
        result.revertData = frame.output;
      }
    } catch (e) {
      result.traceError = e instanceof Error ? e.message : String(e);
    }
  };

  await Promise.all([estimate(), gasPrice(), trace()]);

  result.durationMs = Math.round(performance.now() - started);
  return result;
}

// Logs emitted by reverted frames are discarded, matching on-chain behaviour.
export function collectLogs(frame: CallFrame | undefined): TraceLog[] {
  if (!frame || frame.error) return [];
  const out: TraceLog[] = [];
  const walk = (f: CallFrame) => {
    if (f.error) return;
    // callTracer interleaves logs and sub-calls by "position"; keep order where available
    const logs = [...(f.logs || [])] as (TraceLog & { position?: Hex })[];
    const calls = f.calls || [];
    let li = 0;
    calls.forEach((c, ci) => {
      while (li < logs.length && logs[li].position !== undefined && Number(logs[li].position) <= ci) {
        out.push(logs[li++]);
      }
      walk(c);
    });
    while (li < logs.length) out.push(logs[li++]);
  };
  walk(frame);
  return out;
}

export interface FetchedTx {
  from: string;
  to: string | null;
  value: Hex;
  input: Hex;
  gas: Hex;
  blockNumber: Hex | null;
}

export async function fetchTransaction(rpc: string, hash: string) {
  const tx = await rpcRequest<FetchedTx | null>(rpc, "eth_getTransactionByHash", [hash]);
  if (!tx) throw new Error("Transaction not found on this chain");
  let status: "success" | "reverted" | "pending" = "pending";
  if (tx.blockNumber) {
    const receipt = await rpcRequest<{ status: Hex } | null>(
      rpc,
      "eth_getTransactionReceipt",
      [hash]
    ).catch(() => null);
    if (receipt) status = receipt.status === "0x1" ? "success" : "reverted";
  }
  return { tx, status };
}

// ---------------------------------------------------------------------------
// ABI helpers & decoding
// ---------------------------------------------------------------------------

export function parseUserAbi(text: string): Abi | undefined {
  const t = text.trim();
  if (!t) return undefined;
  try {
    const json = JSON.parse(t);
    if (Array.isArray(json)) return json as Abi;
    if (Array.isArray(json?.abi)) return json.abi as Abi;
  } catch {}
  // Human readable: one signature per line
  const lines = t
    .split("\n")
    .map((l) => l.trim().replace(/[,;]$/, ""))
    .filter(Boolean);
  return parseAbi(lines) as Abi;
}

const COMMON_ABI = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
  "event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)",
  "event Deposit(address indexed dst, uint256 wad)",
  "event Withdrawal(address indexed src, uint256 wad)",
  "event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)",
  "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
  "event Sync(uint112 reserve0, uint112 reserve1)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
]) as Abi;

const ERC721_TRANSFER = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
]) as Abi;

export interface DecodedValue {
  name: string;
  type: string;
  value: unknown;
}

export interface DecodedCall {
  name: string;
  signature: string;
  args: DecodedValue[];
  guessed?: boolean;
}

const sigOf = (item: { name?: string; inputs?: readonly { type: string }[] }) =>
  `${item.name}(${(item.inputs || []).map((i) => i.type).join(",")})`;

function toDecodedValues(
  inputs: readonly { name?: string; type: string }[],
  values: readonly unknown[] | Record<string, unknown> | undefined
): DecodedValue[] {
  const arr = Array.isArray(values)
    ? values
    : inputs.map((i) => (values as Record<string, unknown> | undefined)?.[i.name || ""]);
  return inputs.map((inp, i) => ({
    name: inp.name || `arg${i}`,
    type: inp.type,
    value: arr[i],
  }));
}

export function decodeCall(
  data: Hex | undefined,
  abi: Abi | undefined,
  signatures: SignatureMap
): DecodedCall | undefined {
  if (!data || data.length < 10) return undefined;
  const selector = data.slice(0, 10).toLowerCase();
  if (abi) {
    try {
      const d = decodeFunctionData({ abi, data });
      const fn = (abi as AbiFunction[]).find(
        (i) => i.type === "function" && i.name === d.functionName &&
          sigOf(i) && (i.inputs?.length ?? 0) === (d.args?.length ?? 0)
      );
      if (fn) {
        return { name: fn.name, signature: sigOf(fn), args: toDecodedValues(fn.inputs, d.args) };
      }
    } catch {}
  }
  const candidates = signatures.functions[selector] || [];
  for (const sig of candidates) {
    try {
      const item = parseAbiItem(`function ${sig}`) as AbiFunction;
      const d = decodeFunctionData({ abi: [item], data });
      return {
        name: item.name,
        signature: sig,
        args: toDecodedValues(item.inputs, d.args),
        guessed: true,
      };
    } catch {}
  }
  if (candidates.length) {
    return { name: candidates[0].split("(")[0], signature: candidates[0], args: [], guessed: true };
  }
  return undefined;
}

export function decodeReturn(
  input: Hex,
  output: Hex | undefined,
  abi: Abi | undefined
): DecodedValue[] | undefined {
  if (!abi || !output || output === "0x" || input.length < 10) return undefined;
  try {
    const { functionName } = decodeFunctionData({ abi, data: input });
    const fn = (abi as AbiFunction[]).find(
      (i) => i.type === "function" && i.name === functionName
    );
    if (!fn || !fn.outputs?.length) return undefined;
    const value = decodeFunctionResult({ abi: [fn], functionName, data: output });
    const values = fn.outputs.length === 1 ? [value] : (value as readonly unknown[]);
    return toDecodedValues(fn.outputs, values);
  } catch {
    return undefined;
  }
}

const PANIC_CODES: Record<number, string> = {
  0x00: "Generic compiler panic",
  0x01: "Assertion failed",
  0x11: "Arithmetic overflow/underflow",
  0x12: "Division or modulo by zero",
  0x21: "Invalid enum value",
  0x22: "Invalid storage byte array encoding",
  0x31: "pop() on empty array",
  0x32: "Array index out of bounds",
  0x41: "Out of memory / too large allocation",
  0x51: "Called an uninitialized internal function",
};

export interface DecodedRevert {
  reason: string;
  error?: DecodedCall;
}

export function decodeRevert(
  data: Hex | undefined,
  abi: Abi | undefined,
  signatures: SignatureMap
): DecodedRevert | undefined {
  if (!data || data === "0x") return undefined;
  try {
    const d = decodeErrorResult({ abi: abi ?? [], data });
    const args = (d.args || []) as readonly unknown[];
    if (d.errorName === "Error") return { reason: String(args[0]) };
    if (d.errorName === "Panic") {
      const code = Number(args[0]);
      return {
        reason: `Panic(0x${code.toString(16).padStart(2, "0")}): ${PANIC_CODES[code] || "Unknown panic code"}`,
      };
    }
    const item = d.abiItem as { name: string; inputs: readonly { name?: string; type: string }[] };
    return {
      reason: `${d.errorName}(${args.map(fmtValue).join(", ")})`,
      error: { name: d.errorName, signature: sigOf(item), args: toDecodedValues(item.inputs, args) },
    };
  } catch {}
  const selector = data.slice(0, 10).toLowerCase();
  for (const sig of signatures.functions[selector] || []) {
    try {
      const item = parseAbiItem(`error ${sig}`) as { name: string; inputs: readonly { name?: string; type: string }[] };
      const d = decodeErrorResult({ abi: [item] as unknown as Abi, data });
      const args = (d.args || []) as readonly unknown[];
      return {
        reason: `${d.errorName}(${args.map(fmtValue).join(", ")})`,
        error: { name: d.errorName, signature: sig, args: toDecodedValues(item.inputs, args), guessed: true },
      };
    } catch {}
  }
  // Some contracts revert with a raw string
  try {
    const text = hexToString(trim(data, { dir: "right" }));
    if (/^[\x20-\x7e]{3,}$/.test(text)) return { reason: text };
  } catch {}
  return { reason: `Unknown custom error ${selector}` };
}

export interface DecodedLog {
  name?: string;
  signature?: string;
  args: DecodedValue[];
  guessed?: boolean;
}

export function decodeLog(
  log: TraceLog,
  abi: Abi | undefined,
  signatures: SignatureMap
): DecodedLog | undefined {
  if (!log.topics?.length) return undefined;
  const abis: Abi[] = [];
  if (abi) abis.push(abi);
  abis.push(log.topics.length === 4 ? ERC721_TRANSFER : COMMON_ABI, COMMON_ABI);
  for (const a of abis) {
    try {
      const d = decodeEventLog({
        abi: a,
        data: log.data,
        topics: log.topics as [Hex, ...Hex[]],
        strict: true,
      });
      const ev = (a as AbiEvent[]).find(
        (i) => i.type === "event" && i.name === d.eventName &&
          i.inputs.filter((x) => x.indexed).length === log.topics.length - 1
      ) || (a as AbiEvent[]).find((i) => i.type === "event" && i.name === d.eventName);
      if (!ev) continue;
      return { name: d.eventName, signature: sigOf(ev), args: toDecodedValues(ev.inputs, d.args as any) };
    } catch {}
  }
  // Lookup from signature database: we only know types, not which ones are indexed.
  // Assume the first N params are indexed (the usual convention) and try to decode.
  const sigs = signatures.events[log.topics[0].toLowerCase()] || [];
  for (const sig of sigs) {
    try {
      const generic = parseAbiItem(`event ${sig}`) as AbiEvent;
      const indexedCount = log.topics.length - 1;
      const ev: AbiEvent = {
        ...generic,
        inputs: generic.inputs.map((inp, i) => ({ ...inp, name: `arg${i}`, indexed: i < indexedCount })),
      };
      const d = decodeEventLog({ abi: [ev], data: log.data, topics: log.topics as [Hex, ...Hex[]], strict: true });
      return { name: ev.name, signature: sig, args: toDecodedValues(ev.inputs, d.args as any), guessed: true };
    } catch {}
  }
  if (sigs.length) return { name: sigs[0].split("(")[0], signature: sigs[0], args: [], guessed: true };
  return undefined;
}

// ---------------------------------------------------------------------------
// Signature database (Sourcify 4byte, no API key)
// ---------------------------------------------------------------------------

export interface SignatureMap {
  functions: Record<string, string[]>;
  events: Record<string, string[]>;
}

export const emptySignatures = (): SignatureMap => ({ functions: {}, events: {} });

const SIGNATURE_API = "https://api.4byte.sourcify.dev/signature-database/v1/lookup";

export async function lookupSignatures(
  selectors: string[],
  topics: string[]
): Promise<SignatureMap> {
  const out = emptySignatures();
  const fns = Array.from(new Set(selectors.map((s) => s.toLowerCase())));
  const evs = Array.from(new Set(topics.map((s) => s.toLowerCase())));
  const chunk = <T,>(a: T[], n: number) =>
    Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

  const requests: Promise<void>[] = [];
  const maxLen = Math.max(fns.length, evs.length);
  if (!maxLen) return out;
  const fnChunks = chunk(fns, 20);
  const evChunks = chunk(evs, 20);
  for (let i = 0; i < Math.max(fnChunks.length, evChunks.length); i++) {
    const params = new URLSearchParams();
    if (fnChunks[i]?.length) params.set("function", fnChunks[i].join(","));
    if (evChunks[i]?.length) params.set("event", evChunks[i].join(","));
    params.set("filter", "true");
    requests.push(
      fetch(`${SIGNATURE_API}?${params.toString()}`)
        .then((r) => r.json())
        .then((json) => {
          const pick = (m: Record<string, { name: string }[] | null> | undefined, target: Record<string, string[]>) => {
            for (const [k, v] of Object.entries(m || {})) {
              if (v?.length) target[k.toLowerCase()] = v.map((x) => x.name);
            }
          };
          pick(json?.result?.function, out.functions);
          pick(json?.result?.event, out.events);
        })
        .catch(() => {})
    );
  }
  await Promise.all(requests);
  return out;
}

export function collectSelectors(
  tx: TxRequest,
  result: SimulationResult
): { selectors: string[]; topics: string[] } {
  const selectors: string[] = [];
  const add = (d?: string) => {
    if (d && d.length >= 10) selectors.push(d.slice(0, 10));
  };
  add(tx.data);
  add(result.revertData);
  const walk = (f?: CallFrame) => {
    if (!f) return;
    add(f.input);
    if (f.error) add(f.output);
    f.calls?.forEach(walk);
  };
  walk(result.trace);
  const topics = result.logs.map((l) => l.topics?.[0]).filter(Boolean) as string[];
  return { selectors, topics };
}

// ---------------------------------------------------------------------------
// Asset changes
// ---------------------------------------------------------------------------

export interface AssetTransfer {
  kind: "native" | "erc20" | "erc721" | "erc1155";
  token?: string;
  from: string;
  to: string;
  amount: bigint;
  tokenId?: bigint;
}

const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const TRANSFER_SINGLE_TOPIC = "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62";

const topicToAddress = (t: Hex) => ("0x" + t.slice(26)) as Hex;

export function collectTransfers(
  tx: TxRequest,
  result: SimulationResult
): AssetTransfer[] {
  const out: AssetTransfer[] = [];
  const walk = (f: CallFrame) => {
    if (f.error) return;
    const v = f.value ? BigInt(f.value) : 0n;
    if (v > 0n && f.type !== "DELEGATECALL" && f.to) {
      out.push({ kind: "native", from: f.from, to: f.to, amount: v });
    }
    f.calls?.forEach(walk);
  };
  if (result.trace) walk(result.trace);
  else if (result.success && tx.value > 0n && tx.to) {
    out.push({ kind: "native", from: tx.from, to: tx.to, amount: tx.value });
  }

  for (const log of result.logs) {
    const t0 = log.topics?.[0]?.toLowerCase();
    try {
      if (t0 === TRANSFER_TOPIC && log.topics.length === 3) {
        out.push({
          kind: "erc20",
          token: log.address,
          from: topicToAddress(log.topics[1]),
          to: topicToAddress(log.topics[2]),
          amount: log.data === "0x" ? 0n : BigInt(log.data.slice(0, 66)),
        });
      } else if (t0 === TRANSFER_TOPIC && log.topics.length === 4) {
        out.push({
          kind: "erc721",
          token: log.address,
          from: topicToAddress(log.topics[1]),
          to: topicToAddress(log.topics[2]),
          amount: 1n,
          tokenId: BigInt(log.topics[3]),
        });
      } else if (t0 === TRANSFER_SINGLE_TOPIC && log.topics.length === 4) {
        out.push({
          kind: "erc1155",
          token: log.address,
          from: topicToAddress(log.topics[2]),
          to: topicToAddress(log.topics[3]),
          tokenId: BigInt(log.data.slice(0, 66)),
          amount: BigInt("0x" + log.data.slice(66, 130)),
        });
      }
    } catch {}
  }
  return out;
}

export interface TokenMeta {
  symbol?: string;
  decimals?: number;
}

export async function fetchTokenMeta(
  rpc: string,
  tokens: string[],
  blockTag: string
): Promise<Record<string, TokenMeta>> {
  const out: Record<string, TokenMeta> = {};
  await Promise.all(
    Array.from(new Set(tokens.map((t) => t.toLowerCase()))).map(async (token) => {
      const meta: TokenMeta = {};
      const [sym, dec] = await Promise.all([
        rpcRequest<Hex>(rpc, "eth_call", [{ to: token, data: "0x95d89b41" }, blockTag]).catch(() => undefined),
        rpcRequest<Hex>(rpc, "eth_call", [{ to: token, data: "0x313ce567" }, blockTag]).catch(() => undefined),
      ]);
      if (dec && dec !== "0x") {
        try {
          meta.decimals = Number(BigInt(dec.slice(0, 66)));
        } catch {}
      }
      if (sym && sym !== "0x") {
        meta.symbol = decodeStringish(sym);
      }
      out[token] = meta;
    })
  );
  return out;
}

function decodeStringish(data: Hex): string | undefined {
  try {
    if (data.length > 130) {
      const len = Number(BigInt("0x" + data.slice(66, 130)));
      return hexToString(("0x" + data.slice(130, 130 + len * 2)) as Hex);
    }
    return hexToString(trim(data, { dir: "right" })); // bytes32 symbol (e.g. MKR)
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function fmtValue(v: unknown): string {
  if (typeof v === "bigint") return v.toString();
  if (Array.isArray(v)) return `[${v.map(fmtValue).join(", ")}]`;
  if (v && typeof v === "object") return JSON.stringify(v, jsonReplacer);
  return String(v);
}

export function jsonReplacer(_key: string, value: unknown) {
  return typeof value === "bigint" ? value.toString() : value;
}

export function fmtAmount(amount: bigint, decimals = 18, maxFraction = 6): string {
  const s = formatUnits(amount, decimals);
  const [i, f] = s.split(".");
  if (!f) return i;
  const cut = f.slice(0, maxFraction).replace(/0+$/, "");
  return cut ? `${i}.${cut}` : f.length > maxFraction ? `${i}.${"0".repeat(maxFraction)}…` : i;
}

export const shortAddr = (a?: string) =>
  a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
