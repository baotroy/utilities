"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TextArea from "@/components/Input/TextArea";
import { Card, CopyButton, ErrorText, Field, Intro } from "@/components/Tool/ui";
import clsx from "clsx";
import { FC, useMemo, useState } from "react";
import { MdSwapHoriz } from "react-icons/md";
import { DiffKind, diffJson, DiffOptions } from "./utils";

const LEFT = `{
  "id": 42,
  "name": "Alice",
  "roles": ["admin", "dev"],
  "address": { "city": "Hanoi", "zip": "100000" },
  "active": true,
  "score": 9.5
}`;
const RIGHT = `{
  "name": "Alice Nguyen",
  "id": 42,
  "roles": ["dev", "admin", "ops"],
  "address": { "city": "Ho Chi Minh City" },
  "active": "true",
  "lastLogin": "2026-11-15T08:00:00Z",
  "score": 9.5
}`;

const KIND_STYLE: Record<DiffKind, { label: string; cls: string }> = {
  added: { label: "added", cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  removed: { label: "removed", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  changed: { label: "changed", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  type: { label: "type changed", cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
};

const show = (v: unknown) => (v === undefined ? "" : JSON.stringify(v));

const parse = (text: string, side: string) => {
  try {
    return { value: JSON.parse(text), error: "" };
  } catch (e) {
    return { value: undefined, error: `${side}: ${(e as Error).message}` };
  }
};

const JsonDiffComponent: FC = () => {
  const [left, setLeft] = useState(LEFT);
  const [right, setRight] = useState(RIGHT);
  const [options, setOptions] = useState<DiffOptions>({ ignoreArrayOrder: false, ignoreCase: false, numericStrings: false });
  const [filter, setFilter] = useState<DiffKind | "all">("all");

  const a = useMemo(() => parse(left, "Original"), [left]);
  const b = useMemo(() => parse(right, "Changed"), [right]);
  const diffs = useMemo(
    () => (a.error || b.error ? [] : diffJson(a.value, b.value, options)),
    [a, b, options]
  );
  const counts = diffs.reduce<Record<string, number>>((acc, d) => ({ ...acc, [d.kind]: (acc[d.kind] || 0) + 1 }), {});
  const shown = filter === "all" ? diffs : diffs.filter((d) => d.kind === filter);

  const toggle = (key: keyof DiffOptions, label: string) => (
    <label className="flex cursor-pointer items-center gap-1.5 text-sm">
      <input type="checkbox" checked={options[key]} onChange={(e) => setOptions({ ...options, [key]: e.target.checked })} />
      {label}
    </label>
  );

  return (
    <>
      <Breadcrumb />
      <Intro>
        Compare two JSON documents by meaning rather than by text: key order and whitespace do not
        count, and each difference is listed with its JSONPath.
      </Intro>
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <Field label="Original">
          <TextArea rows={16} value={left} onChange={(e) => setLeft(e.target.value)} isError={!!a.error} additionalClass="w-full font-mono text-sm leading-5" />
        </Field>
        <button
          type="button"
          aria-label="Swap sides"
          title="Swap sides"
          className="hidden cursor-pointer self-center text-bodydark hover:text-primary lg:block"
          onClick={() => {
            setLeft(right);
            setRight(left);
          }}
        >
          <MdSwapHoriz size={26} />
        </button>
        <Field label="Changed">
          <TextArea rows={16} value={right} onChange={(e) => setRight(e.target.value)} isError={!!b.error} additionalClass="w-full font-mono text-sm leading-5" />
        </Field>
      </div>
      <div className="mb-4 flex flex-wrap gap-4">
        {toggle("ignoreArrayOrder", "Ignore array order")}
        {toggle("ignoreCase", "Ignore string case")}
        {toggle("numericStrings", 'Treat "1" and 1 as equal')}
      </div>
      <ErrorText>{a.error || b.error}</ErrorText>
      {!a.error && !b.error && (
        <Card
          title={diffs.length === 0 ? "The documents are equal" : `${diffs.length} difference${diffs.length > 1 ? "s" : ""}`}
          right={
            diffs.length > 0 && (
              <div className="flex flex-wrap gap-1 text-xs">
                {(["all", "added", "removed", "changed", "type"] as const).map((k) =>
                  k === "all" || counts[k] ? (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setFilter(k)}
                      className={clsx(
                        "cursor-pointer rounded px-2 py-0.5",
                        filter === k ? "bg-primary text-white" : "border border-stroke dark:border-strokedark"
                      )}
                    >
                      {k === "all" ? `all ${diffs.length}` : `${KIND_STYLE[k].label} ${counts[k]}`}
                    </button>
                  ) : null
                )}
              </div>
            )
          }
        >
          {shown.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-bodydark">
                    <th className="py-1 pr-3 font-medium">Path</th>
                    <th className="py-1 pr-3 font-medium">Change</th>
                    <th className="py-1 pr-3 font-medium">Original</th>
                    <th className="py-1 font-medium">Changed</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((d, i) => (
                    <tr key={i} className="border-t border-stroke align-top dark:border-strokedark">
                      <td className="py-1.5 pr-3">
                        <span className="flex items-start gap-1 font-mono">
                          <span className="break-all">{d.path}</span>
                          <CopyButton value={d.path} size={14} />
                        </span>
                      </td>
                      <td className="py-1.5 pr-3">
                        <span className={clsx("whitespace-nowrap rounded px-1.5 py-0.5 text-xs", KIND_STYLE[d.kind].cls)}>{KIND_STYLE[d.kind].label}</span>
                      </td>
                      <td className="max-w-xs break-all py-1.5 pr-3 font-mono text-red-600 dark:text-red-400">{show(d.left)}</td>
                      <td className="max-w-xs break-all py-1.5 font-mono text-green-700 dark:text-green-400">{show(d.right)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </>
  );
};

export default JsonDiffComponent;
