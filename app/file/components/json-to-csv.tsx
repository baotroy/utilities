"use client";
import { copyToClipboard } from "@/common/utils";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState } from "react";
import Button from "@/components/Input/Button";
import Copy from "@/components/common/copy";
import { MdOutlineClear } from "react-icons/md";
import { LiaExchangeAltSolid } from "react-icons/lia";

export default function JsonToCsvComponent() {
  const [json, setJson] = useState("");
  const [csv, setCsv] = useState("");
  const [error, setError] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const [includeHeaders, setIncludeHeaders] = useState(true);

  const convertJsonToCsv = () => {
    setError("");
    setCsv("");

    if (!json.trim()) {
      setError("Please enter JSON data");
      return;
    }

    try {
      const data = JSON.parse(json);

      if (!Array.isArray(data)) {
        setError("JSON must be an array of objects");
        return;
      }

      if (data.length === 0) {
        setError("Array is empty");
        return;
      }

      // Get all unique keys from all objects
      const allKeys = new Set<string>();
      data.forEach((item) => {
        if (typeof item === "object" && item !== null) {
          Object.keys(item).forEach((key) => allKeys.add(key));
        }
      });
      const headers = Array.from(allKeys);

      if (headers.length === 0) {
        setError("No valid object properties found");
        return;
      }

      // Escape value for CSV
      const escapeValue = (val: unknown): string => {
        if (val === null || val === undefined) return "";
        const str = typeof val === "object" ? JSON.stringify(val) : String(val);
        if (str.includes(delimiter) || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const lines: string[] = [];

      // Add headers
      if (includeHeaders) {
        lines.push(headers.map(escapeValue).join(delimiter));
      }

      // Add data rows
      data.forEach((item) => {
        const row = headers.map((header) => escapeValue(item[header]));
        lines.push(row.join(delimiter));
      });

      setCsv(lines.join("\n"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  const reset = () => {
    setJson("");
    setCsv("");
    setError("");
  };

  const handleCopy = () => {
    copyToClipboard(csv);
  };

  const downloadCsv = () => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "data.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const loadSample = () => {
    setJson(`[
  { "name": "John Doe", "age": 30, "city": "New York" },
  { "name": "Jane Smith", "age": 25, "city": "Los Angeles" },
  { "name": "Bob Johnson", "age": 35, "city": "Chicago" }
]`);
  };

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Convert JSON array data to CSV (Comma-Separated Values) format.
        </p>

        <div className="space-y-4">
          {/* Options */}
          <div className="flex flex-wrap gap-4">
            <div>
              <div className="mb-2">Delimiter</div>
              <select
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                className="custom-input"
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="\t">Tab</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHeaders}
                  onChange={(e) => setIncludeHeaders(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Include headers</span>
              </label>
            </div>
            <div className="flex items-end">
              <button
                onClick={loadSample}
                className="text-sm text-primary hover:underline"
              >
                Load sample
              </button>
            </div>
          </div>

          {/* JSON Input */}
          <div>
            <div className="mb-2">JSON Input (Array of Objects)</div>
            <textarea
              rows={10}
              value={json}
              onChange={(e) => setJson(e.target.value)}
              placeholder='[{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]'
              className="custom-input w-full font-mono text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex">
            <Button
              handleOnClick={convertJsonToCsv}
              label="Convert to CSV"
              additionalClass="mr-2"
              icon={{
                icon: LiaExchangeAltSolid,
                position: "left",
                size: 20,
              }}
            />
            <Button
              handleOnClick={reset}
              label="Reset"
              type="reset"
              additionalClass="mr-2"
              icon={{
                icon: MdOutlineClear,
                position: "left",
                size: 20,
              }}
            />
          </div>

          {/* Error */}
          {error && <div className="text-red-500 text-sm">{error}</div>}

          {/* CSV Output */}
          {csv && (
            <div>
              <div className="my-3 flex items-center justify-between">
                <span>CSV Output</span>
                <button
                  onClick={downloadCsv}
                  className="text-sm text-primary hover:underline"
                >
                  Download CSV
                </button>
              </div>
              <div className="flex">
                <textarea
                  rows={10}
                  readOnly
                  value={csv}
                  className="custom-input w-full no-border-right font-mono text-sm"
                />
                <Copy handleCopy={handleCopy} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
