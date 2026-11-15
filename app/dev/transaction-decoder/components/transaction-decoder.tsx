"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import SelectBox from "@/components/Input/SelectBox";
import TextArea from "@/components/Input/TextArea";
import TextBox from "@/components/Input/TextBox";
import { copyToClipboard } from "@/common/utils";
import clsx from "clsx";
import { FC, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { MdContentCopy, MdDownload, MdOpenInNew, MdOutlineClear, MdSearch } from "react-icons/md";
import type { Abi } from "viem";
import { AddressLink, ExplorerContext, ValueView } from "../../evm-transaction-simulator/components/address";
import CallTrace from "../../evm-transaction-simulator/components/call-trace";
import {
  CHAINS,
  CUSTOM_CHAIN,
  ChainPreset,
  SignatureMap,
  TokenMeta,
  collectInternalTxs,
  collectSelectors,
  collectTransfers,
  decodeCall,
  decodeLog,
  emptySignatures,
  fetchTokenMeta,
  fmtAmount,
  jsonReplacer,
  lookupSignatures,
  parseUserAbi,
} from "../../evm-transaction-simulator/components/utils";
import FunctionComponent from "../../universal-calldata-decoder/components/FunctionComponent";
import type { IDecodeResult, IFunctionFragement } from "../../universal-calldata-decoder/components/type";
import {
  DecodeError,
  decodeCalldata,
  decodeWithSignature,
} from "../../universal-calldata-decoder/components/utils";
import {
  ExecutionInfo,
  TxDetails,
  asSimulationResult,
  fetchExecution,
  fetchTxDetails,
  findChainOfTx,
  fmtAge,
  parseHashInput,
  toTxRequest,
  txTypeLabel,
  unwrapRevert,
} from "./utils";

const AUTO_DETECT = "Auto-detect";

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

const CopyButton: FC<{ text: string; title?: string }> = ({ text, title = "Copy" }) => (
  <button
    onClick={() => copyToClipboard(text)}
    className="ml-2 inline-flex align-middle text-bodydark hover:text-primary"
    title={title}
    aria-label={title}
  >
    <MdContentCopy size={14} />
  </button>
);

const STATUS_STYLE = {
  success: { label: "SUCCESS", className: "bg-success/15 text-success" },
  reverted: { label: "FAILED", className: "bg-danger/15 text-danger" },
  pending: { label: "PENDING", className: "bg-warning/15 text-warning" },
} as const;

interface Decoded {
  chain?: ChainPreset;
  rpc: string;
  details: TxDetails;
  exec?: ExecutionInfo;
}

const TransactionDecoderComponent = () => {
  const [chainName, setChainName] = useState(AUTO_DETECT);
  const [customRpc, setCustomRpc] = useState("");
  const [hashInput, setHashInput] = useState("");
  const [abiText, setAbiText] = useState("");
  const [showAbi, setShowAbi] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingExec, setLoadingExec] = useState(false);
  const [error, setError] = useState("");
  const [decoded, setDecoded] = useState<Decoded | null>(null);
  const [signatures, setSignatures] = useState<SignatureMap>(emptySignatures());
  const [tokenMeta, setTokenMeta] = useState<Record<string, TokenMeta>>({});
  const [input, setInput] = useState<IDecodeResult | null>(null);
  const [inputError, setInputError] = useState("");
  const [inputSignature, setInputSignature] = useState("");
  const [inputFragment, setInputFragment] = useState<IFunctionFragement | null>(null);
  const [internalValueOnly, setInternalValueOnly] = useState(true);
  const requestRef = useRef(0);
  // selectors of wrapped revert errors already asked from the signature database
  const lookedUpRef = useRef(new Set<string>());

  const activeAbiText = showAbi ? abiText : "";
  const abiState = useMemo((): { abi?: Abi; error?: string } => {
    try {
      return { abi: parseUserAbi(activeAbiText) };
    } catch (e) {
      return { error: e instanceof Error ? e.message.split("\n")[0] : "Invalid ABI" };
    }
  }, [activeAbiText]);
  const abi = abiState.abi;

  const presetChain = CHAINS.find((c) => c.name === chainName);

  const decodeInput = async (data: string, request: number) => {
    setInput(null);
    setInputFragment(null);
    setInputSignature("");
    setInputError("");
    if (!data || data === "0x" || data.length < 10) return;
    try {
      const res = await decodeCalldata(data, activeAbiText);
      if (request !== requestRef.current) return;
      setInput(res);
      setInputFragment(res.fragment);
      setInputSignature(res.candidates[0] || "");
    } catch (e) {
      if (request !== requestRef.current) return;
      setInputError(
        e instanceof DecodeError && e.code === "abi"
          ? e.message
          : `Could not decode the input with the signature database (${e instanceof Error ? e.message : String(e)}).`
      );
    }
  };

  const decode = async (raw = hashInput, selected = chainName) => {
    setError("");
    const parsed = parseHashInput(raw);
    if (!parsed.hash) {
      setError("Enter a transaction hash (0x + 64 hex characters) or an explorer link to a transaction.");
      return;
    }
    const request = ++requestRef.current;
    setLoading(true);
    setDecoded(null);
    setSignatures(emptySignatures());
    lookedUpRef.current.clear();
    setTokenMeta({});
    setInput(null);
    setInputError("");
    try {
      // Which chain: custom RPC > chain of the explorer link > selection > search all presets
      let chain: ChainPreset | undefined;
      let rpc: string;
      if (selected === CUSTOM_CHAIN) {
        rpc = customRpc.trim();
        if (!rpc) throw new Error("Please enter an RPC URL");
      } else {
        chain = parsed.chain && selected === AUTO_DETECT ? parsed.chain : CHAINS.find((c) => c.name === selected);
        if (!chain && !customRpc.trim()) {
          chain = await findChainOfTx(parsed.hash);
          if (request !== requestRef.current) return;
          if (!chain) {
            throw new Error(
              `Transaction not found on any of the preset chains (${CHAINS.map((c) => c.name).join(", ")}). Pick "Custom RPC" for another chain.`
            );
          }
        }
        rpc = customRpc.trim() || chain!.rpc;
        if (chain && selected === AUTO_DETECT) {
          toast.success(`Found on ${chain.name}`);
        }
      }

      const details = await fetchTxDetails(rpc, parsed.hash);
      if (request !== requestRef.current) return;
      setDecoded({ chain, rpc, details });
      setLoading(false);

      // Share link: ?chain=<id>&tx=<hash>
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("tx", parsed.hash);
        if (chain) url.searchParams.set("chain", String(chain.id));
        else url.searchParams.delete("chain");
        window.history.replaceState(null, "", url.toString());
      } catch {}

      decodeInput(details.tx.input, request);

      const txReq = toTxRequest(details.tx);
      const enrich = (exec: ExecutionInfo) => {
        const sim = asSimulationResult(details, exec);
        const { selectors, topics } = collectSelectors(txReq, sim);
        lookupSignatures(selectors, topics).then((s) => {
          if (request !== requestRef.current) return;
          setSignatures((prev) => ({
            functions: { ...prev.functions, ...s.functions },
            events: { ...prev.events, ...s.events },
          }));
        });
        const tokens = collectTransfers(txReq, sim)
          .filter((t) => t.kind === "erc20" && t.token)
          .map((t) => t.token!);
        if (tokens.length) {
          fetchTokenMeta(rpc, tokens, details.tx.blockNumber || "latest").then((m) => {
            if (request === requestRef.current) setTokenMeta(m);
          });
        }
      };
      enrich({});

      // Call trace / revert reason (slower, may need the debug API)
      if (details.status !== "pending") {
        setLoadingExec(true);
        const exec = await fetchExecution(rpc, details);
        if (request !== requestRef.current) return;
        setDecoded({ chain, rpc, details, exec });
        enrich(exec);
      }
    } catch (e) {
      if (request === requestRef.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (request === requestRef.current) {
        setLoading(false);
        setLoadingExec(false);
      }
    }
  };

  // Open a shared link: ?tx=<hash>&chain=<id>
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tx = params.get("tx") || params.get("hash");
      if (!tx) return;
      const chainId = Number(params.get("chain"));
      const chain = CHAINS.find((c) => c.id === chainId);
      if (chain) setChainName(chain.name);
      setHashInput(tx);
      // start after hydration has finished (toasts need the Toaster mounted)
      const run = () => setTimeout(() => decode(tx, chain ? chain.name : AUTO_DETECT), 0);
      if (document.readyState === "complete") run();
      else window.addEventListener("load", run, { once: true });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-decode the input with the ABI when it changes
  useEffect(() => {
    if (decoded) decodeInput(decoded.details.tx.input, requestRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAbiText]);

  const changeSignature = async (sig: string) => {
    if (!input) return;
    setInputSignature(sig);
    try {
      setInputFragment(await decodeWithSignature(input.calldata, sig, activeAbiText));
    } catch {
      toast.error("Unable to decode with this signature");
    }
  };

  const reset = () => {
    requestRef.current++;
    setHashInput("");
    setDecoded(null);
    setError("");
    setInput(null);
    setInputError("");
    setLoading(false);
    setLoadingExec(false);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("tx");
      url.searchParams.delete("chain");
      window.history.replaceState(null, "", url.toString());
    } catch {}
  };

  // ------------------------------------------------------------------ derived
  const d = decoded?.details;
  const exec = decoded?.exec;
  const chain = decoded?.chain;
  const symbol = chain?.symbol || "ETH";
  const explorer = chain?.explorer;
  const txReq = d ? toTxRequest(d.tx) : undefined;
  const sim = d ? asSimulationResult(d, exec || {}) : undefined;
  const transfers = txReq && sim ? collectTransfers(txReq, sim) : [];
  const internal = txReq && sim ? collectInternalTxs(txReq, sim) : { items: [] };
  const internalShown =
    internal.source === "trace" && internalValueOnly ? internal.items.filter((t) => t.value > 0n) : internal.items;
  const revertChain =
    d?.status === "reverted" ? unwrapRevert(exec?.revertData, abi, signatures) : { chain: [], unknownSelectors: [] };
  // the innermost error is the real cause; the outer ones only wrap it
  const revert = revertChain.chain[revertChain.chain.length - 1];
  const wrappers = revertChain.chain.slice(0, -1);
  // Fallback when the universal decoder found nothing: the 4byte lookup made for the events
  const simpleCall = d && !input?.fragment ? decodeCall(d.tx.input, abi, signatures) : undefined;

  const gasUsed = d?.receipt ? BigInt(d.receipt.gasUsed) : undefined;
  const gasLimit = d ? BigInt(d.tx.gas) : undefined;
  const effectivePrice = d?.receipt?.effectiveGasPrice
    ? BigInt(d.receipt.effectiveGasPrice)
    : d?.tx.gasPrice
      ? BigInt(d.tx.gasPrice)
      : undefined;
  const l1Fee = d?.receipt?.l1Fee ? BigInt(d.receipt.l1Fee) : 0n;
  const blobFee =
    d?.receipt?.blobGasUsed && d.receipt.blobGasPrice
      ? BigInt(d.receipt.blobGasUsed) * BigInt(d.receipt.blobGasPrice)
      : 0n;
  const fee =
    gasUsed !== undefined && effectivePrice !== undefined ? gasUsed * effectivePrice + l1Fee + blobFee : undefined;
  const blockNumber = d?.tx.blockNumber ? BigInt(d.tx.blockNumber) : undefined;
  const value = d ? BigInt(d.tx.value) : 0n;

  // Wrapped errors are only known once the outer one is decoded: look them up then
  const unknownKey = revertChain.unknownSelectors.join(",");
  useEffect(() => {
    const missing = revertChain.unknownSelectors.filter((s) => !lookedUpRef.current.has(s));
    if (!missing.length) return;
    missing.forEach((s) => lookedUpRef.current.add(s));
    const request = requestRef.current;
    lookupSignatures(missing, []).then((found) => {
      if (request !== requestRef.current || !Object.keys(found.functions).length) return;
      setSignatures((prev) => ({ functions: { ...prev.functions, ...found.functions }, events: prev.events }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unknownKey]);

  const rawJson = d ? JSON.stringify({ transaction: d.tx, receipt: d.receipt, trace: exec?.trace }, jsonReplacer, 2) : "";
  const addrLink = (a: string, full = false) => <AddressLink address={a} short={!full} />;
  const ExplorerLink: FC<{ path: string; children: ReactNode }> = ({ path, children }) =>
    explorer ? (
      <a href={`${explorer}/${path}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
        {children}
      </a>
    ) : (
      <>{children}</>
    );

  return (
    <ExplorerContext.Provider value={explorer}>
      <Breadcrumb />
      <div className="max-w-5xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Paste a transaction hash (or an explorer link) to see what it did: the decoded function and arguments, the
          events, token transfers, and the revert reason when it failed. Everything is read from a public RPC in your
          browser, no API key needed. Function and event names come from your ABI or the 4byte signature database.
        </p>

        <div className="space-y-4">
          <Field label="Transaction hash" hint="(or a block explorer link such as https://etherscan.io/tx/0x…)">
            {/* pasting a hash or link decodes right away */}
            <div
              onPaste={(e) => {
                const text = e.clipboardData.getData("text").trim();
                if (parseHashInput(text).hash) setTimeout(() => decode(text), 0);
              }}
            >
              <TextBox
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && decode()}
                placeholder="0x…"
                additionalClass="w-full font-mono text-sm"
              />
            </div>
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Network" hint={chainName === AUTO_DETECT ? "(searches every preset chain)" : undefined}>
              <SelectBox
                items={[AUTO_DETECT, ...CHAINS.map((c) => c.name), CUSTOM_CHAIN]}
                value={chainName}
                handleOnChange={(e) => setChainName(e.target.value)}
                additionalClass="w-full"
              />
            </Field>
            <Field label="RPC URL" hint={chainName === CUSTOM_CHAIN ? "(required)" : "(optional, overrides the default)"}>
              <TextBox
                value={customRpc}
                onChange={(e) => setCustomRpc(e.target.value)}
                placeholder={presetChain?.rpc || "https://..."}
                additionalClass="w-full"
              />
            </Field>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={showAbi} onChange={(e) => setShowAbi(e.target.checked)} />
              Use my ABI (for contracts whose functions or events are not in the signature database)
            </label>
            {showAbi && (
              <div className="mt-2">
                <TextArea
                  rows={3}
                  value={abiText}
                  onChange={(e) => setAbiText(e.target.value)}
                  placeholder={'[{"type":"function",...}]  or  function transfer(address to, uint256 amount)'}
                  additionalClass="w-full font-mono text-xs"
                  isError={!!abiState.error}
                />
                {abiState.error && <div className="mt-1 text-xs text-danger">ABI: {abiState.error}</div>}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button label="Decode" handleOnClick={() => decode()} isLoading={loading} icon={{ icon: MdSearch, position: "left", size: 20 }} />
            <Button label="Reset" type="reset" handleOnClick={reset} icon={{ icon: MdOutlineClear, position: "left", size: 20 }} />
          </div>

          {error && <div className="text-danger text-sm break-all">{error}</div>}

          {d && (
            <div className="space-y-4 pt-2">
              {/* Overview */}
              <Card
                title="Overview"
                right={
                  <span className={clsx("rounded px-2 py-0.5 text-xs font-semibold", STATUS_STYLE[d.status].className)}>
                    {STATUS_STYLE[d.status].label}
                  </span>
                }
              >
                <Row label="Transaction hash">
                  <ExplorerLink path={`tx/${d.tx.hash}`}>{d.tx.hash}</ExplorerLink>
                  <CopyButton text={d.tx.hash} />
                  {explorer && (
                    <a href={`${explorer}/tx/${d.tx.hash}`} target="_blank" rel="noreferrer" className="ml-1 inline-flex align-middle text-bodydark hover:text-primary" title="Open on explorer">
                      <MdOpenInNew size={14} />
                    </a>
                  )}
                </Row>
                <Row label="Network">
                  {chain ? `${chain.name} (chain id ${chain.id})` : `Custom RPC${d.tx.chainId ? ` (chain id ${BigInt(d.tx.chainId)})` : ""}`}
                </Row>
                <Row label="Block">
                  {blockNumber !== undefined ? (
                    <>
                      <ExplorerLink path={`block/${blockNumber}`}>{blockNumber.toString()}</ExplorerLink>
                      {d.tx.transactionIndex && ` · position ${Number(BigInt(d.tx.transactionIndex))}`}
                      {d.latestBlock !== undefined && d.latestBlock >= blockNumber && (
                        <span className="text-bodydark dark:text-bodydark2">
                          {" "}· {(d.latestBlock - blockNumber + 1n).toLocaleString()} confirmations
                        </span>
                      )}
                    </>
                  ) : (
                    "pending (not mined yet)"
                  )}
                </Row>
                {d.timestamp !== undefined && (
                  <Row label="Time">
                    {new Date(d.timestamp * 1000).toLocaleString()}{" "}
                    <span className="text-bodydark dark:text-bodydark2">
                      · {fmtAge(d.timestamp)} · UTC {new Date(d.timestamp * 1000).toISOString().replace("T", " ").slice(0, 19)}
                    </span>
                  </Row>
                )}
                <Row label="From">
                  <AddressLink address={d.tx.from} />
                </Row>
                <Row label="To">
                  {d.tx.to ? (
                    <AddressLink address={d.tx.to} />
                  ) : (
                    <>
                      Contract creation
                      {d.receipt?.contractAddress && (
                        <>
                          {": "}
                          <AddressLink address={d.receipt.contractAddress} />
                        </>
                      )}
                    </>
                  )}
                </Row>
                <Row label="Value">
                  {fmtAmount(value, 18, 18)} {symbol}
                  {value > 0n && <span className="text-bodydark dark:text-bodydark2"> · {value.toString()} wei</span>}
                </Row>
                {fee !== undefined && (
                  <Row label="Transaction fee">
                    {fmtAmount(fee, 18, 18)} {symbol}
                    {l1Fee > 0n && (
                      <span className="text-bodydark dark:text-bodydark2"> · includes L1 data fee {fmtAmount(l1Fee, 18, 18)}</span>
                    )}
                    {blobFee > 0n && (
                      <span className="text-bodydark dark:text-bodydark2"> · includes blob fee {fmtAmount(blobFee, 18, 18)}</span>
                    )}
                  </Row>
                )}
                {effectivePrice !== undefined && (
                  <Row label="Gas price">
                    {fmtAmount(effectivePrice, 9, 9)} gwei
                    {d.tx.maxFeePerGas && (
                      <span className="text-bodydark dark:text-bodydark2">
                        {" "}· max {fmtAmount(BigInt(d.tx.maxFeePerGas), 9, 9)} · max priority{" "}
                        {fmtAmount(BigInt(d.tx.maxPriorityFeePerGas || "0x0"), 9, 9)} gwei
                      </span>
                    )}
                  </Row>
                )}
                <Row label="Gas used / limit">
                  {gasUsed !== undefined ? gasUsed.toLocaleString() : "—"} / {gasLimit!.toLocaleString()}
                  {gasUsed !== undefined && gasLimit! > 0n && (
                    <span className={clsx("text-bodydark dark:text-bodydark2", gasUsed === gasLimit && d.status === "reverted" && "text-danger")}>
                      {" "}({((Number(gasUsed) / Number(gasLimit)) * 100).toFixed(2)}%
                      {gasUsed === gasLimit && d.status === "reverted" ? ", out of gas?" : ""})
                    </span>
                  )}
                </Row>
                <Row label="Type / nonce">
                  {txTypeLabel(d.tx.type)} · nonce {BigInt(d.tx.nonce).toString()}
                </Row>
                {d.tx.authorizationList && d.tx.authorizationList.length > 0 && (
                  <Row label="Authorizations">
                    {d.tx.authorizationList.map((a, i) => (
                      <div key={i}>
                        delegate to <AddressLink address={a.address} /> (chain {BigInt(a.chainId).toString()}, nonce {BigInt(a.nonce).toString()})
                      </div>
                    ))}
                  </Row>
                )}
              </Card>

              {/* Revert reason */}
              {d.status === "reverted" && (
                <Card
                  title="Revert reason"
                  right={
                    loadingExec ? (
                      <span className="text-xs text-bodydark dark:text-bodydark2">replaying…</span>
                    ) : exec?.revertSource ? (
                      <span className="text-xs text-bodydark dark:text-bodydark2">via {exec.revertSource}</span>
                    ) : undefined
                  }
                >
                  {loadingExec ? (
                    <div className="text-sm text-bodydark dark:text-bodydark2">Re-executing the transaction to read why it failed…</div>
                  ) : (
                    <>
                      <Row label="Reason">
                        <span className="text-danger">
                          {revert?.reason ||
                            exec?.errorMessage ||
                            (gasUsed === gasLimit ? "Out of gas (the transaction used its whole gas limit)" : "Reverted without a reason")}
                        </span>
                        {revert?.error?.guessed && <span className="ml-2 text-xs text-bodydark">(from 4byte)</span>}
                      </Row>
                      {wrappers.length > 0 && (
                        <Row label="Wrapped in">
                          {wrappers.map((w, i) => (
                            <div key={i}>
                              {w.error ? w.error.signature : w.reason}
                              {w.error?.guessed && <span className="ml-2 text-xs text-bodydark">(from 4byte)</span>}
                            </div>
                          ))}
                        </Row>
                      )}
                      {exec?.errorMessage && revert && exec.errorMessage !== revert.reason && exec.errorMessage !== "execution reverted" && (
                        <Row label="Node message">{exec.errorMessage}</Row>
                      )}
                      {exec?.revertData && (
                        <Row label="Revert data">
                          <details>
                            <summary className="cursor-pointer text-bodydark dark:text-bodydark2">
                              {exec.revertData.slice(0, 10)}… ({(exec.revertData.length - 2) / 2} bytes)
                              <CopyButton text={exec.revertData} />
                            </summary>
                            <div className="mt-1">{exec.revertData}</div>
                          </details>
                        </Row>
                      )}
                      {revert?.error && revert.error.args.length > 0 && (
                        <Row label="Error args">
                          <ArgsTable args={revert.error.args} />
                        </Row>
                      )}
                      {exec?.warning && <div className="mt-2 text-xs text-warning">{exec.warning}</div>}
                    </>
                  )}
                </Card>
              )}

              {/* Input data */}
              <Card
                title="Input data"
                right={
                  input && input.candidates.length > 1 ? (
                    <select
                      value={inputSignature}
                      onChange={(e) => changeSignature(e.target.value)}
                      className="max-w-[60%] rounded border border-stroke bg-transparent px-2 py-0.5 font-mono text-xs dark:border-strokedark dark:bg-boxdark"
                      title="Other signatures with the same selector"
                    >
                      {input.candidates.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  ) : undefined
                }
              >
                {d.tx.input === "0x" || !d.tx.input ? (
                  <div className="text-sm text-bodydark dark:text-bodydark2">
                    No input data: a plain {symbol} transfer.
                  </div>
                ) : !d.tx.to ? (
                  <div className="text-sm text-bodydark dark:text-bodydark2">
                    Contract creation: the input is the contract bytecode ({((d.tx.input.length - 2) / 2).toLocaleString()} bytes).
                  </div>
                ) : inputFragment ? (
                  <FunctionComponent fragment={inputFragment} />
                ) : simpleCall ? (
                  <>
                    <div className="mb-2 font-mono text-sm break-all">
                      {simpleCall.signature}
                      {simpleCall.guessed && <span className="ml-2 text-xs text-bodydark">(from 4byte)</span>}
                    </div>
                    {simpleCall.args.length > 0 && <ArgsTable args={simpleCall.args} />}
                  </>
                ) : (
                  <div className="text-sm text-bodydark dark:text-bodydark2">
                    {inputError ||
                      (input
                        ? `Unknown function ${input.selector}: it is not in the signature database${input.notInAbi ? " nor in your ABI" : ""}. Add the contract ABI to decode it.`
                        : "Decoding…")}
                  </div>
                )}
                {d.tx.input && d.tx.input !== "0x" && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-bodydark dark:text-bodydark2">
                      Raw input ({((d.tx.input.length - 2) / 2).toLocaleString()} bytes)
                    </summary>
                    <div className="mt-1 max-h-60 overflow-auto rounded bg-gray-2 p-2 font-mono text-xs break-all dark:bg-meta-4">
                      {d.tx.input}
                    </div>
                    <button className="mt-1 text-xs text-primary hover:underline" onClick={() => copyToClipboard(d.tx.input)}>
                      Copy
                    </button>
                  </details>
                )}
              </Card>

              {/* Asset transfers */}
              {transfers.length > 0 && (
                <Card title={`Token transfers (${transfers.length})`}>
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
                                {t.kind === "native" ? (
                                  symbol
                                ) : (
                                  <>
                                    {meta?.symbol ? (
                                      <a
                                        href={explorer ? `${explorer}/token/${t.token}` : undefined}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={clsx(explorer && "text-primary hover:underline")}
                                        title={t.token}
                                      >
                                        {meta.symbol}
                                      </a>
                                    ) : (
                                      addrLink(t.token!)
                                    )}
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

              {/* Events */}
              {d.receipt && (
                <Card title={`Events (${d.receipt.logs.length})`}>
                  {d.receipt.logs.length === 0 ? (
                    <div className="text-sm text-bodydark dark:text-bodydark2">
                      {d.status === "reverted"
                        ? "No events: a failed transaction's events are rolled back."
                        : "This transaction emitted no events."}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {d.receipt.logs.map((log, i) => {
                        const dl = decodeLog(log, abi, signatures);
                        return (
                          <div key={i} className="border-b border-stroke/50 dark:border-strokedark/50 last:border-b-0 pb-3 last:pb-0">
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span className="text-xs text-bodydark">
                                #{log.logIndex !== undefined ? Number(BigInt(log.logIndex)) : i}
                              </span>
                              <span className="font-mono font-semibold">{dl?.name || log.topics[0]?.slice(0, 10) || "anonymous"}</span>
                              <span className="text-xs">{addrLink(log.address, true)}</span>
                              {dl?.source && (
                                <span
                                  className={clsx(
                                    "rounded px-1.5 py-0.5 text-[11px]",
                                    dl.source === "abi"
                                      ? "bg-primary/10 text-primary"
                                      : "bg-gray text-bodydark dark:bg-meta-4 dark:text-bodydark2"
                                  )}
                                >
                                  {dl.source === "abi" ? "from your ABI" : dl.source === "common" ? "common event" : "guessed from 4byte"}
                                </span>
                              )}
                            </div>
                            {dl?.signature && <div className="mt-0.5 break-all font-mono text-xs text-bodydark">{dl.signature}</div>}
                            {dl && dl.args.length > 0 ? (
                              <div className="mt-1">
                                <ArgsTable args={dl.args} />
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
                  )}
                </Card>
              )}

              {/* Internal transactions + call trace */}
              {d.status !== "pending" && (
                <Card
                  title={
                    internal.source
                      ? `Internal transactions (${internalShown.length}${
                          internalShown.length !== internal.items.length ? ` of ${internal.items.length} calls` : ""
                        })`
                      : "Internal transactions"
                  }
                  right={
                    internal.source === "trace" ? (
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input type="checkbox" checked={internalValueOnly} onChange={(e) => setInternalValueOnly(e.target.checked)} />
                        Only calls that move {symbol}
                      </label>
                    ) : undefined
                  }
                >
                  {loadingExec ? (
                    <div className="text-sm text-bodydark dark:text-bodydark2">Tracing the transaction…</div>
                  ) : !internal.source ? (
                    <div className="text-sm text-bodydark dark:text-bodydark2">
                      Not available: internal transactions and the call trace need an RPC with the debug API (
                      <code>debug_traceTransaction</code>). Public RPCs usually do not offer it; enter your own node or a provider
                      that enables it in the RPC URL field.
                      {exec?.traceError && <div className="mt-1 text-xs">RPC answer: {exec.traceError}</div>}
                    </div>
                  ) : internalShown.length === 0 ? (
                    <div className="text-sm text-bodydark dark:text-bodydark2">
                      {internal.items.length === 0 && d.status === "reverted" && internal.source !== "trace"
                        ? `None: the transaction failed, so its internal ${symbol} transfers were rolled back.`
                        : internal.items.length === 0
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
                            <th className="py-1">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {internalShown.map((t) => {
                            const fn =
                              internal.source === "trace" && !t.type.startsWith("CREATE") ? decodeCall(t.input, abi, signatures) : undefined;
                            return (
                              <tr
                                key={t.id}
                                className={clsx("border-b border-stroke/50 dark:border-strokedark/50 last:border-b-0", t.reverted && "opacity-60")}
                              >
                                <td className="py-1 pr-3 whitespace-nowrap">
                                  <span style={{ paddingLeft: `${(t.depth - 1) * 8}px` }}>
                                    {internal.source === "trace" ? `call_${t.id}` : Number(t.id) + 1}
                                  </span>
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
              )}

              {exec?.trace && (
                <Card title="Call trace">
                  <div className="overflow-x-auto">
                    <CallTrace frame={exec.trace} abi={abi} signatures={signatures} symbol={symbol} explorer={explorer} />
                  </div>
                </Card>
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
                    a.download = `tx-${d.tx.hash.slice(0, 10)}.json`;
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

export default TransactionDecoderComponent;
