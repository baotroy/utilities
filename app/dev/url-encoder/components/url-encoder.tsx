"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import TextArea from "@/components/Input/TextArea";
import { Card, CopyButton, ErrorText, Field, Intro, OutputBox, Tabs, ValueRow } from "@/components/Tool/ui";
import { FC, useMemo, useState } from "react";
import { MdAdd, MdClose } from "react-icons/md";

type Variant = "component" | "uri" | "form";

const encode = (text: string, variant: Variant) => {
  if (variant === "uri") return encodeURI(text);
  const out = encodeURIComponent(text);
  return variant === "form" ? out.replace(/%20/g, "+") : out;
};

const decode = (text: string, variant: Variant) => {
  const t = variant === "form" ? text.replace(/\+/g, " ") : text;
  return variant === "uri" ? decodeURI(t) : decodeURIComponent(t);
};

const EncodeTab: FC = () => {
  const [input, setInput] = useState("name=Nguyễn Văn A&redirect=https://example.com/a b?x=1");
  const [variant, setVariant] = useState<Variant>("component");
  const [direction, setDirection] = useState<"encode" | "decode">("encode");
  const { output, error } = useMemo(() => {
    try {
      return { output: direction === "encode" ? encode(input, variant) : decode(input, variant), error: "" };
    } catch (e) {
      return { output: "", error: `Cannot decode: ${(e as Error).message}` };
    }
  }, [input, variant, direction]);
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Tabs value={direction} onChange={setDirection} options={[{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }]} />
        <Tabs
          value={variant}
          onChange={setVariant}
          options={[
            { value: "component", label: "Component (encodeURIComponent)" },
            { value: "uri", label: "Full URL (encodeURI)" },
            { value: "form", label: "Form (+ for spaces)" },
          ]}
        />
      </div>
      <Field label="Input">
        <TextArea rows={5} value={input} onChange={(e) => setInput(e.target.value)} additionalClass="w-full font-mono text-sm leading-5" />
      </Field>
      <Field label="Output" right={<Button label="Use as input" type="outline" disabled={!output} handleOnClick={() => { setInput(output); setDirection(direction === "encode" ? "decode" : "encode"); }} />}>
        <OutputBox value={output} rows={5} />
        <ErrorText>{error}</ErrorText>
      </Field>
    </>
  );
};

const ParseTab: FC = () => {
  const [input, setInput] = useState("https://user:pass@api.example.com:8443/v1/search?q=hello%20world&tag=a&tag=b&utm_source=x#results");
  const parsed = useMemo(() => {
    try {
      const url = new URL(input.trim());
      return { url, params: Array.from(url.searchParams.entries()), error: "" };
    } catch {
      return { url: null, params: [] as [string, string][], error: "Not a full URL (it needs a protocol such as https://)" };
    }
  }, [input]);

  const setParams = (params: [string, string][]) => {
    if (!parsed.url) return;
    const url = new URL(parsed.url.toString());
    url.search = new URLSearchParams(params).toString();
    setInput(url.toString());
  };

  const url = parsed.url;
  return (
    <>
      <Field label="URL">
        <TextArea rows={3} value={input} onChange={(e) => setInput(e.target.value)} additionalClass="w-full font-mono text-sm leading-5" />
      </Field>
      <ErrorText>{input.trim() ? parsed.error : ""}</ErrorText>
      {url && (
        <div className="space-y-4">
          <Card title="Parts">
            <dl>
              <ValueRow label="Protocol" value={url.protocol} />
              {url.username && <ValueRow label="Username" value={decodeURIComponent(url.username)} />}
              {url.password && <ValueRow label="Password" value={decodeURIComponent(url.password)} />}
              <ValueRow label="Host" value={url.hostname} main />
              <ValueRow label="Port" value={url.port || `(default${url.protocol === "https:" ? " 443" : url.protocol === "http:" ? " 80" : ""})`} />
              <ValueRow label="Origin" value={url.origin} />
              <ValueRow label="Path" value={decodeURIComponent(url.pathname)} />
              <ValueRow label="Query string" value={url.search} />
              <ValueRow label="Hash" value={url.hash} />
            </dl>
          </Card>
          <Card
            title={`Query parameters (${parsed.params.length})`}
            right={
              <button type="button" className="flex cursor-pointer items-center gap-1 text-sm text-primary hover:underline" onClick={() => setParams([...parsed.params, ["key", "value"]])}>
                <MdAdd /> Add
              </button>
            }
          >
            {parsed.params.length === 0 && <p className="text-sm text-bodydark">No query parameters.</p>}
            <div className="space-y-2">
              {parsed.params.map(([k, v], i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className="custom-input w-1/3 font-mono text-sm"
                    value={k}
                    spellCheck={false}
                    onChange={(e) => setParams(parsed.params.map((p, j) => (j === i ? [e.target.value, p[1]] : p)))}
                  />
                  <input
                    className="custom-input min-w-0 flex-1 font-mono text-sm"
                    value={v}
                    spellCheck={false}
                    onChange={(e) => setParams(parsed.params.map((p, j) => (j === i ? [p[0], e.target.value] : p)))}
                  />
                  <CopyButton value={v} />
                  <button type="button" aria-label="Remove parameter" className="cursor-pointer text-bodydark hover:text-red-500" onClick={() => setParams(parsed.params.filter((_, j) => j !== i))}>
                    <MdClose size={18} />
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-bodydark dark:text-bodydark2">Values are shown decoded; edits rebuild the URL above.</p>
          </Card>
          <Card title="As JSON">
            <OutputBox
              rows={6}
              value={JSON.stringify(
                parsed.params.reduce<Record<string, string | string[]>>((acc, [k, v]) => {
                  const prev = acc[k];
                  acc[k] = prev === undefined ? v : Array.isArray(prev) ? [...prev, v] : [prev, v];
                  return acc;
                }, {}),
                null,
                2
              )}
            />
          </Card>
        </div>
      )}
    </>
  );
};

const UrlEncoderComponent: FC = () => {
  const [tab, setTab] = useState<"encode" | "parse">("encode");
  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <Intro>Percent-encode text for a URL or decode it back, and take a URL apart into its pieces and query parameters.</Intro>
        <Tabs value={tab} onChange={setTab} options={[{ value: "encode", label: "Encode / Decode" }, { value: "parse", label: "Parse URL" }]} />
        {tab === "encode" ? <EncodeTab /> : <ParseTab />}
      </div>
    </>
  );
};

export default UrlEncoderComponent;
