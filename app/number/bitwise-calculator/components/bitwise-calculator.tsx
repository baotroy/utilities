"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Card, CopyButton, ErrorText, Field, Intro, Tabs } from "@/components/Tool/ui";
import clsx from "clsx";
import { FC, useMemo, useState } from "react";

type Op = "AND" | "OR" | "XOR" | "NAND" | "NOR" | "XNOR" | "NOT" | "SHL" | "SHR" | "SAR";
type Width = "8" | "16" | "32" | "64" | "128" | "256";

const OPS: { value: Op; label: string }[] = [
  { value: "AND", label: "AND &" },
  { value: "OR", label: "OR |" },
  { value: "XOR", label: "XOR ^" },
  { value: "NAND", label: "NAND" },
  { value: "NOR", label: "NOR" },
  { value: "XNOR", label: "XNOR" },
  { value: "NOT", label: "NOT ~" },
  { value: "SHL", label: "<<" },
  { value: "SHR", label: ">>> (logical)" },
  { value: "SAR", label: ">> (arithmetic)" },
];

const B = (n: number | string) => BigInt(n);

/** 255, 0xff, 0b1111_1111, 0o377 or -1 */
function parseInt2(raw: string): bigint {
  const s = raw.trim().replace(/_/g, "").toLowerCase();
  const neg = s.startsWith("-");
  const body = neg ? s.slice(1) : s;
  if (!/^(0x[0-9a-f]+|0b[01]+|0o[0-7]+|\d+)$/.test(body)) throw new Error(`"${raw}" is not an integer (use 255, 0xff, 0b1010 or 0o17)`);
  const v = BigInt(body);
  return neg ? -v : v;
}

const BitwiseCalculatorComponent: FC = () => {
  const [a, setA] = useState("0b1100_1010");
  const [b, setB] = useState("0x0f");
  const [op, setOp] = useState<Op>("AND");
  const [width, setWidth] = useState<Width>("8");

  const bits = Number(width);
  const mask = (B(1) << B(bits)) - B(1);
  const unary = op === "NOT";
  const shift = op === "SHL" || op === "SHR" || op === "SAR";

  const calc = useMemo(() => {
    try {
      const x = parseInt2(a) & mask;
      const y = unary ? B(0) : shift ? parseInt2(b) : parseInt2(b) & mask;
      if (shift && (y < B(0) || y > B(bits))) throw new Error(`Shift amount must be between 0 and ${bits}`);
      const signed = (v: bigint) => (v >> B(bits - 1) ? v - (B(1) << B(bits)) : v);
      let r: bigint;
      switch (op) {
        case "AND": r = x & y; break;
        case "OR": r = x | y; break;
        case "XOR": r = x ^ y; break;
        case "NAND": r = ~(x & y); break;
        case "NOR": r = ~(x | y); break;
        case "XNOR": r = ~(x ^ y); break;
        case "NOT": r = ~x; break;
        case "SHL": r = x << y; break;
        case "SHR": r = x >> y; break;
        case "SAR": r = signed(x) >> y; break;
      }
      return { x, y, r: r & mask, signed, error: "" };
    } catch (e) {
      return { x: B(0), y: B(0), r: B(0), signed: (v: bigint) => v, error: (e as Error).message };
    }
  }, [a, b, op, bits, mask, unary, shift]);

  const bin = (v: bigint) => v.toString(2).padStart(bits, "0");
  const groups = (s: string) => s.replace(/(.{4})(?!$)/g, "$1 ");

  const BitRow: FC<{ label: string; v: bigint; highlight?: boolean }> = ({ label, v, highlight }) => (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 text-right text-sm text-bodydark">{label}</span>
      <span className={clsx("break-all font-mono text-sm tracking-wider", highlight && "font-semibold text-primary")}>
        {groups(bin(v))
          .split("")
          .map((c, i) => (
            <span key={i} className={c === "1" ? "" : c === "0" ? "opacity-40" : ""}>
              {c}
            </span>
          ))}
      </span>
    </div>
  );

  const formats = (v: bigint) => [
    { label: "Decimal (unsigned)", value: v.toString() },
    { label: "Decimal (signed)", value: calc.signed(v).toString() },
    { label: "Hex", value: `0x${v.toString(16).padStart(bits / 4, "0")}` },
    { label: "Octal", value: `0o${v.toString(8)}` },
    { label: "Binary", value: `0b${bin(v)}` },
    { label: "Bits set", value: String(bin(v).split("").filter((c) => c === "1").length) },
  ];

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <Intro>
          Bit operations on fixed-width integers, up to 256 bits for Solidity values. Inputs can be
          decimal, <span className="font-mono">0x</span> hex, <span className="font-mono">0b</span> binary or{" "}
          <span className="font-mono">0o</span> octal; negative numbers use two&apos;s complement.
        </Intro>
        <Field label="Width (bits)">
          <Tabs value={width} onChange={setWidth} className="mb-0!" options={(["8", "16", "32", "64", "128", "256"] as Width[]).map((w) => ({ value: w, label: w }))} />
        </Field>
        <Field label="Operation">
          <Tabs value={op} onChange={setOp} className="mb-0!" options={OPS} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="A">
            <input className="custom-input w-full font-mono" value={a} spellCheck={false} onChange={(e) => setA(e.target.value)} />
          </Field>
          {!unary && (
            <Field label={shift ? "Shift by" : "B"}>
              <input className="custom-input w-full font-mono" value={b} spellCheck={false} onChange={(e) => setB(e.target.value)} />
            </Field>
          )}
        </div>
        <ErrorText>{calc.error}</ErrorText>
        {!calc.error && (
          <>
            <Card className="mb-4 overflow-x-auto">
              <div className="space-y-1">
                <BitRow label="A" v={calc.x} />
                {!unary && !shift && <BitRow label="B" v={calc.y} />}
                {shift && <p className="pl-17 text-sm text-bodydark">{OPS.find((o) => o.value === op)!.label} {calc.y.toString()}</p>}
                <div className="ml-17 border-t border-stroke dark:border-strokedark" />
                <BitRow label="Result" v={calc.r} highlight />
              </div>
            </Card>
            <Card title="Result">
              <dl>
                {formats(calc.r).map((f) => (
                  <div key={f.label} className="flex items-start gap-2 border-b border-stroke py-1.5 text-sm last:border-0 dark:border-strokedark">
                    <dt className="w-40 shrink-0 text-bodydark">{f.label}</dt>
                    <dd className="min-w-0 flex-1 break-all font-mono">{f.value}</dd>
                    <CopyButton value={f.value} />
                  </div>
                ))}
              </dl>
            </Card>
          </>
        )}
      </div>
    </>
  );
};

export default BitwiseCalculatorComponent;
