"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState, useEffect } from "react";
import Button from "@/components/Input/Button";
import { MdOutlineClear, MdSwapVert, MdContentCopy } from "react-icons/md";
import { copyToClipboard } from "@/common/utils";

type Mode = "encode" | "decode";

export default function Base64EncoderComponent() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [error, setError] = useState("");
  const [urlSafe, setUrlSafe] = useState(false);

  useEffect(() => {
    convert();
  }, [input, mode, urlSafe]);

  const convert = () => {
    setError("");
    setOutput("");

    if (!input.trim()) {
      return;
    }

    try {
      if (mode === "encode") {
        // Encode to Base64
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        let base64 = btoa(String.fromCharCode(...data));

        if (urlSafe) {
          // Convert to URL-safe Base64
          base64 = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        }

        setOutput(base64);
      } else {
        // Decode from Base64
        let base64 = input.trim();

        if (urlSafe) {
          // Convert from URL-safe Base64
          base64 = base64.replace(/-/g, "+").replace(/_/g, "/");
          // Add padding if needed
          while (base64.length % 4) {
            base64 += "=";
          }
        }

        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const decoder = new TextDecoder("utf-8");
        setOutput(decoder.decode(bytes));
      }
    } catch (err) {
      setError(
        mode === "decode"
          ? "Invalid Base64 string"
          : "Failed to encode"
      );
    }
  };

  const handleSwap = () => {
    setInput(output);
    setOutput("");
    setMode(mode === "encode" ? "decode" : "encode");
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  const copyOutput = () => {
    if (output) {
      copyToClipboard(output);
    }
  };

  const handleSampleEncode = () => {
    setMode("encode");
    setInput("Hello, World! 🌍");
  };

  const handleSampleDecode = () => {
    setMode("decode");
    setInput("SGVsbG8sIFdvcmxkISDwn4yN");
  };

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Encode text to Base64 or decode Base64 back to text. Supports UTF-8 encoding and URL-safe Base64.
        </p>

        {/* Mode Selection */}
        <div className="mb-4 flex items-center gap-4">
          <div className="flex rounded border border-stroke dark:border-strokedark overflow-hidden">
            <button
              onClick={() => setMode("encode")}
              className={`px-4 py-2 text-sm font-medium ${mode === "encode"
                  ? "bg-primary text-white"
                  : "bg-transparent text-body dark:text-bodydark2 hover:bg-gray-100 dark:hover:bg-meta-4"
                }`}
            >
              Encode
            </button>
            <button
              onClick={() => setMode("decode")}
              className={`px-4 py-2 text-sm font-medium border-l border-stroke dark:border-strokedark ${mode === "decode"
                  ? "bg-primary text-white"
                  : "bg-transparent text-body dark:text-bodydark2 hover:bg-gray-100 dark:hover:bg-meta-4"
                }`}
            >
              Decode
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm text-body dark:text-bodydark2 cursor-pointer">
            <input
              type="checkbox"
              checked={urlSafe}
              onChange={(e) => setUrlSafe(e.target.checked)}
              className="w-4 h-4 rounded border-stroke"
            />
            URL-safe Base64
          </label>
        </div>

        {/* Input */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="font-medium text-black dark:text-white">
              {mode === "encode" ? "Text to Encode" : "Base64 to Decode"}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleSampleEncode}
                className="text-xs text-primary hover:underline"
              >
                Sample encode
              </button>
              <button
                onClick={handleSampleDecode}
                className="text-xs text-primary hover:underline"
              >
                Sample decode
              </button>
            </div>
          </div>
          <textarea
            placeholder={mode === "encode" ? "Enter text to encode..." : "Enter Base64 string to decode..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={6}
            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-4 py-3 font-mono text-sm text-black outline-none transition placeholder:text-bodydark2 focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
          />
        </div>

        {/* Action Buttons */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            handleOnClick={handleSwap}
            label="Swap"
            type="outline"
            icon={{ icon: MdSwapVert, position: "left", size: 18 }}
          />
          <Button
            handleOnClick={handleClear}
            label="Clear"
            type="reset"
            icon={{ icon: MdOutlineClear, position: "left", size: 18 }}
          />
          {output && (
            <Button
              handleOnClick={copyOutput}
              label="Copy Output"
              type="outline"
              icon={{ icon: MdContentCopy, position: "left", size: 18 }}
            />
          )}
        </div>

        {/* Error */}
        {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}

        {/* Output */}
        <div className="mb-4">
          <label className="mb-2 block font-medium text-black dark:text-white">
            {mode === "encode" ? "Base64 Output" : "Decoded Text"}
          </label>
          <textarea
            value={output}
            readOnly
            rows={6}
            placeholder={mode === "encode" ? "Base64 encoded string will appear here..." : "Decoded text will appear here..."}
            className="w-full rounded border-[1.5px] border-stroke bg-gray-50 px-4 py-3 font-mono text-sm text-black outline-none dark:border-form-strokedark dark:bg-form-input dark:text-white"
          />
        </div>

        {/* Info Stats */}
        {input && (
          <div className="mb-4 flex flex-wrap gap-4 text-sm text-body dark:text-bodydark2">
            <span>Input: {new TextEncoder().encode(input).length} bytes</span>
            {output && <span>Output: {output.length} characters</span>}
            {mode === "encode" && output && (
              <span>Size increase: {((output.length / new TextEncoder().encode(input).length - 1) * 100).toFixed(1)}%</span>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
          <div className="text-sm font-medium mb-2">About Base64</div>
          <ul className="text-xs text-body dark:text-bodydark2 space-y-1">
            <li>• <strong>Base64</strong> encodes binary data into ASCII text using 64 characters (A-Z, a-z, 0-9, +, /).</li>
            <li>• <strong>URL-safe Base64</strong> replaces + with - and / with _ to avoid URL encoding issues.</li>
            <li>• Base64 increases data size by approximately 33%.</li>
            <li>• Common uses: embedding images in HTML/CSS, encoding authentication credentials, data URIs.</li>
          </ul>
        </div>
      </div>
    </>
  );
}
