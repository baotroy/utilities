"use client";
import { copyToClipboard } from "@/common/utils";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState } from "react";
import Button from "@/components/Input/Button";
import Copy from "@/components/common/copy";
import { MdOutlineClear } from "react-icons/md";
import { LiaHashtagSolid } from "react-icons/lia";
import crypto from "crypto";

type HashAlgorithm = "md5" | "sha1" | "sha256" | "sha512";

interface HashResult {
  algorithm: string;
  hash: string;
}

export default function HashGeneratorComponent() {
  const [input, setInput] = useState("");
  const [inputType, setInputType] = useState<"text" | "file">("text");
  const [results, setResults] = useState<HashResult[]>([]);
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<HashAlgorithm[]>(["md5", "sha1", "sha256", "sha512"]);
  const [isHmac, setIsHmac] = useState(false);
  const [hmacKey, setHmacKey] = useState("");
  const [outputFormat, setOutputFormat] = useState<"hex" | "base64">("hex");

  const algorithms: { id: HashAlgorithm; label: string; bits: number }[] = [
    { id: "md5", label: "MD5", bits: 128 },
    { id: "sha1", label: "SHA-1", bits: 160 },
    { id: "sha256", label: "SHA-256", bits: 256 },
    { id: "sha512", label: "SHA-512", bits: 512 },
  ];

  const toggleAlgorithm = (algo: HashAlgorithm) => {
    if (selectedAlgorithms.includes(algo)) {
      if (selectedAlgorithms.length > 1) {
        setSelectedAlgorithms(selectedAlgorithms.filter((a) => a !== algo));
      }
    } else {
      setSelectedAlgorithms([...selectedAlgorithms, algo]);
    }
  };

  const generateHashes = () => {
    if (!input) {
      setResults([]);
      return;
    }

    const newResults: HashResult[] = [];

    for (const algo of selectedAlgorithms) {
      let hash: crypto.Hash | crypto.Hmac;

      if (isHmac && hmacKey) {
        hash = crypto.createHmac(algo, hmacKey);
      } else {
        hash = crypto.createHash(algo);
      }

      hash.update(input);

      const digest = outputFormat === "hex" ? hash.digest("hex") : hash.digest("base64");

      newResults.push({
        algorithm: isHmac ? `HMAC-${algo.toUpperCase()}` : algo.toUpperCase(),
        hash: digest,
      });
    }

    setResults(newResults);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInput(content);
    };
    reader.readAsText(file);
  };

  const reset = () => {
    setInput("");
    setResults([]);
    setHmacKey("");
  };

  const handleCopy = (hash: string) => {
    copyToClipboard(hash);
  };

  const handleCopyAll = () => {
    const allHashes = results.map((r) => `${r.algorithm}: ${r.hash}`).join("\n");
    copyToClipboard(allHashes);
  };

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Generate cryptographic hash values using MD5, SHA-1, SHA-256, and SHA-512 algorithms. Supports HMAC for keyed hashing.
        </p>

        <div className="space-y-4">
          {/* Input Type */}
          <div>
            <div className="mb-2">Input Type</div>
            <div className="flex gap-2">
              <button
                onClick={() => setInputType("text")}
                className={`px-4 py-2 rounded border transition-colors ${
                  inputType === "text"
                    ? "bg-primary text-white border-primary"
                    : "bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-primary"
                }`}
              >
                Text
              </button>
              <button
                onClick={() => setInputType("file")}
                className={`px-4 py-2 rounded border transition-colors ${
                  inputType === "file"
                    ? "bg-primary text-white border-primary"
                    : "bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-primary"
                }`}
              >
                File
              </button>
            </div>
          </div>

          {/* Input */}
          <div>
            <div className="mb-2">Input {inputType === "text" ? "Text" : "File"}</div>
            {inputType === "text" ? (
              <textarea
                rows={6}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter text to hash..."
                className="custom-input w-full"
              />
            ) : (
              <input
                type="file"
                onChange={handleFileUpload}
                className="custom-input w-full"
              />
            )}
          </div>

          {/* Algorithms */}
          <div>
            <div className="mb-2">Hash Algorithms</div>
            <div className="flex flex-wrap gap-2">
              {algorithms.map((algo) => (
                <button
                  key={algo.id}
                  onClick={() => toggleAlgorithm(algo.id)}
                  className={`px-3 py-1.5 rounded border text-sm transition-colors ${
                    selectedAlgorithms.includes(algo.id)
                      ? "bg-primary text-white border-primary"
                      : "bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-primary"
                  }`}
                >
                  {algo.label} ({algo.bits}-bit)
                </button>
              ))}
            </div>
          </div>

          {/* HMAC Option */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={isHmac}
                onChange={(e) => setIsHmac(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Use HMAC (keyed-hash)</span>
            </label>
            {isHmac && (
              <input
                type="text"
                value={hmacKey}
                onChange={(e) => setHmacKey(e.target.value)}
                placeholder="Enter secret key for HMAC"
                className="custom-input w-full"
              />
            )}
          </div>

          {/* Output Format */}
          <div>
            <div className="mb-2">Output Format</div>
            <div className="flex gap-2">
              <button
                onClick={() => setOutputFormat("hex")}
                className={`px-3 py-1.5 rounded border text-sm transition-colors ${
                  outputFormat === "hex"
                    ? "bg-primary text-white border-primary"
                    : "bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-primary"
                }`}
              >
                Hexadecimal
              </button>
              <button
                onClick={() => setOutputFormat("base64")}
                className={`px-3 py-1.5 rounded border text-sm transition-colors ${
                  outputFormat === "base64"
                    ? "bg-primary text-white border-primary"
                    : "bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-primary"
                }`}
              >
                Base64
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex">
            <Button
              handleOnClick={generateHashes}
              label="Generate Hash"
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

          {/* Results */}
          {results.length > 0 && (
            <div>
              <div className="my-3 flex items-center justify-between">
                <span>Hash Results</span>
                <button
                  onClick={handleCopyAll}
                  className="text-sm text-primary hover:underline"
                >
                  Copy all
                </button>
              </div>
              <div className="space-y-2">
                {results.map((result, i) => (
                  <div
                    key={i}
                    className="p-3 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{result.algorithm}</span>
                      <button
                        onClick={() => handleCopy(result.hash)}
                        className="text-xs text-primary hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    <code className="text-sm font-mono break-all">{result.hash}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
            <div className="text-sm font-medium mb-2">About Hash Functions</div>
            <ul className="text-xs text-body dark:text-bodydark2 space-y-1">
              <li><strong>MD5:</strong> 128-bit, fast but cryptographically broken. Use for checksums only.</li>
              <li><strong>SHA-1:</strong> 160-bit, deprecated for security. Avoid for new applications.</li>
              <li><strong>SHA-256:</strong> 256-bit, secure and widely used. Recommended for most uses.</li>
              <li><strong>SHA-512:</strong> 512-bit, highest security. Better performance on 64-bit systems.</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
