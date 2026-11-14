import { FC, useMemo, useState } from "react";
import { IDecodedParam } from "./type";
import { MdContentCopy } from "react-icons/md";
import { copyToClipboard } from "@/common/utils";
import clsx from "clsx";
import FunctionComponent from "./FunctionComponent";
import { convertNumberBetweenEtherUnit } from "@/app/number/utils";

const UNITS = { wei: "WEI", gwei: "GWEI", ether: "ETH" } as const;
type Unit = keyof typeof UNITS;

const BYTES_FORMATS = {
  hex: "Hex",
  decimal: "Decimal",
  binary: "Binary",
  text: "Text",
} as const;
type BytesFormat = keyof typeof BYTES_FORMATS;

const stripHexPrefix = (hex: string) => (hex.startsWith("0x") ? hex.slice(2) : hex);

// Convert hex string to decimal / binary string
function hexToBase(hex: string, base: 2 | 10): string {
  try {
    const cleanHex = stripHexPrefix(hex);
    if (!cleanHex) return "0";
    return BigInt("0x" + cleanHex).toString(base);
  } catch {
    return "Invalid hex";
  }
}

// Convert hex string to text (UTF-8)
function hexToText(hex: string): string {
  try {
    const cleanHex = stripHexPrefix(hex);
    if (!cleanHex) return "";
    // Remove trailing null bytes (whole "00" pairs only: stripping single
    // zeros broke values whose last byte ends in 0, e.g. 0x...30)
    const trimmedHex = cleanHex.replace(/(?:00)+$/, "");
    if (trimmedHex.length % 2 !== 0) return "Invalid hex length";
    const bytes = [];
    for (let i = 0; i < trimmedHex.length; i += 2) {
      bytes.push(parseInt(trimmedHex.substring(i, i + 2), 16));
    }
    return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
  } catch {
    return "Invalid text";
  }
}

const isBytesType = (type: string) => /^bytes\d*$/.test(type);
const isUintType = (type: string) => /^u?int\d*$/.test(type);

interface ItemProps {
  param: IDecodedParam;
  // position in the parent (function argument, tuple member or array element)
  index: number;
  // true when the parent is an array
  isArrayElement?: boolean;
  depth?: number;
}

const Item: FC<ItemProps> = ({ param, index, isArrayElement, depth = 0 }) => {
  const { name, type, baseType, value, components, arrayChildren } = param;

  const [unit, setUnit] = useState<Unit>("wei");
  const [bytesFormat, setBytesFormat] = useState<BytesFormat>("hex");

  const isContainer = baseType === "array" || baseType === "tuple";
  const showUnit = isUintType(type);
  const showBytesFormat = isBytesType(type);

  // Derived from props + selected format, so a new decode never shows the
  // values of the previous one
  const displayValue = useMemo(() => {
    if (showUnit && unit !== "wei") {
      return convertNumberBetweenEtherUnit(value, "wei", unit);
    }
    if (showBytesFormat) {
      if (bytesFormat === "decimal") return hexToBase(value, 10);
      if (bytesFormat === "binary") return hexToBase(value, 2);
      if (bytesFormat === "text") return hexToText(value);
    }
    return value;
  }, [value, unit, bytesFormat, showUnit, showBytesFormat]);

  return (
    <div
      className={clsx(
        "my-2 rounded-lg border border-stroke px-3 py-2",
        // alternate the background so nesting levels stay readable
        depth % 2 === 0 ? "bg-white" : "bg-gray-50"
      )}
    >
      <div className="mb-1 flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="text-bodydark">
          {isArrayElement ? `[${index}]` : `#${index}`}
        </span>
        <span className="font-mono font-semibold">{type}</span>
        {name && <span className="text-bodydark">{name}</span>}
        {arrayChildren && (
          <span className="text-bodydark">(length: {arrayChildren.length})</span>
        )}
      </div>

      {!isContainer && (
        <div className="flex">
          <input
            type="text"
            readOnly
            aria-label={`${type} value`}
            className="w-full min-w-0 rounded-l-lg border border-r-0 border-bodydark bg-white p-1.5 font-mono text-sm outline-none"
            value={displayValue}
          />
          <button
            type="button"
            title="Copy"
            aria-label="Copy value"
            onClick={() => copyToClipboard(displayValue)}
            className="rounded-r-lg border border-bodydark bg-gray-2 px-3 hover:cursor-pointer"
          >
            <MdContentCopy size={18} />
          </button>
          {showUnit && (
            <select
              value={unit}
              aria-label="Unit"
              className="ml-2 rounded-lg border border-bodydark p-1.5 text-sm"
              onChange={(e) => setUnit(e.target.value as Unit)}
            >
              {Object.entries(UNITS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          )}
          {showBytesFormat && (
            <select
              value={bytesFormat}
              aria-label="Format"
              className="ml-2 rounded-lg border border-bodydark p-1.5 text-sm"
              onChange={(e) => setBytesFormat(e.target.value as BytesFormat)}
            >
              {Object.entries(BYTES_FORMATS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {param.selectorSignatures && (
        <div className="mt-1 text-xs text-bodydark">
          Selector of{" "}
          <span className="font-mono">{param.selectorSignatures.join(" or ")}</span>
        </div>
      )}

      {arrayChildren && arrayChildren.length === 0 && (
        <div className="text-sm text-bodydark">Empty array</div>
      )}

      {arrayChildren?.map((item, i) => (
        <Item key={i} param={item} index={i} isArrayElement depth={depth + 1} />
      ))}

      {components?.map((item, i) => (
        <Item key={i} param={item} index={i} depth={depth + 1} />
      ))}

      {param.functionFragment && (
        <FunctionComponent fragment={param.functionFragment} isChild depth={depth + 1} />
      )}
    </div>
  );
};

export default Item;
