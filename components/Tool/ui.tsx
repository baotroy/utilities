"use client";
import clsx from "clsx";
import { FC, ReactNode } from "react";
import { MdContentCopy } from "react-icons/md";
import { copyToClipboard } from "@/common/utils";

/** Short explanation shown under the page title. */
export const Intro: FC<{ children: ReactNode }> = ({ children }) => (
  <p className="mb-6 text-sm text-body dark:text-bodydark2">{children}</p>
);

/** Label + optional hint above an input. */
export const Field: FC<{
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  right?: ReactNode;
}> = ({ label, hint, children, className, right }) => (
  <div className={clsx("mb-4", className)}>
    <div className="mb-1.5 flex items-end justify-between gap-2">
      <label className="block text-sm font-semibold">
        {label}
        {hint && (
          <span className="ml-1 font-normal text-bodydark dark:text-bodydark2">{hint}</span>
        )}
      </label>
      {right}
    </div>
    {children}
  </div>
);

export const CopyButton: FC<{ value: string; label?: string; size?: number }> = ({
  value,
  label = "Copy",
  size = 16,
}) => (
  <button
    type="button"
    aria-label={label}
    title="Copy"
    className="shrink-0 cursor-pointer text-bodydark hover:text-primary"
    onClick={() => copyToClipboard(value)}
  >
    <MdContentCopy size={size} />
  </button>
);

/** A labelled, copyable value row. */
export const ValueRow: FC<{
  label: ReactNode;
  value: string;
  main?: boolean;
  labelWidth?: string;
}> = ({ label, value, main, labelWidth = "w-36" }) => (
  <div className="flex items-start gap-2 border-b border-stroke py-1.5 text-sm last:border-b-0 dark:border-strokedark">
    <dt className={clsx(labelWidth, "shrink-0 break-words text-bodydark dark:text-bodydark2")}>{label}</dt>
    <dd
      className={clsx(
        "min-w-0 flex-1 break-all font-mono",
        main ? "font-semibold text-primary" : "text-body dark:text-bodydark2"
      )}
    >
      {value}
    </dd>
    {value !== "" && <CopyButton value={value} label={`Copy ${typeof label === "string" ? label : "value"}`} />}
  </div>
);

export const Card: FC<{ title?: ReactNode; children: ReactNode; className?: string; right?: ReactNode }> = ({
  title,
  children,
  className,
  right,
}) => (
  <div
    className={clsx(
      "rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark",
      className
    )}
  >
    {(title || right) && (
      <div className="mb-2 flex items-center justify-between gap-2">
        {title && <h3 className="font-semibold text-graydark dark:text-white">{title}</h3>}
        {right}
      </div>
    )}
    {children}
  </div>
);

export const ErrorText: FC<{ children: ReactNode }> = ({ children }) =>
  children ? (
    <p className="mt-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-transparent dark:text-red-400">
      {children}
    </p>
  ) : null;

/** Segmented control for picking one of a few modes. */
export function Tabs<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={clsx(
        "mb-4 inline-flex flex-wrap rounded-lg border border-stroke p-0.5 dark:border-strokedark",
        className
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "cursor-pointer rounded-md px-3 py-1 text-sm font-medium",
            value === o.value
              ? "bg-primary text-white"
              : "text-body hover:text-primary dark:text-bodydark2"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Read-only monospace output with a copy button. */
export const OutputBox: FC<{ value: string; rows?: number; placeholder?: string }> = ({
  value,
  rows = 8,
  placeholder,
}) => (
  <div className="relative">
    <textarea
      readOnly
      rows={rows}
      value={value}
      placeholder={placeholder}
      spellCheck={false}
      className="custom-input w-full font-mono text-sm leading-5"
    />
    {value && (
      <span className="absolute right-3 top-2">
        <CopyButton value={value} label="Copy output" />
      </span>
    )}
  </div>
);
