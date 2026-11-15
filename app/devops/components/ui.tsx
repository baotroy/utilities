"use client";
import clsx from "clsx";
import { ReactNode } from "react";

export const textareaClass =
  "w-full rounded border-[1.5px] border-stroke bg-transparent px-4 py-3 font-mono text-sm text-black outline-none transition placeholder:text-bodydark2 focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";

export const outputClass =
  "w-full rounded border-[1.5px] border-stroke bg-gray-50 px-4 py-3 font-mono text-sm text-black outline-none dark:border-form-strokedark dark:bg-form-input dark:text-white";

export const inputClass =
  "w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm text-black outline-none transition placeholder:text-bodydark2 focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary";

export const selectClass =
  "rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white";

/** Segmented control used to switch direction or mode. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded border border-stroke dark:border-strokedark overflow-hidden">
      {options.map((o, idx) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={clsx(
            "px-4 py-2 text-sm font-medium",
            idx > 0 && "border-l border-stroke dark:border-strokedark",
            value === o.value
              ? "bg-primary text-white"
              : "bg-transparent text-body dark:text-bodydark2 hover:bg-gray-100 dark:hover:bg-meta-4"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-body dark:text-bodydark2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-stroke"
      />
      {children}
    </label>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-black dark:text-white">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-bodydark dark:text-bodydark2">{hint}</span>}
    </label>
  );
}

export function Warnings({ items, tone = "warning" }: { items: string[]; tone?: "warning" | "error" }) {
  if (!items.length) return null;
  return (
    <ul
      className={clsx(
        "mb-4 space-y-1 rounded border px-4 py-3 text-sm",
        tone === "error"
          ? "border-red-300 bg-red-50 text-red-600 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400"
          : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300"
      )}
    >
      {items.map((w, i) => (
        <li key={i}>• {w}</li>
      ))}
    </ul>
  );
}

export function LinkButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="text-xs text-primary hover:underline">
      {children}
    </button>
  );
}
