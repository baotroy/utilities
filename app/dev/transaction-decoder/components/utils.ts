import type { Abi, Hex } from "viem";
import {
  CHAINS,
  DecodedRevert,
  SignatureMap,
  decodeRevert,
  CallFrame,
  ChainPreset,
  SimulationResult,
  TraceLog,
  TxRequest,
  rpcRequest,
  simulateTransaction,
} from "../../evm-transaction-simulator/components/utils";

// ---------------------------------------------------------------------------
// Input parsing
// ---------------------------------------------------------------------------

const HASH_RE = /0x[0-9a-fA-F]{64}/;

export interface ParsedInput {
  hash?: string;
  /** chain recognised from an explorer link such as https://basescan.org/tx/0x… */
  chain?: ChainPreset;
}

/** Accepts a bare hash or an explorer link to the transaction. */
export function parseHashInput(text: string): ParsedInput {
  const t = text.trim();
  const m = t.match(HASH_RE);
  if (!m) return {};
  // a bare hash must be exactly 32 bytes, not a longer hex string
  if (/^0x[0-9a-fA-F]+$/.test(t) && t.length !== 66) return {};
  let chain: ChainPreset | undefined;
  try {
    if (/^https?:\/\//i.test(t)) {
      const host = new URL(t).hostname.replace(/^www\./, "").toLowerCase();
      chain = CHAINS.find((c) => new URL(c.explorer).hostname.replace(/^www\./, "") === host);
    }
  } catch {}
  return { hash: m[0].toLowerCase(), chain };
}

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------

export interface RpcTx {
  hash: string;
  from: string;
  to: string | null;
  value: Hex;
  input: Hex;
  gas: Hex;
  nonce: Hex;
  type?: Hex;
  gasPrice?: Hex;
  maxFeePerGas?: Hex;
  maxPriorityFeePerGas?: Hex;
  blockNumber: Hex | null;
  blockHash: Hex | null;
  transactionIndex: Hex | null;
  chainId?: Hex;
  blobVersionedHashes?: Hex[];
  authorizationList?: { address: string; chainId: Hex; nonce: Hex }[];
}

export interface RpcReceipt {
  status?: Hex;
  gasUsed: Hex;
  effectiveGasPrice?: Hex;
  contractAddress?: string | null;
  logs: (TraceLog & { logIndex?: Hex; removed?: boolean })[];
  /** OP-stack chains (Optimism, Base…): fee paid for the L1 data */
  l1Fee?: Hex;
  blobGasUsed?: Hex;
  blobGasPrice?: Hex;
}

export interface TxDetails {
  tx: RpcTx;
  receipt: RpcReceipt | null;
  timestamp?: number;
  latestBlock?: bigint;
  status: "success" | "reverted" | "pending";
}

export async function fetchTxDetails(rpc: string, hash: string): Promise<TxDetails> {
  const tx = await rpcRequest<RpcTx | null>(rpc, "eth_getTransactionByHash", [hash]);
  if (!tx) throw new Error("Transaction not found on this chain");
  if (!tx.blockNumber) return { tx, receipt: null, status: "pending" };
  const [receipt, block, latest] = await Promise.all([
    rpcRequest<RpcReceipt | null>(rpc, "eth_getTransactionReceipt", [hash]).catch(() => null),
    rpcRequest<{ timestamp: Hex } | null>(rpc, "eth_getBlockByNumber", [tx.blockNumber, false]).catch(() => null),
    rpcRequest<Hex>(rpc, "eth_blockNumber", []).catch(() => undefined),
  ]);
  // Pre-Byzantium receipts have no status field
  const status = !receipt ? "pending" : receipt.status === "0x0" ? "reverted" : "success";
  return {
    tx,
    receipt,
    status,
    timestamp: block?.timestamp ? Number(BigInt(block.timestamp)) : undefined,
    latestBlock: latest ? BigInt(latest) : undefined,
  };
}

/**
 * Looks the hash up on every preset chain at once and returns the first one
 * that has it (used when the user does not know the chain).
 */
export async function findChainOfTx(hash: string): Promise<ChainPreset | undefined> {
  return new Promise((resolve) => {
    let pending = CHAINS.length;
    let done = false;
    for (const chain of CHAINS) {
      rpcRequest<RpcTx | null>(chain.rpc, "eth_getTransactionByHash", [hash])
        .then((tx) => {
          if (tx && !done) {
            done = true;
            resolve(chain);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (--pending === 0 && !done) resolve(undefined);
        });
    }
  });
}

export function toTxRequest(tx: RpcTx): TxRequest {
  return {
    from: tx.from,
    to: tx.to || undefined,
    value: BigInt(tx.value),
    data: tx.input,
    gas: BigInt(tx.gas),
  };
}

export interface ExecutionInfo {
  /** call tree from debug_traceTransaction (or the replay) */
  trace?: CallFrame;
  /** revert data of a failed transaction */
  revertData?: Hex;
  /** message of the node / tracer for a failed transaction */
  errorMessage?: string;
  /** how the revert reason was obtained */
  revertSource?: "debug_traceTransaction" | "eth_simulateV1" | "eth_call";
  /** native transfers from an eth_simulateV1 replay (no trace) */
  valueTransfers?: SimulationResult["valueTransfers"];
  traceError?: string;
  /** set when the replay did not end like the transaction on chain */
  warning?: string;
}

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * Re-executes a mined transaction to get what the receipt does not hold:
 * the call trace (needs the debug API) and, for a failed transaction, the
 * revert data. A failed transaction without the debug API is replayed at
 * its position in its block with eth_simulateV1 (or eth_call as a last resort).
 */
export async function fetchExecution(rpc: string, d: TxDetails): Promise<ExecutionInfo> {
  const out: ExecutionInfo = {};
  if (d.status === "pending" || !d.tx.blockNumber) return out;

  try {
    const frame = await rpcRequest<CallFrame>(rpc, "debug_traceTransaction", [
      d.tx.hash,
      { tracer: "callTracer", tracerConfig: { withLog: true } },
    ]);
    if (!frame || typeof frame !== "object" || !frame.from) throw new Error("empty response");
    out.trace = frame;
    if (frame.error) {
      if (frame.output && frame.output !== "0x") out.revertData = frame.output;
      out.errorMessage = frame.revertReason || frame.error;
      out.revertSource = "debug_traceTransaction";
    }
    return out;
  } catch (e) {
    out.traceError = msg(e);
  }

  if (d.status !== "reverted") return out;

  // No debug API: replay the failed transaction to read its revert data
  const tx = toTxRequest(d.tx);
  try {
    const res = await simulateTransaction(rpc, tx, {
      block: "latest",
      overrideBalance: false,
      trace: false,
      replay: {
        hash: d.tx.hash,
        blockNumber: BigInt(d.tx.blockNumber),
        index: d.tx.transactionIndex ? Number(BigInt(d.tx.transactionIndex)) : 0,
        // pristine: false skips the debug_traceTransaction we already tried
        pristine: false,
        status: "reverted",
      },
    });
    out.revertData = res.revertData;
    out.errorMessage = res.errorMessage;
    out.revertSource = res.replay ? "eth_simulateV1" : "eth_call";
    out.valueTransfers = res.valueTransfers;
    if (res.success) {
      out.warning =
        "The replay did not revert, so the revert reason could not be read. Use an RPC with the debug API (debug_traceTransaction) for the exact reason.";
    } else if (!res.replay && res.warnings.length) {
      out.warning = res.warnings.join(" ");
    }
  } catch (e) {
    out.warning = `Could not replay the transaction to read the revert reason: ${msg(e)}`;
  }
  return out;
}

/**
 * The simulator's helpers (transfers, internal transactions, selectors) work
 * on a SimulationResult: build one from the receipt and the execution info.
 */
export function asSimulationResult(d: TxDetails, exec: ExecutionInfo): SimulationResult {
  return {
    success: d.status !== "reverted",
    revertData: exec.revertData,
    errorMessage: exec.errorMessage,
    trace: exec.trace,
    logs: (d.receipt?.logs || []).map((l) => ({ address: l.address, topics: l.topics, data: l.data })),
    valueTransfers: exec.valueTransfers,
    gasUsed: d.receipt ? BigInt(d.receipt.gasUsed) : undefined,
    blockNumber: d.tx.blockNumber ? BigInt(d.tx.blockNumber) : undefined,
    warnings: [],
    durationMs: 0,
  };
}

/**
 * Errors that wrap another error in a bytes argument (routers, aggregators,
 * multicalls: `SwapFailed(bytes reason)`) are unwrapped: the result lists the
 * outer error first and the innermost (the real cause) last.
 */
export function unwrapRevert(
  data: Hex | undefined,
  abi: Abi | undefined,
  signatures: SignatureMap
): { chain: DecodedRevert[]; unknownSelectors: string[] } {
  const chain: DecodedRevert[] = [];
  const unknownSelectors: string[] = [];
  let current = data;
  for (let depth = 0; current && current !== "0x" && depth < 6; depth++) {
    const r = decodeRevert(current, abi, signatures);
    if (!r) break;
    if (r.reason.startsWith("Unknown custom error")) unknownSelectors.push(current.slice(0, 10).toLowerCase());
    chain.push(r);
    const inner = r.error?.args.find(
      (a) => a.type === "bytes" && typeof a.value === "string" && a.value.length >= 10
    );
    current = inner ? (inner.value as Hex) : undefined;
  }
  return { chain, unknownSelectors };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const TX_TYPES: Record<number, string> = {
  0: "Legacy",
  1: "EIP-2930 (access list)",
  2: "EIP-1559",
  3: "EIP-4844 (blob)",
  4: "EIP-7702 (set code)",
};

export function txTypeLabel(type?: Hex): string {
  if (!type) return "Legacy";
  const n = Number(BigInt(type));
  return `${n} · ${TX_TYPES[n] || "Unknown"}`;
}

export function fmtAge(timestamp: number, now = Date.now() / 1000): string {
  let s = Math.max(0, Math.round(now - timestamp));
  const parts: string[] = [];
  const units: [string, number][] = [["d", 86400], ["h", 3600], ["m", 60], ["s", 1]];
  for (const [u, n] of units) {
    if (s >= n || (u === "s" && parts.length === 0)) {
      parts.push(`${Math.floor(s / n)}${u}`);
      s %= n;
    }
    if (parts.length === 2) break;
  }
  return `${parts.join(" ")} ago`;
}
