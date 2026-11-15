"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TextArea from "@/components/Input/TextArea";
import { Card, CopyButton, ErrorText, Field, Intro, OutputBox } from "@/components/Tool/ui";
import { JSONPath } from "jsonpath-plus";
import { FC, useMemo, useState } from "react";

const SAMPLE = `{
  "store": {
    "book": [
      { "category": "reference", "author": "Nigel Rees", "title": "Sayings of the Century", "price": 8.95 },
      { "category": "fiction", "author": "Evelyn Waugh", "title": "Sword of Honour", "price": 12.99 },
      { "category": "fiction", "author": "Herman Melville", "title": "Moby Dick", "isbn": "0-553-21311-3", "price": 8.99 },
      { "category": "fiction", "author": "J. R. R. Tolkien", "title": "The Lord of the Rings", "isbn": "0-395-19395-8", "price": 22.99 }
    ],
    "bicycle": { "color": "red", "price": 19.95 }
  }
}`;

const EXAMPLES = [
  { path: "$.store.book[*].author", note: "every author" },
  { path: "$..price", note: "all prices, at any depth" },
  { path: "$.store.book[?(@.price < 10)].title", note: "filter" },
  { path: "$.store.book[-1:]", note: "last item" },
  { path: "$.store.book[?(@.isbn)]", note: "items that have isbn" },
  { path: "$.store.*~", note: "property names" },
];

const JsonPathComponent: FC = () => {
  const [json, setJson] = useState(SAMPLE);
  const [path, setPath] = useState(EXAMPLES[2].path);

  const parsed = useMemo(() => {
    try {
      return { value: JSON.parse(json), error: "" };
    } catch (e) {
      return { value: undefined, error: `Invalid JSON: ${(e as Error).message}` };
    }
  }, [json]);

  const result = useMemo(() => {
    if (parsed.error || !path.trim()) return { matches: [] as { path: string; value: unknown }[], error: "" };
    try {
      const matches = JSONPath({ path: path.trim(), json: parsed.value, resultType: "all", eval: "safe", wrap: true }) as {
        path: string;
        value: unknown;
      }[];
      return { matches: matches.map((m) => ({ path: m.path, value: m.value })), error: "" };
    } catch (e) {
      return { matches: [], error: `Invalid JSONPath: ${(e as Error).message}` };
    }
  }, [parsed, path]);

  const valuesJson = JSON.stringify(result.matches.map((m) => m.value), null, 2);

  return (
    <>
      <Breadcrumb />
      <Intro>
        Pick values out of a JSON document with a JSONPath expression. Filters like{" "}
        <span className="font-mono">[?(@.price &lt; 10)]</span> run in a safe evaluator, not with eval.
      </Intro>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <Field label="JSON">
            <TextArea rows={22} value={json} onChange={(e) => setJson(e.target.value)} isError={!!parsed.error} additionalClass="w-full font-mono text-sm leading-5" />
            <ErrorText>{parsed.error}</ErrorText>
          </Field>
        </div>
        <div>
          <Field label="JSONPath">
            <input className="custom-input w-full font-mono text-sm" value={path} spellCheck={false} onChange={(e) => setPath(e.target.value)} />
          </Field>
          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.path}
                type="button"
                title={ex.note}
                onClick={() => setPath(ex.path)}
                className="cursor-pointer rounded border border-stroke px-2 py-1 font-mono hover:border-primary hover:text-primary dark:border-strokedark"
              >
                {ex.path}
              </button>
            ))}
          </div>
          <ErrorText>{result.error}</ErrorText>
          {!result.error && !parsed.error && (
            <>
              <Field label={`${result.matches.length} match${result.matches.length === 1 ? "" : "es"}`}>
                <OutputBox value={result.matches.length ? valuesJson : ""} rows={10} placeholder="No match" />
              </Field>
              {result.matches.length > 0 && (
                <Card title="Paths">
                  <ul className="max-h-72 overflow-auto text-sm">
                    {result.matches.map((m, i) => (
                      <li key={i} className="flex items-start gap-2 border-b border-stroke py-1 last:border-0 dark:border-strokedark">
                        <span className="min-w-0 flex-1 break-all font-mono">{m.path}</span>
                        <CopyButton value={m.path} label={`Copy path ${m.path}`} />
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default JsonPathComponent;
