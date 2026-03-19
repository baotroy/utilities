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

  // Convert unquoted keys to quoted keys in object literals
  const normalizeJSON = (str: string): string => {
    // Replace unquoted keys with quoted keys
    // Matches: word: or ,word: and replaces with "word": or ,"word":
    return str.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
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
