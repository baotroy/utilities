"use client";
import clsx from "clsx";
import { FC, useState } from "react";
import type { Abi } from "viem";
import { MdChevronRight, MdExpandMore } from "react-icons/md";
import {
  CallFrame,
  SignatureMap,
  decodeCall,
  decodeRevert,
  fmtAmount,
  fmtValue,
  shortAddr,
} from "./utils";

interface CallTraceProps {
  frame: CallFrame;
  abi?: Abi;
  signatures: SignatureMap;
  symbol: string;
  explorer?: string;
  depth?: number;
}

const TYPE_COLORS: Record<string, string> = {
  CALL: "bg-primary/15 text-primary",
  STATICCALL: "bg-meta-5/15 text-meta-5",
  DELEGATECALL: "bg-warning/15 text-warning",
  CALLCODE: "bg-warning/15 text-warning",
  CREATE: "bg-success/15 text-success",
  CREATE2: "bg-success/15 text-success",
  SELFDESTRUCT: "bg-danger/15 text-danger",
};

const CallTrace: FC<CallTraceProps> = ({
  frame,
  abi,
  signatures,
  symbol,
  explorer,
  depth = 0,
}) => {
  const [open, setOpen] = useState(depth < 3);
  const [showRaw, setShowRaw] = useState(false);
  const decoded = frame.type.startsWith("CREATE")
    ? undefined
    : decodeCall(frame.input, abi, signatures);
  const value = frame.value ? BigInt(frame.value) : 0n;
  const hasChildren = !!frame.calls?.length;
  const revert = frame.error
    ? frame.revertReason || decodeRevert(frame.output, abi, signatures)?.reason
    : undefined;

  return (
    <div className={clsx(depth > 0 && "ml-4 border-l border-stroke dark:border-strokedark pl-3")}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1 text-xs font-mono">
        <button
          onClick={() => setOpen(!open)}
          className={clsx("w-4", !hasChildren && "invisible")}
          aria-label="Toggle"
        >
          {open ? <MdExpandMore size={16} /> : <MdChevronRight size={16} />}
        </button>
        <span className={clsx("rounded px-1.5 py-0.5 font-semibold", TYPE_COLORS[frame.type] || "bg-bodydark/20")}>
          {frame.type}
        </span>
        {frame.to && (
          <a
            href={explorer ? `${explorer}/address/${frame.to}` : undefined}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
            title={frame.to}
          >
            {shortAddr(frame.to)}
          </a>
        )}
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="break-all text-left hover:underline"
          title="Show input/output"
        >
          {decoded ? (
            <>
              <span className="font-semibold">{decoded.name}</span>
              <span className="text-body dark:text-bodydark2">
                ({decoded.args.map((a) => fmtValue(a.value)).join(", ")})
              </span>
            </>
          ) : frame.input && frame.input.length >= 10 ? (
            <span className="text-body dark:text-bodydark2">{frame.input.slice(0, 10)}</span>
          ) : (
            <span className="text-body dark:text-bodydark2">{frame.type.startsWith("CREATE") ? "constructor" : "fallback / receive"}</span>
          )}
        </button>
        {value > 0n && (
          <span className="text-warning">
            {fmtAmount(value)} {symbol}
          </span>
        )}
        {frame.gasUsed && (
          <span className="text-body dark:text-bodydark2">
            gas {BigInt(frame.gasUsed).toLocaleString()}
          </span>
        )}
        {frame.error && (
          <span className="text-danger">
            ✕ {frame.error}
            {revert && revert !== frame.error ? `: ${revert}` : ""}
          </span>
        )}
      </div>
      {showRaw && (
        <div className="ml-6 mb-2 space-y-1 rounded bg-gray-2 p-2 text-xs font-mono break-all dark:bg-meta-4">
          <div>
            <span className="text-body dark:text-bodydark2">from </span>
            {frame.from}
          </div>
          {frame.to && (
            <div>
              <span className="text-body dark:text-bodydark2">to </span>
              {frame.to}
            </div>
          )}
          <div>
            <span className="text-body dark:text-bodydark2">input </span>
            {frame.input}
          </div>
          {frame.output && (
            <div>
              <span className="text-body dark:text-bodydark2">output </span>
              {frame.output}
            </div>
          )}
        </div>
      )}
      {open &&
        frame.calls?.map((c, i) => (
          <CallTrace
            key={i}
            frame={c}
            abi={abi}
            signatures={signatures}
            symbol={symbol}
            explorer={explorer}
            depth={depth + 1}
          />
        ))}
    </div>
  );
};

export default CallTrace;
