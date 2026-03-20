"use client";
import { copyToClipboard } from "@/common/utils";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState } from "react";
import Button from "@/components/Input/Button";
import TextBox from "@/components/Input/TextBox";
import Copy from "@/components/common/copy";
import { MdOutlineClear, MdRefresh } from "react-icons/md";
import { LiaHashtagSolid } from "react-icons/lia";
import crypto from "crypto";

type UUIDVersion = "v1" | "v4" | "v5";

// Predefined namespaces for UUID v5
const NAMESPACES = {
  DNS: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  URL: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
  OID: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
  X500: "6ba7b814-9dad-11d1-80b4-00c04fd430c8",
} as const;

type NamespaceKey = keyof typeof NAMESPACES;

// Helper to format bytes as UUID string
function bytesToUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

// Parse UUID string to bytes
function uuidToBytes(uuid: string): Uint8Array {
  const hex = uuid.replace(/-/g, "");
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Generate UUID v1 (time-based)
function generateUUIDv1(): string {
  // Get current timestamp in 100-nanosecond intervals since Oct 15, 1582
  const now = Date.now();
  const gregorianOffset = BigInt("122192928000000000"); // 100-ns intervals from Oct 15, 1582 to Jan 1, 1970
  const timestamp = BigInt(now) * BigInt(10000) + gregorianOffset;

  // Extract time components
  const timeLow = Number(timestamp & BigInt(0xffffffff));
  const timeMid = Number((timestamp >> BigInt(32)) & BigInt(0xffff));
  const timeHi = Number((timestamp >> BigInt(48)) & BigInt(0x0fff));

  // Generate random clock sequence and node
  const clockSeq = crypto.randomBytes(2);
  clockSeq[0] = (clockSeq[0] & 0x3f) | 0x80; // Set variant bits

  const node = crypto.randomBytes(6);

  const bytes = new Uint8Array(16);

  // Time low (4 bytes)
  bytes[0] = (timeLow >> 24) & 0xff;
  bytes[1] = (timeLow >> 16) & 0xff;
  bytes[2] = (timeLow >> 8) & 0xff;
  bytes[3] = timeLow & 0xff;

  // Time mid (2 bytes)
  bytes[4] = (timeMid >> 8) & 0xff;
  bytes[5] = timeMid & 0xff;

  // Time high and version (2 bytes) - version 1
  bytes[6] = ((timeHi >> 8) & 0x0f) | 0x10;
  bytes[7] = timeHi & 0xff;

  // Clock sequence
  bytes[8] = clockSeq[0];
  bytes[9] = clockSeq[1];

  // Node (6 bytes)
  bytes.set(node, 10);

  return bytesToUuid(bytes);
}

// Generate UUID v4 (random)
function generateUUIDv4(): string {
  const bytes = crypto.randomBytes(16);

  // Set version 4
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  // Set variant
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  return bytesToUuid(bytes);
}

// Generate UUID v5 (SHA-1 name-based)
function generateUUIDv5(namespace: string, name: string): string {
  const namespaceBytes = uuidToBytes(namespace);
  const nameBytes = Buffer.from(name, "utf8");

  const hash = crypto.createHash("sha1");
  hash.update(namespaceBytes);
  hash.update(nameBytes);
  const digest = hash.digest();

  const bytes = new Uint8Array(16);
  bytes.set(digest.subarray(0, 16));

  // Set version 5
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  // Set variant
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  return bytesToUuid(bytes);
}

export default function UuidGeneratorComponent() {
  const [version, setVersion] = useState<UUIDVersion>("v4");
  const [count, setCount] = useState(1);
  const [uuids, setUuids] = useState<string[]>([]);
  const [uppercase, setUppercase] = useState(false);
  const [noDashes, setNoDashes] = useState(false);

  // v5 specific
  const [namespace, setNamespace] = useState<NamespaceKey>("DNS");
  const [customNamespace, setCustomNamespace] = useState("");
  const [name, setName] = useState("");
  const [useCustomNamespace, setUseCustomNamespace] = useState(false);

  const generate = () => {
    const results: string[] = [];
    const genCount = Math.min(Math.max(1, count), 1000);

    for (let i = 0; i < genCount; i++) {
      let uuid: string;

      switch (version) {
        case "v1":
          uuid = generateUUIDv1();
          break;
        case "v4":
          uuid = generateUUIDv4();
          break;
        case "v5":
          const ns = useCustomNamespace ? customNamespace : NAMESPACES[namespace];
          uuid = generateUUIDv5(ns, name || `name-${i}`);
          break;
        default:
          uuid = generateUUIDv4();
      }

      if (uppercase) uuid = uuid.toUpperCase();
      if (noDashes) uuid = uuid.replace(/-/g, "");

      results.push(uuid);
    }

    setUuids(results);
  };

  const reset = () => {
    setUuids([]);
    setName("");
    setCustomNamespace("");
  };

  const handleCopy = () => {
    copyToClipboard(uuids.join("\n"));
  };

  const handleCopySingle = (uuid: string) => {
    copyToClipboard(uuid);
  };

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Generate universally unique identifiers (UUIDs). Supports v1 (time-based), v4 (random), and v5 (SHA-1 name-based).
        </p>

        <div className="space-y-4">
          {/* Version Selection */}
          <div>
            <div className="mb-2">UUID Version</div>
            <div className="flex flex-wrap gap-2">
              {(["v1", "v4", "v5"] as UUIDVersion[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVersion(v)}
                  className={`px-4 py-2 rounded border transition-colors min-w-20 ${version === v
                    ? "bg-primary text-white border-primary"
                    : "bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-primary"
                    }`}
                >
                  {v.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="mt-1 text-xs text-body dark:text-bodydark2">
              {version === "v1" && "Time-based UUID using current timestamp and random node ID"}
              {version === "v4" && "Random UUID using cryptographically secure random numbers"}
              {version === "v5" && "Name-based UUID using SHA-1 hash of namespace and name"}
            </div>
          </div>

          {/* v5 specific options */}
          {version === "v5" && (
            <>
              <div>
                <div className="mb-2">Namespace</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(Object.keys(NAMESPACES) as NamespaceKey[]).map((ns) => (
                    <button
                      key={ns}
                      onClick={() => {
                        setNamespace(ns);
                        setUseCustomNamespace(false);
                      }}
                      className={`px-3 py-1.5 rounded border text-sm transition-colors ${!useCustomNamespace && namespace === ns
                        ? "bg-primary text-white border-primary"
                        : "bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-primary"
                        }`}
                    >
                      {ns}
                    </button>
                  ))}
                  <button
                    onClick={() => setUseCustomNamespace(true)}
                    className={`px-3 py-1.5 rounded border text-sm transition-colors ${useCustomNamespace
                      ? "bg-primary text-white border-primary"
                      : "bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-primary"
                      }`}
                  >
                    Custom
                  </button>
                </div>
                {useCustomNamespace && (
                  <TextBox
                    value={customNamespace}
                    onChange={(e) => setCustomNamespace(e.target.value)}
                    placeholder="Enter custom namespace UUID (e.g., 6ba7b810-9dad-11d1-80b4-00c04fd430c8)"
                    additionalClass="w-full"
                  />
                )}
              </div>

              <div>
                <div className="mb-2">Name</div>
                <TextBox
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name to hash (e.g., example.com)"
                  additionalClass="w-full"
                />
              </div>
            </>
          )}

          {/* Options */}
          <div className="flex flex-wrap gap-4">
            <div>
              <div className="mb-2">Count</div>
              <TextBox
                type="number"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                placeholder="1"
                additionalClass="w-24"
              />
              <span className="ml-2 text-xs text-body dark:text-bodydark2">(max: 1000)</span>
            </div>

            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={uppercase}
                  onChange={(e) => setUppercase(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Uppercase</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noDashes}
                  onChange={(e) => setNoDashes(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>No dashes</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex mt-4">
            <Button
              handleOnClick={generate}
              label="Generate"
              additionalClass="mr-2"
              icon={{
                icon: MdRefresh,
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
          {uuids.length > 0 && (
            <div>
              <div className="my-3 flex items-center justify-between">
                <span>
                  Generated UUIDs ({uuids.length})
                </span>
                <button
                  onClick={handleCopy}
                  className="text-sm text-primary hover:underline"
                >
                  Copy all
                </button>
              </div>

              {uuids.length <= 10 ? (
                <div className="space-y-2">
                  {uuids.map((uuid, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark"
                    >
                      <code className="flex-1 font-mono text-sm break-all">{uuid}</code>
                      <button
                        onClick={() => handleCopySingle(uuid)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="Copy"
                      >
                        <LiaHashtagSolid size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex">
                  <textarea
                    rows={10}
                    readOnly
                    value={uuids.join("\n")}
                    className="custom-input w-full no-border-right font-mono text-sm"
                  />
                  <Copy handleCopy={handleCopy} />
                </div>
              )}
            </div>
          )}

          {/* Info Section */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
            <div className="text-sm font-medium mb-2">UUID Versions:</div>
            <ul className="text-xs text-body dark:text-bodydark2 space-y-1">
              <li><strong>v1:</strong> Time-based. Uses current timestamp and a random node identifier. Unique but reveals creation time.</li>
              <li><strong>v4:</strong> Random. Uses cryptographically secure random numbers. Most commonly used.</li>
              <li><strong>v5:</strong> Name-based (SHA-1). Deterministic - same namespace + name always produces the same UUID.</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
