import yaml from "js-yaml";

export interface EnvEntry {
  key: string;
  value: string;
  line: number;
}

export interface EnvParseResult {
  entries: EnvEntry[];
  errors: string[];
}

const KEY_RE = /^[A-Za-z_][A-Za-z0-9_.\-]*$/;

/**
 * Parse a .env file the way dotenv / docker compose do:
 * - `#` comments and blank lines are skipped, `export ` prefix is allowed
 * - double quotes support escapes (\n, \t, \", \\) and may span lines
 * - single quotes are literal and may span lines
 * - unquoted values are trimmed and lose an inline ` # comment`
 */
export function parseEnv(text: string): EnvParseResult {
  const entries: EnvEntry[] = [];
  const errors: string[] = [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const lineNo = i + 1;
    let line = lines[i];
    i++;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    line = line.replace(/^\s*export\s+/, "");
    const eq = line.indexOf("=");
    const colon = line.indexOf(":");
    // Also accept YAML-ish "KEY: value" when there is no "="
    const sepIdx = eq !== -1 ? eq : colon;
    if (sepIdx === -1) {
      errors.push(`Line ${lineNo}: missing "=" in "${trimmed}"`);
      continue;
    }
    const key = line.slice(0, sepIdx).trim();
    if (!KEY_RE.test(key)) {
      errors.push(`Line ${lineNo}: invalid variable name "${key}"`);
      continue;
    }
    let rest = line.slice(sepIdx + 1).replace(/^\s+/, "");
    let value: string;
    const q = rest[0];
    if (q === '"' || q === "'" || q === "`") {
      // Read until the matching unescaped quote, possibly across lines
      let buf = rest.slice(1);
      let end = findClosingQuote(buf, q);
      while (end === -1 && i < lines.length) {
        buf += "\n" + lines[i];
        i++;
        end = findClosingQuote(buf, q);
      }
      if (end === -1) {
        errors.push(`Line ${lineNo}: unterminated ${q} quote for ${key}`);
        value = buf;
      } else {
        value = buf.slice(0, end);
      }
      if (q === '"') value = unescapeDouble(value);
    } else {
      const hash = rest.search(/\s#/);
      if (hash !== -1) rest = rest.slice(0, hash);
      value = rest.trim();
    }
    const existing = entries.findIndex((e) => e.key === key);
    if (existing !== -1) {
      errors.push(`Line ${lineNo}: ${key} is defined again (line ${entries[existing].line}); the last value wins`);
      entries.splice(existing, 1);
    }
    entries.push({ key, value, line: lineNo });
  }
  return { entries, errors };
}

function findClosingQuote(s: string, q: string): number {
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\\" && q === '"') {
      i++;
      continue;
    }
    if (s[i] === q) return i;
  }
  return -1;
}

function unescapeDouble(s: string): string {
  return s.replace(/\\([nrt"\\$])/g, (_, c) => ({ n: "\n", r: "\r", t: "\t" } as Record<string, string>)[c] ?? c);
}

/** Turn "true", "42", "null"… into typed values when asked to. */
function typed(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(value) && Number.isSafeInteger(Math.trunc(Number(value)))) return Number(value);
  return value;
}

export interface EnvToObjOptions {
  nestSeparator: string; // "" = flat
  parseTypes: boolean;
  lowerCaseKeys: boolean;
}

export function envToObject(entries: EnvEntry[], opts: EnvToObjOptions): { data: Record<string, unknown>; errors: string[] } {
  const data: Record<string, any> = {};
  const errors: string[] = [];
  for (const { key, value } of entries) {
    const v = opts.parseTypes ? typed(value) : value;
    const k = opts.lowerCaseKeys ? key.toLowerCase() : key;
    if (!opts.nestSeparator) {
      data[k] = v;
      continue;
    }
    const parts = k.split(opts.nestSeparator).filter(Boolean);
    let node = data;
    let ok = true;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (node[p] === undefined) node[p] = {};
      else if (typeof node[p] !== "object" || node[p] === null) {
        errors.push(`${key}: "${parts.slice(0, i + 1).join(opts.nestSeparator)}" already has a value, so it cannot be nested; kept flat`);
        ok = false;
        break;
      }
      node = node[p];
    }
    if (!ok) {
      data[k] = v;
      continue;
    }
    const last = parts[parts.length - 1];
    if (typeof node[last] === "object" && node[last] !== null) {
      errors.push(`${key}: conflicts with nested keys of the same name; kept flat`);
      data[k] = v;
    } else node[last] = v;
  }
  return { data, errors };
}

export type ObjFormat = "json" | "yaml";

export function stringifyObj(data: unknown, format: ObjFormat, indent: number): string {
  if (format === "json") return JSON.stringify(data, null, indent);
  return yaml.dump(data, { indent, lineWidth: -1, noRefs: true, quotingType: '"' });
}

/* ------------------------------------------------------------------ */
/* JSON / YAML -> .env                                                  */
/* ------------------------------------------------------------------ */

export interface ObjToEnvOptions {
  separator: string;
  upperCase: boolean;
  arrays: "index" | "json";
  quote: "auto" | "double" | "single" | "none";
  exportPrefix: boolean;
}

/** Parse JSON first, then YAML. Returns the detected format. */
export function parseObject(text: string): { data: unknown; format: ObjFormat } {
  const t = text.trim();
  if (t.startsWith("{") || t.startsWith("[")) {
    try {
      return { data: JSON.parse(t), format: "json" };
    } catch {
      // fall through to YAML (which is a superset of JSON)
    }
  }
  return { data: yaml.load(text), format: "yaml" };
}

function sanitizeKey(k: string, upper: boolean): string {
  let s = k.replace(/[^A-Za-z0-9_]/g, "_");
  if (/^\d/.test(s)) s = "_" + s;
  return upper ? s.toUpperCase() : s;
}

function flatten(value: unknown, prefix: string, opts: ObjToEnvOptions, out: [string, string][]) {
  const join = (k: string) => (prefix ? `${prefix}${opts.separator}${k}` : k);
  if (Array.isArray(value)) {
    if (opts.arrays === "json" && prefix) {
      out.push([prefix, JSON.stringify(value)]);
      return;
    }
    value.forEach((v, i) => flatten(v, join(String(i)), opts, out));
    return;
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length && prefix) out.push([prefix, ""]);
    for (const [k, v] of entries) flatten(v, join(sanitizeKey(k, opts.upperCase)), opts, out);
    return;
  }
  if (!prefix) return;
  out.push([prefix, value === null || value === undefined ? "" : String(value)]);
}

function quoteValue(v: string, mode: ObjToEnvOptions["quote"]): string {
  const dq = () => '"' + v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t") + '"';
  switch (mode) {
    case "double":
      return dq();
    case "single":
      return v.includes("'") ? dq() : `'${v}'`;
    case "none":
      return v;
    default:
      if (v === "") return "";
      return /^[A-Za-z0-9_\-./:@,+%=]*$/.test(v) ? v : dq();
  }
}

export function objectToEnv(data: unknown, opts: ObjToEnvOptions): string {
  const pairs: [string, string][] = [];
  // Compose-style list: ["KEY=value", ...]
  if (Array.isArray(data) && data.every((x) => typeof x === "string" && x.includes("="))) {
    for (const s of data as string[]) {
      const eq = s.indexOf("=");
      pairs.push([s.slice(0, eq), s.slice(eq + 1)]);
    }
  } else if (data !== null && typeof data === "object") {
    flatten(data, "", opts, pairs);
  } else {
    throw new Error("Input must be an object (or a list of KEY=value strings).");
  }
  const prefix = opts.exportPrefix ? "export " : "";
  return pairs.map(([k, v]) => `${prefix}${k}=${quoteValue(v, opts.quote)}`).join("\n") + (pairs.length ? "\n" : "");
}
