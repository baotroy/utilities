"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import ChainRpc from "@/components/evm/ChainRpc";
import { Card, ErrorText, Field, Intro, ValueRow } from "@/components/Tool/ui";
import { EVM_CHAINS, getClient, shortError } from "@/common/evmTools";
import { FC, useMemo, useState } from "react";
import { MdClose } from "react-icons/md";
import { getAddress, Hex, isAddress } from "viem";
import { computeSlot, erc7201Slot, interpretWord, PROXY_SLOTS, Step } from "./utils";

const KEY_TYPES = ["address", "uint256", "int256", "bytes32", "bool", "string", "bytes"];

const StepRow: FC<{ step: Step; onChange: (s: Step) => void; onRemove: () => void }> = ({ step, onChange, onRemove }) => (
  <div className="flex flex-wrap items-center gap-2 rounded border border-stroke p-2 text-sm dark:border-strokedark">
    {step.kind === "mapping" && (
      <>
        <span className="w-20 font-semibold">mapping</span>
        <select className="custom-input" value={step.keyType} onChange={(e) => onChange({ ...step, keyType: e.target.value })}>
          {KEY_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <input className="custom-input min-w-0 flex-1 font-mono" placeholder="key" value={step.key} spellCheck={false} onChange={(e) => onChange({ ...step, key: e.target.value })} />
      </>
    )}
    {step.kind === "array" && (
      <>
        <span className="w-20 font-semibold">array</span>
        <label className="flex items-center gap-1">
          index
          <input className="custom-input w-28 font-mono" value={step.index} onChange={(e) => onChange({ ...step, index: e.target.value })} />
        </label>
        <label className="flex items-center gap-1">
          slots per item
          <input className="custom-input w-16 font-mono" value={step.itemSlots} onChange={(e) => onChange({ ...step, itemSlots: e.target.value })} />
        </label>
      </>
    )}
    {step.kind === "offset" && (
      <>
        <span className="w-20 font-semibold">struct</span>
        <label className="flex items-center gap-1">
          field slot offset
          <input className="custom-input w-20 font-mono" value={step.offset} onChange={(e) => onChange({ ...step, offset: e.target.value })} />
        </label>
      </>
    )}
    <button type="button" aria-label="Remove step" className="ml-auto cursor-pointer text-bodydark hover:text-red-500" onClick={onRemove}>
      <MdClose size={18} />
    </button>
  </div>
);

const StorageSlotReaderComponent: FC = () => {
  const [base, setBase] = useState("0");
  const [steps, setSteps] = useState<Step[]>([{ kind: "mapping", keyType: "address", key: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045" }]);
  const [namespace, setNamespace] = useState("openzeppelin.storage.ERC20");
  const [rpc, setRpc] = useState(EVM_CHAINS[0].rpc);
  const [contract, setContract] = useState("");
  const [slot, setSlot] = useState("");
  const [block, setBlock] = useState("");
  const [word, setWord] = useState<{ slot: string; value: Hex } | null>(null);
  const [proxy, setProxy] = useState<{ label: string; value: string }[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");

  const computed = useMemo(() => {
    try {
      return { ...computeSlot(base, steps), error: "" };
    } catch (e) {
      return { slot: "" as Hex, trace: [], error: shortError(e) };
    }
  }, [base, steps]);

  const nsSlot = useMemo(() => (namespace.trim() ? erc7201Slot(namespace.trim()) : ""), [namespace]);

  const checkContract = () => {
    if (!isAddress(contract.trim(), { strict: false })) throw new Error("Enter the contract address");
    return getAddress(contract.trim().toLowerCase());
  };
  const blockArg = () => (block.trim() ? { blockNumber: BigInt(block.trim()) } : {});

  const read = async (target: string) => {
    setError("");
    setWord(null);
    setLoading("read");
    try {
      const address = checkContract();
      const s = target.trim() as Hex;
      if (!/^0x[0-9a-fA-F]{1,64}$/.test(s)) throw new Error("The slot must be hex, e.g. 0x0 or a 32-byte hash");
      const value = (await getClient(rpc).getStorageAt({ address, slot: s, ...blockArg() })) || "0x";
      setWord({ slot: s, value: value === "0x" ? (`0x${"0".repeat(64)}` as Hex) : value });
    } catch (e) {
      setError(shortError(e));
    } finally {
      setLoading("");
    }
  };

  const readProxy = async () => {
    setError("");
    setProxy(null);
    setLoading("proxy");
    try {
      const address = checkContract();
      const client = getClient(rpc);
      const values = await Promise.all(PROXY_SLOTS.map((p) => client.getStorageAt({ address, slot: p.slot as Hex, ...blockArg() })));
      setProxy(
        PROXY_SLOTS.map((p, i) => {
          const v = values[i] || "0x";
          const empty = !v || /^0x0*$/.test(v);
          return { label: p.label, value: empty ? "(empty)" : getAddress(`0x${v.slice(-40)}`) };
        })
      );
    } catch (e) {
      setError(shortError(e));
    } finally {
      setLoading("");
    }
  };

  const view = word ? interpretWord(word.value) : null;

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <Intro>
          Work out where Solidity keeps a variable, then read it straight from the chain with
          eth_getStorageAt. Base slots come from the variable order in the contract (or from{" "}
          <span className="font-mono">forge inspect &lt;Contract&gt; storageLayout</span>).
        </Intro>

        <Card title="1. Compute a slot" className="mb-4">
          <Field label="Base slot" hint="(the variable's slot number)">
            <input className="custom-input w-full font-mono text-sm" value={base} onChange={(e) => setBase(e.target.value)} />
          </Field>
          <div className="mb-3 space-y-2">
            {steps.map((s, i) => (
              <StepRow
                key={i}
                step={s}
                onChange={(next) => setSteps(steps.map((x, j) => (j === i ? next : x)))}
                onRemove={() => setSteps(steps.filter((_, j) => j !== i))}
              />
            ))}
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Button label="+ Mapping key" type="outline" handleOnClick={() => setSteps([...steps, { kind: "mapping", keyType: "address", key: "" }])} />
            <Button label="+ Array index" type="outline" handleOnClick={() => setSteps([...steps, { kind: "array", index: "0", itemSlots: "1" }])} />
            <Button label="+ Struct field" type="outline" handleOnClick={() => setSteps([...steps, { kind: "offset", offset: "0" }])} />
          </div>
          <ErrorText>{computed.error}</ErrorText>
          {!computed.error && (
            <>
              <dl>
                {computed.trace.map((t, i) => (
                  <ValueRow key={i} label={t.label} value={t.slot} main={i === computed.trace.length - 1} labelWidth="w-56" />
                ))}
              </dl>
              <div className="mt-2 text-right">
                <Button label="Use this slot below" type="success" handleOnClick={() => setSlot(computed.slot)} />
              </div>
            </>
          )}
          <div className="mt-4 border-t border-stroke pt-4 dark:border-strokedark">
            <Field label="ERC-7201 namespace" hint="(@custom:storage-location erc7201:<id>)">
              <input className="custom-input w-full font-mono text-sm" value={namespace} spellCheck={false} onChange={(e) => setNamespace(e.target.value)} />
            </Field>
            {nsSlot && (
              <dl>
                <ValueRow label="Namespace slot" value={nsSlot} labelWidth="w-56" />
              </dl>
            )}
          </div>
        </Card>

        <Card title="2. Read from chain">
          <ChainRpc rpc={rpc} onChange={setRpc} />
          <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
            <Field label="Contract address">
              <input className="custom-input w-full font-mono text-sm" value={contract} spellCheck={false} onChange={(e) => setContract(e.target.value)} placeholder="0x…" />
            </Field>
            <Field label="Block" hint="(optional)">
              <input className="custom-input w-full font-mono text-sm" value={block} onChange={(e) => setBlock(e.target.value)} placeholder="latest" />
            </Field>
          </div>
          <Field label="Slot">
            <input className="custom-input w-full font-mono text-sm" value={slot} spellCheck={false} onChange={(e) => setSlot(e.target.value)} placeholder="0x0" />
          </Field>
          <div className="mb-3 flex flex-wrap justify-end gap-2">
            <Button label="Find proxy implementation" type="outline" handleOnClick={readProxy} isLoading={loading === "proxy"} />
            <Button label="Read slot" handleOnClick={() => read(slot || "0x0")} isLoading={loading === "read"} />
          </div>
          <ErrorText>{error}</ErrorText>
          {view && word && (
            <dl className="mt-2">
              <ValueRow label="Raw value" value={word.value} main />
              <ValueRow label="uint256" value={view.uint} />
              {view.int !== view.uint && <ValueRow label="int256" value={view.int} />}
              <ValueRow label="As address (low 20 bytes)" value={view.address} />
              {view.bool && <ValueRow label="bool" value={view.bool} />}
              {view.shortString && <ValueRow label="Short string" value={view.shortString} />}
            </dl>
          )}
          {proxy && (
            <dl className="mt-2">
              {proxy.map((p) => (
                <ValueRow key={p.label} label={p.label} value={p.value} main={p.value !== "(empty)"} labelWidth="w-56" />
              ))}
            </dl>
          )}
        </Card>
      </div>
    </>
  );
};

export default StorageSlotReaderComponent;
