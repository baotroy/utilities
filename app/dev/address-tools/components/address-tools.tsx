"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import TextArea from "@/components/Input/TextArea";
import { Card, CopyButton, ErrorText, Field, Intro, Tabs, ValueRow } from "@/components/Tool/ui";
import { EVM_CHAINS, parseBigIntInput, shortError } from "@/common/evmTools";
import { FC, useMemo, useState } from "react";
import {
  createPublicClient,
  getAddress,
  getContractAddress,
  Hex,
  http,
  isAddress,
  isHex,
  keccak256,
  pad,
  stringToHex,
} from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";

type Tab = "checksum" | "create" | "create2" | "ens";

const toAddress = (raw: string, label: string) => {
  const t = raw.trim();
  if (!isAddress(t, { strict: false })) throw new Error(`${label} is not a valid address`);
  return getAddress(t.toLowerCase());
};

const ChecksumTab: FC = () => {
  const [text, setText] = useState(
    "0xd8da6bf26964af9d7eed9e03e53415d37aa96045\n0x1f9840a85d5af5bf1d1762f925bdaddc4201f984\n0xD8dA6BF26964aF9D7eEd9e03E53415D37aA96046"
  );
  const rows = useMemo(
    () =>
      text
        .split(/[\s,]+/)
        .map((x) => x.trim())
        .filter(Boolean)
        .map((input) => {
          if (!/^0x[0-9a-fA-F]{40}$/.test(input)) return { input, error: "Not a 20-byte hex address" };
          const checksummed = getAddress(input.toLowerCase());
          const mixed = input.slice(2) !== input.slice(2).toLowerCase() && input.slice(2) !== input.slice(2).toUpperCase();
          return { input, checksummed, badChecksum: mixed && checksummed !== input };
        }),
    [text]
  );
  return (
    <>
      <Field label="Addresses" hint="(one per line)">
        <TextArea rows={5} value={text} onChange={(e) => setText(e.target.value)} additionalClass="w-full font-mono text-sm leading-5" />
      </Field>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="rounded-lg border border-stroke p-3 text-sm dark:border-strokedark">
            {r.error ? (
              <>
                <p className="break-all font-mono">{r.input}</p>
                <p className="text-red-500">{r.error}</p>
              </>
            ) : (
              <>
                <p className="flex items-center gap-2">
                  <span className="break-all font-mono font-semibold text-primary">{r.checksummed}</span>
                  <CopyButton value={r.checksummed!} />
                </p>
                <p className={r.badChecksum ? "text-red-500" : "text-bodydark dark:text-bodydark2"}>
                  {r.badChecksum
                    ? "Wrong checksum: the mixed case does not match, so this address may have a typo."
                    : r.input === r.checksummed
                      ? "Valid checksum"
                      : "No checksum in the input (all one case); the line above is the checksummed form."}
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

const CreateTab: FC = () => {
  const [from, setFrom] = useState("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
  const [nonce, setNonce] = useState("0");
  const result = useMemo(() => {
    try {
      const sender = toAddress(from, "Deployer");
      const start = parseBigIntInput(nonce || "0");
      return {
        rows: Array.from({ length: 5 }, (_, i) => {
          const n = start + BigInt(i);
          return { nonce: n.toString(), address: getContractAddress({ from: sender, nonce: n }) };
        }),
        error: "",
      };
    } catch (e) {
      return { rows: [], error: shortError(e) };
    }
  }, [from, nonce]);
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
        <Field label="Deployer address">
          <input className="custom-input w-full font-mono text-sm" value={from} spellCheck={false} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="Nonce">
          <input className="custom-input w-full font-mono text-sm" value={nonce} onChange={(e) => setNonce(e.target.value)} />
        </Field>
      </div>
      <ErrorText>{result.error}</ErrorText>
      {result.rows.length > 0 && (
        <Card title="Contract address by nonce">
          <dl>
            {result.rows.map((r, i) => (
              <ValueRow key={r.nonce} label={`nonce ${r.nonce}`} value={r.address} main={i === 0} />
            ))}
          </dl>
        </Card>
      )}
    </>
  );
};

const Create2Tab: FC = () => {
  const [from, setFrom] = useState("0x4e59b44847b379578588920ca78fbf26c0b4956c");
  const [salt, setSalt] = useState("0");
  const [codeMode, setCodeMode] = useState<"code" | "hash">("code");
  const [code, setCode] = useState("0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea164736f6c6343000818000a");
  const result = useMemo(() => {
    try {
      const sender = toAddress(from, "Factory");
      const s = salt.trim();
      const saltHex: Hex = isHex(s) && s.length === 66
        ? (s as Hex)
        : isHex(s)
          ? pad(s as Hex, { size: 32 })
          : /^\d+$/.test(s)
            ? pad(`0x${BigInt(s).toString(16)}` as Hex, { size: 32 })
            : keccak256(stringToHex(s));
      const c = code.trim();
      if (!isHex(c) || c.length % 2) throw new Error(codeMode === "code" ? "Init code must be hex" : "Init code hash must be hex");
      if (codeMode === "hash" && c.length !== 66) throw new Error("Init code hash must be 32 bytes");
      const bytecodeHash = codeMode === "hash" ? (c as Hex) : keccak256(c as Hex);
      const address = getContractAddress({ opcode: "CREATE2", from: sender, salt: saltHex, bytecodeHash });
      return { address, saltHex, bytecodeHash, error: "" };
    } catch (e) {
      return { address: "", saltHex: "", bytecodeHash: "", error: shortError(e) };
    }
  }, [from, salt, code, codeMode]);
  return (
    <>
      <Field label="Factory / deployer address" hint="(default: the deterministic deployment proxy)">
        <input className="custom-input w-full font-mono text-sm" value={from} spellCheck={false} onChange={(e) => setFrom(e.target.value)} />
      </Field>
      <Field label="Salt" hint="(32-byte hex, a number, or text that gets hashed with keccak256)">
        <input className="custom-input w-full font-mono text-sm" value={salt} spellCheck={false} onChange={(e) => setSalt(e.target.value)} />
      </Field>
      <Field
        label={codeMode === "code" ? "Init code" : "Init code hash"}
        hint={codeMode === "code" ? "(creation bytecode + encoded constructor args)" : "(keccak256 of the init code)"}
        right={
          <button type="button" className="cursor-pointer text-sm text-primary hover:underline" onClick={() => setCodeMode(codeMode === "code" ? "hash" : "code")}>
            {codeMode === "code" ? "I have the hash" : "I have the init code"}
          </button>
        }
      >
        <TextArea rows={codeMode === "code" ? 4 : 1} value={code} onChange={(e) => setCode(e.target.value)} additionalClass="w-full font-mono text-sm leading-5" />
      </Field>
      <ErrorText>{result.error}</ErrorText>
      {result.address && (
        <Card title="CREATE2 address">
          <dl>
            <ValueRow label="Address" value={result.address} main />
            <ValueRow label="Salt (bytes32)" value={result.saltHex} />
            <ValueRow label="Init code hash" value={result.bytecodeHash} />
          </dl>
        </Card>
      )}
    </>
  );
};

const EnsTab: FC = () => {
  const [query, setQuery] = useState("vitalik.eth");
  const [rpc, setRpc] = useState(EVM_CHAINS[0].rpc);
  const [result, setResult] = useState<{ label: string; value: string }[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const client = createPublicClient({ chain: mainnet, transport: http(rpc.trim()) });
      const q = query.trim();
      if (isAddress(q, { strict: false })) {
        const address = getAddress(q.toLowerCase());
        const name = await client.getEnsName({ address });
        setResult([
          { label: "Address", value: address },
          { label: "Primary name", value: name || "(no reverse record)" },
        ]);
      } else {
        const name = normalize(q);
        const [address, avatar] = await Promise.all([
          client.getEnsAddress({ name }),
          client.getEnsAvatar({ name }).catch(() => null),
        ]);
        setResult([
          { label: "Name", value: name },
          { label: "Address", value: address || "(not set)" },
          ...(avatar ? [{ label: "Avatar", value: avatar }] : []),
        ]);
      }
    } catch (e) {
      setError(shortError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="ENS name or address">
          <input
            className="custom-input w-full font-mono text-sm"
            value={query}
            spellCheck={false}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
          />
        </Field>
        <Field label="Ethereum mainnet RPC">
          <input className="custom-input w-full font-mono text-sm" value={rpc} spellCheck={false} onChange={(e) => setRpc(e.target.value)} />
        </Field>
      </div>
      <div className="mb-4 text-right">
        <Button label="Resolve" handleOnClick={run} isLoading={loading} />
      </div>
      <ErrorText>{error}</ErrorText>
      {result && (
        <Card>
          <dl>
            {result.map((r, i) => (
              <ValueRow key={r.label} label={r.label} value={r.value} main={i === 1} />
            ))}
          </dl>
        </Card>
      )}
    </>
  );
};

const AddressToolsComponent: FC = () => {
  const [tab, setTab] = useState<Tab>("checksum");
  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <Intro>
          Everyday address helpers: fix or check the EIP-55 checksum, work out where a contract will
          be deployed with CREATE or CREATE2, and resolve ENS names both ways.
        </Intro>
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { value: "checksum", label: "Checksum" },
            { value: "create", label: "CREATE address" },
            { value: "create2", label: "CREATE2 address" },
            { value: "ens", label: "ENS" },
          ]}
        />
        {tab === "checksum" && <ChecksumTab />}
        {tab === "create" && <CreateTab />}
        {tab === "create2" && <Create2Tab />}
        {tab === "ens" && <EnsTab />}
      </div>
    </>
  );
};

export default AddressToolsComponent;
