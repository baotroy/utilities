"use client";
import { useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { copyToClipboard } from "@/common/utils";
import { MdContentCopy, MdRefresh } from "react-icons/md";
import toast from "react-hot-toast";

export default function ObjectSerializerComponent() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  // Convert a JS object literal to valid JSON text: single-quoted strings
  // become double-quoted, unquoted keys get quoted and trailing commas are
  // dropped. It walks the text token by token so the content of string values
  // is never touched (the old regex version rewrote text inside strings and
  // turned every apostrophe in the output into a double quote).
  const normalizeJSON = (str: string): string => {
    let out = "";
    let i = 0;
    while (i < str.length) {
      const ch = str[i];
      if (ch === '"' || ch === "'") {
        // string literal
        let j = i + 1;
        let content = "";
        while (j < str.length && str[j] !== ch) {
          if (str[j] === "\\" && j + 1 < str.length) {
            // keep escapes, except \' which JSON does not know
            content += str[j + 1] === "'" ? "'" : str[j] + str[j + 1];
            j += 2;
          } else {
            content += ch === "'" && str[j] === '"' ? '\\"' : str[j];
            j++;
          }
        }
        out += `"${content}"`;
        i = j + 1;
      } else if (/[A-Za-z_$]/.test(ch)) {
        // identifier: quote it when it is used as a key
        let j = i;
        while (j < str.length && /[\w$]/.test(str[j])) j++;
        const word = str.slice(i, j);
        let k = j;
        while (k < str.length && /\s/.test(str[k])) k++;
        out += str[k] === ":" ? `"${word}"` : word;
        i = j;
      } else if (ch === ",") {
        // drop trailing commas
        let k = i + 1;
        while (k < str.length && /\s/.test(str[k])) k++;
        if (str[k] !== "}" && str[k] !== "]") out += ch;
        i++;
      } else {
        out += ch;
        i++;
      }
    }
    return out;
  };

  const handleStringify = () => {
    try {
      setError("");
      // Normalize the input to convert unquoted keys to quoted
      const normalized = normalizeJSON(input);
      // Try to parse as JSON
      const parsed = JSON.parse(normalized);
      // Then stringify with pretty formatting
      const stringified = JSON.stringify(parsed, null, 2);
      setOutput(stringified);
      toast.success("Object stringified successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Invalid input";
      setError(`Error: ${errorMessage}`);
      toast.error("Invalid JSON or object format");
    }
  };

  const handleCopy = () => {
    if (output) {
      copyToClipboard(output);
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  const handleMinify = () => {
    try {
      setError("");
      // Normalize the input to convert unquoted keys to quoted
      const normalized = normalizeJSON(input);
      const parsed = JSON.parse(normalized);
      const minified = JSON.stringify(parsed);
      setOutput(minified);
      toast.success("Object minified successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Invalid input";
      setError(`Error: ${errorMessage}`);
      toast.error("Invalid JSON or object format");
    }
  };

  return (
    <>
      <Breadcrumb />
      <div className="max-w-6xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Convert a JavaScript object or JSON to a stringified format. Supports both pretty-printed and minified output.
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Input Section */}
          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Input (JSON or Object)
            </label>
            <textarea
              rows={15}
              placeholder='Enter JSON or object, e.g., {name: "John", age: 30} or {"name": "John"}'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-white px-5 py-3 text-black outline-none transition placeholder:text-bodydark2 focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
            <div className="mt-3 flex gap-3">
              <button
                onClick={handleStringify}
                className="flex-1 rounded-md bg-primary px-4 py-2.5 text-center font-medium text-white hover:bg-opacity-90"
              >
                Stringify (Pretty)
              </button>
              <button
                onClick={handleMinify}
                className="flex-1 rounded-md border border-primary px-4 py-2.5 text-center font-medium text-primary hover:bg-opacity-90"
              >
                Minify
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div>
            <label className="mb-3 block text-sm font-medium text-black dark:text-white">
              Output
            </label>
            <textarea
              rows={15}
              readOnly
              placeholder="Stringified output will appear here"
              value={output}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-gray-2 px-5 py-3 text-black outline-none placeholder:text-bodydark2 dark:border-form-strokedark dark:bg-form-input dark:text-white"
            />
            <div className="mt-3 flex gap-3">
              <button
                onClick={handleCopy}
                disabled={!output}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-center font-medium text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MdContentCopy className="h-5 w-5" />
                Copy
              </button>
              <button
                onClick={handleClear}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-primary px-4 py-2.5 text-center font-medium text-primary hover:bg-opacity-90"
              >
                <MdRefresh className="h-5 w-5" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Info Box */}
        {!output && !error && (
          <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-bodydark dark:bg-meta-4 dark:text-bodydark2">
            <p className="font-medium">How to use:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Paste your JSON or object in the input field (unquoted keys are supported)</li>
              <li>Click "Stringify (Pretty)" for formatted output with indentation</li>
              <li>Click "Minify" for compact, single-line output</li>
              <li>Copy the result to your clipboard</li>
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
