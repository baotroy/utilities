"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import TextArea from "@/components/Input/TextArea";
import AbiField from "@/components/evm/AbiField";
import ChainRpc from "@/components/evm/ChainRpc";
import { Card, ErrorText, Field, Intro, Tabs, ValueRow } from "@/components/Tool/ui";
import { EVM_CHAINS, formatValue, getClient, shortError, tryParseAbi } from "@/common/evmTools";
import { FC, useState } from "react";
import { Hex } from "viem";
import { decodeRevert, DecodedRevert, extractRevertData, PANIC_CODES, revertDataFromTx } from "./utils";

const SAMPLES = [
  { label: "Error(string)", value: "0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001a556e697377617056323a20494e53554646494349454e545f494e505554000000" },
  { label: "Panic", value: "0x4e487b710000000000000000000000000000000000000000000000000000000000000011" },
  { label: "Custom error", value: "0xe450d38c000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000012c" },
];

const KIND_LABEL: Record<DecodedRevert["kind"], string> = {
  empty: "No revert data",
  "error-string": "require / revert with a message",
  panic: "Panic (assert, overflow, bounds…)",
  custom: "Custom error",
  unknown: "Unknown error",
};

const RevertDecoderComponent: FC = () => {
  const [mode, setMode] = useState<"data" | "tx">("data");
  const [input, setInput] = useState(SAMPLES[0].value);
  const [rpc, setRpc] = useState(EVM_CHAINS[0].rpc);
  const [txHash, setTxHash] = useState("");
  const [abiText, setAbiText] = useState("");
  const [result, setResult] = useState<DecodedRevert | null>(null);
  const [txStatus, setTxStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { abi, error: abiError } = tryParseAbi(abiText);

  const run = async () => {
    setError("");
    setResult(null);
    setTxStatus("");
    setLoading(true);
    try {
      let data: Hex;
      if (mode === "data") {
        data = extractRevertData(input);
      } else {
        if (!/^0x[0-9a-fA-F]{64}$/.test(txHash.trim())) throw new Error("Enter a 32-byte transaction hash");
        const r = await revertDataFromTx(getClient(rpc), txHash.trim() as Hex);
        data = r.data;
        setTxStatus(r.status);
      }
      setResult(await decodeRevert(data, abi));
    } catch (e) {
      setError(shortError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <Intro>
          Find out why a call reverted. Paste the revert data (or the whole error your wallet or
          library printed), or a failed transaction hash to replay it. Error(string), Panic codes
          and custom errors are decoded; custom errors come from your ABI or the 4byte database.
        </Intro>
        <Tabs
          value={mode}
          onChange={(m) => {
            setMode(m);
            setResult(null);
            setError("");
          }}
          options={[
            { value: "data", label: "Revert data" },
            { value: "tx", label: "Failed transaction" },
          ]}
        />
        {mode === "data" ? (
          <Field
            label="Revert data or error"
            right={
              <span className="flex gap-2 text-sm">
                {SAMPLES.map((s) => (
                  <button key={s.label} type="button" className="cursor-pointer text-primary hover:underline" onClick={() => setInput(s.value)}>
                    {s.label}
                  </button>
                ))}
              </span>
            }
          >
            <TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} placeholder='0x08c379a0… or {"code":3,"message":"execution reverted","data":"0x…"}' additionalClass="w-full font-mono text-sm leading-5" />
          </Field>
        ) : (
          <>
            <ChainRpc rpc={rpc} onChange={setRpc} />
            <Field label="Transaction hash" hint="(replayed with eth_call at the block before it; old blocks need an archive RPC)">
              <input className="custom-input w-full font-mono text-sm" value={txHash} spellCheck={false} onChange={(e) => setTxHash(e.target.value)} placeholder="0x…" />
            </Field>
          </>
        )}
        <AbiField value={abiText} onChange={setAbiText} error={abiError} rows={3} hint="(optional: for custom errors)" placeholder="error InsufficientBalance(uint256 available, uint256 required)" />
        <div className="mb-4 text-right">
          <Button label="Decode" handleOnClick={run} isLoading={loading} disabled={!!abiError} />
        </div>
        <ErrorText>{error}</ErrorText>
        {result && (
          <Card title={KIND_LABEL[result.kind]} right={result.source && result.source !== "builtin" && <span className="rounded bg-gray px-1.5 py-0.5 text-xs text-bodydark dark:bg-meta-4">from {result.source === "abi" ? "ABI" : "4byte"}</span>}>
            <dl>
              {txStatus && <ValueRow label="Transaction status" value={txStatus} />}
              {result.kind === "empty" && (
                <p className="text-sm text-body dark:text-bodydark2">
                  {mode === "tx" && txStatus === "success"
                    ? "The transaction succeeded, and replaying it did not revert."
                    : "The call reverted without data: a bare revert(), a require without a message, running out of gas, or a call to an address with no code."}
                </p>
              )}
              {result.message && <ValueRow label={result.kind === "panic" ? "Meaning" : "Reason"} value={result.message} main />}
              {result.signature && <ValueRow label="Error" value={result.signature} main={!result.message} />}
              {result.args?.filter(() => result.kind === "custom").map((a, i) => (
                <ValueRow key={i} label={<span className="font-mono">{a.name} <span className="text-xs">{a.type}</span></span>} value={formatValue(a.value)} />
              ))}
              {result.kind === "unknown" && (
                <p className="py-1.5 text-sm text-body dark:text-bodydark2">
                  Selector <span className="font-mono">{result.data.slice(0, 10)}</span> is not in your ABI
                  {result.candidates?.length
                    ? ` and no 4byte match fits the data (${result.candidates.join(", ")})`
                    : result.lookupFailed
                      ? ", and the 4byte database could not be reached"
                      : " or the 4byte database"}. Add the contract&apos;s error definitions to the ABI field.
                </p>
              )}
              {result.data !== "0x" && <ValueRow label="Raw data" value={result.data} />}
            </dl>
          </Card>
        )}
        <details className="mt-6 text-sm">
          <summary className="cursor-pointer font-semibold">Panic codes</summary>
          <table className="mt-2 text-left">
            <tbody>
              {Object.entries(PANIC_CODES).map(([code, text]) => (
                <tr key={code} className="border-t border-stroke dark:border-strokedark">
                  <td className="py-1 pr-4 font-mono">0x{Number(code).toString(16).padStart(2, "0")}</td>
                  <td className="py-1">{text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </>
  );
};

export default RevertDecoderComponent;
