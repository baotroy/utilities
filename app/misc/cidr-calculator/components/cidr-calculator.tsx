"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { Card, ErrorText, Field, Intro, OutputBox, ValueRow } from "@/components/Tool/ui";
import { FC, useMemo, useState } from "react";
import { MdCheckCircle, MdCancel } from "react-icons/md";
import { formatCount, formatIp, ipv4Class, ipv4Kind, parseCidr, parseIp, splitSubnets } from "./utils";

const CidrCalculatorComponent: FC = () => {
  const [input, setInput] = useState("192.168.10.37/22");
  const [check, setCheck] = useState("192.168.11.200");
  const [splitTo, setSplitTo] = useState("");

  const info = useMemo(() => {
    try {
      return { data: parseCidr(input), error: "" };
    } catch (e) {
      return { data: null, error: (e as Error).message };
    }
  }, [input]);

  const d = info.data;
  const v = d?.version || 4;
  const contains = useMemo(() => {
    if (!d || !check.trim()) return null;
    const ip = parseIp(check);
    if (!ip || ip.version !== d.version) return "invalid";
    return ip.value >= d.network && ip.value <= d.last;
  }, [d, check]);

  const split = useMemo(() => {
    const p = Number(splitTo);
    if (!d || !splitTo || !Number.isInteger(p)) return null;
    return splitSubnets(d, p);
  }, [d, splitTo]);

  const hosts = d
    ? d.version === 4
      ? d.prefix >= 31
        ? d.size
        : d.size - BigInt(2)
      : d.size
    : BigInt(0);
  const firstHost = d ? (d.version === 4 && d.prefix < 31 ? d.network + BigInt(1) : d.network) : BigInt(0);
  const lastHost = d ? (d.version === 4 && d.prefix < 31 ? d.last - BigInt(1) : d.last) : BigInt(0);

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <Intro>
          Enter a CIDR block (<span className="font-mono">10.0.0.0/16</span>), an IP with a netmask (
          <span className="font-mono">10.0.0.5 255.255.255.0</span>) or an IPv6 prefix (
          <span className="font-mono">2001:db8::/48</span>).
        </Intro>
        <Field label="CIDR">
          <input className="custom-input w-full font-mono" value={input} spellCheck={false} onChange={(e) => setInput(e.target.value)} />
        </Field>
        <ErrorText>{info.error}</ErrorText>
        {d && (
          <div className="space-y-4">
            <Card title={`${formatIp(d.network, v)}/${d.prefix}`}>
              <dl>
                <ValueRow label="Network" value={formatIp(d.network, v)} main />
                {d.version === 4 && <ValueRow label="Broadcast" value={formatIp(d.last, v)} />}
                <ValueRow label="First usable" value={formatIp(firstHost, v)} />
                <ValueRow label="Last usable" value={formatIp(lastHost, v)} />
                <ValueRow label="Total addresses" value={formatCount(d.size)} />
                {d.version === 4 && <ValueRow label="Usable hosts" value={formatCount(hosts)} />}
                {d.version === 4 && (
                  <>
                    <ValueRow label="Netmask" value={formatIp(d.mask, 4)} />
                    <ValueRow label="Wildcard mask" value={formatIp(~d.mask & BigInt(0xffffffff), 4)} />
                    <ValueRow label="Binary netmask" value={d.mask.toString(2).padStart(32, "0").replace(/(.{8})(?!$)/g, "$1.")} />
                    <ValueRow label="Class" value={ipv4Class(d.network)} />
                    <ValueRow label="Type" value={ipv4Kind(d.ip)} />
                    <ValueRow label="Hex" value={`0x${d.network.toString(16).padStart(8, "0")}`} />
                  </>
                )}
                {d.version === 6 && (
                  <>
                    <ValueRow label="Expanded" value={formatIp(d.network, 6, true)} />
                    <ValueRow label="Last address" value={formatIp(d.last, 6)} />
                  </>
                )}
              </dl>
            </Card>
            <Card title="Is an IP in this block?">
              <input className="custom-input w-full font-mono" value={check} spellCheck={false} onChange={(e) => setCheck(e.target.value)} placeholder={v === 4 ? "10.0.1.2" : "2001:db8::1"} />
              {contains !== null && (
                <p className={`mt-2 flex items-center gap-2 text-sm font-semibold ${contains === true ? "text-green-600" : "text-red-500"}`}>
                  {contains === true ? <MdCheckCircle size={18} /> : <MdCancel size={18} />}
                  {contains === "invalid" ? `Not a valid IPv${v} address` : contains ? "Inside the block" : "Outside the block"}
                </p>
              )}
            </Card>
            <Card title="Split into subnets">
              <label className="flex items-center gap-2 text-sm">
                New prefix length
                <input className="custom-input w-20 font-mono" value={splitTo} onChange={(e) => setSplitTo(e.target.value)} placeholder={String(Math.min(d.prefix + 2, d.bits))} />
              </label>
              {split && (
                <div className="mt-3">
                  <p className="mb-2 text-sm">
                    {split.count === BigInt(0)
                      ? `Pick a prefix between ${d.prefix} and ${d.bits}.`
                      : `${formatCount(split.count)} subnet${split.count === BigInt(1) ? "" : "s"}${split.count > BigInt(split.list.length) ? `, first ${split.list.length} shown` : ""}`}
                  </p>
                  {split.list.length > 0 && <OutputBox value={split.list.join("\n")} rows={8} />}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default CidrCalculatorComponent;
