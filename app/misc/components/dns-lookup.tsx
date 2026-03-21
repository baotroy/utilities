"use client";
import { copyToClipboard } from "@/common/utils";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState } from "react";
import Button from "@/components/Input/Button";
import TextBox from "@/components/Input/TextBox";
import { MdOutlineClear, MdSearch } from "react-icons/md";
import clsx from "clsx";

interface DnsRecord {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DnsResponse {
  Status: number;
  Question: { name: string; type: number }[];
  Answer?: DnsRecord[];
  Authority?: DnsRecord[];
  Comment?: string;
}

const RECORD_TYPES = [
  { type: "A", code: 1, description: "IPv4 address" },
  { type: "AAAA", code: 28, description: "IPv6 address" },
  { type: "CNAME", code: 5, description: "Canonical name (alias)" },
  { type: "MX", code: 15, description: "Mail exchange server" },
  { type: "TXT", code: 16, description: "Text records (SPF, DKIM, etc.)" },
  { type: "NS", code: 2, description: "Name server" },
  { type: "SOA", code: 6, description: "Start of authority" },
  { type: "SRV", code: 33, description: "Service locator" },
  { type: "CAA", code: 257, description: "Certificate authority authorization" },
  { type: "PTR", code: 12, description: "Pointer (reverse DNS)" },
];

const DNS_STATUS: Record<number, string> = {
  0: "NOERROR",
  1: "FORMERR — Query format error",
  2: "SERVFAIL — Server failure",
  3: "NXDOMAIN — Domain does not exist",
  4: "NOTIMP — Not implemented",
  5: "REFUSED — Query refused",
};

const TYPE_NAME: Record<number, string> = {};
for (const rt of RECORD_TYPES) {
  TYPE_NAME[rt.code] = rt.type;
}

function formatTTL(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function DnsLookupComponent() {
  const [domain, setDomain] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["A", "AAAA", "MX", "CNAME", "TXT"]);
  const [results, setResults] = useState<{ type: string; records: DnsRecord[]; status: number; error?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const selectAll = () => setSelectedTypes(RECORD_TYPES.map((r) => r.type));
  const selectCommon = () => setSelectedTypes(["A", "AAAA", "MX", "CNAME", "TXT"]);

  const lookupDns = async () => {
    const trimmed = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!trimmed) {
      setError("Please enter a domain name");
      return;
    }

    setError("");
    setResults([]);
    setLoading(true);

    const queries = selectedTypes.map(async (type) => {
      const rt = RECORD_TYPES.find((r) => r.type === type);
      if (!rt) return { type, records: [], status: -1, error: "Unknown type" };

      try {
        // Using Cloudflare DNS-over-HTTPS (supports CORS)
        const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(trimmed)}&type=${type}`;
        const response = await fetch(url, {
          headers: { Accept: "application/dns-json" },
        });

        if (!response.ok) {
          return { type, records: [], status: -1, error: `HTTP ${response.status}` };
        }

        const data: DnsResponse = await response.json();
        return {
          type,
          records: data.Answer?.filter((a) => a.type === rt.code) || [],
          status: data.Status,
        };
      } catch (err) {
        return {
          type,
          records: [],
          status: -1,
          error: err instanceof Error ? err.message : "Request failed",
        };
      }
    });

    const allResults = await Promise.all(queries);
    setResults(allResults);
    setLoading(false);
  };

  const reset = () => {
    setDomain("");
    setResults([]);
    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") lookupDns();
  };

  const copyAllResults = () => {
    const lines = results
      .filter((r) => r.records.length > 0)
      .flatMap((r) =>
        r.records.map((rec) => `${rec.name}\t${formatTTL(rec.TTL)}\t${TYPE_NAME[rec.type] || rec.type}\t${rec.data}`)
      );
    copyToClipboard(lines.join("\n"));
  };

  const totalRecords = results.reduce((sum, r) => sum + r.records.length, 0);

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Query DNS records for any domain. Uses Cloudflare DNS-over-HTTPS for fast, private lookups.
        </p>

        <div className="space-y-4">
          {/* Domain input */}
          <div>
            <div className="mb-2">Domain Name</div>
            <TextBox
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter domain (e.g., example.com)"
              additionalClass="w-full"
            />
          </div>

          {/* Record type selection */}
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span>Record Types</span>
              <button onClick={selectCommon} className="text-xs text-primary hover:underline">
                Common
              </button>
              <button onClick={selectAll} className="text-xs text-primary hover:underline">
                All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {RECORD_TYPES.map((rt) => (
                <button
                  key={rt.type}
                  onClick={() => toggleType(rt.type)}
                  className={clsx(
                    "px-3 py-1.5 rounded border text-sm font-mono transition-colors",
                    selectedTypes.includes(rt.type)
                      ? "bg-primary text-white border-primary"
                      : "bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-primary"
                  )}
                  title={rt.description}
                >
                  {rt.type}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              handleOnClick={lookupDns}
              label="Lookup"
              isLoading={loading}
              icon={{ icon: MdSearch, position: "left", size: 20 }}
            />
            <Button
              handleOnClick={reset}
              label="Reset"
              type="reset"
              icon={{ icon: MdOutlineClear, position: "left", size: 20 }}
            />
          </div>

          {/* Error */}
          {error && <div className="text-danger text-sm">{error}</div>}

          {/* Results */}
          {results.length > 0 && (
            <div>
              <div className="my-3 flex items-center justify-between">
                <span>
                  Results — {totalRecords} record{totalRecords !== 1 ? "s" : ""} found
                </span>
                {totalRecords > 0 && (
                  <button onClick={copyAllResults} className="text-sm text-primary hover:underline">
                    Copy all
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {results.map((result) => (
                  <div
                    key={result.type}
                    className="rounded border border-stroke dark:border-strokedark overflow-hidden"
                  >
                    {/* Type header */}
                    <div className="flex items-center justify-between px-4 py-2 bg-bodydark/10 dark:bg-body/20">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-sm">{result.type}</span>
                        <span className="text-xs text-bodydark dark:text-bodydark2">
                          {RECORD_TYPES.find((r) => r.type === result.type)?.description}
                        </span>
                      </div>
                      <span
                        className={clsx(
                          "text-xs font-mono",
                          result.status === 0 && result.records.length > 0 && "text-success",
                          result.status === 3 && "text-warning",
                          result.error && "text-danger"
                        )}
                      >
                        {result.error
                          ? result.error
                          : result.records.length > 0
                            ? `${result.records.length} record${result.records.length > 1 ? "s" : ""}`
                            : DNS_STATUS[result.status] || `Status: ${result.status}`}
                      </span>
                    </div>

                    {/* Records table */}
                    {result.records.length > 0 && (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-stroke dark:border-strokedark text-xs text-bodydark dark:text-bodydark2">
                            <th className="px-4 py-1.5 text-left">Name</th>
                            <th className="px-4 py-1.5 text-left">TTL</th>
                            <th className="px-4 py-1.5 text-left">Value</th>
                            <th className="px-4 py-1.5 text-right w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.records.map((rec, i) => (
                            <tr
                              key={i}
                              className="border-b border-stroke/50 dark:border-strokedark/50 last:border-b-0"
                            >
                              <td className="px-4 py-2 font-mono text-xs">{rec.name}</td>
                              <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">
                                {formatTTL(rec.TTL)}
                              </td>
                              <td className="px-4 py-2 font-mono text-xs break-all">{rec.data}</td>
                              <td className="px-4 py-2 text-right">
                                <button
                                  onClick={() => copyToClipboard(rec.data)}
                                  className="text-xs text-primary hover:underline"
                                >
                                  Copy
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* No records */}
                    {result.records.length === 0 && !result.error && (
                      <div className="px-4 py-3 text-xs text-bodydark dark:text-bodydark2">
                        No {result.type} records found
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reference */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
            <div className="text-sm font-medium mb-2">DNS Record Types</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {RECORD_TYPES.map((rt) => (
                <div key={rt.type} className="text-xs text-body dark:text-bodydark2">
                  <strong className="font-mono">{rt.type}</strong> — {rt.description}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
