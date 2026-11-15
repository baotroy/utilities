export type EscapeKind = "json" | "js" | "html" | "xml" | "sql" | "csv" | "regex" | "unicode" | "shell";

export const ESCAPE_KINDS: { value: EscapeKind; label: string }[] = [
  { value: "json", label: "JSON" },
  { value: "js", label: "JavaScript" },
  { value: "html", label: "HTML" },
  { value: "xml", label: "XML" },
  { value: "sql", label: "SQL" },
  { value: "csv", label: "CSV" },
  { value: "regex", label: "Regex" },
  { value: "unicode", label: "Unicode \\u" },
  { value: "shell", label: "Shell" },
];

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const XML_ESCAPES: Record<string, string> = { ...HTML_ESCAPES, "'": "&apos;" };

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0", copy: "©", reg: "®", trade: "™",
  hellip: "…", mdash: "—", ndash: "–", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", euro: "€",
  pound: "£", yen: "¥", cent: "¢", deg: "°", times: "×", divide: "÷", middot: "·", laquo: "«", raquo: "»",
};

const decodeEntities = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? m;
  });

/** Backslash escapes shared by JS and the \u form. */
function unescapeBackslashes(s: string): string {
  return s.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[0-7]{1,3}|.)/gs, (m, e: string) => {
    if (e[0] === "u") return String.fromCodePoint(parseInt(e[1] === "{" ? e.slice(2, -1) : e.slice(1), 16));
    if (e[0] === "x") return String.fromCharCode(parseInt(e.slice(1), 16));
    if (/^[0-7]+$/.test(e)) return e === "0" ? "\0" : String.fromCharCode(parseInt(e, 8));
    const map: Record<string, string> = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", v: "\v", "\n": "" };
    return map[e] ?? e;
  });
}

export function escapeText(s: string, kind: EscapeKind): string {
  switch (kind) {
    case "json":
      return JSON.stringify(s).slice(1, -1);
    case "js":
      return s.replace(/[\\'"`\n\r\t\b\f\v\0\u2028\u2029]|\$\{/g, (c) => {
        const map: Record<string, string> = {
          "\\": "\\\\", "'": "\\'", '"': '\\"', "`": "\\`", "\n": "\\n", "\r": "\\r", "\t": "\\t",
          "\b": "\\b", "\f": "\\f", "\v": "\\v", "\0": "\\0", "\u2028": "\\u2028", "\u2029": "\\u2029", "${": "\\${",
        };
        return map[c];
      });
    case "html":
      return s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
    case "xml":
      return s.replace(/[&<>"']/g, (c) => XML_ESCAPES[c]);
    case "sql":
      return s.replace(/'/g, "''");
    case "csv":
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    case "regex":
      return s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    case "unicode":
      return Array.from(s)
        .map((c) => {
          const cp = c.codePointAt(0)!;
          if (cp >= 0x20 && cp < 0x7f) return c;
          if (cp > 0xffff) return c.split("").map((u) => `\\u${u.charCodeAt(0).toString(16).padStart(4, "0")}`).join("");
          return `\\u${cp.toString(16).padStart(4, "0")}`;
        })
        .join("");
    case "shell":
      return `'${s.replace(/'/g, `'\\''`)}'`;
  }
}

export function unescapeText(s: string, kind: EscapeKind): string {
  switch (kind) {
    case "json":
      // a bare quote inside the input is taken literally
      return JSON.parse(`"${s.replace(/\\.|"|\n|\r|\t/gs, (m) => (m === '"' ? '\\"' : m === "\n" ? "\\n" : m === "\r" ? "\\r" : m === "\t" ? "\\t" : m))}"`);
    case "js":
    case "unicode":
      return unescapeBackslashes(s);
    case "html":
    case "xml":
      return decodeEntities(s);
    case "sql":
      return s.replace(/''/g, "'");
    case "csv": {
      const t = s.trim();
      return t.startsWith('"') && t.endsWith('"') ? t.slice(1, -1).replace(/""/g, '"') : s;
    }
    case "regex":
      return s.replace(/\\([.*+?^${}()|[\]\\/])/g, "$1");
    case "shell": {
      const t = s.trim();
      if (t.startsWith("'") && t.endsWith("'")) return t.slice(1, -1).replace(/'\\''/g, "'");
      if (t.startsWith('"') && t.endsWith('"')) return t.slice(1, -1).replace(/\\(["\\$`])/g, "$1");
      return t.replace(/\\(.)/g, "$1");
    }
  }
}
