"use client";
import { copyToClipboard } from "@/common/utils";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState } from "react";
import Button from "@/components/Input/Button";
import TextBox from "@/components/Input/TextBox";
import Copy from "@/components/common/copy";
import { MdOutlineClear, MdSearch } from "react-icons/md";

interface IpInfo {
  ip: string;
  hostname?: string;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  loc?: string;
  org?: string;
  postal?: string;
  timezone?: string;
  asn?: string;
  error?: string;
}

interface MyIp {
  v4: IpInfo | null;
  v6: IpInfo | null;
}

// ipinfo.io only has an IPv4 (A) record, so it always reports the IPv4 address.
// v6.ipinfo.io is IPv6-only (AAAA record) and reports the IPv6 address.
const MY_IPV4_URL = "https://ipinfo.io/json";
const MY_IPV6_URL = "https://v6.ipinfo.io/json";

const fetchIpInfo = async (url: string): Promise<IpInfo> => {
  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || data.error.title || "Lookup failed");
  }

  return {
    ip: data.ip,
    hostname: data.hostname,
    city: data.city,
    region: data.region,
    country: data.country,
    loc: data.loc,
    org: data.org,
    postal: data.postal,
    timezone: data.timezone,
  };
};

export default function IpAddressLookupComponent() {
  const [ip, setIp] = useState("");
  const [info, setInfo] = useState<IpInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [myIp, setMyIp] = useState<MyIp | null>(null);

  const lookupIp = async (ipAddress?: string) => {
    setError("");
    setInfo(null);
    setLoading(true);

    const target = (ipAddress || ip).trim();

    try {
      // Using ipinfo.io API (free tier: 50k requests/month)
      setInfo(await fetchIpInfo(`https://ipinfo.io/${target}/json`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  const lookupMyIp = async () => {
    setError("");
    setLoading(true);

    try {
      // Fetch IPv4 and IPv6 in parallel; IPv6 fails if the network has no IPv6 connectivity
      const [v4, v6] = await Promise.allSettled([
        fetchIpInfo(MY_IPV4_URL),
        fetchIpInfo(MY_IPV6_URL),
      ]);
      const result: MyIp = {
        v4: v4.status === "fulfilled" ? v4.value : null,
        v6: v6.status === "fulfilled" ? v6.value : null,
      };

      if (!result.v4 && !result.v6) {
        const reason = v4.status === "rejected" ? v4.reason : null;
        throw reason instanceof Error ? reason : new Error("Failed to get your IP");
      }

      const primary = (result.v4 || result.v6)!;
      setMyIp(result);
      setIp(primary.ip);
      setInfo(primary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get your IP");
    } finally {
      setLoading(false);
    }
  };

  const showMyIpInfo = (selected: IpInfo) => {
    setError("");
    setIp(selected.ip);
    setInfo(selected);
  };

  const reset = () => {
    setIp("");
    setInfo(null);
    setError("");
    setMyIp(null);
  };

  const handleCopy = (text: string) => {
    copyToClipboard(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      lookupIp();
    }
  };

  const isValidIp = (ip: string): boolean => {
    // IPv4
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv6
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    // Domain
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip) || domainRegex.test(ip);
  };

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Look up IP address information including geolocation, ISP, and timezone.
        </p>

        <div className="space-y-4">
          {/* IP Input */}
          <div>
            <div className="mb-2">IP Address or Domain</div>
            <div className="flex">
              <TextBox
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter IP address (e.g., 8.8.8.8) or domain"
                additionalClass="flex-1 no-border-right"
              />
              <Copy handleCopy={() => ip.trim() && handleCopy(ip.trim())} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              handleOnClick={() => lookupIp()}
              label={loading ? "Looking up..." : "Lookup"}
              additionalClass="mr-2"
              icon={{
                icon: MdSearch,
                position: "left",
                size: 20,
              }}
            />
            <Button
              handleOnClick={lookupMyIp}
              label="My IP"
              type="outline"
              additionalClass="mr-2"
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

          {/* My IP (IPv4 + IPv6) */}
          {myIp && (
            <div>
              <div className="my-3">Your IP Addresses</div>
              <div className="bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      { label: "IPv4", value: myIp.v4 },
                      { label: "IPv6", value: myIp.v6 },
                    ].map((row) => (
                      <tr key={row.label} className="border-b border-stroke dark:border-strokedark last:border-b-0">
                        <td className="px-4 py-3 font-medium w-1/3">{row.label}</td>
                        <td className="px-4 py-3">
                          {row.value ? (
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-mono break-all">{row.value.ip}</span>
                              <div className="flex shrink-0 gap-3">
                                <button
                                  onClick={() => showMyIpInfo(row.value!)}
                                  className="text-xs text-primary hover:underline"
                                >
                                  Details
                                </button>
                                <button
                                  onClick={() => handleCopy(row.value!.ip)}
                                  className="text-xs text-primary hover:underline"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-body dark:text-bodydark2">
                              Not available{row.label === "IPv6" && " (no IPv6 connectivity)"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Results */}
          {info && (
            <div>
              <div className="my-3">IP Information</div>
              <div className="bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      { label: "IP Address", value: info.ip },
                      { label: "Hostname", value: info.hostname },
                      { label: "City", value: info.city },
                      { label: "Region", value: info.region },
                      { label: "Country", value: info.country },
                      { label: "Postal Code", value: info.postal },
                      { label: "Location", value: info.loc },
                      { label: "Timezone", value: info.timezone },
                      { label: "Organization", value: info.org },
                    ]
                      .filter((row) => row.value)
                      .map((row, i) => (
                        <tr key={i} className="border-b border-stroke dark:border-strokedark last:border-b-0">
                          <td className="px-4 py-3 font-medium w-1/3">{row.label}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-between">
                              <span>{row.value}</span>
                              <button
                                onClick={() => handleCopy(row.value!)}
                                className="text-xs text-primary hover:underline"
                              >
                                Copy
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Map Link */}
              {info.loc && (
                <div className="mt-4">
                  <a
                    href={`https://www.google.com/maps?q=${info.loc}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    View on Google Maps →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
            <div className="text-sm font-medium mb-2">About IP Lookup</div>
            <ul className="text-xs text-body dark:text-bodydark2 space-y-1">
              <li>• Geolocation data is approximate and based on IP registration info</li>
              <li>• VPN/proxy users may see different locations</li>
              <li>• ISP information shows the organization that owns the IP block</li>
              <li>• Data provided by ipinfo.io</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
