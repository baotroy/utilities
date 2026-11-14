"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import TextArea from "@/components/Input/TextArea";
import { copyToClipboard } from "@/common/utils";
import { FC, useMemo, useState } from "react";
import { MdContentCopy } from "react-icons/md";
import { SelectorResult, signaturesToSelectors } from "./utils";

const SAMPLE = [
  "transfer(address,uint256)",
  "function approve(address spender, uint256 amount)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "error InsufficientBalance(uint256 available, uint256 required)",
].join("\n");

const CopyButton: FC<{ value: string; label: string }> = ({ value, label }) => (
  <button
    type="button"
    aria-label={label}
    title="Copy"
    className="ml-2 shrink-0 cursor-pointer text-bodydark hover:text-primary"
    onClick={() => copyToClipboard(value)}
  >
    <MdContentCopy size={16} />
  </button>
);

const ResultCard: FC<{ result: SelectorResult }> = ({ result }) => {
  if (result.error) {
    return (
      <div className="rounded-lg border border-stroke p-3 dark:border-strokedark">
        <p className="break-all font-mono text-sm">{result.input}</p>
        <p className="mt-1 text-sm text-red-500">{result.error}</p>
      </div>
    );
  }
  const isEvent = result.kind === "event";
  // the value people want for this kind first, in bold
  const rows = isEvent
    ? [
        { label: "Topic hash", value: result.hash, main: true },
        { label: "First 4 bytes", value: result.selector, main: false },
      ]
    : [
        { label: "Selector", value: result.selector, main: true },
        { label: "Full hash", value: result.hash, main: false },
      ];
  return (
    <div className="rounded-lg border border-stroke p-3 dark:border-strokedark">
      <p className="flex items-start text-sm">
        <span className="mr-2 shrink-0 rounded bg-gray px-1.5 py-0.5 text-xs font-semibold text-bodydark dark:bg-meta-4 dark:text-bodydark2">
          {result.kind}
        </span>
        <span className="break-all font-mono font-semibold">{result.signature}</span>
        <CopyButton value={result.signature} label={`Copy signature ${result.signature}`} />
      </p>
      <dl className="mt-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start py-0.5">
            <dt className="w-28 shrink-0 text-bodydark dark:text-bodydark2">{row.label}</dt>
            <dd
              className={
                row.main
                  ? "break-all font-mono font-semibold text-primary"
                  : "break-all font-mono text-body dark:text-bodydark2"
              }
            >
              {row.value}
            </dd>
            <CopyButton value={row.value} label={`Copy ${row.label} of ${result.signature}`} />
          </div>
        ))}
      </dl>
    </div>
  );
};

const SignatureToSelectorComponent: FC = () => {
  const [text, setText] = useState("transfer(address,uint256)");
  const results = useMemo(() => signaturesToSelectors(text), [text]);
  const valid = results.filter((r) => !r.error);

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Convert a Solidity function, event or error signature to its hex code: the 4-byte
          selector of a function or error, and the 32-byte topic hash of an event. One
          signature per line.
        </p>
        <label className="mb-2 block text-sm font-semibold">Signatures</label>
        <TextArea
          rows={5}
          additionalClass="w-full text-sm leading-5 font-mono"
          placeholder={"transfer(address,uint256)\nevent Transfer(address indexed from, address indexed to, uint256 value)"}
          onChange={(e) => setText(e.target.value)}
          value={text}
        />
        <p className="mt-1 text-xs text-bodydark dark:text-bodydark2">
          Start a line with <span className="font-mono">event</span> or{" "}
          <span className="font-mono">error</span> to mark its kind. Parameter names and
          aliases like <span className="font-mono">uint</span> are normalized before hashing.
        </p>
        <div className="mb-4 mt-2 text-right">
          <Button label="Sample" type="outline" additionalClass="mr-2" handleOnClick={() => setText(SAMPLE)} />
          <Button label="Clear" type="reset" additionalClass="mr-2" handleOnClick={() => setText("")} />
          <Button
            label="Copy all"
            type="success"
            disabled={valid.length === 0}
            handleOnClick={() =>
              copyToClipboard(
                valid
                  .map((r) => `${r.signature}: ${r.kind === "event" ? r.hash : r.selector}`)
                  .join("\n")
              )
            }
          />
        </div>
        <div className="space-y-3">
          {results.map((result, index) => (
            <ResultCard key={`${index}-${result.input}`} result={result} />
          ))}
        </div>
      </div>
    </>
  );
};

export default SignatureToSelectorComponent;
