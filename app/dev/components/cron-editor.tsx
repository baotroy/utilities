"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { copyToClipboard } from "@/common/utils";

const defaultCron: Record<string, string> = {
  minute: "0",
  hour: "*",
  dayOfMonth: "*",
  month: "*",
  dayOfWeek: "*",
};

const fieldInfo: Record<string, { label: string; description: string; allowedValues: string }> = {
  minute: {
    label: "Minute",
    description: "0-59",
    allowedValues: "0-59, * , / - ,",
  },
  hour: {
    label: "Hour",
    description: "0-23",
    allowedValues: "0-23, * , / - ,",
  },
  dayOfMonth: {
    label: "Day of Month",
    description: "1-31",
    allowedValues: "1-31, * , / - , ?",
  },
  month: {
    label: "Month",
    description: "1-12 or JAN-DEC",
    allowedValues: "1-12, JAN-DEC, * , / - ,",
  },
  dayOfWeek: {
    label: "Day of Week",
    description: "0-6 or SUN-SAT",
    allowedValues: "0-6, SUN-SAT, * , / - , ?",
  },
};

const presets = [
  { label: "Every minute", cron: "* * * * *" },
  { label: "Every 5 minutes", cron: "*/5 * * * *" },
  { label: "Every 15 minutes", cron: "*/15 * * * *" },
  { label: "Every 30 minutes", cron: "*/30 * * * *" },
  { label: "Every hour", cron: "0 * * * *" },
  { label: "Every day at midnight", cron: "0 0 * * *" },
  { label: "Every day at noon", cron: "0 12 * * *" },
  { label: "Every Sunday at midnight", cron: "0 0 * * 0" },
  { label: "Every Monday at 9am", cron: "0 9 * * 1" },
  { label: "First day of month at midnight", cron: "0 0 1 * *" },
  { label: "Every weekday at 9am", cron: "0 9 * * 1-5" },
  { label: "Every 6 hours", cron: "0 */6 * * *" },
];

// Simple cron description generator
function describeCron(parts: string[]): string {
  if (parts.length !== 5) return "Invalid cron expression";

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Build description
  if (minute === "*" && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return "Every minute";
  }

  if (minute.startsWith("*/") && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return `Every ${minute.slice(2)} minutes`;
  }

  if (hour.startsWith("*/") && minute === "0" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*") {
    return `Every ${hour.slice(2)} hours`;
  }

  let timeDesc = "";
  if (minute !== "*" && hour !== "*") {
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    if (!isNaN(h) && !isNaN(m)) {
      const period = h >= 12 ? "PM" : "AM";
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      timeDesc = `At ${h12}:${m.toString().padStart(2, "0")} ${period}`;
    } else {
      timeDesc = `At ${hour}:${minute.padStart(2, "0")}`;
    }
  } else if (minute !== "*") {
    timeDesc = `At minute ${minute}`;
    if (hour === "*") timeDesc += " of every hour";
  } else if (hour !== "*") {
    if (hour.startsWith("*/")) {
      timeDesc = `Every ${hour.slice(2)} hours`;
    } else {
      timeDesc = `At hour ${hour}`;
    }
  }

  let dayDesc = "";
  if (dayOfMonth !== "*" && dayOfMonth !== "?") {
    dayDesc = `on day ${dayOfMonth} of the month`;
  }
  if (dayOfWeek !== "*" && dayOfWeek !== "?") {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    if (dayOfWeek.includes("-")) {
      const [start, end] = dayOfWeek.split("-").map(Number);
      if (!isNaN(start) && !isNaN(end)) {
        dayDesc = `on ${days[start]} through ${days[end]}`;
      } else {
        dayDesc = `on ${dayOfWeek}`;
      }
    } else if (!isNaN(parseInt(dayOfWeek, 10))) {
      dayDesc = `on ${days[parseInt(dayOfWeek, 10)] || dayOfWeek}`;
    } else {
      dayDesc = `on ${dayOfWeek}`;
    }
  }

  let monthDesc = "";
  if (month !== "*") {
    const months = [
      "", "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    if (!isNaN(parseInt(month, 10))) {
      monthDesc = `in ${months[parseInt(month, 10)] || month}`;
    } else {
      monthDesc = `in ${month}`;
    }
  }

  return [timeDesc, dayDesc, monthDesc].filter(Boolean).join(" ") || "Custom schedule";
}

// Calculate next run times
function getNextRuns(cronExpression: string, count: number = 5): Date[] {
  const parts = cronExpression.split(/\s+/);
  if (parts.length !== 5) return [];

  const [minuteExpr, hourExpr, dayOfMonthExpr, monthExpr, dayOfWeekExpr] = parts;
  const runs: Date[] = [];
  const now = new Date();
  const current = new Date(now);
  current.setSeconds(0);
  current.setMilliseconds(0);

  // Parse cron field
  const parseField = (expr: string, min: number, max: number): number[] => {
    if (expr === "*") return Array.from({ length: max - min + 1 }, (_, i) => i + min);
    if (expr === "?") return Array.from({ length: max - min + 1 }, (_, i) => i + min);
    if (expr.startsWith("*/")) {
      const step = parseInt(expr.slice(2), 10);
      return Array.from({ length: Math.ceil((max - min + 1) / step) }, (_, i) => min + i * step);
    }
    if (expr.includes("-")) {
      const [start, end] = expr.split("-").map(Number);
      return Array.from({ length: end - start + 1 }, (_, i) => i + start);
    }
    if (expr.includes(",")) {
      return expr.split(",").map(Number).filter(n => !isNaN(n));
    }
    const num = parseInt(expr, 10);
    return isNaN(num) ? [] : [num];
  };

  const minutes = parseField(minuteExpr, 0, 59);
  const hours = parseField(hourExpr, 0, 23);
  const daysOfMonth = parseField(dayOfMonthExpr, 1, 31);
  const months = parseField(monthExpr, 1, 12);
  const daysOfWeek = parseField(dayOfWeekExpr, 0, 6);

  // Find next runs (simple approach - iterate forward)
  const maxIterations = 525600; // 1 year in minutes
  let iterations = 0;

  while (runs.length < count && iterations < maxIterations) {
    current.setMinutes(current.getMinutes() + 1);
    iterations++;

    const m = current.getMinutes();
    const h = current.getHours();
    const dom = current.getDate();
    const mon = current.getMonth() + 1;
    const dow = current.getDay();

    if (
      minutes.includes(m) &&
      hours.includes(h) &&
      daysOfMonth.includes(dom) &&
      months.includes(mon) &&
      daysOfWeek.includes(dow)
    ) {
      runs.push(new Date(current));
    }
  }

  return runs;
}

export default function CronEditorComponent() {
  const [fields, setFields] = useState(defaultCron);
  const [cronExpression, setCronExpression] = useState("0 * * * *");
  const [description, setDescription] = useState("");
  const [nextRuns, setNextRuns] = useState<Date[]>([]);
  const [error, setError] = useState("");

  const inputClass =
    "w-full rounded p-2 border border-bodydark outline-bodydark dark:outline-boxdark dark:bg-body text-[14px] dark:text-bodydark1 font-mono text-center";

  // Update cron expression when fields change
  useEffect(() => {
    const expr = `${fields.minute} ${fields.hour} ${fields.dayOfMonth} ${fields.month} ${fields.dayOfWeek}`;
    setCronExpression(expr);
  }, [fields]);

  // Update description and next runs when expression changes
  useEffect(() => {
    const parts = cronExpression.trim().split(/\s+/);
    if (parts.length === 5) {
      setError("");
      setDescription(describeCron(parts));
      setNextRuns(getNextRuns(cronExpression, 5));
    } else {
      setError("Invalid cron expression (must have 5 fields)");
      setDescription("");
      setNextRuns([]);
    }
  }, [cronExpression]);

  // Handle field change
  const handleFieldChange = (field: string, value: string) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  };

  // Handle direct expression input
  const handleExpressionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCronExpression(value);

    const parts = value.trim().split(/\s+/);
    if (parts.length === 5) {
      setFields({
        minute: parts[0],
        hour: parts[1],
        dayOfMonth: parts[2],
        month: parts[3],
        dayOfWeek: parts[4],
      });
    }
  };

  // Apply preset
  const applyPreset = (cron: string) => {
    setCronExpression(cron);
    const parts = cron.split(/\s+/);
    if (parts.length === 5) {
      setFields({
        minute: parts[0],
        hour: parts[1],
        dayOfMonth: parts[2],
        month: parts[3],
        dayOfWeek: parts[4],
      });
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-bodydark dark:text-bodydark2">
          Build and validate cron schedule expressions. Edit individual fields or type the full expression directly.
        </p>

        {/* Cron Expression Input */}
        <div className="mb-6">
          <label className="font-semibold text-sm mb-2 block">Cron Expression</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={cronExpression}
              onChange={handleExpressionChange}
              placeholder="* * * * *"
              className={clsx(
                "flex-1 rounded p-3 border outline-bodydark dark:outline-boxdark dark:bg-body text-xl dark:text-bodydark1 font-mono",
                error ? "border-danger" : "border-bodydark"
              )}
            />
            <button
              onClick={() => copyToClipboard(cronExpression)}
              className="px-4 py-3 text-sm underline decoration-dashed hover:no-underline"
            >
              copy
            </button>
          </div>
          {error && <p className="text-danger text-sm mt-1">{error}</p>}
        </div>

        {/* Individual Fields */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-4">Fields</h3>
          <div className="grid grid-cols-5 gap-2">
            {Object.keys(fieldInfo).map((field) => (
              <div key={field} className="text-center">
                <label className="text-xs font-semibold block mb-1">
                  {fieldInfo[field].label}
                </label>
                <input
                  type="text"
                  value={fields[field]}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  className={inputClass}
                />
                <p className="text-xs text-bodydark dark:text-bodydark2 mt-1">
                  {fieldInfo[field].description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="mb-6 p-4 bg-bodydark/10 dark:bg-body/20 rounded-lg">
          <h3 className="font-semibold text-sm mb-2">Human Readable</h3>
          <p className="text-lg">{description || "Enter a valid cron expression"}</p>
        </div>

        {/* Next Runs */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-4">Next Scheduled Runs</h3>
          {nextRuns.length > 0 ? (
            <ul className="space-y-2">
              {nextRuns.map((run, index) => (
                <li
                  key={index}
                  className="p-2 bg-bodydark/5 dark:bg-body/10 rounded font-mono text-sm"
                >
                  {formatDate(run)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-bodydark dark:text-bodydark2 text-sm">
              No upcoming runs calculated
            </p>
          )}
        </div>

        {/* Presets */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-4">Common Presets</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {presets.map(({ label, cron }) => (
              <button
                key={cron}
                onClick={() => applyPreset(cron)}
                className={clsx(
                  "p-3 rounded border border-bodydark dark:border-body text-left hover:bg-bodydark/10 dark:hover:bg-body/20 transition-colors",
                  cronExpression === cron && "bg-bodydark/20 dark:bg-body/30"
                )}
              >
                <span className="font-mono text-sm block">{cron}</span>
                <p className="text-xs text-bodydark dark:text-bodydark2 mt-1">{label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Reference */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Cron Syntax Reference</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-bodydark dark:border-body">
              <thead>
                <tr className="bg-bodydark/10 dark:bg-body/20">
                  <th className="p-2 text-left border-b border-bodydark dark:border-body">Symbol</th>
                  <th className="p-2 text-left border-b border-bodydark dark:border-body">Description</th>
                  <th className="p-2 text-left border-b border-bodydark dark:border-body">Example</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { symbol: "*", desc: "Any value", example: "* in hour = every hour" },
                  { symbol: ",", desc: "Value list separator", example: "1,3,5 = at 1, 3, and 5" },
                  { symbol: "-", desc: "Range of values", example: "1-5 = 1 through 5" },
                  { symbol: "/", desc: "Step values", example: "*/15 = every 15" },
                ].map(({ symbol, desc, example }) => (
                  <tr key={symbol} className="border-b border-bodydark/50 dark:border-body/50">
                    <td className="p-2 font-mono font-bold">{symbol}</td>
                    <td className="p-2">{desc}</td>
                    <td className="p-2 font-mono text-xs">{example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm border border-bodydark dark:border-body">
              <thead>
                <tr className="bg-bodydark/10 dark:bg-body/20">
                  <th className="p-2 text-left border-b border-bodydark dark:border-body">Field</th>
                  <th className="p-2 text-left border-b border-bodydark dark:border-body">Required</th>
                  <th className="p-2 text-left border-b border-bodydark dark:border-body">Allowed Values</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { field: "Minute", required: "Yes", values: "0-59" },
                  { field: "Hour", required: "Yes", values: "0-23" },
                  { field: "Day of Month", required: "Yes", values: "1-31" },
                  { field: "Month", required: "Yes", values: "1-12 or JAN-DEC" },
                  { field: "Day of Week", required: "Yes", values: "0-6 or SUN-SAT (0 = Sunday)" },
                ].map(({ field, required, values }) => (
                  <tr key={field} className="border-b border-bodydark/50 dark:border-body/50">
                    <td className="p-2 font-semibold">{field}</td>
                    <td className="p-2">{required}</td>
                    <td className="p-2 font-mono text-xs">{values}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
