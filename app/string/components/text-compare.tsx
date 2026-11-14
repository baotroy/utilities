"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState, useMemo } from "react";
import { lcsDiff } from "@/common/diff";

interface DiffLine {
  type: "equal" | "added" | "removed";
  text: string;
  lineNumber?: number;
}

// Line-based diff using LCS so an inserted/deleted line does not mark every
// following line as changed. Rows of the two panels stay aligned.
function computeDiff(text1: string, text2: string): { left: DiffLine[]; right: DiffLine[] } {
  const ops = lcsDiff(text1.split("\n"), text2.split("\n"));

  const left: DiffLine[] = [];
  const right: DiffLine[] = [];
  const blank: DiffLine = { type: "equal", text: "" };

  let k = 0;
  while (k < ops.length) {
    const op = ops[k];
    if (op.type === "equal") {
      left.push({ type: "equal", text: op.value, lineNumber: op.aIndex! + 1 });
      right.push({ type: "equal", text: op.value, lineNumber: op.bIndex! + 1 });
      k++;
      continue;
    }
    const removed: typeof ops = [];
    const added: typeof ops = [];
    while (k < ops.length && ops[k].type === "removed") removed.push(ops[k++]);
    while (k < ops.length && ops[k].type === "added") added.push(ops[k++]);

    const rows = Math.max(removed.length, added.length);
    for (let r = 0; r < rows; r++) {
      left.push(
        removed[r]
          ? { type: "removed", text: removed[r].value, lineNumber: removed[r].aIndex! + 1 }
          : blank
      );
      right.push(
        added[r]
          ? { type: "added", text: added[r].value, lineNumber: added[r].bIndex! + 1 }
          : blank
      );
    }
  }

  return { left, right };
}

export default function TextCompareComponent() {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");

  const diff = useMemo(() => computeDiff(text1, text2), [text1, text2]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let unchanged = 0;

    diff.left.forEach((line) => {
      if (line.type === "removed") removed++;
      else if (line.lineNumber !== undefined) unchanged++;
    });
    diff.right.forEach((line) => {
      if (line.type === "added") added++;
    });

    return { added, removed, unchanged };
  }, [diff]);

  const handleClear = () => {
    setText1("");
    setText2("");
  };

  const handleSwap = () => {
    const temp = text1;
    setText1(text2);
    setText2(temp);
  };

  const getLineClass = (type: "equal" | "added" | "removed") => {
    switch (type) {
      case "added":
        return "bg-green-100 dark:bg-green-900/30";
      case "removed":
        return "bg-red-100 dark:bg-red-900/30";
      default:
        return "";
    }
  };

  return (
    <>
      <Breadcrumb />
      <p className="mb-6 text-sm text-body dark:text-bodydark2">
        Compare two texts and highlight the differences line by line
      </p>

      {/* Input Section */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-2.5 block font-medium text-black dark:text-white">
            Original Text
          </label>
          <textarea
            placeholder="Enter original text..."
            value={text1}
            onChange={(e) => setText1(e.target.value)}
            rows={10}
            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-mono text-sm text-black outline-none transition placeholder:text-bodydark2 focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-2.5 block font-medium text-black dark:text-white">
            Modified Text
          </label>
          <textarea
            placeholder="Enter modified text..."
            value={text2}
            onChange={(e) => setText2(e.target.value)}
            rows={10}
            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-mono text-sm text-black outline-none transition placeholder:text-bodydark2 focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={handleSwap}
          className="rounded-md border border-primary px-4 py-2.5 text-center font-medium text-primary hover:bg-opacity-90"
        >
          Swap Texts
        </button>
        <button
          onClick={handleClear}
          className="rounded-md border border-stroke px-4 py-2.5 text-center font-medium text-bodydark hover:bg-opacity-90 dark:border-strokedark dark:text-bodydark2"
        >
          Clear All
        </button>
      </div>

      {/* Stats */}
      {(text1 || text2) && (
        <div className="mb-6 flex flex-wrap gap-4">
          <span className="rounded bg-green-100 px-3 py-1 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-400">
            +{stats.added} added
          </span>
          <span className="rounded bg-red-100 px-3 py-1 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-400">
            -{stats.removed} removed
          </span>
          <span className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            {stats.unchanged} unchanged
          </span>
        </div>
      )}

      {/* Diff Output */}
      {(text1 || text2) && (
        <div className="rounded-lg border border-stroke dark:border-strokedark">
          <div className="grid grid-cols-2">
            <div className="border-r border-stroke p-2 text-center text-sm font-medium text-bodydark dark:border-strokedark dark:text-bodydark2">
              Original
            </div>
            <div className="p-2 text-center text-sm font-medium text-bodydark dark:text-bodydark2">
              Modified
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-stroke dark:border-strokedark">
            {/* Left Panel */}
            <div className="border-r border-stroke font-mono text-sm dark:border-strokedark">
              {diff.left.map((line, idx) => (
                <div
                  key={idx}
                  className={`flex ${getLineClass(line.type)}`}
                >
                  <span className="w-10 shrink-0 border-r border-stroke px-2 py-1 text-right text-xs text-bodydark2 dark:border-strokedark">
                    {line.lineNumber}
                  </span>
                  <pre className="flex-1 whitespace-pre-wrap break-all px-2 py-1 text-black dark:text-white">
                    {line.text || "\u00A0"}
                  </pre>
                </div>
              ))}
            </div>
            {/* Right Panel */}
            <div className="font-mono text-sm">
              {diff.right.map((line, idx) => (
                <div
                  key={idx}
                  className={`flex ${getLineClass(line.type)}`}
                >
                  <span className="w-10 shrink-0 border-r border-stroke px-2 py-1 text-right text-xs text-bodydark2 dark:border-strokedark">
                    {line.lineNumber}
                  </span>
                  <pre className="flex-1 whitespace-pre-wrap break-all px-2 py-1 text-black dark:text-white">
                    {line.text || "\u00A0"}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      {!text1 && !text2 && (
        <div className="rounded-lg bg-blue-50 p-4 text-sm text-bodydark dark:bg-meta-4 dark:text-bodydark2">
          <p className="font-medium">How to use:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Enter the original text in the left text area</li>
            <li>Enter the modified text in the right text area</li>
            <li>Differences will be highlighted automatically</li>
            <li>Green lines indicate additions, red lines indicate removals</li>
          </ul>
        </div>
      )}
    </>
  );
}
