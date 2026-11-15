"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Card, CopyButton, Field, Intro } from "@/components/Tool/ui";
import BigNumber from "bignumber.js";
import { FC, useMemo, useState } from "react";

interface Unit {
  key: string;
  label: string;
  bytes: BigNumber;
}

const pow = (b: number, e: number) => new BigNumber(b).pow(e);

const DECIMAL: Unit[] = [
  { key: "B", label: "Byte", bytes: pow(1000, 0) },
  { key: "KB", label: "Kilobyte", bytes: pow(1000, 1) },
  { key: "MB", label: "Megabyte", bytes: pow(1000, 2) },
  { key: "GB", label: "Gigabyte", bytes: pow(1000, 3) },
  { key: "TB", label: "Terabyte", bytes: pow(1000, 4) },
  { key: "PB", label: "Petabyte", bytes: pow(1000, 5) },
];
const BINARY: Unit[] = [
  { key: "KiB", label: "Kibibyte", bytes: pow(1024, 1) },
  { key: "MiB", label: "Mebibyte", bytes: pow(1024, 2) },
  { key: "GiB", label: "Gibibyte", bytes: pow(1024, 3) },
  { key: "TiB", label: "Tebibyte", bytes: pow(1024, 4) },
  { key: "PiB", label: "Pebibyte", bytes: pow(1024, 5) },
];
const BITS: Unit[] = [
  { key: "bit", label: "Bit", bytes: new BigNumber(1).div(8) },
  { key: "Kbit", label: "Kilobit", bytes: pow(1000, 1).div(8) },
  { key: "Mbit", label: "Megabit", bytes: pow(1000, 2).div(8) },
  { key: "Gbit", label: "Gigabit", bytes: pow(1000, 3).div(8) },
];
const ALL = [...DECIMAL, ...BINARY, ...BITS];

const SPEEDS = [
  { label: "Mbit/s", bytesPerSec: pow(1000, 2).div(8) },
  { label: "Gbit/s", bytesPerSec: pow(1000, 3).div(8) },
  { label: "MB/s", bytesPerSec: pow(1000, 2) },
];

const fmt = (n: BigNumber) => {
  if (n.isZero()) return "0";
  if (n.abs().lt("0.000001") || n.abs().gte("1e21")) return n.toExponential(6).replace(/\.?0+e/, "e");
  return n.decimalPlaces(n.abs().lt(1) ? 10 : 6).toFormat();
};

const duration = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "-";
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)} ms`;
  const parts: string[] = [];
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s || !parts.length) parts.push(`${s}s`);
  return parts.join(" ");
};

const UnitGrid: FC<{ title: string; units: Unit[]; bytes: BigNumber; onPick: (u: Unit, v: string) => void }> = ({ title, units, bytes, onPick }) => (
  <Card title={title}>
    <dl>
      {units.map((u) => {
        const v = fmt(bytes.div(u.bytes));
        return (
          <div key={u.key} className="flex items-center gap-2 border-b border-stroke py-1.5 text-sm last:border-0 dark:border-strokedark">
            <dt className="w-24 shrink-0 text-bodydark" title={u.label}>
              {u.key}
            </dt>
            <dd className="min-w-0 flex-1 break-all font-mono">
              <button type="button" className="cursor-pointer text-left hover:text-primary" title="Use as input" onClick={() => onPick(u, v.replace(/,/g, ""))}>
                {v}
              </button>
            </dd>
            <CopyButton value={v.replace(/,/g, "")} />
          </div>
        );
      })}
    </dl>
  </Card>
);

const ByteConverterComponent: FC = () => {
  const [value, setValue] = useState("1.5");
  const [unit, setUnit] = useState("GB");
  const [speed, setSpeed] = useState("100");
  const [speedUnit, setSpeedUnit] = useState(SPEEDS[0].label);

  const bytes = useMemo(() => {
    const n = new BigNumber(value.replace(/[,_\s]/g, ""));
    const u = ALL.find((x) => x.key === unit)!;
    return n.isFinite() ? n.times(u.bytes) : null;
  }, [value, unit]);

  const seconds = useMemo(() => {
    const s = new BigNumber(speed);
    const su = SPEEDS.find((x) => x.label === speedUnit)!;
    if (!bytes || !s.isFinite() || s.lte(0)) return NaN;
    return bytes.div(s.times(su.bytesPerSec)).toNumber();
  }, [bytes, speed, speedUnit]);

  const pick = (u: Unit, v: string) => {
    setUnit(u.key);
    setValue(v);
  };

  return (
    <>
      <Breadcrumb />
      <div className="max-w-5xl">
        <Intro>
          Convert data sizes. KB, MB and GB use powers of 1000 (what disk makers and network speeds
          use); KiB, MiB and GiB use powers of 1024 (what operating systems often show).
        </Intro>
        <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
          <Field label="Value">
            <input className="custom-input w-full font-mono" value={value} onChange={(e) => setValue(e.target.value)} />
          </Field>
          <Field label="Unit">
            <select className="custom-input w-full" value={unit} onChange={(e) => setUnit(e.target.value)}>
              {ALL.map((u) => (
                <option key={u.key} value={u.key}>
                  {u.key} ({u.label})
                </option>
              ))}
            </select>
          </Field>
        </div>
        {!bytes ? (
          <p className="text-sm text-red-500">Enter a number.</p>
        ) : (
          <>
            <div className="mb-4 grid gap-4 lg:grid-cols-3">
              <UnitGrid title="Decimal (SI)" units={DECIMAL} bytes={bytes} onPick={pick} />
              <UnitGrid title="Binary (IEC)" units={BINARY} bytes={bytes} onPick={pick} />
              <UnitGrid title="Bits" units={BITS} bytes={bytes} onPick={pick} />
            </div>
            <Card title="Transfer time">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                At
                <input className="custom-input w-28 font-mono" value={speed} onChange={(e) => setSpeed(e.target.value)} />
                <select className="custom-input" value={speedUnit} onChange={(e) => setSpeedUnit(e.target.value)}>
                  {SPEEDS.map((s) => (
                    <option key={s.label}>{s.label}</option>
                  ))}
                </select>
                this takes <span className="font-mono text-base font-semibold text-primary">{duration(seconds)}</span>
              </div>
            </Card>
          </>
        )}
      </div>
    </>
  );
};

export default ByteConverterComponent;
