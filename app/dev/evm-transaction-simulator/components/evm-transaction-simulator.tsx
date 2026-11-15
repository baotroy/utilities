"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import SelectBox from "@/components/Input/SelectBox";
import TextArea from "@/components/Input/TextArea";
import TextBox from "@/components/Input/TextBox";
import { copyToClipboard } from "@/common/utils";
import clsx from "clsx";
import { FC, ReactNode, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MdDownload, MdOutlineClear, MdPlayArrow } from "react-icons/md";
import type { Abi, Hex } from "viem";
import { isAddress, isHex, parseUnits } from "viem";
import { AddressLink, ExplorerContext, ValueView } from "./address";
import CallTrace from "./call-trace";
import {
  CHAINS,
  CUSTOM_CHAIN,
  SignatureMap,
  SimulationResult,
  TokenMeta,
  TxRequest,
  collectSelectors,
  collectInternalTxs,
  collectTransfers,
  decodeCall,
  decodeLog,
  decodeReturn,
  decodeRevert,
  emptySignatures,
  fetchTokenMeta,
  fetchTransaction,
  fmtAmount,
  jsonReplacer,
  lookupSignatures,
  parseUserAbi,
  simulateTransaction,
} from "./utils";

const UNITS = ["Ether", "Gwei", "Wei"];
const UNIT_DECIMALS: Record<string, number> = { Ether: 18, Gwei: 9, Wei: 0 };

const Card: FC<{ title: string; right?: ReactNode; children: ReactNode }> = ({ title, right, children }) => (
  <div className="rounded border border-stroke dark:border-strokedark overflow-hidden">
    <div className="flex items-center justify-between gap-2 px-4 py-2 bg-bodydark/10 dark:bg-body/20">
      <span className="font-semibold text-sm">{title}</span>
      {right}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const Field: FC<{ label: string; hint?: string; children: ReactNode; className?: string }> = ({ label, hint, children, className }) => (
  <div className={className}>
    <div className="mb-1.5 text-sm">
      {label}
      {hint && <span className="ml-1 text-xs text-bodydark dark:text-bodydark2">{hint}</span>}
    </div>
    {children}
  </div>
);

const Row: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 py-1.5 border-b border-stroke/60 dark:border-strokedark/60 last:border-b-0 text-sm">
    <div className="sm:w-40 shrink-0 text-bodydark dark:text-bodydark2">{label}</div>
    <div className="min-w-0 break-all font-mono text-xs sm:text-sm">{children}</div>
  </div>
);

const ArgsTable: FC<{ args: { name: string; type: string; value: unknown }[] }> = ({ args }) => (
  <table className="w-full text-xs font-mono">
    <tbody>
      {args.map((a, i) => (
        <tr key={i} className="border-b border-stroke/50 dark:border-strokedark/50 last:border-b-0 align-top">
          <td className="py-1 pr-3 whitespace-nowrap">{a.name}</td>
          <td className="py-1 pr-3 whitespace-nowrap text-bodydark dark:text-bodydark2">{a.type}</td>
          <td className="py-1 break-all">
            <ValueView value={a.value} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

interface LoadedTx {
  hash: string;
  blockNumber: bigint;
  index: number;
  status: "success" | "reverted" | "pending";
  from: string;
  to: string;
  value: bigint;
  data: string;
  gas: bigint;
}

const EvmTransactionSimulatorComponent = () => {
  const [chainName, setChainName] = useState(CHAINS[0].name);
  const [customRpc, setCustomRpc] = useState("");
  const [txHash, setTxHash] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("Ether");
  const [data, setData] = useState("");
  const [gas, setGas] = useState("");
  const [block, setBlock] = useState("latest");
  const [abiText, setAbiText] = useState("");
  const [overrideBalance, setOverrideBalance] = useState(false);
  const [withTrace, setWithTrace] = useState(true);
  const [internalValueOnly, setInternalValueOnly] = useState(true);
  // The mined transaction last loaded by hash (so it can be replayed in its block)
  const [loaded, setLoaded] = useState<LoadedTx | null>(null);
  const [replayInBlock, setReplayInBlock] = useState(true);

  const [loading, setLoading] = useState(false);
  const [loadingTx, setLoadingTx] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [simTx, setSimTx] = useState<TxRequest | null>(null);
  const [signatures, setSignatures] = useState<SignatureMap>(emptySignatures());
  const [tokenMeta, setTokenMeta] = useState<Record<string, TokenMeta>>({});

  const chain = CHAINS.find((c) => c.name === chainName);
  const rpc = (chainName === CUSTOM_CHAIN ? customRpc : customRpc || chain?.rpc || "").trim();
  const symbol = chain?.symbol || "ETH";
  // Prefer the chain the RPC reports (custom RPCs), else the selected preset
  const explorer =
    (result?.chainId !== undefined ? CHAINS.find((c) => c.id === result.chainId)?.explorer : undefined) ??
    chain?.explorer;

  const abiState = useMemo((): { abi?: Abi; error?: string } => {
    try {
      return { abi: parseUserAbi(abiText) };
    } catch (e) {
      return { error: e instanceof Error ? e.message.split("\n")[0] : "Invalid ABI" };
    }
  }, [abiText]);
  const abi = abiState.abi;

  const loadFromHash = async () => {
    const hash = txHash.trim();
    if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) {
      toast.error("Invalid transaction hash");
      return;
    }
    if (!rpc) {
      toast.error("Please enter an RPC URL");
      return;
    }
    setLoadingTx(true);
    try {
      const { tx, status } = await fetchTransaction(rpc, hash);
      setFrom(tx.from);
      setTo(tx.to || "");
      setValue(BigInt(tx.value).toString());
      setUnit("Wei");
      setData(tx.input);
      setGas(BigInt(tx.gas).toString());
      if (tx.blockNumber) {
        const blockNumber = BigInt(tx.blockNumber);
        const index = tx.transactionIndex ? Number(BigInt(tx.transactionIndex)) : 0;
        setBlock((blockNumber - 1n).toString());
        setLoaded({ hash, blockNumber, index, status, from: tx.from, to: tx.to || "", value: BigInt(tx.value), data: tx.input, gas: BigInt(tx.gas) });
        setReplayInBlock(true);
        toast.success(`Loaded (on-chain status: ${status}). It will be replayed at position ${index} of block ${blockNumber}.`);
      } else {
        setBlock("latest");
        setLoaded(null);
        toast.success("Loaded pending transaction");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to load transaction");
    } finally {
      setLoadingTx(false);
    }
  };

  // Replay only while the Block field still points at the block before the
  // one the loaded transaction was mined in.
  const canReplay =
    !!loaded && replayInBlock && block.trim() === (loaded.blockNumber - 1n).toString();

  const buildTx = (): TxRequest => {
    const f = from.trim();
    const t = to.trim();
    const d = data.trim() || "0x";
    if (!isAddress(f, { strict: false })) throw new Error("From must be a valid address");
    if (t && !isAddress(t, { strict: false })) throw new Error("To must be a valid address (leave empty to deploy a contract)");
    const dd = d.startsWith("0x") ? d : `0x${d}`;
    if (!isHex(dd) || dd.length % 2 !== 0) throw new Error("Data must be a hex string");
    if (!t && dd === "0x") throw new Error("Enter a To address, or bytecode in Data to deploy a contract");
    let v = 0n;
    if (value.trim()) {
      try {
        v = parseUnits(value.trim(), UNIT_DECIMALS[unit]);
      } catch {
        throw new Error("Invalid value");
      }
    }
    let g: bigint | undefined;
    if (gas.trim()) {
      if (!/^\d+$/.test(gas.trim())) throw new Error("Gas limit must be a whole number");
      g = BigInt(gas.trim());
    }
    return { from: f, to: t || undefined, value: v, data: dd as Hex, gas: g };
  };

  const simulate = async () => {
    setError("");
    if (!rpc) {
      setError("Please enter an RPC URL");
      return;
    }
    let tx: TxRequest;
    try {
      tx = buildTx();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }
    setLoading(true);
    setResult(null);
    setSignatures(emptySignatures());
    setTokenMeta({});
    try {
      const res = await simulateTransaction(rpc, tx, {
        block,
        overrideBalance,
        trace: withTrace,
        replay: canReplay
          ? {
              hash: loaded.hash,
              blockNumber: loaded.blockNumber,
              index: loaded.index,
              status: loaded.status,
              pristine:
                !overrideBalance &&
                tx.from.toLowerCase() === loaded.from.toLowerCase() &&
                (tx.to || "").toLowerCase() === loaded.to.toLowerCase() &&
                tx.value === loaded.value &&
                tx.data.toLowerCase() === loaded.data.toLowerCase() &&
                tx.gas === loaded.gas,
            }
          : undefined,
      });
      if (chain && res.chainId && res.chainId !== chain.id && customRpc) {
        res.warnings.push(`The RPC reports chain id ${res.chainId}, not ${chain.id} (${chain.name}).`);
      }
      setSimTx(tx);
      setResult(res);

      // Enrich in the background: signatures + token metadata
      const { selectors, topics } = collectSelectors(tx, res);
      lookupSignatures(selectors, topics).then(setSignatures);
      const tokens = collectTransfers(tx, res)
        .filter((t) => t.kind === "erc20" && t.token)
        .map((t) => t.token!);
      if (tokens.length) {
        const tag = res.blockNumber !== undefined ? "0x" + res.blockNumber.toString(16) : "latest";
        fetchTokenMeta(rpc, tokens, tag).then(setTokenMeta);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setTxHash("");
    setFrom("");
    setTo("");
    setValue("");
    setUnit("Ether");
    setData("");
    setGas("");
    setBlock("latest");
    setLoaded(null);
    setResult(null);
    setError("");
  };

  const decodedInput = simTx ? decodeCall(simTx.data, abi, signatures) : undefined;
  const decodedReturn =
    simTx && result?.success ? decodeReturn(simTx.data, result.returnData, abi) : undefined;
  const revert = result && !result.success ? decodeRevert(result.revertData, abi, signatures) : undefined;
  const transfers = simTx && result ? collectTransfers(simTx, result) : [];
  const internal = simTx && result ? collectInternalTxs(simTx, result) : { items: [] };
  const internalShown =
    internal.source === "trace" && internalValueOnly
      ? internal.items.filter((t) => t.value > 0n)
      : internal.items;
  const fee =
    result?.gasPrice !== undefined && (result.gasUsed ?? result.gasEstimate) !== undefined
      ? (result.gasUsed ?? result.gasEstimate)! * result.gasPrice
      : undefined;

  const rawJson = result
    ? JSON.stringify({ request: simTx, result }, jsonReplacer, 2)
    : "";

  const addrLink = (a: string, full = false) => <AddressLink address={a} short={!full} />;

  return (
    <ExplorerContext.Provider value={explorer}>
      <Breadcrumb />
      <div className="max-w-5xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Simulate a transaction on any EVM chain without sending it. Runs <code>eth_call</code> and{" "}
          <code>eth_estimateGas</code> through a public RPC (no API key) to show the status, revert reason, return
          data and gas. Events and token transfers come from <code>eth_simulateV1</code>, and the call trace from{" "}
          <code>debug_traceCall</code> when the RPC supports it.
        </p>

        <div className="space-y-4">
          {/* Network */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Network">
              <SelectBox
                items={[...CHAINS.map((c) => c.name), CUSTOM_CHAIN]}
                value={chainName}
                handleOnChange={(e) => setChainName(e.target.value)}
                additionalClass="w-full"
              />
            </Field>
            <Field label="RPC URL" hint={chainName === CUSTOM_CHAIN ? "(required)" : "(optional, overrides the default)"}>
              <TextBox
                value={customRpc}
                onChange={(e) => setCustomRpc(e.target.value)}
                placeholder={chain?.rpc || "https://..."}
                additionalClass="w-full"
              />
            </Field>
          </div>

          {/* Load from hash */}
          <Field label="Load from transaction hash" hint="(optional, re-simulates an existing transaction)">
            <div className="flex flex-col sm:flex-row gap-2">
              <TextBox
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadFromHash()}
                placeholder="0x…"
                additionalClass="w-full font-mono text-sm"
              />
              <Button label="Load" type="secondary" handleOnClick={loadFromHash} isLoading={loadingTx} additionalClass="whitespace-nowrap" />
            </div>
          </Field>

          {/* Transaction */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="From">
              <TextBox value={from} onChange={(e) => setFrom(e.target.value)} placeholder="0x… sender address" additionalClass="w-full font-mono text-sm" />
            </Field>
            <Field label="To" hint="(empty = contract deployment)">
              <TextBox value={to} onChange={(e) => setTo(e.target.value)} placeholder="0x… contract or recipient" additionalClass="w-full font-mono text-sm" />
            </Field>
            <Field label="Value">
              <div className="flex gap-2">
                <TextBox value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" additionalClass="w-full font-mono text-sm" />
                <SelectBox items={UNITS} value={unit} handleOnChange={(e) => setUnit(e.target.value)} additionalClass="w-28" />
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Gas limit" hint="(optional)">
                <TextBox value={gas} onChange={(e) => setGas(e.target.value)} placeholder="auto" additionalClass="w-full font-mono text-sm" />
              </Field>
              <Field label="Block">
                <TextBox value={block} onChange={(e) => setBlock(e.target.value)} placeholder="latest" additionalClass="w-full font-mono text-sm" />
              </Field>
            </div>
          </div>

          <Field label="Data" hint="(calldata, or bytecode for a deployment)">
            <TextArea rows={4} value={data} onChange={(e) => setData(e.target.value)} placeholder="0x…" additionalClass="w-full font-mono text-xs break-all" />
          </Field>

          <Field label="ABI" hint="(optional: JSON ABI or one signature per line; without it, names come from the 4byte signature database)">
            <TextArea
              rows={3}
              value={abiText}
              onChange={(e) => setAbiText(e.target.value)}
              placeholder={'[{"type":"function",...}]  or  function transfer(address to, uint256 amount) returns (bool)'}
              additionalClass="w-full font-mono text-xs"
              isError={!!abiState.error}
            />
            {abiState.error && <div className="mt-1 text-xs text-danger">ABI: {abiState.error}</div>}
          </Field>

          <div className="flex flex-col gap-2 text-sm">
            {loaded && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={replayInBlock} onChange={(e) => setReplayInBlock(e.target.checked)} />
                <span>
                  Replay at its original position in block {loaded.blockNumber.toString()} (after the {loaded.index} transaction
                  {loaded.index === 1 ? "" : "s"} mined before it)
                  {block.trim() !== (loaded.blockNumber - 1n).toString() && (
                    <span className="text-bodydark dark:text-bodydark2"> · off because the Block field was changed</span>
                  )}
                </span>
              </label>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={withTrace} onChange={(e) => setWithTrace(e.target.checked)} />
              Call trace (<code>debug_traceCall</code>, needs an RPC with the debug API; events do not need it)
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={overrideBalance} onChange={(e) => setOverrideBalance(e.target.checked)} />
              Give the sender a large native balance (state override, avoids &quot;insufficient funds&quot;)
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button label="Simulate" handleOnClick={simulate} isLoading={loading} icon={{ icon: MdPlayArrow, position: "left", size: 20 }} />
            <Button label="Reset" type="reset" handleOnClick={reset} icon={{ icon: MdOutlineClear, position: "left", size: 20 }} />
          </div>

          {error && <div className="text-danger text-sm break-all">{error}</div>}

          {/* Results */}
          {result && simTx && (
            <div className="space-y-4 pt-2">
              <Card
                title="Result"
                right={
                  <span
                    className={clsx(
                      "rounded px-2 py-0.5 text-xs font-semibold",
                      result.success ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                    )}
                  >
                    {result.success ? "SUCCESS" : "REVERTED"}
                  </span>
                }
              >
                <Row label="Network">
                  {chain?.name || "Custom"}
                  {result.chainId !== undefined && ` (chain id ${result.chainId})`}
                </Row>
                <Row label="From">
                  <AddressLink address={simTx.from} />
                </Row>
                <Row label="To">
                  {simTx.to ? <AddressLink address={simTx.to} /> : "(contract deployment)"}
                </Row>
                <Row label="Block">
                  {result.replay
                    ? `${result.replay.blockNumber}, position ${result.replay.index} · replayed after the ${result.replay.index} earlier transaction(s) of the block (${result.replay.method})`
                    : result.blockNumber !== undefined
                      ? result.blockNumber.toString()
                      : block}{" "}
                  · simulated in {result.durationMs} ms
                </Row>
                {!result.success && (
                  <>
                    <Row label="Revert reason">
                      <span className="text-danger">
                        {revert?.reason || result.errorMessage || "Reverted without a reason"}
                      </span>
                      {revert?.error?.guessed && <span className="ml-2 text-xs text-bodydark">(from 4byte)</span>}
                    </Row>
                    {result.errorMessage && revert && <Row label="RPC message">{result.errorMessage}</Row>}
                    {result.revertData && <Row label="Revert data">{result.revertData}</Row>}
                    {revert?.error && revert.error.args.length > 0 && (
                      <Row label="Error args">
                        <ArgsTable args={revert.error.args} />
                      </Row>
                    )}
                  </>
                )}
                {result.gasEstimate !== undefined && (
                  <Row label="Gas estimate">{result.gasEstimate.toLocaleString()}</Row>
                )}
                {result.gasUsed !== undefined && (
                  <Row label={result.trace ? "Gas used (trace)" : "Gas used (simulated)"}>
                    {result.gasUsed.toLocaleString()}
                  </Row>
                )}
                {fee !== undefined && (
                  <Row label="Est. fee">
                    {fmtAmount(fee, 18, 8)} {symbol}{" "}
                    <span className="text-bodydark dark:text-bodydark2">
                      @ {fmtAmount(result.gasPrice!, 9, 3)} gwei
                    </span>
                  </Row>
                )}
                {result.success && (
                  <Row label="Return data">
                    <div className="flex items-start gap-2">
                      <span>{result.returnData || "0x"}</span>
                      {result.returnData && result.returnData !== "0x" && (
                        <button className="text-xs text-primary hover:underline shrink-0" onClick={() => copyToClipboard(result.returnData!)}>
                          Copy
                        </button>
                      )}
                    </div>
                  </Row>
                )}
                {decodedReturn && (
                  <Row label="Decoded return">
                    <ArgsTable args={decodedReturn} />
                  </Row>
                )}
              </Card>

              {decodedInput && (
                <Card
                  title="Function"
                  right={decodedInput.guessed ? <span className="text-xs text-bodydark dark:text-bodydark2">from 4byte</span> : undefined}
                >
                  <div className="mb-2 font-mono text-sm break-all">{decodedInput.signature}</div>
                  {decodedInput.args.length > 0 && <ArgsTable args={decodedInput.args} />}
                </Card>
              )}

              {transfers.length > 0 && (
                <Card title={`Asset transfers (${transfers.length})`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="text-left text-bodydark dark:text-bodydark2 border-b border-stroke dark:border-strokedark">
                          <th className="py-1 pr-3">Asset</th>
                          <th className="py-1 pr-3">From</th>
                          <th className="py-1 pr-3">To</th>
                          <th className="py-1 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transfers.map((t, i) => {
                          const meta = t.token ? tokenMeta[t.token.toLowerCase()] : undefined;
                          return (
                            <tr key={i} className="border-b border-stroke/50 dark:border-strokedark/50 last:border-b-0">
                              <td className="py-1 pr-3 whitespace-nowrap">
                                {t.kind === "native" ? symbol : (
                                  <>
                                    {meta?.symbol || addrLink(t.token!)}
                                    <span className="ml-1 text-bodydark">{t.kind.toUpperCase()}</span>
                                  </>
                                )}
                              </td>
                              <td className="py-1 pr-3">{addrLink(t.from)}</td>
                              <td className="py-1 pr-3">{addrLink(t.to)}</td>
                              <td className="py-1 text-right whitespace-nowrap">
                                {t.kind === "native"
                                  ? fmtAmount(t.amount)
                                  : t.kind === "erc20"
                                    ? meta?.decimals !== undefined
                                      ? fmtAmount(t.amount, meta.decimals)
                                      : t.amount.toString()
                                    : `${t.kind === "erc1155" ? `${t.amount} × ` : ""}#${t.tokenId}`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              <Card
                title={`Internal transactions (${internalShown.length}${
                  internalShown.length !== internal.items.length ? ` of ${internal.items.length} calls` : ""
                })`}
                right={
                  internal.source === "trace" ? (
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={internalValueOnly}
                        onChange={(e) => setInternalValueOnly(e.target.checked)}
                      />
                      Only calls that move {symbol}
                    </label>
                  ) : internal.source === "eth_simulateV1" ? (
                    <span className="text-xs text-bodydark dark:text-bodydark2">{symbol} transfers from eth_simulateV1</span>
                  ) : undefined
                }
              >
                {!internal.source ? (
                  <div className="text-sm text-bodydark dark:text-bodydark2">
                    Not available: internal transactions need an RPC that supports <code>debug_traceCall</code> or{" "}
                    <code>eth_simulateV1</code>.
                  </div>
                ) : internalShown.length === 0 ? (
                  <div className="text-sm text-bodydark dark:text-bodydark2">
                    {internal.items.length === 0
                      ? `This transaction makes no internal ${internal.source === "trace" ? "calls" : `${symbol} transfers`}.`
                      : `No internal call moves ${symbol}. Untick the box to see all ${internal.items.length} calls.`}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="text-left text-bodydark dark:text-bodydark2 border-b border-stroke dark:border-strokedark">
                          <th className="py-1 pr-3">{internal.source === "trace" ? "Trace" : "#"}</th>
                          <th className="py-1 pr-3">Type</th>
                          <th className="py-1 pr-3">From</th>
                          <th className="py-1 pr-3">To</th>
                          {internal.source === "trace" && <th className="py-1 pr-3">Function</th>}
                          <th className="py-1 pr-3 text-right">Value ({symbol})</th>
                          {internal.source === "trace" && <th className="py-1 pr-3 text-right">Gas used</th>}
                          <th className="py-1">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {internalShown.map((t) => {
                          const fn =
                            internal.source === "trace" && !t.type.startsWith("CREATE")
                              ? decodeCall(t.input, abi, signatures)
                              : undefined;
                          return (
                            <tr
                              key={t.id}
                              className={clsx(
                                "border-b border-stroke/50 dark:border-strokedark/50 last:border-b-0",
                                t.reverted && "opacity-60"
                              )}
                            >
                              <td className="py-1 pr-3 whitespace-nowrap">
                                <span style={{ paddingLeft: `${(t.depth - 1) * 8}px` }}>{internal.source === "trace" ? `call_${t.id}` : Number(t.id) + 1}</span>
                              </td>
                              <td className="py-1 pr-3 whitespace-nowrap">{t.type}</td>
                              <td className="py-1 pr-3">{addrLink(t.from)}</td>
                              <td className="py-1 pr-3">{t.to ? addrLink(t.to) : "—"}</td>
                              {internal.source === "trace" && (
                                <td className="py-1 pr-3 whitespace-nowrap" title={fn?.signature || t.input}>
                                  {t.type.startsWith("CREATE")
                                    ? "constructor"
                                    : fn?.name || (t.input && t.input.length >= 10 ? t.input.slice(0, 10) : "—")}
                                </td>
                              )}
                              <td className={clsx("py-1 pr-3 text-right whitespace-nowrap", t.value > 0n && "text-warning")}>
                                {t.value > 0n ? fmtAmount(t.value) : "0"}
                              </td>
                              {internal.source === "trace" && (
                                <td className="py-1 pr-3 text-right whitespace-nowrap">
                                  {t.gasUsed !== undefined ? t.gasUsed.toLocaleString() : ""}
                                </td>
                              )}
                              <td className="py-1 whitespace-nowrap">
                                {t.error ? (
                                  <span className="text-danger" title={t.error}>✕ {t.error}</span>
                                ) : t.reverted ? (
                                  <span className="text-danger">rolled back</span>
                                ) : (
                                  <span className="text-success">✓</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {result.logs.length > 0 && (
                <Card title={`Events (${result.logs.length})`}>
                  <div className="space-y-3">
                    {result.logs.map((log, i) => {
                      const d = decodeLog(log, abi, signatures);
                      return (
                        <div key={i} className="border-b border-stroke/50 dark:border-strokedark/50 last:border-b-0 pb-3 last:pb-0">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-xs text-bodydark">#{i}</span>
                            <span className="font-mono font-semibold">{d?.name || log.topics[0]?.slice(0, 10) || "anonymous"}</span>
                            <span className="text-xs">{addrLink(log.address, true)}</span>
                            {d?.source && (
                              <span
                                className={clsx(
                                  "rounded px-1.5 py-0.5 text-[11px]",
                                  d.source === "abi"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-gray text-bodydark dark:bg-meta-4 dark:text-bodydark2"
                                )}
                              >
                                {d.source === "abi"
                                  ? "from your ABI"
                                  : d.source === "common"
                                    ? "common event"
                                    : "guessed from 4byte"}
                              </span>
                            )}
                          </div>
                          {d?.signature && (
                            <div className="mt-0.5 break-all font-mono text-xs text-bodydark">{d.signature}</div>
                          )}
                          {d && d.args.length > 0 ? (
                            <div className="mt-1">
                              <ArgsTable args={d.args} />
                            </div>
                          ) : (
                            <div className="mt-1 space-y-0.5 text-xs font-mono break-all">
                              {log.topics.map((t, j) => (
                                <div key={j}>
                                  <span className="text-bodydark">topic{j} </span>
                                  {t}
                                </div>
                              ))}
                              <div>
                                <span className="text-bodydark">data </span>
                                {log.data}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {result.success && result.logsSource && result.logs.length === 0 && (
                <Card title="Events (0)">
                  <div className="text-sm text-bodydark">This transaction emits no events.</div>
                </Card>
              )}

              {result.trace && (
                <Card title="Call trace">
                  <div className="overflow-x-auto">
                    <CallTrace frame={result.trace} abi={abi} signatures={signatures} symbol={symbol} explorer={explorer} />
                  </div>
                </Card>
              )}

              {(result.traceError || (!result.logsSource && result.logsError) || result.warnings.length > 0) && (
                <div className="rounded border border-warning/40 bg-warning/10 p-3 text-xs space-y-1">
                  {result.traceError && (
                    <div>
                      {result.logsSource
                        ? "The call trace is not available"
                        : "The call trace and events are not available"}
                      : this RPC does not support <code>debug_traceCall</code> ({result.traceError})
                      {result.logsSource ? (
                        <>
                          . Events were read with <code>eth_simulateV1</code> instead.
                        </>
                      ) : (
                        <>
                          {" "}
                          or <code>eth_simulateV1</code> ({result.logsError}).
                        </>
                      )}{" "}
                      Use an RPC with the debug API (for example your own node, or a provider plan that enables it) in
                      the RPC URL field to see {result.logsSource ? "the trace" : "them"}.
                    </div>
                  )}
                  {!result.traceError && !result.logsSource && result.logsError && (
                    <div>
                      Events are not available: this RPC does not support <code>eth_simulateV1</code> (
                      {result.logsError}). Turn on the call trace or use another RPC.
                    </div>
                  )}
                  {result.warnings.map((w, i) => (
                    <div key={i}>{w}</div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button label="Copy raw JSON" type="secondary" handleOnClick={() => copyToClipboard(rawJson)} />
                <Button
                  label="Download JSON"
                  type="outline"
                  icon={{ icon: MdDownload, position: "left", size: 18 }}
                  handleOnClick={() => {
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(new Blob([rawJson], { type: "application/json" }));
                    a.download = "simulation.json";
                    a.click();
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </ExplorerContext.Provider>
  );
};

export default EvmTransactionSimulatorComponent;
