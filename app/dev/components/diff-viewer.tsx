"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState, useMemo } from "react";
import Button from "@/components/Input/Button";
import { MdOutlineClear, MdSwapHoriz, MdContentCopy } from "react-icons/md";
import { copyToClipboard } from "@/common/utils";

type ViewMode = "split" | "unified";

interface DiffSegment {
  type: "equal" | "added" | "removed";
  text: string;
}

interface DiffLine {
  type: "equal" | "added" | "removed" | "modified";
  leftLine?: number;
  rightLine?: number;
  leftText: string;
  rightText: string;
  leftSegments?: DiffSegment[];
  rightSegments?: DiffSegment[];
}

// LCS-based diff for character-level comparison
function lcsCharDiff(str1: string, str2: string): { left: DiffSegment[]; right: DiffSegment[] } {
  if (str1 === str2) {
    return {
      left: [{ type: "equal", text: str1 }],
      right: [{ type: "equal", text: str2 }],
    };
  }

  // Simple word-based diff for better readability
  const words1 = str1.split(/(\s+)/);
  const words2 = str2.split(/(\s+)/);

  const m = words1.length;
  const n = words2.length;

  // Build LCS table
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (words1[i - 1] === words2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  const leftSegments: DiffSegment[] = [];
  const rightSegments: DiffSegment[] = [];

  let i = m,
    j = n;
  const leftStack: DiffSegment[] = [];
  const rightStack: DiffSegment[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && words1[i - 1] === words2[j - 1]) {
      leftStack.push({ type: "equal", text: words1[i - 1] });
      rightStack.push({ type: "equal", text: words2[j - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rightStack.push({ type: "added", text: words2[j - 1] });
      j--;
    } else {
      leftStack.push({ type: "removed", text: words1[i - 1] });
      i--;
    }
  }

  // Reverse and merge consecutive segments of the same type
  const mergeSegments = (stack: DiffSegment[]): DiffSegment[] => {
    const result: DiffSegment[] = [];
    for (let k = stack.length - 1; k >= 0; k--) {
      const seg = stack[k];
      if (result.length > 0 && result[result.length - 1].type === seg.type) {
        result[result.length - 1].text += seg.text;
      } else {
        result.push({ ...seg });
      }
    }
    return result;
  };

  return {
    left: mergeSegments(leftStack),
    right: mergeSegments(rightStack),
  };
}

// Main diff computation
function computeDiff(text1: string, text2: string): DiffLine[] {
  const lines1 = text1.split("\n");
  const lines2 = text2.split("\n");

  const m = lines1.length;
  const n = lines2.length;

  // LCS for lines
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (lines1[i - 1] === lines2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  const result: DiffLine[] = [];
  let i = m,
    j = n;

  const stack: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
      stack.push({
        type: "equal",
        leftLine: i,
        rightLine: j,
        leftText: lines1[i - 1],
        rightText: lines2[j - 1],
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({
        type: "added",
        rightLine: j,
        leftText: "",
        rightText: lines2[j - 1],
      });
      j--;
    } else {
      stack.push({
        type: "removed",
        leftLine: i,
        leftText: lines1[i - 1],
        rightText: "",
      });
      i--;
    }
  }

  // Reverse stack and detect modified lines
  for (let k = stack.length - 1; k >= 0; k--) {
    const line = stack[k];

    // Check if this removed line is followed by an added line (modification)
    if (
      line.type === "removed" &&
      k > 0 &&
      stack[k - 1].type === "added"
    ) {
      const addedLine = stack[k - 1];
      const charDiff = lcsCharDiff(line.leftText, addedLine.rightText);
      result.push({
        type: "modified",
        leftLine: line.leftLine,
        rightLine: addedLine.rightLine,
        leftText: line.leftText,
        rightText: addedLine.rightText,
        leftSegments: charDiff.left,
        rightSegments: charDiff.right,
      });
      k--; // Skip the added line
    } else {
      result.push(line);
    }
  }

  return result;
}

// Generate unified diff format
function generateUnifiedDiff(diff: DiffLine[], filename1: string, filename2: string): string {
  const lines: string[] = [];
  lines.push(`--- ${filename1}`);
  lines.push(`+++ ${filename2}`);

  let leftLine = 1;
  let rightLine = 1;

  // Group changes into hunks
  let hunkStart = -1;
  let hunk: string[] = [];
  let hunkLeftStart = 0;
  let hunkRightStart = 0;
  let hunkLeftCount = 0;
  let hunkRightCount = 0;

  const flushHunk = () => {
    if (hunk.length > 0) {
      lines.push(`@@ -${hunkLeftStart},${hunkLeftCount} +${hunkRightStart},${hunkRightCount} @@`);
      lines.push(...hunk);
      hunk = [];
    }
  };

  diff.forEach((line, idx) => {
    if (line.type === "equal") {
      if (hunk.length > 0) {
        // Add context
        hunk.push(` ${line.leftText}`);
        hunkLeftCount++;
        hunkRightCount++;

        // Check if we should flush the hunk
        const nextNonEqual = diff.slice(idx + 1).findIndex((l) => l.type !== "equal");
        if (nextNonEqual === -1 || nextNonEqual > 3) {
          // Add up to 3 more context lines then flush
          let added = 0;
          for (let k = idx + 1; k < diff.length && added < 3; k++) {
            if (diff[k].type === "equal") {
              hunk.push(` ${diff[k].leftText}`);
              hunkLeftCount++;
              hunkRightCount++;
              added++;
            }
          }
          flushHunk();
        }
      }
      if (line.leftLine) leftLine = line.leftLine + 1;
      if (line.rightLine) rightLine = line.rightLine + 1;
    } else {
      if (hunk.length === 0) {
        // Start new hunk with context
        hunkLeftStart = Math.max(1, (line.leftLine || leftLine) - 3);
        hunkRightStart = Math.max(1, (line.rightLine || rightLine) - 3);
        hunkLeftCount = 0;
        hunkRightCount = 0;

        // Add leading context
        const contextStart = Math.max(0, idx - 3);
        for (let k = contextStart; k < idx; k++) {
          if (diff[k].type === "equal") {
            hunk.push(` ${diff[k].leftText}`);
            hunkLeftCount++;
            hunkRightCount++;
          }
        }
      }

      if (line.type === "removed") {
        hunk.push(`-${line.leftText}`);
        hunkLeftCount++;
        if (line.leftLine) leftLine = line.leftLine + 1;
      } else if (line.type === "added") {
        hunk.push(`+${line.rightText}`);
        hunkRightCount++;
        if (line.rightLine) rightLine = line.rightLine + 1;
      } else if (line.type === "modified") {
        hunk.push(`-${line.leftText}`);
        hunk.push(`+${line.rightText}`);
        hunkLeftCount++;
        hunkRightCount++;
        if (line.leftLine) leftLine = line.leftLine + 1;
        if (line.rightLine) rightLine = line.rightLine + 1;
      }
    }
  });

  flushHunk();
  return lines.join("\n");
}

export default function DiffViewerComponent() {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  const diff = useMemo(() => computeDiff(text1, text2), [text1, text2]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let modified = 0;
    let unchanged = 0;

    diff.forEach((line) => {
      if (line.type === "added") added++;
      else if (line.type === "removed") removed++;
      else if (line.type === "modified") modified++;
      else unchanged++;
    });

    return { added, removed, modified, unchanged };
  }, [diff]);

  const unifiedDiff = useMemo(
    () => generateUnifiedDiff(diff, "original", "modified"),
    [diff]
  );

  const handleClear = () => {
    setText1("");
    setText2("");
  };

  const handleSwap = () => {
    const temp = text1;
    setText1(text2);
    setText2(temp);
  };

  const copyUnifiedDiff = () => {
    copyToClipboard(unifiedDiff);
  };

  const getLineClass = (type: DiffLine["type"]) => {
    switch (type) {
      case "added":
        return "bg-green-100 dark:bg-green-900/30";
      case "removed":
        return "bg-red-100 dark:bg-red-900/30";
      case "modified":
        return "bg-yellow-100 dark:bg-yellow-900/30";
      default:
        return "";
    }
  };

  const renderSegments = (segments: DiffSegment[] | undefined, fallbackText: string) => {
    if (!segments) {
      return <span>{fallbackText || "\u00A0"}</span>;
    }
    return segments.map((seg, idx) => (
      <span
        key={idx}
        className={
          seg.type === "added"
            ? "bg-green-300 dark:bg-green-700"
            : seg.type === "removed"
              ? "bg-red-300 dark:bg-red-700"
              : ""
        }
      >
        {seg.text}
      </span>
    ));
  };

  return (
    <>
      <Breadcrumb />
      <div className="max-w-7xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Compare two texts or code snippets side by side with character-level highlighting of changes.
        </p>

        {/* Input Section */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              Original
            </label>
            <textarea
              placeholder="Paste original text or code..."
              value={text1}
              onChange={(e) => setText1(e.target.value)}
              rows={12}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-4 py-3 font-mono text-sm text-black outline-none transition placeholder:text-bodydark2 focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              Modified
            </label>
            <textarea
              placeholder="Paste modified text or code..."
              value={text2}
              onChange={(e) => setText2(e.target.value)}
              rows={12}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-4 py-3 font-mono text-sm text-black outline-none transition placeholder:text-bodydark2 focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            <Button
              handleOnClick={handleSwap}
              label="Swap"
              type="outline"
              icon={{ icon: MdSwapHoriz, position: "left", size: 18 }}
            />
            <Button
              handleOnClick={handleClear}
              label="Clear"
              type="reset"
              icon={{ icon: MdOutlineClear, position: "left", size: 18 }}
            />
            {(text1 || text2) && (
              <Button
                handleOnClick={copyUnifiedDiff}
                label="Copy Diff"
                type="outline"
                icon={{ icon: MdContentCopy, position: "left", size: 18 }}
              />
            )}
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-body dark:text-bodydark2">View:</span>
              <div className="flex rounded border border-stroke dark:border-strokedark overflow-hidden">
                <button
                  onClick={() => setViewMode("split")}
                  className={`px-3 py-1 text-sm ${viewMode === "split"
                    ? "bg-primary text-white"
                    : "bg-transparent text-body dark:text-bodydark2 hover:bg-gray-100 dark:hover:bg-meta-4"
                    }`}
                >
                  Split
                </button>
                <button
                  onClick={() => setViewMode("unified")}
                  className={`px-3 py-1 text-sm border-l border-stroke dark:border-strokedark ${viewMode === "unified"
                    ? "bg-primary text-white"
                    : "bg-transparent text-body dark:text-bodydark2 hover:bg-gray-100 dark:hover:bg-meta-4"
                    }`}
                >
                  Unified
                </button>
              </div>
            </div>

            {/* Line Numbers Toggle */}
            <label className="flex items-center gap-2 text-sm text-body dark:text-bodydark2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLineNumbers}
                onChange={(e) => setShowLineNumbers(e.target.checked)}
                className="w-4 h-4 rounded border-stroke"
              />
              Line numbers
            </label>
          </div>
        </div>

        {/* Stats */}
        {(text1 || text2) && (
          <div className="mb-4 flex flex-wrap gap-3">
            <span className="rounded bg-green-100 px-3 py-1 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-400">
              +{stats.added} added
            </span>
            <span className="rounded bg-red-100 px-3 py-1 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-400">
              -{stats.removed} removed
            </span>
            <span className="rounded bg-yellow-100 px-3 py-1 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
              ~{stats.modified} modified
            </span>
            <span className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              {stats.unchanged} unchanged
            </span>
          </div>
        )}

        {/* Diff Output */}
        {(text1 || text2) && (
          <div className="rounded-lg border border-stroke dark:border-strokedark overflow-hidden">
            {viewMode === "split" ? (
              <>
                {/* Split View Header */}
                <div className="grid grid-cols-2 bg-gray-50 dark:bg-meta-4">
                  <div className="border-r border-stroke dark:border-strokedark p-2 text-center text-sm font-medium text-bodydark dark:text-bodydark2">
                    Original
                  </div>
                  <div className="p-2 text-center text-sm font-medium text-bodydark dark:text-bodydark2">
                    Modified
                  </div>
                </div>

                {/* Split View Content */}
                <div className="grid grid-cols-2 border-t border-stroke dark:border-strokedark">
                  {/* Left Panel */}
                  <div className="border-r border-stroke font-mono text-sm dark:border-strokedark overflow-x-auto">
                    {diff.map((line, idx) => (
                      <div
                        key={idx}
                        className={`flex min-h-6 ${line.type === "removed" || line.type === "modified"
                          ? "bg-red-100 dark:bg-red-900/30"
                          : line.type === "added"
                            ? "bg-gray-50 dark:bg-meta-4"
                            : ""
                          }`}
                      >
                        {showLineNumbers && (
                          <span className="w-10 shrink-0 border-r border-stroke px-2 py-1 text-right text-xs text-bodydark2 dark:border-strokedark select-none">
                            {line.leftLine || ""}
                          </span>
                        )}
                        <pre className="flex-1 whitespace-pre px-2 py-1 text-black dark:text-white overflow-x-auto">
                          {line.type === "modified"
                            ? renderSegments(line.leftSegments, line.leftText)
                            : line.type === "added"
                              ? "\u00A0"
                              : line.leftText || "\u00A0"}
                        </pre>
                      </div>
                    ))}
                  </div>

                  {/* Right Panel */}
                  <div className="font-mono text-sm overflow-x-auto">
                    {diff.map((line, idx) => (
                      <div
                        key={idx}
                        className={`flex min-h-6 ${line.type === "added" || line.type === "modified"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : line.type === "removed"
                            ? "bg-gray-50 dark:bg-meta-4"
                            : ""
                          }`}
                      >
                        {showLineNumbers && (
                          <span className="w-10 shrink-0 border-r border-stroke px-2 py-1 text-right text-xs text-bodydark2 dark:border-strokedark select-none">
                            {line.rightLine || ""}
                          </span>
                        )}
                        <pre className="flex-1 whitespace-pre px-2 py-1 text-black dark:text-white overflow-x-auto">
                          {line.type === "modified"
                            ? renderSegments(line.rightSegments, line.rightText)
                            : line.type === "removed"
                              ? "\u00A0"
                              : line.rightText || "\u00A0"}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Unified View Header */}
                <div className="bg-gray-50 dark:bg-meta-4 p-2 text-sm font-medium text-bodydark dark:text-bodydark2 border-b border-stroke dark:border-strokedark">
                  Unified Diff
                </div>

                {/* Unified View Content */}
                <div className="font-mono text-sm overflow-x-auto">
                  {diff.map((line, idx) => (
                    <div
                      key={idx}
                      className={`flex min-h-6 ${getLineClass(line.type)}`}
                    >
                      {showLineNumbers && (
                        <>
                          <span className="w-10 shrink-0 border-r border-stroke px-2 py-1 text-right text-xs text-bodydark2 dark:border-strokedark select-none">
                            {line.leftLine || ""}
                          </span>
                          <span className="w-10 shrink-0 border-r border-stroke px-2 py-1 text-right text-xs text-bodydark2 dark:border-strokedark select-none">
                            {line.rightLine || ""}
                          </span>
                        </>
                      )}
                      <span className="w-6 shrink-0 px-1 py-1 text-center text-xs font-bold select-none">
                        {line.type === "added" ? "+" : line.type === "removed" ? "-" : line.type === "modified" ? "~" : ""}
                      </span>
                      <pre className="flex-1 whitespace-pre px-2 py-1 text-black dark:text-white overflow-x-auto">
                        {line.type === "modified" ? (
                          <>
                            <div className="bg-red-100 dark:bg-red-900/30 -mx-2 px-2">
                              -{renderSegments(line.leftSegments, line.leftText)}
                            </div>
                            <div className="bg-green-100 dark:bg-green-900/30 -mx-2 px-2">
                              +{renderSegments(line.rightSegments, line.rightText)}
                            </div>
                          </>
                        ) : line.type === "removed" ? (
                          line.leftText || "\u00A0"
                        ) : (
                          line.rightText || "\u00A0"
                        )}
                      </pre>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
          <div className="text-sm font-medium mb-2">Legend</div>
          <div className="flex flex-wrap gap-4 text-xs text-body dark:text-bodydark2">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-100 dark:bg-green-900/30 rounded"></span>
              <span>Added lines</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-red-100 dark:bg-red-900/30 rounded"></span>
              <span>Removed lines</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900/30 rounded"></span>
              <span>Modified lines</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-300 dark:bg-green-700 rounded"></span>
              <span>Added text within line</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-red-300 dark:bg-red-700 rounded"></span>
              <span>Removed text within line</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
