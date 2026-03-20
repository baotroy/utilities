"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState } from "react";
import BN from "bignumber.js";
import SelectBox from "@/components/Input/SelectBox";
import TextBox from "@/components/Input/TextBox";
import Button from "@/components/Input/Button";
import { MdOutlineClear } from "react-icons/md";
import { LiaEqualsSolid } from "react-icons/lia";
import Copy from "@/components/common/copy";
import { copyToClipboard } from "@/common/utils";

type Operation = "+" | "-" | "×" | "÷" | "%" | "^";

const operations: Operation[] = ["+", "-", "×", "÷", "%", "^"];

const operationLabels: Record<Operation, string> = {
  "+": "Addition",
  "-": "Subtraction",
  "×": "Multiplication",
  "÷": "Division",
  "%": "Modulo",
  "^": "Power",
};

export default function BigNumberCalculatorComponent() {
  const [num1, setNum1] = useState("");
  const [num2, setNum2] = useState("");
  const [operation, setOperation] = useState<Operation>("+");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const calculate = () => {
    setError("");
    setResult("");

    if (!num1.trim() || !num2.trim()) {
      setError("Please enter both numbers");
      return;
    }

    try {
      const a = new BN(num1);
      const b = new BN(num2);

      if (a.isNaN() || b.isNaN()) {
        setError("Invalid number format");
        return;
      }

      let res: BN;

      switch (operation) {
        case "+":
          res = a.plus(b);
          break;
        case "-":
          res = a.minus(b);
          break;
        case "×":
          res = a.times(b);
          break;
        case "÷":
          if (b.isZero()) {
            setError("Cannot divide by zero");
            return;
          }
          res = a.dividedBy(b);
          break;
        case "%":
          if (b.isZero()) {
            setError("Cannot modulo by zero");
            return;
          }
          res = a.modulo(b);
          break;
        case "^":
          if (b.isGreaterThan(1000000)) {
            setError("Exponent too large (max: 1,000,000)");
            return;
          }
          res = a.pow(b.toNumber());
          break;
        default:
          setError("Unknown operation");
          return;
      }

      setResult(res.toFixed());
    } catch (err) {
      setError("Calculation error: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const reset = () => {
    setNum1("");
    setNum2("");
    setResult("");
    setError("");
  };

  const handleCopy = () => {
    copyToClipboard(result);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      calculate();
    }
  };

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Perform arithmetic operations on arbitrarily large numbers with full precision. Supports addition, subtraction, multiplication, division, modulo, and power operations.
        </p>

        <div className="space-y-4">
          {/* First Number */}
          <div>
            <div className="mb-2">First Number</div>
            <TextBox
              value={num1}
              onChange={(e) => setNum1(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter first number (e.g., 123456789012345678901234567890)"
              additionalClass="w-full"
            />
          </div>

          {/* Operation */}
          <div>
            <div className="mb-2">Operation</div>
            <div className="flex flex-wrap gap-2">
              {operations.map((op) => (
                <button
                  key={op}
                  onClick={() => setOperation(op)}
                  className={`px-4 py-2 rounded border transition-colors min-w-15 ${operation === op
                    ? "bg-primary text-white border-primary"
                    : "bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-primary"
                    }`}
                  title={operationLabels[op]}
                >
                  {op}
                </button>
              ))}
            </div>
            <div className="mt-1 text-xs text-body dark:text-bodydark2">
              Selected: {operationLabels[operation]}
            </div>
          </div>

          {/* Second Number */}
          <div>
            <div className="mb-2">Second Number</div>
            <TextBox
              value={num2}
              onChange={(e) => setNum2(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter second number"
              additionalClass="w-full"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex mt-4">
            <Button
              handleOnClick={calculate}
              label="Calculate"
              additionalClass="mr-2"
              icon={{
                icon: LiaEqualsSolid,
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

          {/* Error Display */}
          {error && (
            <div className="text-red-500 text-sm mt-2">{error}</div>
          )}

          {/* Result */}
          <div>
            <div className="my-3">
              Result
              {result && (
                <span className="text-sm text-body dark:text-bodydark2">
                  {" "}({result.length.toLocaleString()} digits)
                </span>
              )}
            </div>
            <div className="flex">
              <textarea
                rows={4}
                readOnly
                value={result}
                placeholder="Result will appear here"
                className="custom-input w-full no-border-right"
              />
              <Copy handleCopy={handleCopy} />
            </div>
          </div>

          {/* Expression Display */}
          {result && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
              <div className="text-xs text-body dark:text-bodydark2 mb-1">Expression:</div>
              <div className="font-mono text-sm break-all">
                {num1} {operation} {num2} = {result.length > 50 ? result.substring(0, 50) + "..." : result}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
