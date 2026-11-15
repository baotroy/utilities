export type DiffKind = "added" | "removed" | "changed" | "type";

export interface DiffEntry {
  path: string;
  kind: DiffKind;
  left?: unknown;
  right?: unknown;
}

export interface DiffOptions {
  ignoreArrayOrder: boolean;
  ignoreCase: boolean;
  numericStrings: boolean;
}

const typeOf = (v: unknown) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);

const keyPath = (base: string, key: string) =>
  /^[A-Za-z_$][\w$]*$/.test(key) ? `${base}.${key}` : `${base}[${JSON.stringify(key)}]`;

/** Stable string for sorting arrays when order does not matter. */
const canonical = (v: unknown): string => {
  if (Array.isArray(v)) return `[${v.map(canonical).sort().join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v as object)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
};

function sameScalar(a: unknown, b: unknown, o: DiffOptions): boolean {
  if (a === b) return true;
  if (o.numericStrings && (typeof a === "number" || typeof a === "string") && (typeof b === "number" || typeof b === "string")) {
    if (String(a).trim() !== "" && String(b).trim() !== "" && Number(a) === Number(b)) return true;
  }
  if (o.ignoreCase && typeof a === "string" && typeof b === "string") return a.toLowerCase() === b.toLowerCase();
  return false;
}

export function diffJson(left: unknown, right: unknown, options: DiffOptions, path = "$", out: DiffEntry[] = []): DiffEntry[] {
  const lt = typeOf(left);
  const rt = typeOf(right);
  if (lt === "array" && rt === "array") {
    let a = left as unknown[];
    let b = right as unknown[];
    if (options.ignoreArrayOrder) {
      a = [...a].sort((x, y) => canonical(x).localeCompare(canonical(y)));
      b = [...b].sort((x, y) => canonical(x).localeCompare(canonical(y)));
    }
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
      const p = `${path}[${i}]`;
      if (i >= a.length) out.push({ path: p, kind: "added", right: b[i] });
      else if (i >= b.length) out.push({ path: p, kind: "removed", left: a[i] });
      else diffJson(a[i], b[i], options, p, out);
    }
    return out;
  }
  if (lt === "object" && rt === "object") {
    const a = left as Record<string, unknown>;
    const b = right as Record<string, unknown>;
    const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
    for (const k of keys) {
      const p = keyPath(path, k);
      if (!(k in b)) out.push({ path: p, kind: "removed", left: a[k] });
      else if (!(k in a)) out.push({ path: p, kind: "added", right: b[k] });
      else diffJson(a[k], b[k], options, p, out);
    }
    return out;
  }
  if (lt !== rt && !(options.numericStrings && sameScalar(left, right, options))) {
    out.push({ path, kind: "type", left, right });
  } else if (!sameScalar(left, right, options)) {
    out.push({ path, kind: "changed", left, right });
  }
  return out;
}
