"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import TextArea from "@/components/Input/TextArea";
import { copyToClipboard } from "@/common/utils";
import clsx from "clsx";
import { FC, useEffect, useMemo, useState } from "react";
import { MdAdd, MdArrowDownward, MdArrowUpward, MdClose } from "react-icons/md";
import {
  SortKey,
  SortOrder,
  SortType,
  collectFields,
  formatOutput,
  parseInput,
  sortItems,
} from "./utils";

const SAMPLES: Record<string, string> = {
  Numbers: "[42, 7, 1000, -3, 15.5, 0, 7]",
  Strings: `["banana", "Apple", "cherry", "item10", "item2", "apple"]`,
  Objects: JSON.stringify(
    [
      { name: "Bob", age: 30, address: { city: "Hanoi" }, joined: "2024-03-01" },
      { name: "alice", age: 25, address: { city: "Da Nang" }, joined: "2023-11-20" },
      { name: "Carol", age: 30, address: { city: "Hue" }, joined: "2022-07-15" },
      { name: "Dave", age: 41, address: { city: "Hanoi" }, joined: "2024-01-09" },
      { name: "Eve", address: { city: "Can Tho" }, joined: "2021-05-30" },
    ],
    null,
    2
  ),
};

const ORDERS: { value: SortOrder; label: string }[] = [
  { value: "asc", label: "Ascending (A → Z, 0 → 9)" },
  { value: "desc", label: "Descending (Z → A, 9 → 0)" },
];

const TYPES: { value: SortType; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "number", label: "Number" },
  { value: "string", label: "Text" },
  { value: "date", label: "Date" },
];

const control =
  "rounded border border-stroke bg-white px-2 py-1.5 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark";
const iconButton =
  "rounded p-1.5 text-bodydark hover:bg-gray hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-meta-4";

const describe = (items: unknown[]): string => {
  const kinds = new Set(
    items.map((item) =>
      item === null
        ? "null"
        : Array.isArray(item)
          ? "array"
          : typeof item === "object"
            ? "object"
            : typeof item
    )
  );
  const names: Record<string, string> = {
    number: "numbers",
    string: "strings",
    object: "objects",
    boolean: "booleans",
    array: "arrays",
    null: "nulls",
    undefined: "undefined",
  };
  return Array.from(kinds)
    .map((k) => names[k] || k)
    .join(", ");
};

const ArraySorterComponent: FC = () => {
  const [input, setInput] = useState(SAMPLES.Objects);
  const [mode, setMode] = useState<"value" | "fields">("fields");
  const [valueKey, setValueKey] = useState<SortKey>({ path: "", order: "asc", type: "auto" });
  const [fieldKeys, setFieldKeys] = useState<SortKey[]>([
    { path: "age", order: "desc", type: "auto" },
    { path: "name", order: "asc", type: "auto" },
  ]);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [natural, setNatural] = useState(true);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [indent, setIndent] = useState(2);

  const parsed = useMemo(() => {
    try {
      return { ...parseInput(input), error: "" };
    } catch (e) {
      return {
        items: [] as unknown[],
        format: "json" as const,
        error: e instanceof Error ? e.message : "Invalid input",
      };
    }
  }, [input]);

  const fields = useMemo(() => collectFields(parsed.items), [parsed.items]);
  const hasObjects = fields.length > 0;

  // switch to the mode that fits what was pasted
  useEffect(() => {
    if (!hasObjects && mode === "fields") setMode("value");
    if (hasObjects && mode === "value") setMode("fields");
    // only when the kind of data changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasObjects]);

  // keep at least one usable field row
  useEffect(() => {
    if (!hasObjects) return;
    setFieldKeys((keys) => {
      const usable = keys.filter((k) => k.path.trim() !== "");
      if (usable.length > 0) return keys;
      return [{ path: fields[0], order: "asc", type: "auto" }];
    });
  }, [hasObjects, fields]);

  const keys = mode === "value" ? [valueKey] : fieldKeys.filter((k) => k.path.trim() !== "");
  const options = { caseSensitive, natural, removeDuplicates };

  const output = useMemo(() => {
    if (parsed.error || parsed.items.length === 0) return { text: "", count: 0 };
    const sorted = sortItems(parsed.items, keys, options);
    return { text: formatOutput(sorted, parsed.format, indent), count: sorted.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed, JSON.stringify(keys), caseSensitive, natural, removeDuplicates, indent]);

  const updateField = (index: number, patch: Partial<SortKey>) =>
    setFieldKeys((list) => list.map((k, i) => (i === index ? { ...k, ...patch } : k)));
  const moveField = (index: number, delta: number) =>
    setFieldKeys((list) => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });
  const addField = () =>
    setFieldKeys((list) => [
      ...list,
      {
        path: fields.find((f) => !list.some((k) => k.path === f)) || "",
        order: "asc",
        type: "auto",
      },
    ]);

  return (
    <>
      <Breadcrumb />
      <div className="max-w-5xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Sort an array of numbers, strings or objects. Sort by the values themselves, or by one or
          more fields of the objects (nested fields with a dot, e.g. address.city). Paste JSON, a
          JavaScript array, or one value per line.
        </p>

        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <label className="text-sm font-semibold" htmlFor="sort-input">
            Input
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(SAMPLES).map((name) => (
              <Button
                key={name}
                label={name}
                type="outline"
                handleOnClick={() => setInput(SAMPLES[name])}
              />
            ))}
            <Button label="Clear" type="reset" handleOnClick={() => setInput("")} />
          </div>
        </div>
        <TextArea
          rows={10}
          additionalClass="w-full text-sm leading-5 font-mono"
          placeholder={'[3, 1, 2]  or  [{"name": "Bob", "age": 30}, ...]  or one value per line'}
          onChange={(e) => setInput(e.target.value)}
          value={input}
          isError={!!parsed.error}
        />
        <p
          className={clsx(
            "mt-1 text-sm",
            parsed.error ? "text-red-500" : "text-bodydark dark:text-bodydark2"
          )}
        >
          {parsed.error
            ? parsed.error
            : parsed.items.length > 0
              ? `${parsed.items.length} items (${describe(parsed.items)}), ${
                  parsed.format === "json" ? "array" : "one value per line"
                }`
              : " "}
        </p>

        <div className="mt-4 rounded-lg border border-stroke p-4 dark:border-strokedark">
          <div className="mb-3 flex flex-wrap items-center gap-4 text-sm">
            <span className="font-semibold">Sort by</span>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="sort-mode"
                checked={mode === "value"}
                onChange={() => setMode("value")}
              />
              Value of each item
            </label>
            <label
              className={clsx(
                "flex items-center gap-2",
                hasObjects ? "cursor-pointer" : "cursor-not-allowed opacity-50"
              )}
              title={hasObjects ? "" : "The items have no fields (not objects)"}
            >
              <input
                type="radio"
                name="sort-mode"
                checked={mode === "fields"}
                disabled={!hasObjects}
                onChange={() => setMode("fields")}
              />
              Fields
            </label>
          </div>

          {mode === "value" ? (
            <div className="flex flex-wrap gap-2">
              <select
                aria-label="Order"
                className={control}
                value={valueKey.order}
                onChange={(e) => setValueKey({ ...valueKey, order: e.target.value as SortOrder })}
              >
                {ORDERS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                aria-label="Compare as"
                className={control}
                value={valueKey.type}
                onChange={(e) => setValueKey({ ...valueKey, type: e.target.value as SortType })}
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    Compare as: {t.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <datalist id="sort-fields">
                {fields.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
              <ol className="space-y-2">
                {fieldKeys.map((key, index) => (
                  <li key={index} className="flex flex-wrap items-center gap-2">
                    <span className="w-14 shrink-0 text-xs text-bodydark">
                      {index === 0 ? "Sort by" : "then by"}
                    </span>
                    <input
                      list="sort-fields"
                      aria-label={`Field ${index + 1}`}
                      placeholder="field, e.g. address.city"
                      spellCheck={false}
                      className={clsx(control, "min-w-0 flex-1 font-mono")}
                      value={key.path}
                      onChange={(e) => updateField(index, { path: e.target.value })}
                    />
                    <select
                      aria-label={`Order of field ${index + 1}`}
                      className={control}
                      value={key.order}
                      onChange={(e) => updateField(index, { order: e.target.value as SortOrder })}
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                    <select
                      aria-label={`Type of field ${index + 1}`}
                      className={control}
                      value={key.type}
                      onChange={(e) => updateField(index, { type: e.target.value as SortType })}
                    >
                      {TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <span className="flex">
                      <button
                        type="button"
                        aria-label="Move up"
                        className={iconButton}
                        disabled={index === 0}
                        onClick={() => moveField(index, -1)}
                      >
                        <MdArrowUpward />
                      </button>
                      <button
                        type="button"
                        aria-label="Move down"
                        className={iconButton}
                        disabled={index === fieldKeys.length - 1}
                        onClick={() => moveField(index, 1)}
                      >
                        <MdArrowDownward />
                      </button>
                      <button
                        type="button"
                        aria-label="Remove field"
                        className={iconButton}
                        disabled={fieldKeys.length === 1}
                        onClick={() => setFieldKeys((list) => list.filter((_, i) => i !== index))}
                      >
                        <MdClose />
                      </button>
                    </span>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                className="mt-2 flex items-center gap-1 text-sm text-primary hover:underline"
                onClick={addField}
              >
                <MdAdd /> Add field
              </button>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-stroke pt-3 text-sm dark:border-strokedark">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
              />
              Case sensitive
            </label>
            <label
              className="flex cursor-pointer items-center gap-2"
              title='Numbers inside text are compared as numbers: "item2" before "item10"'
            >
              <input type="checkbox" checked={natural} onChange={(e) => setNatural(e.target.checked)} />
              Natural order (item2 before item10)
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={removeDuplicates}
                onChange={(e) => setRemoveDuplicates(e.target.checked)}
              />
              Remove duplicates
            </label>
          </div>
          <p className="mt-2 text-xs text-bodydark dark:text-bodydark2">
            Items where the value is missing, null or empty always go last. Items with equal values
            keep their original order.
          </p>
        </div>

        <div className="mb-2 mt-4 flex flex-wrap items-end justify-between gap-2">
          <span className="text-sm font-semibold">
            Result{output.count > 0 && ` (${output.count} items)`}
          </span>
          <div className="flex items-center gap-2">
            {parsed.format === "json" && (
              <select
                aria-label="Indentation"
                className={control}
                value={indent}
                onChange={(e) => setIndent(Number(e.target.value))}
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
                <option value={0}>Minified</option>
              </select>
            )}
            <Button
              label="Use as input"
              type="outline"
              disabled={!output.text}
              handleOnClick={() => setInput(output.text)}
            />
            <Button
              label="Copy"
              type="success"
              disabled={!output.text}
              handleOnClick={() => copyToClipboard(output.text)}
            />
          </div>
        </div>
        <TextArea
          rows={14}
          readonly
          additionalClass="w-full text-sm leading-5 font-mono"
          value={output.text}
        />
      </div>
    </>
  );
};

export default ArraySorterComponent;
