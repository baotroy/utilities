import type { Metadata } from "next";
import DateDifferenceComponent from "../components/date-difference";

export const metadata: Metadata = {
  title: "Date Difference Calculator | Calculate Days Between Dates",
  description:
    "Calculate the exact difference between two dates. Get results in years, months, weeks, days, hours, minutes, and seconds.",
  keywords: [
    "date difference",
    "days between dates",
    "date calculator",
    "time span",
    "duration calculator",
  ],
};

export default function DateDifferenceePage() {
  return <DateDifferenceComponent />;
}
