"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import { copyToClipboard, download } from "@/common/utils";
import { useMemo, useState } from "react";
import { MdContentCopy, MdDownload, MdOutlineClear, MdSwapHoriz } from "react-icons/md";
import { Check, LinkButton, Segmented, Warnings, outputClass, selectClass, textareaClass } from "@/app/devops/components/ui";
import { ObjFormat, ObjToEnvOptions, envToObject, objectToEnv, parseEnv, parseObject, stringifyObj } from "./utils";

type Mode = "env2obj" | "obj2env";

const SAMPLE_ENV = `# App
NODE_ENV=production
PORT=3000
DEBUG=false
APP_NAME="My App"   # quoted value
export API_URL=https://api.example.com/v1

# Database
DB__HOST=localhost
DB__PORT=5432
DB__PASSWORD='p@ss#word'
PRIVATE_KEY="-----BEGIN KEY-----\\nabc123\\n-----END KEY-----"
`;

const SAMPLE_OBJ = `{
  "nodeEnv": "production",
  "port": 3000,
  "debug": false,
  "db": {
    "host": "localhost",
    "port": 5432,
    "password": "p@ss word"
  },
  "allowedOrigins": ["https://a.com", "https://b.com"]
}`;

export default function EnvConverterComponent() {
  const [mode, setMode] = useState<Mode>("env2obj");
  const [input, setInput] = useState("");

  // .env -> JSON/YAML options
  const [format, setFormat] = useState<ObjFormat>("json");
  const [indent, setIndent] = useState(2);
  const [nest, setNest] = useState("");
  const [parseTypes, setParseTypes] = useState(false);
  const [lowerCase, setLowerCase] = useState(false);

  // JSON/YAML -> .env options
  const [envOpts, setEnvOpts] = useState<ObjToEnvOptions>({
    separator: "_",
    upperCase: true,
    arrays: "index",
    quote: "auto",
    exportPrefix: false,
  });
  const setOpt = <K extends keyof ObjToEnvOptions>(k: K, v: ObjToEnvOptions[K]) => setEnvOpts((o) => ({ ...o, [k]: v }));

  const result = useMemo(() => {
    if (!input.trim()) return { output: "", warnings: [] as string[], error: "", info: "" };
    if (mode === "env2obj") {
      const { entries, errors } = parseEnv(input);
      const { data, errors: nestErrors } = envToObject(entries, { nestSeparator: nest, parseTypes, lowerCaseKeys: lowerCase });
      return {
        output: entries.length ? stringifyObj(data, format, indent) : "",
        warnings: [...errors, ...nestErrors],
        error: "",
        info: `${entries.length} variable${entries.length === 1 ? "" : "s"}`,
      };
    }
    try {
      const { data, format: detected } = parseObject(input);
      const out = objectToEnv(data, envOpts);
      const count = out ? out.trim().split("\n").length : 0;
      return { output: out, warnings: [], error: "", info: `Detected ${detected.toUpperCase()} · ${count} variable${count === 1 ? "" : "s"}` };
    } catch (e: any) {
      return { output: "", warnings: [], error: e.message || String(e), info: "" };
    }
  }, [input, mode, format, indent, nest, parseTypes, lowerCase, envOpts]);

  const handleSwap = () => {
    setInput(result.output);
    setMode(mode === "env2obj" ? "obj2env" : "env2obj");
  };

  const isEnv = mode === "env2obj";
  const outName = isEnv ? (format === "json" ? "env.json" : "env.yaml") : ".env";

  return (
    <>
      <Breadcrumb />
      <div className="w-full">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Convert a <code>.env</code> file to JSON or YAML, or flatten JSON / YAML config into <code>.env</code> variables.
          Handles comments, <code>export</code>, quotes, escapes and multi-line values. Nothing leaves your browser.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-4">
          <Segmented<Mode>
            value={mode}
            onChange={setMode}
            options={[
              { value: "env2obj", label: ".env → JSON / YAML" },
              { value: "obj2env", label: "JSON / YAML → .env" },
            ]}
          />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-body dark:text-bodydark2">
          {isEnv ? (
            <>
              <label className="flex items-center gap-2">
                Output
                <select className={selectClass} value={format} onChange={(e) => setFormat(e.target.value as ObjFormat)}>
                  <option value="json">JSON</option>
                  <option value="yaml">YAML</option>
                </select>
              </label>
              <label className="flex items-center gap-2">
                Indent
                <select className={selectClass} value={indent} onChange={(e) => setIndent(Number(e.target.value))}>
                  <option value={2}>2 spaces</option>
                  <option value={4}>4 spaces</option>
                </select>
              </label>
              <label className="flex items-center gap-2">
                Nest keys by
                <select className={selectClass} value={nest} onChange={(e) => setNest(e.target.value)}>
                  <option value="">(flat)</option>
                  <option value="__">__ (double underscore)</option>
                  <option value="_">_ (underscore)</option>
                  <option value=".">. (dot)</option>
                </select>
              </label>
              <Check checked={parseTypes} onChange={setParseTypes}>Parse numbers / booleans</Check>
              <Check checked={lowerCase} onChange={setLowerCase}>Lowercase keys</Check>
            </>
          ) : (
            <>
              <label className="flex items-center gap-2">
                Nested key separator
                <select className={selectClass} value={envOpts.separator} onChange={(e) => setOpt("separator", e.target.value)}>
                  <option value="_">_</option>
                  <option value="__">__</option>
                  <option value=".">.</option>
                </select>
              </label>
              <label className="flex items-center gap-2">
                Arrays
                <select className={selectClass} value={envOpts.arrays} onChange={(e) => setOpt("arrays", e.target.value as ObjToEnvOptions["arrays"])}>
                  <option value="index">KEY_0, KEY_1…</option>
                  <option value="json">JSON string</option>
                </select>
              </label>
              <label className="flex items-center gap-2">
                Quotes
                <select className={selectClass} value={envOpts.quote} onChange={(e) => setOpt("quote", e.target.value as ObjToEnvOptions["quote"])}>
                  <option value="auto">When needed</option>
                  <option value="double">Always "double"</option>
                  <option value="single">Always 'single'</option>
                  <option value="none">Never</option>
                </select>
              </label>
              <Check checked={envOpts.upperCase} onChange={(v) => setOpt("upperCase", v)}>UPPER_CASE keys</Check>
              <Check checked={envOpts.exportPrefix} onChange={(v) => setOpt("exportPrefix", v)}>Prefix with export</Check>
            </>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-black dark:text-white">{isEnv ? ".env" : "JSON or YAML"}</span>
              <LinkButton onClick={() => setInput(isEnv ? SAMPLE_ENV : SAMPLE_OBJ)}>Load sample</LinkButton>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={20}
              spellCheck={false}
              placeholder={isEnv ? "KEY=value\n# comment\nOTHER=\"quoted value\"" : '{ "key": "value" }\n\nor\n\nkey: value'}
              className={textareaClass}
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-black dark:text-white">{isEnv ? format.toUpperCase() : ".env"}</span>
              {result.info && <span className="text-xs text-bodydark dark:text-bodydark2">{result.info}</span>}
            </div>
            <textarea value={result.output} readOnly rows={20} spellCheck={false} placeholder="Result appears here as you type..." className={outputClass} />
          </div>
        </div>

        <div className="my-4 flex flex-wrap gap-2">
          <Button
            handleOnClick={() => copyToClipboard(result.output)}
            label="Copy"
            type="outline"
            icon={{ icon: MdContentCopy, position: "left", size: 18 }}
            disabled={!result.output}
          />
          <Button
            handleOnClick={() => download(result.output, outName, isEnv && format === "json" ? "application/json" : "text/plain")}
            label="Download"
            type="outline"
            icon={{ icon: MdDownload, position: "left", size: 18 }}
            disabled={!result.output}
          />
          <Button
            handleOnClick={handleSwap}
            label="Use output as input"
            type="outline"
            icon={{ icon: MdSwapHoriz, position: "left", size: 18 }}
            disabled={!result.output}
          />
          <Button handleOnClick={() => setInput("")} label="Clear" type="reset" icon={{ icon: MdOutlineClear, position: "left", size: 18 }} />
        </div>

        {result.error && <Warnings items={[result.error]} tone="error" />}
        <Warnings items={result.warnings} />

        <div className="p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
          <div className="text-sm font-medium mb-2">Notes</div>
          <ul className="text-xs text-body dark:text-bodydark2 space-y-1">
            <li>• <code>.env</code> values are always strings. Turn on <em>Parse numbers / booleans</em> to get typed JSON.</li>
            <li>• <em>Nest keys by __</em> turns <code>DB__HOST=x</code> into <code>{"{ \"DB\": { \"HOST\": \"x\" } }"}</code> (the ASP.NET / Spring style).</li>
            <li>• JSON / YAML → .env flattens nested objects (<code>db.host</code> → <code>DB_HOST</code>) and also accepts a compose-style list of <code>KEY=value</code> strings.</li>
          </ul>
        </div>
      </div>
    </>
  );
}
