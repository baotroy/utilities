"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState, useEffect } from "react";
import Button from "@/components/Input/Button";
import { MdOutlineClear, MdSwapHoriz } from "react-icons/md";
import { LiaCalculatorSolid } from "react-icons/lia";
import dayjs from "dayjs";

interface DateDiff {
  years: number;
  months: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
  totalYears: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
}

export default function DateDifferenceComponent() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [diff, setDiff] = useState<DateDiff | null>(null);
  const [error, setError] = useState("");

  const calculateDifference = () => {
    setError("");
    setDiff(null);

    if (!startDate || !endDate) {
      setError("Please select both dates");
      return;
    }

    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (!start.isValid() || !end.isValid()) {
      setError("Invalid date format");
      return;
    }

    // Ensure start is before end for calculation
    const [earlier, later] = start.isBefore(end) ? [start, end] : [end, start];

    // Calculate total differences
    const totalSeconds = later.diff(earlier, "second");
    const totalMinutes = later.diff(earlier, "minute");
    const totalHours = later.diff(earlier, "hour");
    const totalDays = later.diff(earlier, "day");
    const totalWeeks = later.diff(earlier, "week");
    const totalMonths = later.diff(earlier, "month");
    const totalYears = later.diff(earlier, "year");

    // Calculate breakdown (years, months, days, etc.)
    let years = later.diff(earlier, "year");
    let tempDate = earlier.add(years, "year");

    let months = later.diff(tempDate, "month");
    tempDate = tempDate.add(months, "month");

    let days = later.diff(tempDate, "day");
    tempDate = tempDate.add(days, "day");

    let hours = later.diff(tempDate, "hour");
    tempDate = tempDate.add(hours, "hour");

    let minutes = later.diff(tempDate, "minute");
    tempDate = tempDate.add(minutes, "minute");

    let seconds = later.diff(tempDate, "second");

    const weeks = Math.floor(totalDays / 7);

    setDiff({
      years,
      months,
      weeks,
      days,
      hours,
      minutes,
      seconds,
      totalDays,
      totalWeeks,
      totalMonths,
      totalYears,
      totalHours,
      totalMinutes,
      totalSeconds,
    });
  };

  const swap = () => {
    const temp = startDate;
    setStartDate(endDate);
    setEndDate(temp);
    setDiff(null);
  };

  const reset = () => {
    setStartDate("");
    setEndDate("");
    setDiff(null);
    setError("");
  };

  const setToday = (field: "start" | "end") => {
    const today = dayjs().format("YYYY-MM-DDTHH:mm");
    if (field === "start") {
      setStartDate(today);
    } else {
      setEndDate(today);
    }
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Calculate the difference between two dates in years, months, weeks, days, hours, minutes, and seconds.
        </p>

        <div className="space-y-4">
          {/* Date Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span>Start Date</span>
                <button
                  onClick={() => setToday("start")}
                  className="text-xs text-primary hover:underline"
                >
                  Now
                </button>
              </div>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="custom-input w-full"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span>End Date</span>
                <button
                  onClick={() => setToday("end")}
                  className="text-xs text-primary hover:underline"
                >
                  Now
                </button>
              </div>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="custom-input w-full"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              handleOnClick={calculateDifference}
              label="Calculate"
              additionalClass="mr-2"
              icon={{
                icon: LiaCalculatorSolid,
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

          {/* Results */}
          {diff && (
            <div className="space-y-4">
              {/* Breakdown */}
              <div>
                <div className="my-3 font-medium">Date Difference Breakdown</div>
                <div className="p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
                  <div className="text-2xl font-bold mb-2">
                    {diff.years > 0 && <span>{diff.years} year{diff.years !== 1 ? "s" : ""}, </span>}
                    {diff.months > 0 && <span>{diff.months} month{diff.months !== 1 ? "s" : ""}, </span>}
                    {diff.days > 0 && <span>{diff.days} day{diff.days !== 1 ? "s" : ""}</span>}
                    {diff.years === 0 && diff.months === 0 && diff.days === 0 && (
                      <span>
                        {diff.hours > 0 && <span>{diff.hours} hour{diff.hours !== 1 ? "s" : ""}, </span>}
                        {diff.minutes > 0 && <span>{diff.minutes} minute{diff.minutes !== 1 ? "s" : ""}, </span>}
                        {diff.seconds > 0 && <span>{diff.seconds} second{diff.seconds !== 1 ? "s" : ""}</span>}
                      </span>
                    )}
                  </div>
                  {(diff.years > 0 || diff.months > 0 || diff.days > 0) && (
                    <div className="text-sm text-body dark:text-bodydark2">
                      {diff.hours} hour{diff.hours !== 1 ? "s" : ""}, {diff.minutes} minute{diff.minutes !== 1 ? "s" : ""}, {diff.seconds} second{diff.seconds !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>

              {/* Total Values */}
              <div>
                <div className="my-3 font-medium">Total Duration In</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: "Years", value: diff.totalYears },
                    { label: "Months", value: diff.totalMonths },
                    { label: "Weeks", value: diff.totalWeeks },
                    { label: "Days", value: diff.totalDays },
                    { label: "Hours", value: diff.totalHours },
                    { label: "Minutes", value: diff.totalMinutes },
                    { label: "Seconds", value: diff.totalSeconds },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-3 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark text-center"
                    >
                      <div className="text-xl font-bold font-mono">{formatNumber(item.value)}</div>
                      <div className="text-xs text-body dark:text-bodydark2">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
                <div className="text-sm">
                  <strong>From:</strong> {dayjs(startDate).format("MMMM D, YYYY h:mm A")}
                </div>
                <div className="text-sm">
                  <strong>To:</strong> {dayjs(endDate).format("MMMM D, YYYY h:mm A")}
                </div>
              </div>
            </div>
          )}

          {/* Common Uses */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
            <div className="text-sm font-medium mb-2">Common Use Cases</div>
            <ul className="text-xs text-body dark:text-bodydark2 space-y-1">
              <li>• Calculate age from birthdate</li>
              <li>• Find days until an event or deadline</li>
              <li>• Measure project duration</li>
              <li>• Calculate time between milestones</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
