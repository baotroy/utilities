"use client";
import { copyToClipboard } from "@/common/utils";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState } from "react";
import Button from "@/components/Input/Button";
import TextBox from "@/components/Input/TextBox";
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

export default function IpAddressLookupComponent() {
  const [ip, setIp] = useState("");
  const [info, setInfo] = useState<IpInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [myIp, setMyIp] = useState("");

  const lookupIp = async (ipAddress?: string) => {
    setError("");
    setInfo(null);
    setLoading(true);

    const target = ipAddress || ip;

    try {
      // Using ipinfo.io API (free tier: 50k requests/month)
      const response = await fetch(`https://ipinfo.io/${target}/json`);
      const data = await response.json();

      if (data.error) {
        setError(data.error.message || "Lookup failed");
        setLoading(false);
        return;
      }

      setInfo({
        ip: data.ip,
        hostname: data.hostname,
        city: data.city,
        region: data.region,
        country: data.country,
        loc: data.loc,
        org: data.org,
        postal: data.postal,
        timezone: data.timezone,
      });
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
      const response = await fetch("https://ipinfo.io/json");
      const data = await response.json();

      setMyIp(data.ip);
      setIp(data.ip);
      setInfo({
        ip: data.ip,
        hostname: data.hostname,
        city: data.city,
        region: data.region,
        country: data.country,
        loc: data.loc,
        org: data.org,
        postal: data.postal,
        timezone: data.timezone,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get your IP");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setIp("");
    setInfo(null);
    setError("");
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
            <div className="flex gap-2">
              <TextBox
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter IP address (e.g., 8.8.8.8) or domain"
                additionalClass="flex-1"
              />
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
