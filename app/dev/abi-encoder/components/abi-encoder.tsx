"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import AbiField from "@/components/evm/AbiField";
import { Card, ErrorText, Field, Intro, ValueRow } from "@/components/Tool/ui";
import {
  describeParams,
  formatParamType,
  parseAbiArg,
  placeholderFor,
  shortError,
  tryParseAbi,
} from "@/common/evmTools";
import { FC, useEffect, useMemo, useState } from "react";
import {

  Abi,
  AbiFunction,
  encodeAbiParameters,
  encodeFunctionData,
  toFunctionSelector,
} from "viem";
type AbiConstructor = Extract<Abi[number], { type: "constructor" }>;

const SAMPLE = `function transfer(address to, uint256 amount)
function approve(address spender, uint256 amount)
function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)
function multicall(bytes[] data)`;

type Entry = { key: string; label: string; item: AbiFunction | AbiConstructor };

const AbiEncoderComponent: FC = () => {
  const [abiText, setAbiText] = useState(SAMPLE);
  const [fnKey, setFnKey] = useState("");
  const [args, setArgs] = useState<Record<string, string>>({});
  const { abi, error: abiError } = useMemo(() => tryParseAbi(abiText), [abiText]);

  const entries: Entry[] = useMemo(() => {
    const list: Entry[] = [];
    abi.forEach((item, i) => {
      if (item.type === "function") {
        list.push({ key: `${i}`, label: `${item.name}(${describeParams(item.inputs)})`, item });
      } else if (item.type === "constructor") {
        list.push({ key: `${i}`, label: `constructor(${describeParams(item.inputs)})`, item });
      }
    });
    return list;
  }, [abi]);

  // keep the selection valid when the ABI changes
  useEffect(() => {
    if (!entries.find((e) => e.key === fnKey)) setFnKey(entries[0]?.key || "");
  }, [entries, fnKey]);

  const entry = entries.find((e) => e.key === fnKey);
  const inputs = entry?.item.inputs || [];
  const argKey = (i: number) => `${fnKey}:${i}`;

  const result = useMemo(() => {
    if (!entry) return null;
    const missing = inputs
      .map((p, i) => ({ p, i, v: (args[argKey(i)] ?? "").trim() }))
      .filter(({ p, v }) => !v && p.type !== "string" && p.type !== "bytes" && !p.type.endsWith("[]"))
      .map(({ p, i }) => p.name || `arg${i}`);
    if (missing.length) {
      return { calldata: "", params: "", selector: "", signature: "", error: "", missing };
    }
    try {
      const values = inputs.map((p, i) => parseAbiArg(p, args[argKey(i)] ?? ""));
      const params = encodeAbiParameters(inputs, values as readonly unknown[]);
      if (entry.item.type === "constructor") {
        return { calldata: params, params, selector: "", signature: "constructor", error: "" };
      }
      const fn = entry.item as AbiFunction;
      const calldata = encodeFunctionData({ abi: [fn], functionName: fn.name, args: values as readonly unknown[] });
      const signature = `${fn.name}(${fn.inputs.map(formatParamType).join(",")})`;
      return { calldata, params, selector: toFunctionSelector(fn), signature, error: "" };
    } catch (e) {
      return { calldata: "", params: "", selector: "", signature: "", error: shortError(e) };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry, args]);

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <Intro>
          The reverse of the calldata decoder: pick a function from an ABI, fill in its arguments
          and get the hex data to put in a transaction. Arrays and structs are written as JSON,
          e.g. <span className="font-mono">[&quot;0xabc…&quot;, &quot;0xdef…&quot;]</span>.
        </Intro>
        <AbiField value={abiText} onChange={setAbiText} error={abiError} />
        {!abiError && entries.length === 0 && abiText.trim() && (
          <ErrorText>This ABI has no function to encode.</ErrorText>
        )}
        {entries.length > 0 && (
          <>
            <Field label="Function">
              <select
                className="custom-input w-full font-mono text-sm"
                value={fnKey}
                onChange={(e) => setFnKey(e.target.value)}
              >
                {entries.map((e) => (
                  <option key={e.key} value={e.key}>
                    {e.label}
                  </option>
                ))}
              </select>
            </Field>
            {inputs.length === 0 && (
              <p className="mb-4 text-sm text-bodydark dark:text-bodydark2">This function takes no arguments.</p>
            )}
            {inputs.map((p, i) => (
              <Field
                key={argKey(i)}
                label={p.name || `arg${i}`}
                hint={<span className="font-mono">{formatParamType(p)}</span>}
              >
                {p.type.endsWith("]") || p.type === "tuple" || p.type === "bytes" || p.type === "string" ? (
                  <textarea
                    rows={2}
                    spellCheck={false}
                    className="custom-input w-full font-mono text-sm"
                    placeholder={placeholderFor(p)}
                    value={args[argKey(i)] ?? ""}
                    onChange={(e) => setArgs({ ...args, [argKey(i)]: e.target.value })}
                  />
                ) : (
                  <input
                    spellCheck={false}
                    className="custom-input w-full font-mono text-sm"
                    placeholder={placeholderFor(p)}
                    value={args[argKey(i)] ?? ""}
                    onChange={(e) => setArgs({ ...args, [argKey(i)]: e.target.value })}
                  />
                )}
              </Field>
            ))}
            <div className="mb-4 text-right">
              <Button label="Clear arguments" type="reset" handleOnClick={() => setArgs({})} />
            </div>
            {result && "missing" in result ? (
              <p className="text-sm text-bodydark dark:text-bodydark2">Fill in {result.missing!.join(", ")} to see the calldata.</p>
            ) : result?.error ? (
              <ErrorText>{result.error}</ErrorText>
            ) : (
              result && (
                <Card title="Encoded">
                  <dl>
                    {result.signature !== "constructor" && (
                      <>
                        <ValueRow label="Signature" value={result.signature} />
                        <ValueRow label="Selector" value={result.selector} />
                      </>
                    )}
                    <ValueRow
                      label={result.signature === "constructor" ? "Constructor args" : "Calldata"}
                      value={result.calldata}
                      main
                    />
                    {result.signature !== "constructor" && (
                      <ValueRow label="Arguments only" value={result.params} />
                    )}
                    <ValueRow label="Size" value={`${(result.calldata.length - 2) / 2} bytes`} />
                  </dl>
                </Card>
              )
            )}
          </>
        )}
      </div>
    </>
  );
};

export default AbiEncoderComponent;
