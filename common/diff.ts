export type DiffOpType = "equal" | "added" | "removed";

export interface DiffOp<T> {
  type: DiffOpType;
  value: T;
  /** 0-based index in the original sequence (equal / removed) */
  aIndex?: number;
  /** 0-based index in the modified sequence (equal / added) */
  bIndex?: number;
}

// Above this many DP cells the LCS table would use too much memory
// (4 bytes per cell), so we fall back to a coarse diff for the middle part.
const MAX_LCS_CELLS = 16_000_000;

/**
 * Longest-common-subsequence diff between two sequences.
 *
 * Optimizations over a naive LCS:
 *  - the common prefix and suffix are stripped first (typical edits touch
 *    a small part of the text, so the DP table becomes tiny);
 *  - the DP table is one flat Uint32Array instead of an array of arrays.
 *
 * Output is in forward order; within a changed block all removals come
 * before the additions.
 */
export function lcsDiff<T>(a: T[], b: T[]): DiffOp<T>[] {
  const m = a.length;
  const n = b.length;

  let start = 0;
  while (start < m && start < n && a[start] === b[start]) start++;

  let endA = m;
  let endB = n;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  const ops: DiffOp<T>[] = [];
  for (let i = 0; i < start; i++) {
    ops.push({ type: "equal", value: a[i], aIndex: i, bIndex: i });
  }

  const rows = endA - start;
  const cols = endB - start;

  if (rows > 0 || cols > 0) {
    if (rows === 0 || cols === 0 || (rows + 1) * (cols + 1) > MAX_LCS_CELLS) {
      // Nothing in common to search for (or too large): plain replace
      for (let i = start; i < endA; i++) {
        ops.push({ type: "removed", value: a[i], aIndex: i });
      }
      for (let j = start; j < endB; j++) {
        ops.push({ type: "added", value: b[j], bIndex: j });
      }
    } else {
      // dp[i][j] = LCS length of a[start+i..endA) and b[start+j..endB)
      // (suffix form, so we can walk forward when reconstructing)
      const width = cols + 1;
      const dp = new Uint32Array((rows + 1) * width);
      for (let i = rows - 1; i >= 0; i--) {
        const ai = a[start + i];
        for (let j = cols - 1; j >= 0; j--) {
          dp[i * width + j] =
            ai === b[start + j]
              ? dp[(i + 1) * width + j + 1] + 1
              : Math.max(dp[(i + 1) * width + j], dp[i * width + j + 1]);
        }
      }

      let i = 0;
      let j = 0;
      const removed: DiffOp<T>[] = [];
      const added: DiffOp<T>[] = [];
      const flush = () => {
        ops.push(...removed, ...added);
        removed.length = 0;
        added.length = 0;
      };
      while (i < rows || j < cols) {
        if (i < rows && j < cols && a[start + i] === b[start + j]) {
          flush();
          ops.push({
            type: "equal",
            value: a[start + i],
            aIndex: start + i,
            bIndex: start + j,
          });
          i++;
          j++;
        } else if (
          j < cols &&
          (i === rows || dp[i * width + j + 1] >= dp[(i + 1) * width + j])
        ) {
          added.push({ type: "added", value: b[start + j], bIndex: start + j });
          j++;
        } else {
          removed.push({ type: "removed", value: a[start + i], aIndex: start + i });
          i++;
        }
      }
      flush();
    }
  }

  for (let k = 0; k < m - endA; k++) {
    ops.push({
      type: "equal",
      value: a[endA + k],
      aIndex: endA + k,
      bIndex: endB + k,
    });
  }

  return ops;
}
