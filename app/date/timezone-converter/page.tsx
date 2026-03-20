import type { Metadata } from "next";
import TimezoneConverterComponent from "../components/timezone-converter";

export const metadata: Metadata = {
  title: "Timezone Converter | Convert Time Between Timezones",
  description:
    "Convert time between different timezones worldwide. Supports all major timezones with automatic daylight saving time adjustments.",
  keywords: [
    "timezone converter",
    "time zone conversion",
    "world clock",
    "time converter",
    "UTC converter",
    "international time",
  ],
};

export default function TimezoneConverterPage() {
  return <TimezoneConverterComponent />;
}
