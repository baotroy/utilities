"use client";
import { copyToClipboard } from "@/common/utils";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState, useEffect } from "react";
import Button from "@/components/Input/Button";
import Copy from "@/components/common/copy";
import { MdOutlineClear } from "react-icons/md";
import { LiaHashtagSolid } from "react-icons/lia";
import { keccak256, toUtf8Bytes, hexlify, getBytes } from "ethers";

type InputEncoding = "utf8" | "utf16" | "hex" | "base64" | "ascii";

interface EncodingOption {
  id: InputEncoding;
  label: string;
  description: string;
}

const encodingOptions: EncodingOption[] = [
  { id: "utf8", label: "UTF-8", description: "Standard text encoding" },
  { id: "utf16", label: "UTF-16", description: "Unicode text encoding" },
  { id: "hex", label: "Hex", description: "Hexadecimal string (0x prefix optional)" },
  { id: "base64", label: "Base64", description: "Base64 encoded string" },
  { id: "ascii", label: "ASCII", description: "ASCII text encoding" },
];

function encodeInput(input: string, encoding: InputEncoding): Uint8Array | null {
  switch (encoding) {
    case "utf8":
      return toUtf8Bytes(input);

    case "utf16": {
      // UTF-16 LE encoding
      const buffer = new ArrayBuffer(input.length * 2);
      const view = new Uint16Array(buffer);
      for (let i = 0; i < input.length; i++) {
        view[i] = input.charCodeAt(i);
      }
      return new Uint8Array(buffer);
    }

    case "hex": {
      // Remove 0x prefix if present and validate
      let hex = input.trim();
      if (hex.startsWith("0x") || hex.startsWith("0X")) {
        hex = hex.slice(2);
      }
      // Return null for empty or invalid hex (will be handled gracefully)
      if (!hex || !/^[0-9a-fA-F]*$/.test(hex)) {
        return null;
      }
      // Pad with leading zero if odd length
      if (hex.length % 2 !== 0) {
        hex = "0" + hex;
      }
      return getBytes("0x" + hex);
    }

    case "base64": {
      // Decode base64
      try {
        const binaryString = atob(input.trim());
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      } catch {
        return null;
      }
    }

    case "ascii": {
      const bytes = new Uint8Array(input.length);
      for (let i = 0; i < input.length; i++) {
        const code = input.charCodeAt(i);
        if (code > 127) {
          return null;
        }
        bytes[i] = code;
      }
      return bytes;
    }

    default:
      return toUtf8Bytes(input);
  }
}

export default function Keccak256Component() {
  const [input, setInput] = useState("");
  const [encoding, setEncoding] = useState<InputEncoding>("utf8");
  const [hash, setHash] = useState("");
  const [hashNoPrefix, setHashNoPrefix] = useState("");
  const [error, setError] = useState("");
  const [autoHash, setAutoHash] = useState(true);

  const getValidationError = (encoding: InputEncoding, input: string): string | null => {
    if (!input) {
      return "Please enter input string";
    }

    switch (encoding) {
      case "hex": {
        let hex = input.trim();
        if (hex.startsWith("0x") || hex.startsWith("0X")) {
          hex = hex.slice(2);
        }
        if (!hex) {
          return "Please enter a hexadecimal string";
        }
        if (!/^[0-9a-fA-F]*$/.test(hex)) {
          return "Invalid hexadecimal string. Only 0-9 and A-F characters allowed.";
        }
        break;
      }
      case "base64": {
        try {
          atob(input.trim());
        } catch {
          return "Invalid Base64 string";
        }
        break;
      }
      case "ascii": {
        for (let i = 0; i < input.length; i++) {
          if (input.charCodeAt(i) > 127) {
            return `Invalid ASCII character at position ${i}. ASCII only supports characters 0-127.`;
          }
        }
        break;
      }
    }
    return null;
  };

  const calculateHash = (showErrors: boolean = false) => {
    setError("");
    setHash("");
    setHashNoPrefix("");

    if (!input) {
      if (showErrors) {
        setError("Please enter input string");
      }
      return;
    }

    // Validate and show error if manual calculation
    if (showErrors) {
      const validationError = getValidationError(encoding, input);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    try {
      const bytes = encodeInput(input, encoding);
      if (bytes === null) {
        // Invalid input for current encoding
        if (showErrors) {
          setError(`Invalid input for ${encoding.toUpperCase()} encoding`);
        }
        return;
      }
      const result = keccak256(bytes);
      setHash(result);
      setHashNoPrefix(result.slice(2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to calculate hash");
    }
  };

  useEffect(() => {
    if (autoHash && input) {
      const timer = setTimeout(() => {
        calculateHash(false); // Don't show errors for auto-hash
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [input]);

  // Clear results when encoding changes (don't auto-calculate to avoid errors)
  useEffect(() => {
    setHash("");
    setHashNoPrefix("");
    setError("");
  }, [encoding]);

  const reset = () => {
    setInput("");
    setHash("");
    setHashNoPrefix("");
    setError("");
  };

  const handleCopy = () => {
    copyToClipboard(hash);
  };

  const handleCopyNoPrefix = () => {
    copyToClipboard(hashNoPrefix);
  };

  // Example inputs for each encoding
  const examples: Record<InputEncoding, string> = {
    utf8: "Hello, World!",
    utf16: "Hello",
    hex: "0x48656c6c6f",
    base64: "SGVsbG8gV29ybGQh",
    ascii: "Hello World",
  };

  const loadExample = () => {
    setInput(examples[encoding]);
  };

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Calculate Keccak-256 hash from strings with support for multiple input encodings. Keccak-256 is the hash function used in Ethereum.
        </p>

        <div className="space-y-4">
          {/* Input Encoding */}
          <div>
            <div className="mb-2">Input Encoding</div>
            <div className="flex flex-wrap gap-2">
              {encodingOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setEncoding(opt.id)}
                  className={`px-3 py-1.5 rounded border text-sm transition-colors ${encoding === opt.id
                    ? "bg-primary text-white border-primary"
                    : "bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-primary"
                    }`}
                  title={opt.description}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="mt-1 text-xs text-body dark:text-bodydark2">
              {encodingOptions.find((o) => o.id === encoding)?.description}
            </div>
          </div>

          {/* Input */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span>Input String</span>
              <button
                onClick={loadExample}
                className="text-xs text-primary hover:underline"
              >
                Load example
              </button>
            </div>
            <textarea
              rows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Enter ${encoding.toUpperCase()} encoded string...`}
              className="custom-input w-full font-mono text-sm"
            />
            {encoding === "hex" && (
              <div className="mt-1 text-xs text-body dark:text-bodydark2">
                Hex string with or without 0x prefix (e.g., 0x48656c6c6f or 48656c6c6f)
              </div>
            )}
          </div>

          {/* Options */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoHash}
                onChange={(e) => setAutoHash(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Auto-calculate</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex">
            <Button
              handleOnClick={() => calculateHash(true)}
              label="Calculate Hash"
              additionalClass="mr-2"
              icon={{
                icon: LiaHashtagSolid,
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

          {/* Results */}
          {hash && (
            <div className="space-y-4">
              {/* With 0x prefix */}
              <div>
                <div className="my-3">Keccak-256 Hash (with 0x prefix)</div>
                <div className="flex">
                  <input
                    type="text"
                    readOnly
                    value={hash}
                    className="custom-input w-full no-border-right font-mono text-sm"
                  />
                  <Copy handleCopy={handleCopy} />
                </div>
              </div>

              {/* Without 0x prefix */}
              <div>
                <div className="my-3">Keccak-256 Hash (without prefix)</div>
                <div className="flex">
                  <input
                    type="text"
                    readOnly
                    value={hashNoPrefix}
                    className="custom-input w-full no-border-right font-mono text-sm"
                  />
                  <Copy handleCopy={handleCopyNoPrefix} />
                </div>
              </div>

              {/* Hash info */}
              <div className="p-3 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Hash length: <span className="font-mono">64 hex characters</span></div>
                  <div>Bits: <span className="font-mono">256 bits</span></div>
                  <div>Bytes: <span className="font-mono">32 bytes</span></div>
                  <div>Input bytes: <span className="font-mono">{input ? (encodeInput(input, encoding)?.length ?? 0) : 0}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
            <div className="text-sm font-medium mb-2">About Keccak-256</div>
            <ul className="text-xs text-body dark:text-bodydark2 space-y-1">
              <li>• <strong>Keccak-256</strong> is the hash function used by Ethereum for addresses, signatures, and transaction hashes.</li>
              <li>• It produces a 256-bit (32-byte) hash output.</li>
              <li>• Note: Keccak-256 differs slightly from the standardized SHA-3-256 (FIPS 202).</li>
              <li>• The 0x prefix indicates hexadecimal format, commonly used in Ethereum.</li>
            </ul>
          </div>

          {/* Common Use Cases */}
          <div className="p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
            <div className="text-sm font-medium mb-2">Common Use Cases</div>
            <ul className="text-xs text-body dark:text-bodydark2 space-y-1">
              <li>• <strong>Function Selectors:</strong> First 4 bytes of keccak256("functionName(argTypes)")</li>
              <li>• <strong>Event Topics:</strong> keccak256("EventName(argTypes)")</li>
              <li>• <strong>Address Generation:</strong> Last 20 bytes of keccak256(publicKey)</li>
              <li>• <strong>Message Signing:</strong> Hash messages before signing</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
