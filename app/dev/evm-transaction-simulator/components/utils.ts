import type { Abi, AbiEvent, AbiFunction, Hex } from "viem";
import { formatAbiItem } from "viem/utils";
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
  toEventSelector,
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
  /** how the events were obtained; undefined when the RPC could not give them */
  logsSource?: "debug_traceCall" | "debug_traceTransaction" | "eth_simulateV1";
  /**
   * Set when the transaction was replayed at its original position in its
   * block (after the transactions that were mined before it).
   */
  replay?: {
    method: "debug_traceTransaction" | "eth_simulateV1";
    blockNumber: bigint;
    index: number;
  };
  /** why the events could not be read (neither method is supported) */
  logsError?: string;
  blockNumber?: bigint;
  chainId?: number;
  durationMs: number;
  warnings: string[];
}

export interface ReplayTarget {
  hash: string;
  /** block the transaction was mined in */
  blockNumber: bigint;
  /** position of the transaction inside that block */
  index: number;
  /** true when the form still holds exactly the mined transaction */
  pristine: boolean;
  status: "success" | "reverted" | "pending";
}

export interface SimulateOptions {
  block: string; // "latest" or decimal number
  overrideBalance: boolean;
  trace: boolean;
  /**
   * Replay a mined transaction inside its own block. Without this the call
   * runs on the state at the END of `block`, which misses everything the
   * earlier transactions of the same block did (funding, approvals, swaps...).
   */
  replay?: ReplayTarget;
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
  const replay = opts.replay;
  // A replay always starts from the block before the one it was mined in
  const blockTag = replay ? toQuantity(replay.blockNumber - 1n) : blockTagOf(opts.block);

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

  // 0. Mined transaction: replay it at its original position in its block
  let replayed = false;
  if (replay) {
    const errors: string[] = [];
    const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));
    if (replay.pristine) {
      try {
        await replayWithTrace(rpc, replay, result);
        replayed = true;
      } catch (e) {
        errors.push(`debug_traceTransaction: ${msg(e)}`);
      }
    }
    if (!replayed) {
      try {
        await replayWithSimulate(rpc, replay, tx, call, overrides, result);
        replayed = true;
      } catch (e) {
        errors.push(`eth_simulateV1: ${msg(e)}`);
      }
    }
    if (replayed) {
      if (
        replay.pristine &&
        replay.status !== "pending" &&
        (replay.status === "success") !== result.success
      ) {
        warnings.push(
          `The replay ${result.success ? "succeeded" : "reverted"} but the transaction ${
            replay.status === "success" ? "succeeded" : "reverted"
          } on chain. The RPC may have capped the gas of the replayed block; try an RPC with the debug API.`
        );
      }
    } else if (replay.index > 0) {
      warnings.push(
        `This transaction was number ${replay.index + 1} in block ${replay.blockNumber}, but this RPC could not replay the ${replay.index} transaction(s) mined before it (${errors.join("; ")}). ` +
          `It was simulated on the state at the end of block ${replay.blockNumber - 1n} instead, so the result is wrong if it depends on those earlier transactions. Use an RPC that supports eth_simulateV1 or the debug API.`
      );
    }
  }

  // 1. eth_call -> success / revert + return data
  if (!replayed) try {
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
    if (!result.success || replayed) return;
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
    if (!opts.trace || replayed) return;
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
      result.logsSource = "debug_traceCall";
      if (!result.success && !result.revertData && frame?.output && frame.output !== "0x") {
        result.revertData = frame.output;
      }
    } catch (e) {
      result.traceError = e instanceof Error ? e.message : String(e);
    }
  };

  // 4. eth_simulateV1 -> events without the debug API. Most public RPCs do
  //    not expose debug_traceCall but do support eth_simulateV1, which runs
  //    the call in a simulated block and returns the logs it emitted.
  const simulateV1 = async () => {
    if (result.logsSource || replayed) return; // the trace already gave the events
    const block: Record<string, unknown> = { calls: [call] };
    if (overrides) block.stateOverrides = overrides;
    try {
      const blocks = await rpcRequest<SimulatedBlock[]>(rpc, "eth_simulateV1", [
        { blockStateCalls: [block], validation: false, traceTransfers: false },
        pinnedTag,
      ]);
      const sim = blocks?.[0]?.calls?.[0];
      if (!sim) throw new Error("empty eth_simulateV1 response");
      // a reverted call has no logs (they are rolled back on chain as well)
      result.logs = (sim.logs || []).map((l) => ({
        address: l.address,
        topics: l.topics || [],
        data: l.data || "0x",
      }));
      result.logsSource = "eth_simulateV1";
      if (result.gasUsed === undefined && sim.gasUsed) result.gasUsed = BigInt(sim.gasUsed);
      if (!result.success && !result.revertData && sim.error) {
        result.revertData = extractRevertData(sim.error) ?? (sim.returnData && sim.returnData !== "0x" ? sim.returnData : undefined);
      }
    } catch (e) {
      result.logsError = e instanceof Error ? e.message : String(e);
    }
  };

  await Promise.all([estimate(), gasPrice(), trace()]);
  await simulateV1();

  result.durationMs = Math.round(performance.now() - started);
  return result;
}

// Exact replay of a mined transaction (needs the debug API).
async function replayWithTrace(rpc: string, replay: ReplayTarget, result: SimulationResult) {
  const frame = await rpcRequest<CallFrame>(rpc, "debug_traceTransaction", [
    replay.hash,
    { tracer: "callTracer", tracerConfig: { withLog: true } },
  ]);
  if (!frame || typeof frame !== "object" || !frame.from) {
    throw new Error("empty debug_traceTransaction response");
  }
  result.trace = frame;
  if (frame.gasUsed) result.gasUsed = BigInt(frame.gasUsed);
  result.logs = collectLogs(frame);
  result.logsSource = "debug_traceTransaction";
  result.success = !frame.error;
  if (result.success) {
    result.returnData = frame.output ?? "0x";
  } else {
    if (frame.output && frame.output !== "0x") result.revertData = frame.output;
    result.errorMessage = frame.revertReason || frame.error;
  }
  result.replay = {
    method: "debug_traceTransaction",
    blockNumber: replay.blockNumber,
    index: replay.index,
  };
}

interface BlockTx {
  hash: string;
  from: string;
  to: string | null;
  gas: Hex;
  value: Hex;
  input: Hex;
  type?: Hex;
  gasPrice?: Hex;
  maxFeePerGas?: Hex;
  maxPriorityFeePerGas?: Hex;
  maxFeePerBlobGas?: Hex;
  blobVersionedHashes?: Hex[];
  accessList?: unknown[];
  authorizationList?: unknown[];
}

interface FullBlock {
  number: Hex;
  timestamp: Hex;
  gasLimit: Hex;
  miner: string;
  mixHash?: Hex;
  baseFeePerGas?: Hex;
  transactions: BlockTx[];
}

// How a mined transaction is passed to eth_simulateV1. `full` keeps the fee
// and access-list fields so fees, tips and warm slots match the chain.
function replayCall(t: BlockTx, full: boolean): Record<string, unknown> {
  const c: Record<string, unknown> = {
    from: t.from,
    gas: t.gas,
    value: t.value,
    input: t.input,
  };
  if (t.to) c.to = t.to;
  if (!full) return c;
  if (t.maxFeePerGas) {
    c.maxFeePerGas = t.maxFeePerGas;
    c.maxPriorityFeePerGas = t.maxPriorityFeePerGas ?? "0x0";
  } else if (t.gasPrice) {
    c.gasPrice = t.gasPrice;
  }
  if (t.accessList?.length) c.accessList = t.accessList;
  if (t.blobVersionedHashes?.length) {
    c.blobVersionedHashes = t.blobVersionedHashes;
    if (t.maxFeePerBlobGas) c.maxFeePerBlobGas = t.maxFeePerBlobGas;
  }
  if (t.authorizationList?.length) c.authorizationList = t.authorizationList;
  return c;
}

// Replay with eth_simulateV1: rebuild the block on top of its parent, run
// the transactions that were mined before the target, then the target (as
// entered in the form, so an edited copy can be tried in the same context).
async function replayWithSimulate(
  rpc: string,
  replay: ReplayTarget,
  tx: TxRequest,
  call: Record<string, string>,
  overrides: Record<string, unknown> | undefined,
  result: SimulationResult
) {
  const block = await rpcRequest<FullBlock | null>(rpc, "eth_getBlockByNumber", [
    toQuantity(replay.blockNumber),
    true,
  ]);
  const original = block?.transactions?.[replay.index];
  if (!block || !original || original.hash?.toLowerCase() !== replay.hash.toLowerCase()) {
    throw new Error(`block ${replay.blockNumber} does not hold the transaction at position ${replay.index}`);
  }

  const blockOverrides: Record<string, unknown> = {
    number: block.number,
    time: block.timestamp,
    gasLimit: block.gasLimit,
    feeRecipient: block.miner,
  };
  if (block.mixHash) blockOverrides.prevRandao = block.mixHash;
  if (block.baseFeePerGas) blockOverrides.baseFeePerGas = block.baseFeePerGas;

  const sameSender = original.from.toLowerCase() === tx.from.toLowerCase();
  const parentTag = toQuantity(replay.blockNumber - 1n);

  let lastError: unknown;
  // Some nodes reject fee / blob / authorization fields: retry with bare calls
  for (const full of [true, false]) {
    const target: Record<string, unknown> = { ...call };
    if (full && sameSender) {
      const fees = replayCall(original, true);
      for (const key of ["maxFeePerGas", "maxPriorityFeePerGas", "gasPrice", "accessList"]) {
        if (fees[key] !== undefined) target[key] = fees[key];
      }
    }
    const stateCall: Record<string, unknown> = {
      blockOverrides,
      calls: [
        ...block.transactions.slice(0, replay.index).map((t) => replayCall(t, full)),
        target,
      ],
    };
    if (overrides) stateCall.stateOverrides = overrides;
    try {
      const blocks = await rpcRequest<SimulatedBlock[]>(rpc, "eth_simulateV1", [
        { blockStateCalls: [stateCall], validation: false, traceTransfers: false },
        parentTag,
      ]);
      const calls = blocks?.[0]?.calls;
      if (!calls || calls.length !== replay.index + 1) {
        throw new Error("incomplete eth_simulateV1 response");
      }
      const sim = calls[replay.index];
      result.success = sim.status ? BigInt(sim.status) === 1n : !sim.error;
      if (result.success) {
        result.returnData = sim.returnData ?? "0x";
      } else {
        result.revertData =
          extractRevertData(sim.error) ??
          (sim.returnData && sim.returnData !== "0x" ? sim.returnData : undefined);
        result.errorMessage = sim.error?.message || "execution reverted";
      }
      result.logs = (sim.logs || []).map((l) => ({
        address: l.address,
        topics: l.topics || [],
        data: l.data || "0x",
      }));
      result.logsSource = "eth_simulateV1";
      if (sim.gasUsed) result.gasUsed = BigInt(sim.gasUsed);
      result.replay = {
        method: "eth_simulateV1",
        blockNumber: replay.blockNumber,
        index: replay.index,
      };
      return;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

interface SimulatedBlock {
  calls?: {
    status?: Hex;
    returnData?: Hex;
    gasUsed?: Hex;
    logs?: TraceLog[];
    error?: { code?: number; message?: string; data?: unknown };
  }[];
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
  transactionIndex: Hex | null;
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

// Well-known events, used when the user gave no ABI (or it does not have the
// event). Overloads with the same name but different indexed parameters
// (ERC-20 vs ERC-721 Transfer) are told apart by the number of topics.
const COMMON_EVENTS = parseAbi([
  // ERC-20 / ERC-721 / ERC-1155
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
  "event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)",
  "event URI(string value, uint256 indexed id)",
  // WETH
  "event Deposit(address indexed dst, uint256 wad)",
  "event Withdrawal(address indexed src, uint256 wad)",
  // ERC-4626 vaults
  "event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)",
  "event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)",
  // Uniswap V2 (and forks)
  "event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)",
  "event Sync(uint112 reserve0, uint112 reserve1)",
  "event Mint(address indexed sender, uint256 amount0, uint256 amount1)",
  "event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)",
  "event PairCreated(address indexed token0, address indexed token1, address pair, uint256 allPairsLength)",
  // Uniswap V3 (and forks)
  "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
  "event Mint(address sender, address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)",
  "event Burn(address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)",
  "event Collect(address indexed owner, address recipient, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount0, uint128 amount1)",
  "event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)",
  "event IncreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
  "event DecreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
  "event Collect(uint256 indexed tokenId, address recipient, uint256 amount0, uint256 amount1)",
  // Curve
  "event TokenExchange(address indexed buyer, int128 sold_id, uint256 tokens_sold, int128 bought_id, uint256 tokens_bought)",
  // Aave V3
  "event Supply(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint16 indexed referralCode)",
  "event Withdraw(address indexed reserve, address indexed user, address indexed to, uint256 amount)",
  "event Borrow(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint8 interestRateMode, uint256 borrowRate, uint16 indexed referralCode)",
  "event Repay(address indexed reserve, address indexed user, address indexed repayer, uint256 amount, bool useATokens)",
  // Permit2
  "event Approval(address indexed owner, address indexed token, address indexed spender, uint160 amount, uint48 expiration)",
  "event Permit(address indexed owner, address indexed token, address indexed spender, uint160 amount, uint48 expiration, uint48 nonce)",
  // Ownership, roles, pausing, proxies
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
  "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
  "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)",
  "event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)",
  "event Paused(address account)",
  "event Unpaused(address account)",
  "event Upgraded(address indexed implementation)",
  "event AdminChanged(address previousAdmin, address newAdmin)",
  "event BeaconUpgraded(address indexed beacon)",
  "event Initialized(uint8 version)",
  "event Initialized(uint64 version)",
  // Governance tokens
  "event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate)",
  "event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance)",
  // Safe
  "event ExecutionSuccess(bytes32 txHash, uint256 payment)",
  "event ExecutionSuccess(bytes32 indexed txHash, uint256 payment)",
  "event ExecutionFailure(bytes32 txHash, uint256 payment)",
  "event ExecutionFailure(bytes32 indexed txHash, uint256 payment)",
  // ERC-4337 EntryPoint
  "event UserOperationEvent(bytes32 indexed userOpHash, address indexed sender, address indexed paymaster, uint256 nonce, bool success, uint256 actualGasCost, uint256 actualGasUsed)",
]) as unknown as AbiEvent[];

// topic0 -> candidate events
function indexEvents(events: readonly AbiEvent[]): Map<string, AbiEvent[]> {
  const map = new Map<string, AbiEvent[]>();
  for (const ev of events) {
    if (ev.type !== "event" || ev.anonymous) continue;
    try {
      const topic = toEventSelector(ev).toLowerCase();
      map.set(topic, [...(map.get(topic) || []), ev]);
    } catch {}
  }
  return map;
}

const COMMON_EVENT_INDEX = indexEvents(COMMON_EVENTS);
const userEventIndexCache = new WeakMap<object, Map<string, AbiEvent[]>>();
function userEventIndex(abi: Abi): Map<string, AbiEvent[]> {
  let index = userEventIndexCache.get(abi);
  if (!index) {
    index = indexEvents(abi.filter((i) => i.type === "event") as AbiEvent[]);
    userEventIndexCache.set(abi, index);
  }
  return index;
}

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
  /** which definition decoded the event */
  source?: "abi" | "common" | "4byte";
}

export function decodeLog(
  log: TraceLog,
  abi: Abi | undefined,
  signatures: SignatureMap
): DecodedLog | undefined {
  if (!log.topics?.length) return undefined;
  const topic0 = log.topics[0].toLowerCase();
  const indexedCount = log.topics.length - 1;

  // The user's ABI first, then the built-in common events. A definition only
  // fits when it has as many indexed parameters as the log has topics.
  const sources: ["abi" | "common", AbiEvent[]][] = [
    ["abi", abi ? userEventIndex(abi).get(topic0) || [] : []],
    ["common", COMMON_EVENT_INDEX.get(topic0) || []],
  ];
  for (const [source, candidates] of sources) {
    for (const ev of candidates) {
      if (ev.inputs.filter((x) => x.indexed).length !== indexedCount) continue;
      try {
        const d = decodeEventLog({
          abi: [ev],
          data: log.data,
          topics: log.topics as [Hex, ...Hex[]],
          strict: true,
        });
        return {
          name: ev.name,
          signature: formatAbiItem(ev), // tuples expanded: Order((address,uint256))
          args: toDecodedValues(ev.inputs, d.args as any),
          source,
        };
      } catch {}
    }
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
      return { name: ev.name, signature: sig, args: toDecodedValues(ev.inputs, d.args as any), guessed: true, source: "4byte" };
    } catch {}
  }
  if (sigs.length) return { name: sigs[0].split("(")[0], signature: sigs[0], args: [], guessed: true, source: "4byte" };
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
