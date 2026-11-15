"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import TextArea from "@/components/Input/TextArea";
import { ErrorText, Field, Intro, OutputBox, Tabs } from "@/components/Tool/ui";
import { download } from "@/common/utils";
import { FC, useMemo, useState } from "react";
import { MdSwapHoriz } from "react-icons/md";
import { parse as parseToml, stringify as stringifyToml } from "smol-toml";
import { parseAllDocuments, stringify as stringifyYaml } from "yaml";

type Format = "json" | "yaml" | "toml";

const SAMPLES: Record<Format, string> = {
  yaml: `# docker-compose style
version: "3.9"
services:
  web:
    image: nginx:1.27
    ports:
      - "8080:80"
    environment:
      DEBUG: false
      WORKERS: 4
  db:
    image: postgres:16
    volumes: [db-data:/var/lib/postgresql/data]
`,
  json: `{
  "name": "utilities",
  "version": "0.1.0",
  "private": true,
  "scripts": { "dev": "next dev", "build": "next build" },
  "tags": ["tools", "web3"]
}`,
  toml: `[package]
name = "my-crate"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = "1"
`,
};

const FORMATS: { value: Format; label: string }[] = [
  { value: "yaml", label: "YAML" },
  { value: "json", label: "JSON" },
  { value: "toml", label: "TOML" },
];

function parseInput(text: string, format: Format): unknown {
  if (format === "json") return JSON.parse(text);
  if (format === "yaml") {
    const docs = parseAllDocuments(text);
    const errors = docs.flatMap((d) => d.errors);
    if (errors.length) throw errors[0];
    const values = docs.map((d) => d.toJS());
    return values.length > 1 ? values : values[0];
  }
  return parseToml(text);
}

// TOML has no null; drop nulls so a YAML/JSON document still converts
const stripNulls = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.filter((x) => x !== null).map(stripNulls);
  if (v && typeof v === "object" && !(v instanceof Date)) {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).filter(([, x]) => x !== null && x !== undefined).map(([k, x]) => [k, stripNulls(x)])
    );
  }
  return v;
};

function formatOutput(value: unknown, format: Format, indent: number): string {
  if (format === "json") return JSON.stringify(value, null, indent) ?? "";
  if (format === "yaml") return stringifyYaml(value, { indent, lineWidth: 0, aliasDuplicateObjects: false });
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("TOML needs a table (an object) at the top level");
  }
  return stringifyToml(stripNulls(value) as Record<string, unknown>);
}

const YamlJsonConverterComponent: FC = () => {
  const [from, setFrom] = useState<Format>("yaml");
  const [to, setTo] = useState<Format>("json");
  const [input, setInput] = useState(SAMPLES.yaml);
  const [indent, setIndent] = useState(2);

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: "", error: "" };
    try {
      return { output: formatOutput(parseInput(input, from), to, indent), error: "" };
    } catch (e) {
      return { output: "", error: (e as Error).message.split("\n")[0] };
    }
  }, [input, from, to, indent]);

  const swap = () => {
    setFrom(to);
    setTo(from);
    if (output) setInput(output);
  };

  return (
    <>
      <Breadcrumb />
      <Intro>
        Convert config files between YAML, TOML and JSON. Conversion happens as you type; multi-document
        YAML becomes a JSON array.
      </Intro>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <Tabs value={from} onChange={setFrom} options={FORMATS} className="mb-0!" />
        <button type="button" aria-label="Swap" title="Swap input and output" onClick={swap} className="cursor-pointer text-bodydark hover:text-primary">
          <MdSwapHoriz size={26} />
        </button>
        <Tabs value={to} onChange={setTo} options={FORMATS} className="mb-0!" />
        <label className="ml-auto flex items-center gap-2 text-sm">
          Indent
          <select className="custom-input" value={indent} onChange={(e) => setIndent(Number(e.target.value))}>
            <option value={2}>2</option>
            <option value={4}>4</option>
          </select>
        </label>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Field
          label={`Input (${from.toUpperCase()})`}
          right={
            <span className="flex gap-3 text-sm">
              <button type="button" className="cursor-pointer text-primary hover:underline" onClick={() => setInput(SAMPLES[from])}>
                Sample
              </button>
              <button type="button" className="cursor-pointer text-primary hover:underline" onClick={() => setInput("")}>
                Clear
              </button>
            </span>
          }
        >
          <TextArea rows={22} value={input} onChange={(e) => setInput(e.target.value)} isError={!!error} additionalClass="w-full font-mono text-sm leading-5" />
          <ErrorText>{error}</ErrorText>
        </Field>
        <Field
          label={`Output (${to.toUpperCase()})`}
          right={
            <Button label="Download" type="outline" disabled={!output} handleOnClick={() => download(output, `converted.${to === "yaml" ? "yml" : to}`)} />
          }
        >
          <OutputBox value={output} rows={22} />
        </Field>
      </div>
    </>
  );
};

export default YamlJsonConverterComponent;
