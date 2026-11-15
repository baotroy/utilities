"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState, useMemo } from "react";
import { lcsDiff } from "@/common/diff";

type Granularity = "word" | "char";

interface Segment {
  text: string;
  changed: boolean;
}

interface DiffLine {
  type: "equal" | "added" | "removed" | "blank";
  text: string;
  lineNumber?: number;
  /** Parts of the line; the changed ones get the strong highlight */
  segments?: Segment[];
}

interface DiffRow {
  left: DiffLine;
  right: DiffLine;
}

const BLANK: DiffLine = { type: "blank", text: "" };

// Words (letters, digits, underscore in any language), runs of whitespace,
// or single punctuation characters.
const tokenize = (text: string, granularity: Granularity): string[] =>
  granularity === "char"
    ? Array.from(text)
    : text.match(/[\p{L}\p{N}_]+|\s+|[^\p{L}\p{N}_\s]/gu) ?? [];

function pushSegment(list: Segment[], text: string, changed: boolean) {
  const last = list[list.length - 1];
  if (last && last.changed === changed) last.text += text;
  else list.push({ text, changed });
}

// Whitespace that sits between two changed parts is highlighted too, so a
// rewritten phrase shows as one block instead of a row of separate words.
function bridgeWhitespace(list: Segment[]): Segment[] {
  const out: Segment[] = [];
  list.forEach((seg, i) => {
    const bridge =
      !seg.changed &&
      /^\s+$/.test(seg.text) &&
      list[i - 1]?.changed &&
      list[i + 1]?.changed;
    pushSegment(out, seg.text, seg.changed || !!bridge);
  });
  return out;
}

// Diff inside one pair of lines: which parts of the old line were removed
// and which parts of the new line were added.
function diffInline(
  oldText: string,
  newText: string,
  granularity: Granularity
): { left: Segment[]; right: Segment[] } {
  const ops = lcsDiff(tokenize(oldText, granularity), tokenize(newText, granularity));
  const left: Segment[] = [];
  const right: Segment[] = [];
  for (const op of ops) {
    if (op.type === "equal") {
      pushSegment(left, op.value, false);
      pushSegment(right, op.value, false);
    } else if (op.type === "removed") {
      pushSegment(left, op.value, true);
    } else {
      pushSegment(right, op.value, true);
    }
  }
  return { left: bridgeWhitespace(left), right: bridgeWhitespace(right) };
}

// How alike two lines are, from 0 (nothing in common) to 1 (identical),
// ignoring whitespace.
function similarity(a: string, b: string): number {
  const ta = tokenize(a, "word").filter((t) => t.trim());
  const tb = tokenize(b, "word").filter((t) => t.trim());
  if (ta.length === 0 || tb.length === 0) return 0;
  const common = lcsDiff(ta, tb).filter((op) => op.type === "equal").length;
  return (2 * common) / (ta.length + tb.length);
}

const MIN_PAIR_SIMILARITY = 0.4;
const MAX_ALIGN_CELLS = 4000;

// Inside a block of removed lines followed by added lines, decide which old
// line was rewritten into which new line. Lines are paired (in order) only
// when they are similar enough; the rest stay on a row of their own, so a
// brand new line is never compared against an unrelated old one.
type Alignment = [old: number | null, new: number | null, unrelated?: boolean];

function alignBlock(removed: string[], added: string[]): Alignment[] {
  const m = removed.length;
  const n = added.length;
  const out: Alignment[] = [];

  if (m === 0 || n === 0 || m * n > MAX_ALIGN_CELLS) {
    const count = Math.max(m, n);
    for (let r = 0; r < count; r++) out.push([r < m ? r : null, r < n ? r : null]);
    return out;
  }

  const sim: number[] = new Array(m * n);
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++) sim[i * n + j] = similarity(removed[i], added[j]);

  // best[i][j] = best total similarity pairing removed[i..] with added[j..]
  const w = n + 1;
  const best = new Float64Array((m + 1) * w);
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      const s = sim[i * n + j];
      let v = Math.max(best[(i + 1) * w + j], best[i * w + j + 1]);
      if (s >= MIN_PAIR_SIMILARITY) v = Math.max(v, s + best[(i + 1) * w + j + 1]);
      best[i * w + j] = v;
    }
  }

  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    const s = sim[i * n + j];
    const here = best[i * w + j];
    if (s >= MIN_PAIR_SIMILARITY && here === s + best[(i + 1) * w + j + 1]) {
      out.push([i++, j++]);
    } else if (here === best[(i + 1) * w + j]) {
      out.push([i++, null]);
    } else {
      out.push([null, j++]);
    }
  }
  while (i < m) out.push([i++, null]);
  while (j < n) out.push([null, j++]);

  // An unrelated old line directly followed by an unrelated new line share a
  // row to save space; they are flagged so they are not compared in detail.
  const merged: Alignment[] = [];
  for (const entry of out) {
    const prev = merged[merged.length - 1];
    if (prev && prev[1] === null && entry[0] === null && !prev[2]) {
      merged[merged.length - 1] = [prev[0], entry[1], true];
    } else {
      merged.push(entry);
    }
  }
  return merged;
}

// Line-based diff using LCS so an inserted/deleted line does not mark every
// following line as changed. A removed line and the added line that replaces
// it share a row and are compared again word by word (or character by
// character) to find the exact text that differs.
function computeDiff(text1: string, text2: string, granularity: Granularity): DiffRow[] {
  const ops = lcsDiff(text1.split("\n"), text2.split("\n"));
  const rows: DiffRow[] = [];

  let k = 0;
  while (k < ops.length) {
    const op = ops[k];
    if (op.type === "equal") {
      rows.push({
        left: { type: "equal", text: op.value, lineNumber: op.aIndex! + 1 },
        right: { type: "equal", text: op.value, lineNumber: op.bIndex! + 1 },
      });
      k++;
      continue;
    }
    const removed: typeof ops = [];
    const added: typeof ops = [];
    while (k < ops.length && ops[k].type === "removed") removed.push(ops[k++]);
    while (k < ops.length && ops[k].type === "added") added.push(ops[k++]);

    for (const [ri, ai, unrelated] of alignBlock(
      removed.map((o) => o.value),
      added.map((o) => o.value)
    )) {
      const rem = ri === null ? undefined : removed[ri];
      const add = ai === null ? undefined : added[ai];
      const inline = rem && add && !unrelated ? diffInline(rem.value, add.value, granularity) : null;
      rows.push({
        left: rem
          ? {
              type: "removed",
              text: rem.value,
              lineNumber: rem.aIndex! + 1,
              segments: inline?.left ?? [{ text: rem.value, changed: true }],
            }
          : BLANK,
        right: add
          ? {
              type: "added",
              text: add.value,
              lineNumber: add.bIndex! + 1,
              segments: inline?.right ?? [{ text: add.value, changed: true }],
            }
          : BLANK,
      });
    }
  }

  return rows;
}

const LINE_CLASS: Record<DiffLine["type"], string> = {
  equal: "",
  added: "bg-green-100 dark:bg-green-900/40",
  removed: "bg-red-100 dark:bg-red-900/40",
  blank: "bg-gray-100 dark:bg-white/5",
};

const GUTTER_CLASS: Record<DiffLine["type"], string> = {
  equal: "text-bodydark2",
  added: "bg-green-200 text-green-900 dark:bg-green-800/60 dark:text-green-100",
  removed: "bg-red-200 text-red-900 dark:bg-red-800/60 dark:text-red-100",
  blank: "",
};

// Strong background for the exact text that differs
const MARK_CLASS: Record<"added" | "removed", string> = {
  added:
    "rounded-sm bg-green-400 font-semibold text-black dark:bg-green-500 dark:text-black",
  removed:
    "rounded-sm bg-red-400 font-semibold text-black dark:bg-red-500 dark:text-black",
};

function DiffCell({ line, bordered }: { line: DiffLine; bordered?: boolean }) {
  const sign = line.type === "added" ? "+" : line.type === "removed" ? "-" : "";
  return (
    <div
      className={`flex min-w-0 ${LINE_CLASS[line.type]} ${
        bordered ? "border-r border-stroke dark:border-strokedark" : ""
      }`}
    >
      <span
        className={`w-10 shrink-0 select-none border-r border-stroke px-2 py-1 text-right text-xs dark:border-strokedark ${GUTTER_CLASS[line.type]}`}
      >
        {line.lineNumber}
      </span>
      <span className="w-5 shrink-0 select-none py-1 text-center font-bold text-black dark:text-white">
        {sign}
      </span>
      <pre className="min-w-0 flex-1 whitespace-pre-wrap break-all py-1 pr-2 text-black dark:text-white">
        {line.type === "added" || line.type === "removed"
          ? line.segments!.map((seg, i) =>
              seg.changed && seg.text ? (
                <mark key={i} className={MARK_CLASS[line.type as "added" | "removed"]}>
                  {seg.text}
                </mark>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )
          : null}
        {line.type === "equal" ? line.text : null}
        {line.text ? null : "\u00A0"}
      </pre>
    </div>
  );
}

export default function TextCompareComponent() {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");

  const [granularity, setGranularity] = useState<Granularity>("word");

  const rows = useMemo(
    () => computeDiff(text1, text2, granularity),
    [text1, text2, granularity]
  );

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let unchanged = 0;

    rows.forEach(({ left, right }) => {
      if (left.type === "removed") removed++;
      if (right.type === "added") added++;
      if (left.type === "equal") unchanged++;
    });

    return { added, removed, unchanged };
  }, [rows]);

  const handleClear = () => {
    setText1("");
    setText2("");
  };

  const handleSwap = () => {
    const temp = text1;
    setText1(text2);
    setText2(temp);
  };

  return (
    <>
      <Breadcrumb />
      <p className="mb-6 text-sm text-body dark:text-bodydark2">
        Compare two texts side by side. Changed lines are tinted and the exact text that differs is highlighted.
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
      <div className="mb-6 flex flex-wrap items-center gap-3">
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
        <div className="ml-auto flex items-center gap-2 text-sm text-black dark:text-white">
          <span>Highlight by</span>
          <div className="inline-flex overflow-hidden rounded-md border border-stroke dark:border-strokedark">
            {(["word", "char"] as const).map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={granularity === g}
                onClick={() => setGranularity(g)}
                className={`px-3 py-1.5 font-medium ${
                  granularity === g
                    ? "bg-primary text-white"
                    : "text-bodydark hover:bg-gray-100 dark:text-bodydark2 dark:hover:bg-white/10"
                }`}
              >
                {g === "word" ? "Word" : "Character"}
              </button>
            ))}
          </div>
        </div>
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
          <div className="border-t border-stroke font-mono text-sm dark:border-strokedark">
            {rows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-2">
                <DiffCell line={row.left} bordered />
                <DiffCell line={row.right} />
              </div>
            ))}
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
            <li>Inside a changed line, the exact words or characters that differ get a stronger background</li>
          </ul>
        </div>
      )}
    </>
  );
}
