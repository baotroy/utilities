"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState, useEffect, useRef } from "react";
import Button from "@/components/Input/Button";
import { MdOutlineClear, MdSwapHoriz, MdAccessTime, MdSearch, MdKeyboardArrowDown } from "react-icons/md";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

// Common timezones grouped by region
const timezoneGroups: Record<string, { label: string; value: string; offset: string }[]> = {
  "Americas": [
    { label: "New York (EST/EDT)", value: "America/New_York", offset: "-05:00/-04:00" },
    { label: "Los Angeles (PST/PDT)", value: "America/Los_Angeles", offset: "-08:00/-07:00" },
    { label: "Chicago (CST/CDT)", value: "America/Chicago", offset: "-06:00/-05:00" },
    { label: "Denver (MST/MDT)", value: "America/Denver", offset: "-07:00/-06:00" },
    { label: "Toronto", value: "America/Toronto", offset: "-05:00/-04:00" },
    { label: "Vancouver", value: "America/Vancouver", offset: "-08:00/-07:00" },
    { label: "Mexico City", value: "America/Mexico_City", offset: "-06:00" },
    { label: "São Paulo", value: "America/Sao_Paulo", offset: "-03:00" },
    { label: "Buenos Aires", value: "America/Argentina/Buenos_Aires", offset: "-03:00" },
  ],
  "Europe": [
    { label: "London (GMT/BST)", value: "Europe/London", offset: "+00:00/+01:00" },
    { label: "Paris (CET/CEST)", value: "Europe/Paris", offset: "+01:00/+02:00" },
    { label: "Berlin", value: "Europe/Berlin", offset: "+01:00/+02:00" },
    { label: "Amsterdam", value: "Europe/Amsterdam", offset: "+01:00/+02:00" },
    { label: "Rome", value: "Europe/Rome", offset: "+01:00/+02:00" },
    { label: "Madrid", value: "Europe/Madrid", offset: "+01:00/+02:00" },
    { label: "Moscow", value: "Europe/Moscow", offset: "+03:00" },
    { label: "Istanbul", value: "Europe/Istanbul", offset: "+03:00" },
    { label: "Athens", value: "Europe/Athens", offset: "+02:00/+03:00" },
  ],
  "Asia": [
    { label: "Tokyo (JST)", value: "Asia/Tokyo", offset: "+09:00" },
    { label: "Shanghai (CST)", value: "Asia/Shanghai", offset: "+08:00" },
    { label: "Hong Kong", value: "Asia/Hong_Kong", offset: "+08:00" },
    { label: "Singapore (SGT)", value: "Asia/Singapore", offset: "+08:00" },
    { label: "Seoul (KST)", value: "Asia/Seoul", offset: "+09:00" },
    { label: "Mumbai (IST)", value: "Asia/Kolkata", offset: "+05:30" },
    { label: "Dubai", value: "Asia/Dubai", offset: "+04:00" },
    { label: "Bangkok", value: "Asia/Bangkok", offset: "+07:00" },
    { label: "Jakarta", value: "Asia/Jakarta", offset: "+07:00" },
    { label: "Ho Chi Minh", value: "Asia/Ho_Chi_Minh", offset: "+07:00" },
  ],
  "Pacific": [
    { label: "Sydney (AEST/AEDT)", value: "Australia/Sydney", offset: "+10:00/+11:00" },
    { label: "Melbourne", value: "Australia/Melbourne", offset: "+10:00/+11:00" },
    { label: "Auckland (NZST/NZDT)", value: "Pacific/Auckland", offset: "+12:00/+13:00" },
    { label: "Honolulu (HST)", value: "Pacific/Honolulu", offset: "-10:00" },
    { label: "Fiji", value: "Pacific/Fiji", offset: "+12:00" },
  ],
  "Africa": [
    { label: "Cairo", value: "Africa/Cairo", offset: "+02:00" },
    { label: "Johannesburg", value: "Africa/Johannesburg", offset: "+02:00" },
    { label: "Lagos", value: "Africa/Lagos", offset: "+01:00" },
    { label: "Nairobi", value: "Africa/Nairobi", offset: "+03:00" },
  ],
  "Other": [
    { label: "UTC", value: "UTC", offset: "+00:00" },
  ],
};

// Get local timezone
const getLocalTimezone = () => {
  if (typeof window !== "undefined") {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return "UTC";
};

// Build timezone list with local timezone included
const buildTimezoneList = () => {
  const localTz = getLocalTimezone();
  const allZones = Object.entries(timezoneGroups).flatMap(([region, zones]) =>
    zones.map((z) => ({ ...z, region }))
  );

  // Check if local timezone is already in the list
  const exists = allZones.some((z) => z.value === localTz);
  if (!exists && localTz !== "UTC") {
    allZones.unshift({
      label: `Local (${localTz})`,
      value: localTz,
      offset: "",
      region: "Local",
    });
  }
  return allZones;
};

// Flatten for select dropdown
const allTimezones = buildTimezoneList();

// Searchable Timezone Select Component
interface SearchableTimezoneSelectProps {
  value: string;
  onChange: (value: string) => void;
  getOffset: (zone: string) => string;
  localTimezone: string;
}

function SearchableTimezoneSelect({ value, onChange, getOffset, localTimezone }: SearchableTimezoneSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter timezones based on search
  const filteredGroups = Object.entries(timezoneGroups).map(([region, zones]) => ({
    region,
    zones: zones.filter(
      (z) =>
        z.label.toLowerCase().includes(search.toLowerCase()) ||
        z.value.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((g) => g.zones.length > 0);

  // Check if local timezone needs to be added
  const showLocal = !Object.values(timezoneGroups).flat().some((z) => z.value === localTimezone) &&
    localTimezone !== "UTC" &&
    (localTimezone.toLowerCase().includes(search.toLowerCase()) || search === "");

  const selectedLabel = allTimezones.find((z) => z.value === value)?.label || value;

  const handleSelect = (zone: string) => {
    onChange(zone);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className="custom-input w-full flex items-center justify-between cursor-pointer"
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <span className="truncate">{selectedLabel} ({getOffset(value)})</span>
        <MdKeyboardArrowDown className={`ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded shadow-lg max-h-80 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-stroke dark:border-strokedark sticky top-0 bg-white dark:bg-boxdark">
            <div className="relative">
              <MdSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-body dark:text-bodydark2" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search timezone..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-stroke dark:border-strokedark rounded bg-transparent focus:outline-none focus:border-primary"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options */}
          <div className="overflow-y-auto max-h-60">
            {/* Local timezone */}
            {showLocal && (
              <div>
                <div className="px-3 py-1 text-xs font-semibold text-body dark:text-bodydark2 bg-gray-100 dark:bg-meta-4">
                  Local
                </div>
                <div
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-meta-4 ${value === localTimezone ? "bg-primary bg-opacity-10 text-primary" : ""}`}
                  onClick={() => handleSelect(localTimezone)}
                >
                  Local ({localTimezone}) ({getOffset(localTimezone)})
                </div>
              </div>
            )}

            {/* Grouped timezones */}
            {filteredGroups.map(({ region, zones }) => (
              <div key={region}>
                <div className="px-3 py-1 text-xs font-semibold text-body dark:text-bodydark2 bg-gray-100 dark:bg-meta-4">
                  {region}
                </div>
                {zones.map((zone) => (
                  <div
                    key={zone.value}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-meta-4 ${value === zone.value ? "bg-primary bg-opacity-10 text-primary" : ""}`}
                    onClick={() => handleSelect(zone.value)}
                  >
                    {zone.label} ({getOffset(zone.value)})
                  </div>
                ))}
              </div>
            ))}

            {filteredGroups.length === 0 && !showLocal && (
              <div className="px-3 py-4 text-center text-sm text-body dark:text-bodydark2">
                No timezones found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TimezoneConverterComponent() {
  const [dateTime, setDateTime] = useState("");
  const [fromZone, setFromZone] = useState("UTC");
  const [toZone, setToZone] = useState("America/New_York");
  const [convertedTime, setConvertedTime] = useState("");
  const [error, setError] = useState("");
  const [multipleZones, setMultipleZones] = useState<{ zone: string; time: string; label: string }[]>([]);
  const [localTimezone] = useState(() => getLocalTimezone());

  const convert = () => {
    setError("");
    setConvertedTime("");

    if (!dateTime) {
      setError("Please select a date and time");
      return;
    }

    try {
      // Parse the input time in the source timezone
      const sourceTime = dayjs.tz(dateTime, fromZone);

      if (!sourceTime.isValid()) {
        setError("Invalid date/time");
        return;
      }

      // Convert to target timezone
      const targetTime = sourceTime.tz(toZone);
      setConvertedTime(targetTime.format("YYYY-MM-DD HH:mm:ss"));

      // Also show in multiple common timezones
      const commonZones = ["UTC", "America/New_York", "Europe/London", "Asia/Tokyo", "Asia/Singapore", "Australia/Sydney"];
      const results = commonZones.map((zone) => {
        const zoneInfo = allTimezones.find((z) => z.value === zone);
        return {
          zone,
          time: sourceTime.tz(zone).format("YYYY-MM-DD HH:mm:ss"),
          label: zoneInfo?.label || zone,
        };
      });
      setMultipleZones(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion error");
    }
  };

  const swap = () => {
    const temp = fromZone;
    setFromZone(toZone);
    setToZone(temp);
    setConvertedTime("");
    setMultipleZones([]);
  };

  const reset = () => {
    setDateTime("");
    setFromZone("UTC");
    setToZone("America/New_York");
    setConvertedTime("");
    setMultipleZones([]);
    setError("");
  };

  const setNow = () => {
    const now = dayjs().format("YYYY-MM-DDTHH:mm");
    setDateTime(now);
  };

  const detectLocalTimezone = () => {
    setFromZone(localTimezone);
  };

  // Get current offset for a timezone
  const getOffset = (zone: string): string => {
    try {
      return dayjs().tz(zone).format("Z");
    } catch {
      return "";
    }
  };

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Convert time between different timezones worldwide. Supports daylight saving time adjustments.
        </p>

        <div className="space-y-4">
          {/* Date Time Input */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span>Date & Time</span>
              <button
                onClick={setNow}
                className="text-xs text-primary hover:underline"
              >
                Now
              </button>
            </div>
            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="custom-input w-full"
            />
          </div>

          {/* Timezone Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span>From Timezone</span>
                <button
                  onClick={detectLocalTimezone}
                  className="text-xs text-primary hover:underline"
                >
                  Detect local
                </button>
              </div>
              <SearchableTimezoneSelect
                value={fromZone}
                onChange={setFromZone}
                getOffset={getOffset}
                localTimezone={localTimezone}
              />
            </div>

            <div>
              <div className="mb-2">To Timezone</div>
              <SearchableTimezoneSelect
                value={toZone}
                onChange={setToZone}
                getOffset={getOffset}
                localTimezone={localTimezone}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              handleOnClick={convert}
              label="Convert"
              additionalClass="mr-2"
              icon={{
                icon: MdAccessTime,
                position: "left",
                size: 20,
              }}
            />
            <Button
              handleOnClick={swap}
              label="Swap"
              type="outline"
              additionalClass="mr-2"
              icon={{
                icon: MdSwapHoriz,
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

          {/* Result */}
          {convertedTime && (
            <div className="space-y-4">
              <div>
                <div className="my-3 font-medium">Converted Time</div>
                <div className="p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-body dark:text-bodydark2 mb-1">
                        {allTimezones.find((z) => z.value === fromZone)?.label || fromZone}
                      </div>
                      <div className="text-xl font-mono font-bold">
                        {dayjs.tz(dateTime, fromZone).format("YYYY-MM-DD")}
                      </div>
                      <div className="text-2xl font-mono font-bold text-primary">
                        {dayjs.tz(dateTime, fromZone).format("HH:mm:ss")}
                      </div>
                      <div className="text-sm text-body dark:text-bodydark2">
                        {dayjs.tz(dateTime, fromZone).format("dddd")} • UTC{getOffset(fromZone)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-body dark:text-bodydark2 mb-1">
                        {allTimezones.find((z) => z.value === toZone)?.label || toZone}
                      </div>
                      <div className="text-xl font-mono font-bold">
                        {dayjs.tz(dateTime, fromZone).tz(toZone).format("YYYY-MM-DD")}
                      </div>
                      <div className="text-2xl font-mono font-bold text-primary">
                        {dayjs.tz(dateTime, fromZone).tz(toZone).format("HH:mm:ss")}
                      </div>
                      <div className="text-sm text-body dark:text-bodydark2">
                        {dayjs.tz(dateTime, fromZone).tz(toZone).format("dddd")} • UTC{getOffset(toZone)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multiple Timezones */}
              {multipleZones.length > 0 && (
                <div>
                  <div className="my-3 font-medium">Same Moment In Other Timezones</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {multipleZones.map((item) => (
                      <div
                        key={item.zone}
                        className={`p-3 rounded border ${item.zone === toZone
                          ? "bg-primary bg-opacity-10 border-primary"
                          : "bg-gray-50 dark:bg-boxdark border-stroke dark:border-strokedark"
                          }`}
                      >
                        <div className="text-xs text-body dark:text-bodydark2">{item.label}</div>
                        <div className="font-mono font-bold">{item.time.split(" ")[1]}</div>
                        <div className="text-xs text-body dark:text-bodydark2">{item.time.split(" ")[0]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
            <div className="text-sm font-medium mb-2">About Timezones</div>
            <ul className="text-xs text-body dark:text-bodydark2 space-y-1">
              <li>• <strong>UTC (Coordinated Universal Time)</strong> is the primary time standard used worldwide.</li>
              <li>• <strong>DST (Daylight Saving Time)</strong> adjustments are automatically handled.</li>
              <li>• Offsets shown reflect the current date's offset, which may vary due to DST.</li>
              <li>• Some regions don't observe DST (e.g., Japan, Singapore, most of Africa).</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
