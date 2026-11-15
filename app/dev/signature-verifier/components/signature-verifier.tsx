"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import TextArea from "@/components/Input/TextArea";
import { Card, ErrorText, Field, Intro, Tabs, ValueRow } from "@/components/Tool/ui";
import { shortError } from "@/common/evmTools";
import { FC, useState } from "react";
import { Hex } from "viem";
import { MdCheckCircle, MdCancel } from "react-icons/md";
import { digestOf, recoverSigner, SAMPLE_TYPED, sameAddress, signWithKey, SigMode, splitSignature } from "./utils";

// Well-known test key (private key 0x…01). Never holds real funds.
const TEST_KEY = "0x0000000000000000000000000000000000000000000000000000000000000001";

const SignatureVerifierComponent: FC = () => {
  const [action, setAction] = useState<"verify" | "sign">("verify");
  const [mode, setMode] = useState<SigMode>("message");
  const [inputs, setInputs] = useState<Record<SigMode, string>>({
    message: "Hello from Utilities",
    typed: SAMPLE_TYPED,
    hash: "0x" + "ab".repeat(32),
  });
  const [signature, setSignature] = useState("");
  const [expected, setExpected] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [result, setResult] = useState<{ signer?: string; signature?: string; digest: string } | null>(null);
  const [error, setError] = useState("");

  const input = inputs[mode];

  const run = async () => {
    setError("");
    setResult(null);
    try {
      const digest = digestOf(mode, input);
      if (action === "verify") {
        const sig = signature.trim() as Hex;
        splitSignature(sig); // validates the length
        const signer = await recoverSigner(mode, input, sig);
        setResult({ signer, signature: sig, digest });
      } else {
        const key = privateKey.trim() as Hex;
        if (!/^0x[0-9a-fA-F]{64}$/.test(key)) throw new Error("The private key must be 32 bytes of hex (0x + 64 characters)");
        const sig = await signWithKey(mode, input, key);
        const signer = await recoverSigner(mode, input, sig);
        setResult({ signer, signature: sig, digest });
      }
    } catch (e) {
      setError(shortError(e));
    }
  };

  let parts: ReturnType<typeof splitSignature> | null = null;
  try {
    parts = result?.signature ? splitSignature(result.signature as Hex) : null;
  } catch {
    parts = null;
  }
  const match = result?.signer && expected.trim() ? sameAddress(result.signer, expected.trim()) : null;

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <Intro>
          Recover who signed a message and check it against an address. Works with personal_sign
          (EIP-191), EIP-712 typed data such as Permit, and raw 32-byte hashes. Everything runs in
          your browser.
        </Intro>
        <div className="flex flex-wrap gap-3">
          <Tabs
            value={action}
            onChange={(a) => {
              setAction(a);
              setResult(null);
            }}
            options={[
              { value: "verify", label: "Verify" },
              { value: "sign", label: "Sign (test)" },
            ]}
          />
          <Tabs
            value={mode}
            onChange={(m) => {
              setMode(m);
              setResult(null);
            }}
            options={[
              { value: "message", label: "Message (EIP-191)" },
              { value: "typed", label: "Typed data (EIP-712)" },
              { value: "hash", label: "Raw hash" },
            ]}
          />
        </div>
        <Field
          label={mode === "message" ? "Message" : mode === "typed" ? "Typed data JSON" : "Hash"}
          hint={
            mode === "message"
              ? "(text, or 0x hex to sign the bytes)"
              : mode === "typed"
                ? "(as passed to eth_signTypedData_v4)"
                : "(32 bytes, signed without a prefix)"
          }
        >
          <TextArea
            rows={mode === "typed" ? 14 : 3}
            value={input}
            onChange={(e) => setInputs({ ...inputs, [mode]: e.target.value })}
            additionalClass="w-full font-mono text-sm leading-5"
          />
        </Field>
        {action === "verify" ? (
          <>
            <Field label="Signature" hint="(65 bytes, or 64-byte EIP-2098 compact)">
              <TextArea rows={2} value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="0x…" additionalClass="w-full font-mono text-sm leading-5" />
            </Field>
            <Field label="Expected signer" hint="(optional)">
              <input className="custom-input w-full font-mono text-sm" value={expected} spellCheck={false} onChange={(e) => setExpected(e.target.value)} placeholder="0x…" />
            </Field>
          </>
        ) : (
          <Field
            label="Private key"
            hint="(stays in this page; use a throwaway test key only)"
            right={
              <button type="button" className="cursor-pointer text-sm text-primary hover:underline" onClick={() => setPrivateKey(TEST_KEY)}>
                Use test key
              </button>
            }
          >
            <input type="password" autoComplete="off" className="custom-input w-full font-mono text-sm" value={privateKey} spellCheck={false} onChange={(e) => setPrivateKey(e.target.value)} placeholder="0x…" />
          </Field>
        )}
        <div className="mb-4 text-right">
          <Button label={action === "verify" ? "Recover signer" : "Sign"} handleOnClick={run} />
        </div>
        <ErrorText>{error}</ErrorText>
        {result && (
          <Card title={action === "verify" ? "Result" : "Signature"}>
            {match !== null && (
              <p className={`mb-2 flex items-center gap-2 font-semibold ${match ? "text-green-600" : "text-red-500"}`}>
                {match ? <MdCheckCircle size={20} /> : <MdCancel size={20} />}
                {match ? "Signed by the expected address" : "Not signed by the expected address"}
              </p>
            )}
            <dl>
              <ValueRow label="Signer" value={result.signer || ""} main={action === "verify"} />
              {action === "sign" && <ValueRow label="Signature" value={result.signature || ""} main />}
              <ValueRow label="Signed digest" value={result.digest} />
              {parts && (
                <>
                  <ValueRow label="r" value={parts.r} />
                  <ValueRow label="s" value={parts.s} />
                  <ValueRow label="v" value={String(parts.v)} />
                  <ValueRow label="Compact (EIP-2098)" value={parts.compact} />
                </>
              )}
            </dl>
          </Card>
        )}
      </div>
    </>
  );
};

export default SignatureVerifierComponent;
