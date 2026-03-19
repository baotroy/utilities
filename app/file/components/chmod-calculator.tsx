"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { copyToClipboard } from "@/common/utils";
import CheckboxTwo from "@/components/Checkboxes/CheckboxTwo";

type PermissionSet = {
  read: boolean;
  write: boolean;
  execute: boolean;
};

type Permissions = {
  owner: PermissionSet;
  group: PermissionSet;
  others: PermissionSet;
};

const defaultPermissions: Permissions = {
  owner: { read: true, write: true, execute: true },
  group: { read: true, write: false, execute: true },
  others: { read: true, write: false, execute: true },
};

export default function ChmodCalculatorComponent() {
  const [permissions, setPermissions] = useState<Permissions>(defaultPermissions);
  const [octalValue, setOctalValue] = useState("755");
  const [symbolicValue, setSymbolicValue] = useState("rwxr-xr-x");

  // Calculate octal value from permissions
  const calculateOctal = (perms: Permissions): string => {
    const calcDigit = (p: PermissionSet): number => {
      return (p.read ? 4 : 0) + (p.write ? 2 : 0) + (p.execute ? 1 : 0);
    };
    return `${calcDigit(perms.owner)}${calcDigit(perms.group)}${calcDigit(perms.others)}`;
  };

  // Calculate symbolic value from permissions
  const calculateSymbolic = (perms: Permissions): string => {
    const calcSymbol = (p: PermissionSet): string => {
      return (p.read ? "r" : "-") + (p.write ? "w" : "-") + (p.execute ? "x" : "-");
    };
    return `${calcSymbol(perms.owner)}${calcSymbol(perms.group)}${calcSymbol(perms.others)}`;
  };

  // Parse octal value to permissions
  const parseOctal = (octal: string): Permissions | null => {
    if (!/^[0-7]{3,4}$/.test(octal)) return null;

    // Take last 3 digits (ignore special bits for now)
    const digits = octal.slice(-3);

    const parseDigit = (digit: string): PermissionSet => {
      const num = parseInt(digit, 10);
      return {
        read: (num & 4) !== 0,
        write: (num & 2) !== 0,
        execute: (num & 1) !== 0,
      };
    };

    return {
      owner: parseDigit(digits[0]),
      group: parseDigit(digits[1]),
      others: parseDigit(digits[2]),
    };
  };

  // Parse symbolic value to permissions
  const parseSymbolic = (symbolic: string): Permissions | null => {
    if (!/^[rwx-]{9}$/.test(symbolic)) return null;

    const parseTriple = (triple: string): PermissionSet => ({
      read: triple[0] === "r",
      write: triple[1] === "w",
      execute: triple[2] === "x",
    });

    return {
      owner: parseTriple(symbolic.slice(0, 3)),
      group: parseTriple(symbolic.slice(3, 6)),
      others: parseTriple(symbolic.slice(6, 9)),
    };
  };

  // Update all values when permissions change
  useEffect(() => {
    setOctalValue(calculateOctal(permissions));
    setSymbolicValue(calculateSymbolic(permissions));
  }, [permissions]);

  // Handle permission checkbox change
  const handlePermissionChange = (
    category: keyof Permissions,
    permission: keyof PermissionSet,
    value: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [permission]: value,
      },
    }));
  };

  // Handle octal input change
  const handleOctalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOctalValue(value);

    const parsed = parseOctal(value);
    if (parsed) {
      setPermissions(parsed);
    }
  };

  // Handle symbolic input change
  const handleSymbolicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSymbolicValue(value);

    const parsed = parseSymbolic(value);
    if (parsed) {
      setPermissions(parsed);
    }
  };

  const inputClass =
    "w-full rounded p-2 border border-bodydark outline-bodydark dark:outline-boxdark dark:bg-body text-[14px] dark:text-bodydark1 font-mono";
  const labelClass = "font-semibold text-sm mb-1";
  const categoryLabels: Record<keyof Permissions, string> = {
    owner: "Owner (User)",
    group: "Group",
    others: "Others (World)",
  };
  const permissionLabels: Record<keyof PermissionSet, { label: string; value: number }> = {
    read: { label: "Read", value: 4 },
    write: { label: "Write", value: 2 },
    execute: { label: "Execute", value: 1 },
  };

  // Generate chmod command examples
  const chmodCommand = `chmod ${octalValue} filename`;
  const chmodSymbolicCommand = `chmod u=${symbolicValue.slice(0, 3).replace(/-/g, "")},g=${symbolicValue.slice(3, 6).replace(/-/g, "")},o=${symbolicValue.slice(6, 9).replace(/-/g, "")} filename`;

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Convert Linux file permissions between octal (numeric) and symbolic formats.
          Click checkboxes or enter values directly.
        </p>

        {/* Permission Checkboxes */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-4">Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.keys(permissions) as Array<keyof Permissions>).map((category) => (
              <div
                key={category}
                className="border border-bodydark dark:border-body rounded-lg p-4"
              >
                <h4 className="font-semibold mb-3 text-center">
                  {categoryLabels[category]}
                </h4>
                <div className="space-y-2">
                  {(Object.keys(permissions[category]) as Array<keyof PermissionSet>).map(
                    (permission) => (
                      <div key={permission} className="flex items-center justify-between">
                        <CheckboxTwo
                          id={`chmod-${category}-${permission}`}
                          label={`${permissionLabels[permission].label} (${permissionLabels[permission].value})`}
                          isChecked={permissions[category][permission]}
                          onChange={(value) =>
                            handlePermissionChange(category, permission, value)
                          }
                        />
                      </div>
                    )
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-bodydark dark:border-body text-center">
                  <span className="font-mono text-lg">
                    {calculateOctal({ owner: permissions[category], group: permissions[category], others: permissions[category] })[0]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Octal and Symbolic Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className={labelClass}>Octal (Numeric)</label>
            <input
              type="text"
              value={octalValue}
              onChange={handleOctalChange}
              placeholder="e.g., 755"
              maxLength={4}
              className={clsx(inputClass, "text-2xl text-center")}
            />
            <p className="text-xs text-bodydark dark:text-bodydark2 mt-1">
              Enter 3 or 4 digits (0-7)
            </p>
          </div>
          <div>
            <label className={labelClass}>Symbolic</label>
            <input
              type="text"
              value={symbolicValue}
              onChange={handleSymbolicChange}
              placeholder="e.g., rwxr-xr-x"
              maxLength={9}
              className={clsx(inputClass, "text-2xl text-center")}
            />
            <p className="text-xs text-bodydark dark:text-bodydark2 mt-1">
              Enter 9 characters (r, w, x, or -)
            </p>
          </div>
        </div>

        {/* Command Examples */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-4">Command Examples</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-boxdark dark:bg-body p-3 rounded font-mono text-sm text-white dark:text-bodydark1">
                {chmodCommand}
              </code>
              <button
                onClick={() => copyToClipboard(chmodCommand)}
                className="px-3 py-2 text-xs underline decoration-dashed hover:no-underline"
              >
                copy
              </button>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-boxdark dark:bg-body p-3 rounded font-mono text-sm text-white dark:text-bodydark1 overflow-x-auto">
                {chmodSymbolicCommand}
              </code>
              <button
                onClick={() => copyToClipboard(chmodSymbolicCommand)}
                className="px-3 py-2 text-xs underline decoration-dashed hover:no-underline"
              >
                copy
              </button>
            </div>
          </div>
        </div>

        {/* Permission Reference */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-4">Common Permission Presets</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { octal: "777", desc: "Full access" },
              { octal: "755", desc: "Owner full, others read/exec" },
              { octal: "644", desc: "Owner read/write, others read" },
              { octal: "600", desc: "Owner read/write only" },
              { octal: "700", desc: "Owner full only" },
              { octal: "444", desc: "Read only for all" },
              { octal: "400", desc: "Owner read only" },
              { octal: "000", desc: "No access" },
            ].map(({ octal, desc }) => (
              <button
                key={octal}
                onClick={() => {
                  const parsed = parseOctal(octal);
                  if (parsed) setPermissions(parsed);
                }}
                className={clsx(
                  "p-2 rounded border border-bodydark dark:border-body text-left hover:bg-bodydark/10 dark:hover:bg-body/20 transition-colors",
                  octalValue === octal && "bg-bodydark/20 dark:bg-body/30"
                )}
              >
                <span className="font-mono font-bold">{octal}</span>
                <p className="text-xs text-bodydark dark:text-bodydark2">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Reference Table */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Permission Reference</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-bodydark dark:border-body">
              <thead>
                <tr className="bg-bodydark/10 dark:bg-body/20">
                  <th className="p-2 text-left border-b border-bodydark dark:border-body">Octal</th>
                  <th className="p-2 text-left border-b border-bodydark dark:border-body">Binary</th>
                  <th className="p-2 text-left border-b border-bodydark dark:border-body">Symbolic</th>
                  <th className="p-2 text-left border-b border-bodydark dark:border-body">Permissions</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {[
                  { octal: 0, binary: "000", symbolic: "---", desc: "None" },
                  { octal: 1, binary: "001", symbolic: "--x", desc: "Execute" },
                  { octal: 2, binary: "010", symbolic: "-w-", desc: "Write" },
                  { octal: 3, binary: "011", symbolic: "-wx", desc: "Write + Execute" },
                  { octal: 4, binary: "100", symbolic: "r--", desc: "Read" },
                  { octal: 5, binary: "101", symbolic: "r-x", desc: "Read + Execute" },
                  { octal: 6, binary: "110", symbolic: "rw-", desc: "Read + Write" },
                  { octal: 7, binary: "111", symbolic: "rwx", desc: "Full" },
                ].map(({ octal, binary, symbolic, desc }) => (
                  <tr key={octal} className="border-b border-bodydark/50 dark:border-body/50">
                    <td className="p-2">{octal}</td>
                    <td className="p-2">{binary}</td>
                    <td className="p-2">{symbolic}</td>
                    <td className="p-2 font-sans">{desc}</td>
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
