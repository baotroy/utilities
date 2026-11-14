"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import TextArea from "@/components/Input/TextArea";
import { copyToClipboard } from "@/common/utils";
import { FC, useState } from "react";
import toast from "react-hot-toast";
import { MdContentCopy } from "react-icons/md";
import { toEventSelector, toFunctionSelector } from "viem";
import { formatAbiItem } from "viem/utils";

interface Row {
  signature: string;
  selector: string;
}

interface Result {
  functions: Row[];
  events: Row[];
  errors: Row[];
}

const SAMPLE_ABI = JSON.stringify(
  [
    {
      type: "function",
      name: "transfer",
      stateMutability: "nonpayable",
      inputs: [
        { name: "to", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [{ name: "", type: "bool" }],
    },
    {
      type: "function",
      name: "balanceOf",
      stateMutability: "view",
      inputs: [{ name: "account", type: "address" }],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      type: "event",
      name: "Transfer",
      inputs: [
        { name: "from", type: "address", indexed: true },
        { name: "to", type: "address", indexed: true },
        { name: "value", type: "uint256", indexed: false },
      ],
    },
    {
      type: "error",
      name: "ERC20InsufficientBalance",
      inputs: [
        { name: "sender", type: "address" },
        { name: "balance", type: "uint256" },
        { name: "needed", type: "uint256" },
      ],
    },
  ],
  null,
  2
);

// Accepts a plain ABI array or a compiler artifact ({ "abi": [...] })
function extractSelectors(text: string): Result {
  const parsed = JSON.parse(text);
  const abi = Array.isArray(parsed) ? parsed : parsed?.abi;
  if (!Array.isArray(abi)) throw new Error("Not an ABI");

  const result: Result = { functions: [], events: [], errors: [] };
  for (const item of abi) {
    if (!item || typeof item.name !== "string") continue;
    // canonical signature, tuples expanded: swap((address,uint256)[])
    const signature = formatAbiItem({ ...item, inputs: item.inputs || [] });
    if (item.type === "function") {
      result.functions.push({ signature, selector: toFunctionSelector(signature) });
    } else if (item.type === "event") {
      // topic0: the full 32-byte hash
      result.events.push({ signature, selector: toEventSelector(signature) });
    } else if (item.type === "error") {
      // errors use a 4-byte selector, like functions
      result.errors.push({ signature, selector: toFunctionSelector(signature) });
    }
  }
  return result;
}

const Section: FC<{ title: string; hint: string; rows: Row[] }> = ({
  title,
  hint,
  rows,
}) => {
  if (rows.length === 0) return null;
  return (
    <div className="mt-4">
      <div className="mb-1">
        <span className="font-semibold">
          {title} ({rows.length})
        </span>{" "}
        <span className="text-sm text-bodydark dark:text-bodydark2">{hint}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="table-code w-full text-sm">
          <tbody>
            {rows.map((row, index) => (
              <tr
                className="code border-b border-stroke dark:border-strokedark"
                key={index}
              >
                <td className="py-1 pr-4 font-mono break-all">{row.signature}</td>
                <td className="py-1 pr-2 font-mono break-all">{row.selector}</td>
                <td className="py-1 w-6">
                  <button
                    type="button"
                    aria-label={`Copy selector of ${row.signature}`}
                    className="cursor-pointer text-bodydark hover:text-primary"
                    onClick={() => copyToClipboard(row.selector)}
                  >
                    <MdContentCopy size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AbiSelectorsComponent: FC = () => {
  const [abi, setAbi] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const extract = (text: string) => {
    try {
      setResult(extractSelectors(text));
    } catch {
      toast.error("Invalid ABI");
      setResult(null);
    }
  };

  const isEmpty =
    result !== null &&
    result.functions.length + result.events.length + result.errors.length === 0;

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Paste a contract ABI to list the 4-byte selector of every function and
          error, and the topic hash of every event.
        </p>
        <div className="w-full">
          <label htmlFor="" className="text-sm">
            ABI
          </label>
          <TextArea
            rows={10}
            additionalClass="w-full text-sm leading-4"
            placeholder='[{"type":"function","name":"transfer","inputs":[...]}]'
            onChange={(e) => setAbi(e.target.value)}
            value={abi}
          />
        </div>
        <div className="text-right mt-2">
          <Button
            label="Sample"
            type="outline"
            additionalClass="mr-2"
            handleOnClick={() => {
              setAbi(SAMPLE_ABI);
              extract(SAMPLE_ABI);
            }}
          />
          <Button label="Extract selectors" handleOnClick={() => extract(abi)} />
        </div>
        {isEmpty && (
          <p className="mt-4 text-sm text-bodydark dark:text-bodydark2">
            This ABI has no functions, events or errors.
          </p>
        )}
        {result && (
          <div className="w-full">
            <Section title="Functions" hint="4-byte selector" rows={result.functions} />
            <Section title="Events" hint="topic hash (topic0)" rows={result.events} />
            <Section title="Errors" hint="4-byte selector" rows={result.errors} />
          </div>
        )}
      </div>
    </>
  );
};

export default AbiSelectorsComponent;
