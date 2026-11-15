// Sorting helpers for the Array Sorter tool (pure functions, no React)

export type SortOrder = "asc" | "desc";
export type SortType = "auto" | "number" | "string" | "date";

export interface SortKey {
  /** dotted path into each element ("" = the element itself), e.g. user.age */
  path: string;
  order: SortOrder;
  type: SortType;
}

export interface SortOptions {
  caseSensitive: boolean;
  /** "item2" before "item10" */
  natural: boolean;
  removeDuplicates: boolean;
}

export type InputFormat = "json" | "lines";

export interface ParsedInput {
  items: unknown[];
  format: InputFormat;
}

// ------------------------------------------------------------------ parsing

/**
 * Relaxed JSON reader for arrays copied from JavaScript: accepts single
 * quoted strings, unquoted keys, trailing commas, comments, undefined and
 * NaN/Infinity, on top of plain JSON.
 */
export function parseRelaxed(text: string): unknown {
  let i = 0;
  const fail = (what: string): never => {
    const line = text.slice(0, i).split("\n").length;
    throw new Error(`${what} at line ${line}`);
  };
  const skip = () => {
    for (;;) {
      while (i < text.length && /\s/.test(text[i])) i++;
      if (text.startsWith("//", i)) {
        while (i < text.length && text[i] !== "\n") i++;
      } else if (text.startsWith("/*", i)) {
        const end = text.indexOf("*/", i + 2);
        i = end < 0 ? text.length : end + 2;
      } else return;
    }
  };
  const readString = (): string => {
    const quote = text[i++];
    let out = "";
    while (i < text.length && text[i] !== quote) {
      let c = text[i++];
      if (c === "\\") {
        c = text[i++];
        const map: Record<string, string> = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", "0": "\0" };
        if (c === "u") {
          out += String.fromCharCode(parseInt(text.slice(i, i + 4), 16));
          i += 4;
          continue;
        }
        out += map[c] ?? c;
      } else out += c;
    }
    if (text[i] !== quote) fail("Unterminated string");
    i++;
    return out;
  };
  const readValue = (): unknown => {
    skip();
    const c = text[i];
    if (c === "[") {
      i++;
      const arr: unknown[] = [];
      for (;;) {
        skip();
        if (text[i] === "]") {
          i++;
          return arr;
        }
        arr.push(readValue());
        skip();
        if (text[i] === ",") i++;
        else if (text[i] !== "]") fail('Expected "," or "]"');
      }
    }
    if (c === "{") {
      i++;
      const obj: Record<string, unknown> = {};
      for (;;) {
        skip();
        if (text[i] === "}") {
          i++;
          return obj;
        }
        let key: string;
        if (text[i] === '"' || text[i] === "'") key = readString();
        else {
          const m = /^[A-Za-z0-9_$]+/.exec(text.slice(i));
          if (!m) fail("Expected a key");
          key = m![0];
          i += key.length;
        }
        skip();
        if (text[i] !== ":") fail('Expected ":"');
        i++;
        obj[key] = readValue();
        skip();
        if (text[i] === ",") i++;
        else if (text[i] !== "}") fail('Expected "," or "}"');
      }
    }
    if (c === '"' || c === "'" || c === "`") return readString();
    const m = /^(0x[0-9a-fA-F]+|-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?|true|false|null|undefined|-?Infinity|NaN)/.exec(
      text.slice(i)
    );
    if (!m) fail("Unexpected character");
    i += m![0].length;
    const word = m![0];
    if (word === "true") return true;
    if (word === "false") return false;
    if (word === "null") return null;
    if (word === "undefined") return undefined;
    return Number(word);
  };
  const value = readValue();
  skip();
  if (i < text.length) fail("Unexpected text after the value");
  return value;
}

/**
 * Accepts a JSON / JavaScript array, or one value per line (numbers stay
 * numbers). The output is written back in the same format.
 */
export function parseInput(text: string): ParsedInput {
  const trimmed = text.trim();
  if (!trimmed) return { items: [], format: "lines" };
  if (trimmed.startsWith("[")) {
    let value: unknown;
    try {
      value = JSON.parse(trimmed);
    } catch {
      value = parseRelaxed(trimmed);
    }
    if (!Array.isArray(value)) throw new Error("The input is not an array");
    return { items: value, format: "json" };
  }
  if (trimmed.startsWith("{")) {
    throw new Error("The input is an object, wrap the items in [ ] to sort them");
  }
  const items = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .map((line) => (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(line) ? Number(line) : line));
  return { items, format: "lines" };
}

export function formatOutput(items: unknown[], format: InputFormat, indent: number): string {
  if (format === "lines") {
    return items
      .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
      .join("\n");
  }
  return JSON.stringify(items, null, indent || undefined);
}

// ------------------------------------------------------------------ fields

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Dotted paths of the fields found in the elements (nested objects included). */
export function collectFields(items: unknown[], maxDepth = 3): string[] {
  const seen = new Set<string>();
  const walk = (value: unknown, prefix: string, depth: number) => {
    if (!isPlainObject(value) || depth > maxDepth) return;
    for (const [key, child] of Object.entries(value)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (isPlainObject(child)) walk(child, path, depth + 1);
      else seen.add(path);
    }
  };
  // a sample is enough to offer the fields
  for (const item of items.slice(0, 500)) walk(item, "", 1);
  return Array.from(seen);
}

export function getPath(value: unknown, path: string): unknown {
  if (!path) return value;
  let current: unknown = value;
  for (const part of path.split(".")) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current) && /^\d+$/.test(part)) current = current[Number(part)];
    else if (typeof current === "object") current = (current as Record<string, unknown>)[part];
    else return undefined;
  }
  return current;
}

// ------------------------------------------------------------------ compare

const isEmpty = (v: unknown) => v === null || v === undefined || v === "";

const toNumber = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "string" && v.trim() !== "") return Number(v.replace(/[_,\s]/g, ""));
  return NaN;
};

const toDate = (v: unknown): number => {
  if (typeof v === "number") return v < 1e11 ? v * 1000 : v; // seconds or ms
  if (typeof v === "string") {
    if (/^\d{9,13}$/.test(v.trim())) return toDate(Number(v));
    return Date.parse(v);
  }
  return NaN;
};

const toText = (v: unknown): string =>
  typeof v === "string" ? v : typeof v === "object" ? JSON.stringify(v) : String(v);

// order of kinds when the values of a key are of different types
const kindRank = (v: unknown): number => {
  if (typeof v === "number" || typeof v === "bigint") return 0;
  if (typeof v === "string") return 1;
  if (typeof v === "boolean") return 2;
  return 3; // objects, arrays
};

function compareValues(a: unknown, b: unknown, type: SortType, options: SortOptions): number {
  const collator = new Intl.Collator(undefined, {
    numeric: options.natural,
    sensitivity: options.caseSensitive ? "variant" : "base",
  });
  const text = (x: unknown, y: unknown) => {
    const r = collator.compare(toText(x), toText(y));
    // case-insensitive ties keep a stable but predictable order
    return r !== 0 || !options.caseSensitive ? r : toText(x) < toText(y) ? -1 : toText(x) > toText(y) ? 1 : 0;
  };

  if (type === "number" || type === "date") {
    const conv = type === "number" ? toNumber : toDate;
    const x = conv(a);
    const y = conv(b);
    const xBad = Number.isNaN(x);
    const yBad = Number.isNaN(y);
    // values that are not numbers / dates go after the others
    if (xBad || yBad) return xBad && yBad ? text(a, b) : xBad ? 1 : -1;
    return x - y;
  }
  if (type === "string") return text(a, b);

  // auto
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "bigint" && typeof b === "bigint") return a < b ? -1 : a > b ? 1 : 0;
  if (typeof a === "string" && typeof b === "string") {
    // numeric strings ("10", "9.5") compare as numbers
    const x = toNumber(a);
    const y = toNumber(b);
    if (!Number.isNaN(x) && !Number.isNaN(y) && /^[\s\d.,_eE+-]+$/.test(a + b)) return x - y;
    return text(a, b);
  }
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  const rank = kindRank(a) - kindRank(b);
  return rank !== 0 ? rank : text(a, b);
}

/**
 * Stable multi-key sort. Missing / null / empty values always go last,
 * whatever the order of the key, so they do not hide the real data.
 */
export function sortItems(items: unknown[], keys: SortKey[], options: SortOptions): unknown[] {
  const effective = keys.length > 0 ? keys : [{ path: "", order: "asc" as SortOrder, type: "auto" as SortType }];
  let list = items;
  if (options.removeDuplicates) {
    const seen = new Set<string>();
    list = items.filter((item) => {
      let id = typeof item === "string" ? "s:" + item : JSON.stringify(item) ?? "undefined";
      if (typeof item === "string" && !options.caseSensitive) id = id.toLowerCase();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }
  // decorate once: reading nested paths for every comparison is slow on big arrays
  const decorated = list.map((item, index) => ({
    item,
    index,
    values: effective.map((key) => getPath(item, key.path)),
  }));
  decorated.sort((x, y) => {
    for (let k = 0; k < effective.length; k++) {
      const a = x.values[k];
      const b = y.values[k];
      const ea = isEmpty(a);
      const eb = isEmpty(b);
      if (ea || eb) {
        if (ea && eb) continue;
        return ea ? 1 : -1;
      }
      const r = compareValues(a, b, effective[k].type, options);
      if (r !== 0 && !Number.isNaN(r)) return effective[k].order === "asc" ? r : -r;
    }
    return x.index - y.index;
  });
  return decorated.map((d) => d.item);
}
