"use client";
import { copyToClipboard } from "@/common/utils";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState } from "react";
import Button from "@/components/Input/Button";
import Copy from "@/components/common/copy";
import { MdOutlineClear, MdSwapHoriz } from "react-icons/md";
import { LiaExchangeAltSolid } from "react-icons/lia";

export default function CsvToJsonComponent() {
  const [csv, setCsv] = useState("");
  const [json, setJson] = useState("");
  const [error, setError] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const [hasHeaders, setHasHeaders] = useState(true);

  const convertCsvToJson = () => {
    setError("");
    setJson("");

    if (!csv.trim()) {
      setError("Please enter CSV data");
      return;
    }

    try {
      // Parse delimiter (handle tab)
      const delim = delimiter === "\\t" ? "\t" : delimiter;

      // Parse the whole text in one pass so quoted values may contain the
      // delimiter, escaped quotes ("") and line breaks
      const text = csv.trim();
      const rows: string[][] = [];
      let row: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
          if (inQuotes && text[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (inQuotes) {
          current += char;
        } else if (char === delim) {
          row.push(current.trim());
          current = "";
        } else if (char === "\n" || char === "\r") {
          if (char === "\r" && text[i + 1] === "\n") i++;
          row.push(current.trim());
          rows.push(row);
          row = [];
          current = "";
        } else {
          current += char;
        }
      }
      row.push(current.trim());
      rows.push(row);

      let result: Record<string, string>[] | string[][];

      if (hasHeaders && rows.length > 1) {
        const headers = rows[0];
        result = rows.slice(1).map((row) => {
          const obj: Record<string, string> = {};
          headers.forEach((header, i) => {
            obj[header] = row[i] || "";
          });
          return obj;
        });
      } else {
        result = rows;
      }

      setJson(JSON.stringify(result, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion error");
    }
  };

  const reset = () => {
    setCsv("");
    setJson("");
    setError("");
  };

  const handleCopy = () => {
    copyToClipboard(json);
  };

  const loadSample = () => {
    setCsv(`name,age,city
John Doe,30,New York
Jane Smith,25,Los Angeles
Bob Johnson,35,Chicago`);
  };

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Convert CSV (Comma-Separated Values) data to JSON format.
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
                  checked={hasHeaders}
                  onChange={(e) => setHasHeaders(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>First row is headers</span>
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

          {/* CSV Input */}
          <div>
            <div className="mb-2">CSV Input</div>
            <textarea
              rows={8}
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder="Paste your CSV data here..."
              className="custom-input w-full font-mono text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex">
            <Button
              handleOnClick={convertCsvToJson}
              label="Convert to JSON"
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

          {/* JSON Output */}
          {json && (
            <div>
              <div className="my-3">JSON Output</div>
              <div className="flex">
                <textarea
                  rows={12}
                  readOnly
                  value={json}
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
