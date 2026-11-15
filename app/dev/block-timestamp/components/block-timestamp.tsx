"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import SelectBox from "@/components/Input/SelectBox";
import TextBox from "@/components/Input/TextBox";
import { copyToClipboard } from "@/common/utils";
import clsx from "clsx";
import { FC, ReactNode, useState } from "react";
import { MdOutlineClear, MdSearch } from "react-icons/md";
import { CHAINS, CUSTOM_CHAIN, rpcRequest } from "../../evm-transaction-simulator/components/utils";
import {
  BlockInfo,
  BlockReader,
  fmtIso,
  fmtLocal,
  fmtOffset,
  fmtRelative,
  fmtUtc,
  nowInputValue,
  parseBlockList,
  parseTimeInput,
  toHex,
} from "./utils";

type Mode = "time" | "block" | "range";
type Zone = "UTC" | "Local";
const MODES: { id: Mode; label: string }[] = [
  { id: "time", label: "Time → Block" },
  { id: "block", label: "Block → Time" },
  { id: "range", label: "Time range → Block range" },
];

const Field: FC<{ label: string; hint?: string; children: ReactNode; className?: string }> = ({ label, hint, children, className }) => (
  <div className={className}>
    <div className="mb-1.5 text-sm">
      {label}
      {hint && <span className="ml-1 text-xs text-bodydark dark:text-bodydark2">{hint}</span>}
    </div>
    {children}
  </div>
);

const Card: FC<{ title: string; right?: ReactNode; children: ReactNode }> = ({ title, right, children }) => (
  <div className="rounded border border-stroke dark:border-strokedark overflow-hidden">
    <div className="flex items-center justify-between gap-2 px-4 py-2 bg-bodydark/10 dark:bg-body/20">
      <span className="font-semibold text-sm">{title}</span>
      {right}
    </div>
    <div className="p-4 overflow-x-auto">{children}</div>
  </div>
);

const Copy: FC<{ text: string; label?: string }> = ({ text, label = "copy" }) => (
  <button className="ml-2 text-xs text-primary hover:underline" onClick={() => copyToClipboard(text)}>
    {label}
  </button>
);

const BlockLink: FC<{ n: number; explorer?: string }> = ({ n, explorer }) =>
  explorer ? (
    <a href={`${explorer}/block/${n}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
      {n.toLocaleString("en-US")}
    </a>
  ) : (
    <span>{n.toLocaleString("en-US")}</span>
  );

interface BlockRow {
  label: string;
  block?: BlockInfo;
  /** estimated block number / timestamp when it is not mined yet */
  estimate?: { number: number; timestamp: number };
  note?: string;
  highlight?: boolean;
}

interface TimeResult {
  target: number;
  rows: BlockRow[];
  calls: number;
  chainId?: number;
}
interface BlockResult {
  rows: BlockRow[];
  calls: number;
  chainId?: number;
}
interface RangeResult {
  from: number;
  to: number;
  fromBlock?: number;
  toBlock?: number;
  rows: BlockRow[];
  calls: number;
  chainId?: number;
  note?: string;
}

const TimeInput: FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  zone: Zone;
  onEnter: () => void;
}> = ({ label, value, onChange, zone, onEnter }) => {
  const ts = parseTimeInput(value, zone);
  return (
    <Field label={label} hint={`(unix seconds/ms, or YYYY-MM-DD HH:mm:ss in ${zone === "UTC" ? "UTC" : "your time zone"})`}>
      <div className="flex gap-2">
        <TextBox
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onEnter()}
          placeholder="2024-01-01 00:00:00  or  1704067200"
          additionalClass="w-full font-mono text-sm"
          isError={!!value.trim() && ts === null}
        />
        <Button label="Now" type="secondary" handleOnClick={() => onChange(nowInputValue(zone))} additionalClass="whitespace-nowrap" />
      </div>
      <div className="mt-1 text-xs font-mono text-bodydark dark:text-bodydark2 min-h-4">
        {value.trim() && (ts === null ? <span className="text-danger">Cannot read this time</span> : <>= {fmtUtc(ts)} · {ts}</>)}
      </div>
    </Field>
  );
};

export default function BlockTimestampComponent() {
  const [mode, setMode] = useState<Mode>("time");
  const [chainName, setChainName] = useState(CHAINS[0].name);
  const [customRpc, setCustomRpc] = useState("");
  const [zone, setZone] = useState<Zone>("UTC");
  const [timeInput, setTimeInput] = useState("");
  const [blockInput, setBlockInput] = useState("");
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeResult, setTimeResult] = useState<TimeResult | null>(null);
  const [blockResult, setBlockResult] = useState<BlockResult | null>(null);
  const [rangeResult, setRangeResult] = useState<RangeResult | null>(null);

  const chain = CHAINS.find((c) => c.name === chainName);
  const rpc = (chainName === CUSTOM_CHAIN ? customRpc : customRpc || chain?.rpc || "").trim();

  const resultChainId = mode === "time" ? timeResult?.chainId : mode === "block" ? blockResult?.chainId : rangeResult?.chainId;
  const explorer =
    (resultChainId !== undefined ? CHAINS.find((c) => c.id === resultChainId)?.explorer : undefined) ??
    (chainName === CUSTOM_CHAIN ? undefined : chain?.explorer);

  const chainIdOf = async () => {
    try {
      return Number(BigInt(await rpcRequest<string>(rpc, "eth_chainId", [])));
    } catch {
      return undefined;
    }
  };

  // Estimate a block that is not mined yet from the recent average block time
  const estimateFuture = async (reader: BlockReader, latest: BlockInfo, target: number) => {
    const avg = await reader.avgBlockTime(latest);
    if (!avg) return undefined;
    const number = latest.number + Math.round((target - latest.timestamp) / avg);
    return { number, timestamp: target, avg };
  };

  const runTime = async () => {
    const target = parseTimeInput(timeInput, zone);
    if (target === null) throw new Error("Enter a time: a unix timestamp or a date such as 2024-01-01 00:00:00");
    const reader = new BlockReader(rpc);
    const [chainId, found] = await Promise.all([chainIdOf(), reader.findByTime(target)]);
    const { before, after, latest } = found;
    const rows: BlockRow[] = [];
    const dBefore = before ? target - before.timestamp : Infinity;
    const dAfter = after ? after.timestamp - target : Infinity;
    const closest = dBefore <= dAfter ? "before" : "after";
    rows.push(
      before
        ? { label: "Before (≤ time)", block: before, highlight: closest === "before" }
        : { label: "Before (≤ time)", note: "The chain had no block yet at this time" }
    );
    if (after) {
      rows.push({ label: "After (≥ time)", block: after, highlight: closest === "after" });
    } else {
      const est = await estimateFuture(reader, latest, target);
      rows.push({
        label: "After (≥ time)",
        estimate: est ? { number: est.number, timestamp: target } : undefined,
        note: est
          ? `Not mined yet. Estimated from the average block time of ${est.avg.toFixed(2)}s over the last 10,000 blocks; latest block is ${latest.number.toLocaleString("en-US")}.`
          : "Not mined yet",
      });
    }
    setTimeResult({ target, rows, calls: reader.calls + 1, chainId });
  };

  const runBlock = async () => {
    const list = parseBlockList(blockInput);
    if (!list.length) throw new Error("Enter one or more block numbers (or latest)");
    if (list.length > 50) throw new Error("Up to 50 blocks at a time");
    const reader = new BlockReader(rpc);
    const [chainId, latest] = await Promise.all([chainIdOf(), reader.get("latest")]);
    let avg: number | undefined;
    const rows: BlockRow[] = [];
    for (const item of list) {
      const n = item === "latest" ? latest.number : item;
      if (n > latest.number) {
        if (avg === undefined) avg = await reader.avgBlockTime(latest);
        rows.push({
          label: item === "latest" ? "latest" : n.toLocaleString("en-US"),
          estimate: avg ? { number: n, timestamp: Math.round(latest.timestamp + (n - latest.number) * avg) } : undefined,
          note: avg
            ? `Not mined yet (latest is ${latest.number.toLocaleString("en-US")}). Estimated at ${avg.toFixed(2)}s per block.`
            : "Not mined yet",
        });
      } else {
        rows.push({ label: item === "latest" ? "latest" : n.toLocaleString("en-US"), block: await reader.get(n) });
      }
    }
    setBlockResult({ rows, calls: reader.calls + 1, chainId });
  };

  const runRange = async () => {
    const from = parseTimeInput(fromInput, zone);
    const to = parseTimeInput(toInput, zone);
    if (from === null || to === null) throw new Error("Enter both the start and the end time");
    if (to < from) throw new Error("The end time is before the start time");
    const reader = new BlockReader(rpc);
    const [chainId, start] = await Promise.all([chainIdOf(), reader.findByTime(from)]);
    const end = await reader.findByTime(to, start.latest);
    // fromBlock: first block at or after the start; toBlock: last block at or before the end
    const fromBlock = start.after ?? undefined;
    const toBlock = end.before ?? undefined;
    const rows: BlockRow[] = [
      fromBlock
        ? { label: "fromBlock", block: fromBlock }
        : { label: "fromBlock", note: "No block mined at or after the start time yet" },
      toBlock ? { label: "toBlock", block: toBlock } : { label: "toBlock", note: "The chain had no block yet at the end time" },
    ];
    let note: string | undefined;
    if (fromBlock && toBlock && fromBlock.number > toBlock.number) note = "No block was mined inside this time range.";
    else if (!end.after) note = `The end time is in the future, so toBlock is the latest block for now.`;
    setRangeResult({
      from,
      to,
      fromBlock: fromBlock?.number,
      toBlock: toBlock?.number,
      rows,
      calls: reader.calls + 1,
      chainId,
      note,
    });
  };

  const run = async () => {
    if (!rpc) {
      setError("Enter an RPC URL");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (mode === "time") await runTime();
      else if (mode === "block") await runBlock();
      else await runRange();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setTimeInput("");
    setBlockInput("");
    setFromInput("");
    setToInput("");
    setTimeResult(null);
    setBlockResult(null);
    setRangeResult(null);
    setError("");
  };

  const changeZone = (z: Zone) => {
    // keep the same instant when switching zones
    const convert = (v: string) => {
      const ts = parseTimeInput(v, zone);
      if (ts === null || /^\d+$/.test(v.trim())) return v;
      return nowLike(ts, z);
    };
    setTimeInput(convert(timeInput));
    setFromInput(convert(fromInput));
    setToInput(convert(toInput));
    setZone(z);
  };

  const rowsTable = (rows: BlockRow[], target?: number) => (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-bodydark dark:text-bodydark2 border-b border-stroke dark:border-strokedark">
          <th className="py-1.5 pr-4 font-normal whitespace-nowrap"></th>
          <th className="py-1.5 pr-4 font-normal whitespace-nowrap">Block</th>
          <th className="py-1.5 pr-4 font-normal whitespace-nowrap">Timestamp</th>
          <th className="py-1.5 pr-4 font-normal whitespace-nowrap">UTC</th>
          <th className="py-1.5 pr-4 font-normal whitespace-nowrap">Your time</th>
          <th className="py-1.5 font-normal whitespace-nowrap">{target !== undefined ? "Off by" : "Age"}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const b = r.block ?? r.estimate;
          return (
            <tr
              key={i}
              className={clsx(
                "border-b border-stroke/60 dark:border-strokedark/60 last:border-b-0 align-top",
                r.highlight && "bg-primary/10"
              )}
            >
              <td className="py-1.5 pr-4 whitespace-nowrap">
                {r.label}
                {r.highlight && <span className="ml-1.5 text-xs text-primary font-semibold">closest</span>}
              </td>
              {b ? (
                <>
                  <td className="py-1.5 pr-4 font-mono whitespace-nowrap">
                    {r.block ? <BlockLink n={b.number} explorer={explorer} /> : <span>~{b.number.toLocaleString("en-US")}</span>}
                    <Copy text={String(b.number)} />
                    <div className="text-xs text-bodydark dark:text-bodydark2">
                      {toHex(b.number)}
                      <Copy text={toHex(b.number)} />
                    </div>
                  </td>
                  <td className="py-1.5 pr-4 font-mono whitespace-nowrap">
                    {r.block ? "" : "~"}
                    {b.timestamp}
                    <Copy text={String(b.timestamp)} />
                  </td>
                  <td className="py-1.5 pr-4 font-mono whitespace-nowrap">{fmtUtc(b.timestamp)}</td>
                  <td className="py-1.5 pr-4 font-mono whitespace-nowrap">{fmtLocal(b.timestamp)}</td>
                  <td className="py-1.5 font-mono whitespace-nowrap">
                    {target !== undefined ? fmtOffset(b.timestamp - target) : fmtRelative(b.timestamp)}
                  </td>
                </>
              ) : (
                <td colSpan={5} className="py-1.5 text-bodydark dark:text-bodydark2">
                  {r.note}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const notes = (rows: BlockRow[]) => {
    const list = rows.filter((r) => (r.block || r.estimate) && r.note);
    if (!list.length) return null;
    return (
      <ul className="mt-3 space-y-1 text-xs text-bodydark dark:text-bodydark2">
        {list.map((r, i) => (
          <li key={i}>
            {r.label}: {r.note}
          </li>
        ))}
      </ul>
    );
  };

  const callsLabel = (calls: number) => (
    <span className="text-xs text-bodydark dark:text-bodydark2">{calls} RPC request{calls === 1 ? "" : "s"}</span>
  );

  const rangeJson =
    rangeResult?.fromBlock !== undefined && rangeResult?.toBlock !== undefined
      ? JSON.stringify({ fromBlock: toHex(rangeResult.fromBlock), toBlock: toHex(rangeResult.toBlock) })
      : "";

  return (
    <>
      <Breadcrumb />
      <div className="max-w-5xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Find the block mined closest to a moment in time, the time of a block, or the block range that covers a period
          (handy for the <code>fromBlock</code>/<code>toBlock</code> of <code>eth_getLogs</code>). Runs in your browser
          through a public RPC, with no API key: it searches block headers with <code>eth_getBlockByNumber</code>.
        </p>

        <div className="space-y-4">
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

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded border border-stroke dark:border-strokedark overflow-hidden">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id);
                    setError("");
                  }}
                  className={clsx(
                    "px-3 py-1.5 text-sm border-r border-stroke dark:border-strokedark last:border-r-0",
                    mode === m.id ? "bg-primary text-white" : "hover:bg-bodydark/10 dark:hover:bg-body/20"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {mode !== "block" && (
              <div className="flex items-center gap-2 text-sm ml-auto">
                <span className="text-bodydark dark:text-bodydark2">Dates typed in</span>
                <SelectBox items={["UTC", "Local"]} value={zone} handleOnChange={(e) => changeZone(e.target.value as Zone)} additionalClass="w-28" />
              </div>
            )}
          </div>

          {mode === "time" && <TimeInput label="Time" value={timeInput} onChange={setTimeInput} zone={zone} onEnter={run} />}

          {mode === "block" && (
            <Field label="Block numbers" hint="(decimal or 0x hex, separated by spaces, commas or new lines; latest works too)">
              <TextBox
                value={blockInput}
                onChange={(e) => setBlockInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && run()}
                placeholder="19000000, 0x1312d00, latest"
                additionalClass="w-full font-mono text-sm"
              />
            </Field>
          )}

          {mode === "range" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TimeInput label="From" value={fromInput} onChange={setFromInput} zone={zone} onEnter={run} />
              <TimeInput label="To" value={toInput} onChange={setToInput} zone={zone} onEnter={run} />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button label="Find" handleOnClick={run} isLoading={loading} icon={{ icon: MdSearch, position: "left", size: 20 }} />
            <Button label="Reset" type="reset" handleOnClick={reset} icon={{ icon: MdOutlineClear, position: "left", size: 20 }} />
          </div>

          {error && <div className="text-danger text-sm break-all">{error}</div>}

          {mode === "time" && timeResult && (
            <Card title={`Blocks around ${fmtUtc(timeResult.target)} (${timeResult.target})`} right={callsLabel(timeResult.calls)}>
              {rowsTable(timeResult.rows, timeResult.target)}
              {notes(timeResult.rows)}
            </Card>
          )}

          {mode === "block" && blockResult && (
            <Card title="Block times" right={callsLabel(blockResult.calls)}>
              {rowsTable(blockResult.rows)}
              {notes(blockResult.rows)}
            </Card>
          )}

          {mode === "range" && rangeResult && (
            <Card title={`Blocks from ${fmtIso(rangeResult.from)} to ${fmtIso(rangeResult.to)}`} right={callsLabel(rangeResult.calls)}>
              {rowsTable(rangeResult.rows)}
              {rangeResult.note && <div className="mt-3 text-xs text-warning">{rangeResult.note}</div>}
              {rangeJson && (!rangeResult.note || !rangeResult.note.startsWith("No block")) && (
                <div className="mt-3 text-sm">
                  <span className="text-bodydark dark:text-bodydark2">
                    {(rangeResult.toBlock! - rangeResult.fromBlock! + 1).toLocaleString("en-US")} blocks · eth_getLogs filter:
                  </span>
                  <div className="mt-1 flex items-start gap-2">
                    <code className="font-mono text-xs break-all">{rangeJson}</code>
                    <Copy text={rangeJson} />
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

// Format a unix time back into the input format for the given zone
function nowLike(ts: number, zone: Zone) {
  return zone === "UTC" ? fmtUtc(ts).replace(" UTC", "") : fmtLocal(ts).replace(/ GMT.*$/, "");
}
