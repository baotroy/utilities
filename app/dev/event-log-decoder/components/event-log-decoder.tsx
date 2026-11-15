"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import TextArea from "@/components/Input/TextArea";
import AbiField from "@/components/evm/AbiField";
import ChainRpc from "@/components/evm/ChainRpc";
import { Card, CopyButton, ErrorText, Field, Intro, Tabs } from "@/components/Tool/ui";
import { EVM_CHAINS, formatValue, getClient, shortError, tryParseAbi } from "@/common/evmTools";
import { FC, useState } from "react";
import { Hex } from "viem";
import { DecodedLog, decodeLogs, parseLogJson, parseTopics, RawLog } from "./utils";

type Mode = "topics" | "json" | "tx";

const SAMPLE_TOPICS = `0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045
0x0000000000000000000000001f9840a85d5af5bf1d1762f925bdaddc4201f984`;
const SAMPLE_DATA = "0x00000000000000000000000000000000000000000000000000000000000f4240";

const LogCard: FC<{ item: DecodedLog; index: number }> = ({ item, index }) => (
  <Card
    title={
      <span className="font-mono text-sm">
        <span className="mr-2 text-bodydark">#{item.log.logIndex ?? index}</span>
        {item.signature || item.log.topics[0]?.slice(0, 10) || "anonymous"}
      </span>
    }
    right={
      item.source && (
        <span className="rounded bg-gray px-1.5 py-0.5 text-xs text-bodydark dark:bg-meta-4">
          {item.source === "abi" ? "from ABI" : "from 4byte"}
        </span>
      )
    }
  >
    {item.log.address && (
      <p className="mb-2 flex items-center gap-2 text-sm">
        <span className="text-bodydark">Contract</span>
        <span className="break-all font-mono">{item.log.address}</span>
        <CopyButton value={item.log.address} />
      </p>
    )}
    {item.error && <p className="text-sm text-red-500">{item.error}</p>}
    {item.args && (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-bodydark">
              <th className="py-1 pr-3 font-medium">Name</th>
              <th className="py-1 pr-3 font-medium">Type</th>
              <th className="py-1 font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {item.args.map((a, i) => {
              const value = formatValue(a.value);
              return (
                <tr key={i} className="border-t border-stroke align-top dark:border-strokedark">
                  <td className="py-1.5 pr-3 font-mono">{a.name}</td>
                  <td className="py-1.5 pr-3 font-mono text-bodydark">
                    {a.type}
                    {a.indexed && <span className="ml-1 text-xs text-primary">indexed</span>}
                  </td>
                  <td className="py-1.5">
                    <span className="flex items-start gap-2">
                      <span className="min-w-0 flex-1 break-all font-mono">{value}</span>
                      <CopyButton value={value} />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </Card>
);

const EventLogDecoderComponent: FC = () => {
  const [mode, setMode] = useState<Mode>("topics");
  const [topics, setTopics] = useState(SAMPLE_TOPICS);
  const [data, setData] = useState(SAMPLE_DATA);
  const [json, setJson] = useState("");
  const [rpc, setRpc] = useState(EVM_CHAINS[0].rpc);
  const [txHash, setTxHash] = useState("");
  const [abiText, setAbiText] = useState("");
  const [results, setResults] = useState<DecodedLog[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { abi, error: abiError } = tryParseAbi(abiText);

  const run = async () => {
    setError("");
    setResults(null);
    setLoading(true);
    try {
      let logs: RawLog[];
      if (mode === "topics") {
        const d = data.trim() || "0x";
        if (!/^0x[0-9a-fA-F]*$/.test(d) || d.length % 2) throw new Error("Data must be hex, e.g. 0x0000…");
        logs = [{ topics: parseTopics(topics), data: d as Hex }];
      } else if (mode === "json") {
        logs = parseLogJson(json);
      } else {
        if (!/^0x[0-9a-fA-F]{64}$/.test(txHash.trim())) throw new Error("Enter a 32-byte transaction hash");
        const receipt = await getClient(rpc).getTransactionReceipt({ hash: txHash.trim() as Hex });
        logs = receipt.logs.map((l) => ({ address: l.address, topics: l.topics as Hex[], data: l.data, logIndex: l.logIndex }));
        if (!logs.length) throw new Error("This transaction emitted no logs.");
      }
      setResults(await decodeLogs(logs, abi));
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
          Decode event logs into names and values. Without an ABI, the event is looked up in the
          4byte signature database by its topic hash.
        </Intro>
        <Tabs
          value={mode}
          onChange={(m) => {
            setMode(m);
            setResults(null);
            setError("");
          }}
          options={[
            { value: "topics", label: "Topics + data" },
            { value: "json", label: "Log JSON" },
            { value: "tx", label: "Transaction hash" },
          ]}
        />
        {mode === "topics" && (
          <>
            <Field label="Topics" hint="(one per line, topic 0 first)">
              <TextArea rows={4} value={topics} onChange={(e) => setTopics(e.target.value)} additionalClass="w-full font-mono text-sm leading-5" />
            </Field>
            <Field label="Data">
              <TextArea rows={3} value={data} onChange={(e) => setData(e.target.value)} additionalClass="w-full font-mono text-sm leading-5" />
            </Field>
          </>
        )}
        {mode === "json" && (
          <Field label="Logs" hint="(one log object, an array of logs, or a whole receipt)">
            <TextArea
              rows={8}
              value={json}
              onChange={(e) => setJson(e.target.value)}
              placeholder={'{"address":"0x…","topics":["0x…"],"data":"0x…"}'}
              additionalClass="w-full font-mono text-sm leading-5"
            />
          </Field>
        )}
        {mode === "tx" && (
          <>
            <ChainRpc rpc={rpc} onChange={setRpc} />
            <Field label="Transaction hash">
              <input className="custom-input w-full font-mono text-sm" value={txHash} spellCheck={false} onChange={(e) => setTxHash(e.target.value)} placeholder="0x…" />
            </Field>
          </>
        )}
        <AbiField value={abiText} onChange={setAbiText} error={abiError} rows={4} hint="(optional: JSON ABI or event signatures, one per line)" placeholder="event Transfer(address indexed from, address indexed to, uint256 value)" />
        <div className="mb-4 text-right">
          <Button label="Decode" handleOnClick={run} isLoading={loading} disabled={!!abiError} />
        </div>
        <ErrorText>{error}</ErrorText>
        {results && (
          <div className="space-y-3">
            {results.map((r, i) => (
              <LogCard key={i} item={r} index={i} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default EventLogDecoderComponent;
