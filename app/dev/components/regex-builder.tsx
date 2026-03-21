"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState, useMemo } from "react";
import { copyToClipboard } from "@/common/utils";
import clsx from "clsx";

interface RegexToken {
  id: string;
  pattern: string;
  label: string;
  description: string;
}

interface RegexFlag {
  flag: string;
  label: string;
  description: string;
}

const FLAGS: RegexFlag[] = [
  { flag: "g", label: "g", description: "Global — find all matches" },
  { flag: "i", label: "i", description: "Case-insensitive" },
  { flag: "m", label: "m", description: "Multiline — ^ and $ match line boundaries" },
  { flag: "s", label: "s", description: "Dotall — . matches newlines" },
  { flag: "u", label: "u", description: "Unicode mode" },
];

const TOKEN_GROUPS: { group: string; tokens: RegexToken[] }[] = [
  {
    group: "Character Classes",
    tokens: [
      { id: "dot", pattern: ".", label: ".", description: "Any character (except newline)" },
      { id: "digit", pattern: "\\d", label: "\\d", description: "Any digit (0-9)" },
      { id: "non-digit", pattern: "\\D", label: "\\D", description: "Non-digit" },
      { id: "word", pattern: "\\w", label: "\\w", description: "Word char (a-z, A-Z, 0-9, _)" },
      { id: "non-word", pattern: "\\W", label: "\\W", description: "Non-word character" },
      { id: "whitespace", pattern: "\\s", label: "\\s", description: "Whitespace (space, tab, newline)" },
      { id: "non-whitespace", pattern: "\\S", label: "\\S", description: "Non-whitespace" },
    ],
  },
  {
    group: "Anchors",
    tokens: [
      { id: "start", pattern: "^", label: "^", description: "Start of string/line" },
      { id: "end", pattern: "$", label: "$", description: "End of string/line" },
      { id: "word-boundary", pattern: "\\b", label: "\\b", description: "Word boundary" },
      { id: "non-word-boundary", pattern: "\\B", label: "\\B", description: "Non-word boundary" },
    ],
  },
  {
    group: "Quantifiers",
    tokens: [
      { id: "zero-or-more", pattern: "*", label: "*", description: "0 or more" },
      { id: "one-or-more", pattern: "+", label: "+", description: "1 or more" },
      { id: "optional", pattern: "?", label: "?", description: "0 or 1 (optional)" },
      { id: "lazy", pattern: "?", label: "*? / +?", description: "Lazy (append to quantifier)" },
      { id: "exact-n", pattern: "{n}", label: "{n}", description: "Exactly n times" },
      { id: "n-or-more", pattern: "{n,}", label: "{n,}", description: "n or more times" },
      { id: "n-to-m", pattern: "{n,m}", label: "{n,m}", description: "Between n and m times" },
    ],
  },
  {
    group: "Groups & Lookaround",
    tokens: [
      { id: "capture-group", pattern: "()", label: "(…)", description: "Capturing group" },
      { id: "non-capture-group", pattern: "(?:)", label: "(?:…)", description: "Non-capturing group" },
      { id: "named-group", pattern: "(?<name>)", label: "(?<name>…)", description: "Named capturing group" },
      { id: "alternation", pattern: "|", label: "|", description: "OR (alternation)" },
      { id: "lookahead", pattern: "(?=)", label: "(?=…)", description: "Positive lookahead" },
      { id: "neg-lookahead", pattern: "(?!)", label: "(?!…)", description: "Negative lookahead" },
      { id: "lookbehind", pattern: "(?<=)", label: "(?<=…)", description: "Positive lookbehind" },
      { id: "neg-lookbehind", pattern: "(?<!)", label: "(?<!…)", description: "Negative lookbehind" },
    ],
  },
  {
    group: "Common Patterns",
    tokens: [
      { id: "email", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", label: "Email", description: "Email address" },
      { id: "url", pattern: "https?://[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=%]+", label: "URL", description: "HTTP/HTTPS URL" },
      { id: "ipv4", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", label: "IPv4", description: "IPv4 address" },
      { id: "hex-color", pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b", label: "Hex Color", description: "#RGB or #RRGGBB" },
      { id: "phone", pattern: "\\+?[\\d\\s\\-().]{7,15}", label: "Phone", description: "Phone number (loose)" },
      { id: "date-iso", pattern: "\\d{4}-\\d{2}-\\d{2}", label: "Date (ISO)", description: "YYYY-MM-DD" },
    ],
  },
];

interface MatchInfo {
  match: string;
  index: number;
  groups: string[];
}

function explainRegex(pattern: string): string[] {
  const explanations: string[] = [];
  let i = 0;

  while (i < pattern.length) {
    const remaining = pattern.slice(i);

    // Named group
    if (remaining.startsWith("(?<")) {
      const end = remaining.indexOf(">");
      if (end !== -1) {
        const name = remaining.slice(3, end);
        explanations.push(`(?<${name}>…) — Named capturing group "${name}"`);
        i += end + 1;
        continue;
      }
    }
    // Non-capturing group
    if (remaining.startsWith("(?:")) {
      explanations.push("(?:…) — Non-capturing group");
      i += 3;
      continue;
    }
    // Positive lookahead
    if (remaining.startsWith("(?=")) {
      explanations.push("(?=…) — Positive lookahead");
      i += 3;
      continue;
    }
    // Negative lookahead
    if (remaining.startsWith("(?!")) {
      explanations.push("(?!…) — Negative lookahead");
      i += 3;
      continue;
    }
    // Positive lookbehind
    if (remaining.startsWith("(?<=")) {
      explanations.push("(?<=…) — Positive lookbehind");
      i += 4;
      continue;
    }
    // Negative lookbehind
    if (remaining.startsWith("(?<!")) {
      explanations.push("(?<!…) — Negative lookbehind");
      i += 4;
      continue;
    }

    // Escape sequences
    if (pattern[i] === "\\" && i + 1 < pattern.length) {
      const next = pattern[i + 1];
      const escapeMap: Record<string, string> = {
        d: "\\d — Any digit (0-9)",
        D: "\\D — Any non-digit",
        w: "\\w — Any word character (a-z, A-Z, 0-9, _)",
        W: "\\W — Any non-word character",
        s: "\\s — Any whitespace",
        S: "\\S — Any non-whitespace",
        b: "\\b — Word boundary",
        B: "\\B — Non-word boundary",
        n: "\\n — Newline",
        t: "\\t — Tab",
        r: "\\r — Carriage return",
      };
      if (escapeMap[next]) {
        explanations.push(escapeMap[next]);
      } else {
        explanations.push(`\\${next} — Literal "${next}"`);
      }
      i += 2;
      continue;
    }

    // Character class
    if (pattern[i] === "[") {
      const closeBracket = pattern.indexOf("]", i + 1);
      if (closeBracket !== -1) {
        const cls = pattern.slice(i, closeBracket + 1);
        const negated = cls[1] === "^";
        explanations.push(
          `${cls} — Character class${negated ? " (negated)" : ""}: match ${negated ? "anything NOT in" : "one of"} the set`
        );
        i = closeBracket + 1;
        continue;
      }
    }

    // Quantifiers with braces
    if (pattern[i] === "{") {
      const closeBrace = pattern.indexOf("}", i);
      if (closeBrace !== -1) {
        const q = pattern.slice(i, closeBrace + 1);
        if (q.includes(",")) {
          const parts = q.slice(1, -1).split(",");
          if (parts[1] === "") {
            explanations.push(`${q} — ${parts[0]} or more times`);
          } else {
            explanations.push(`${q} — Between ${parts[0]} and ${parts[1]} times`);
          }
        } else {
          explanations.push(`${q} — Exactly ${q.slice(1, -1)} times`);
        }
        i = closeBrace + 1;
        continue;
      }
    }

    const charMap: Record<string, string> = {
      "^": "^ — Start of string/line",
      "$": "$ — End of string/line",
      ".": ". — Any character (except newline)",
      "*": "* — 0 or more of the preceding",
      "+": "+ — 1 or more of the preceding",
      "?": "? — 0 or 1 of the preceding (optional)",
      "|": "| — OR (alternation)",
      "(": "( — Start of capturing group",
      ")": ") — End of group",
    };

    if (charMap[pattern[i]]) {
      explanations.push(charMap[pattern[i]]);
    } else {
      explanations.push(`${pattern[i]} — Literal "${pattern[i]}"`);
    }
    i++;
  }

  return explanations;
}

export default function RegexBuilderComponent() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState<string[]>(["g"]);
  const [testString, setTestString] = useState("");
  const [replaceWith, setReplaceWith] = useState("");

  const toggleFlag = (flag: string) => {
    setFlags((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]
    );
  };

  const insertToken = (token: string) => {
    setPattern((prev) => prev + token);
  };

  const matches: MatchInfo[] = useMemo(() => {
    if (!pattern || !testString) return [];
    try {
      const flagStr = flags.join("");
      const re = new RegExp(pattern, flagStr);
      const results: MatchInfo[] = [];
      let match;

      if (flagStr.includes("g")) {
        while ((match = re.exec(testString)) !== null) {
          results.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
          if (!match[0]) re.lastIndex++;
        }
      } else {
        match = re.exec(testString);
        if (match) {
          results.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      }
      return results;
    } catch {
      return [];
    }
  }, [pattern, testString, flags]);

  const regexError = useMemo(() => {
    if (!pattern) return "";
    try {
      new RegExp(pattern, flags.join(""));
      return "";
    } catch (e: unknown) {
      return e instanceof Error ? e.message : "Invalid regex";
    }
  }, [pattern, flags]);

  const highlightedText = useMemo(() => {
    if (!pattern || !testString || regexError) return null;
    try {
      const re = new RegExp(pattern, flags.join(""));
      const parts: { text: string; isMatch: boolean }[] = [];
      let lastIndex = 0;
      let m;

      if (flags.includes("g")) {
        const reGlobal = new RegExp(pattern, flags.join(""));
        while ((m = reGlobal.exec(testString)) !== null) {
          if (m.index > lastIndex) {
            parts.push({ text: testString.slice(lastIndex, m.index), isMatch: false });
          }
          parts.push({ text: m[0], isMatch: true });
          lastIndex = m.index + m[0].length;
          if (!m[0]) {
            reGlobal.lastIndex++;
            lastIndex = reGlobal.lastIndex;
          }
        }
      } else {
        m = re.exec(testString);
        if (m) {
          if (m.index > 0) parts.push({ text: testString.slice(0, m.index), isMatch: false });
          parts.push({ text: m[0], isMatch: true });
          lastIndex = m.index + m[0].length;
        }
      }
      if (lastIndex < testString.length) {
        parts.push({ text: testString.slice(lastIndex), isMatch: false });
      }
      return parts.length > 0 ? parts : null;
    } catch {
      return null;
    }
  }, [pattern, testString, flags, regexError]);

  const replaceResult = useMemo(() => {
    if (!pattern || !testString || regexError) return "";
    try {
      const re = new RegExp(pattern, flags.join(""));
      return testString.replace(re, replaceWith);
    } catch {
      return "";
    }
  }, [pattern, testString, flags, replaceWith, regexError]);

  const explanation = useMemo(() => {
    if (!pattern) return [];
    return explainRegex(pattern);
  }, [pattern]);

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Build regular expressions visually, test against sample text, and get a plain-English explanation of each part.
        </p>

        {/* Regex input */}
        <div className="mb-4">
          <label className="font-semibold text-sm mb-2 block">Regular Expression</label>
          <div className="flex items-center gap-0">
            <span className="px-3 py-2 bg-bodydark/10 dark:bg-body/20 border border-r-0 border-stroke dark:border-strokedark rounded-l font-mono text-lg">
              /
            </span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Enter regex pattern..."
              className={clsx(
                "custom-input flex-1 font-mono text-lg rounded-none! border-x-0",
                regexError && "border-danger!"
              )}
              spellCheck={false}
            />
            <span className="px-3 py-2 bg-bodydark/10 dark:bg-body/20 border border-l-0 border-stroke dark:border-strokedark font-mono text-lg">
              /{flags.join("")}
            </span>
            <button
              onClick={() => copyToClipboard(`/${pattern}/${flags.join("")}`)}
              className="ml-2 text-sm text-primary hover:underline whitespace-nowrap"
            >
              Copy
            </button>
          </div>
          {regexError && (
            <p className="text-danger text-xs mt-1">{regexError}</p>
          )}
        </div>

        {/* Flags */}
        <div className="mb-6">
          <label className="font-semibold text-sm mb-2 block">Flags</label>
          <div className="flex flex-wrap gap-2">
            {FLAGS.map((f) => (
              <button
                key={f.flag}
                onClick={() => toggleFlag(f.flag)}
                className={clsx(
                  "px-3 py-1.5 rounded border text-sm font-mono transition-colors",
                  flags.includes(f.flag)
                    ? "bg-primary text-white border-primary"
                    : "bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-primary"
                )}
                title={f.description}
              >
                {f.label}
                <span className="ml-1.5 font-sans text-xs opacity-80">{f.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Token palette */}
        <div className="mb-6">
          <label className="font-semibold text-sm mb-2 block">Insert Token</label>
          <div className="space-y-3">
            {TOKEN_GROUPS.map((group) => (
              <div key={group.group}>
                <div className="text-xs text-bodydark dark:text-bodydark2 mb-1">{group.group}</div>
                <div className="flex flex-wrap gap-1">
                  {group.tokens.map((token) => (
                    <button
                      key={token.id}
                      onClick={() => insertToken(token.pattern)}
                      className="px-2 py-1 rounded border text-xs font-mono border-stroke dark:border-strokedark hover:border-primary hover:bg-primary/5 transition-colors"
                      title={token.description}
                    >
                      {token.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test string */}
        <div className="mb-4">
          <label className="font-semibold text-sm mb-2 block">Test String</label>
          <textarea
            rows={5}
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Enter text to test the regex against..."
            className="custom-input w-full font-mono text-sm"
            spellCheck={false}
          />
        </div>

        {/* Highlighted matches */}
        {highlightedText && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-sm">
                Matches — {matches.length} found
              </label>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark font-mono text-sm whitespace-pre-wrap break-all">
              {highlightedText.map((part, i) =>
                part.isMatch ? (
                  <mark key={i} className="bg-yellow-300 dark:bg-yellow-600 rounded px-0.5">
                    {part.text}
                  </mark>
                ) : (
                  <span key={i}>{part.text}</span>
                )
              )}
            </div>
          </div>
        )}

        {/* Match details */}
        {matches.length > 0 && (
          <div className="mb-4">
            <label className="font-semibold text-sm mb-2 block">Match Details</label>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-stroke dark:border-strokedark">
                <thead>
                  <tr className="bg-bodydark/10 dark:bg-body/20">
                    <th className="p-2 text-left border-b border-stroke dark:border-strokedark">#</th>
                    <th className="p-2 text-left border-b border-stroke dark:border-strokedark">Match</th>
                    <th className="p-2 text-left border-b border-stroke dark:border-strokedark">Index</th>
                    {matches.some((m) => m.groups.length > 0) && (
                      <th className="p-2 text-left border-b border-stroke dark:border-strokedark">Groups</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {matches.slice(0, 50).map((m, i) => (
                    <tr key={i} className="border-b border-bodydark/50 dark:border-body/50">
                      <td className="p-2 font-mono">{i + 1}</td>
                      <td className="p-2 font-mono break-all">{m.match || "(empty)"}</td>
                      <td className="p-2 font-mono">{m.index}</td>
                      {matches.some((m) => m.groups.length > 0) && (
                        <td className="p-2 font-mono text-xs break-all">
                          {m.groups.map((g, gi) => (
                            <span key={gi} className="mr-2">
                              ${gi + 1}: {g ?? "undefined"}
                            </span>
                          ))}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {matches.length > 50 && (
              <p className="text-xs text-bodydark mt-1">Showing first 50 of {matches.length} matches</p>
            )}
          </div>
        )}

        {/* Replace */}
        <div className="mb-6">
          <label className="font-semibold text-sm mb-2 block">Replace With</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={replaceWith}
              onChange={(e) => setReplaceWith(e.target.value)}
              placeholder="Replacement string (use $1, $2 for groups)..."
              className="custom-input flex-1 font-mono text-sm"
              spellCheck={false}
            />
            <button
              onClick={() => copyToClipboard(replaceResult)}
              className="text-sm text-primary hover:underline whitespace-nowrap"
            >
              Copy result
            </button>
          </div>
          {replaceWith && testString && !regexError && (
            <div className="p-3 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark font-mono text-sm whitespace-pre-wrap break-all">
              {replaceResult}
            </div>
          )}
        </div>

        {/* Explanation */}
        {explanation.length > 0 && (
          <div className="mb-6">
            <label className="font-semibold text-sm mb-2 block">Pattern Explanation</label>
            <div className="p-3 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark space-y-1">
              {explanation.map((line, i) => (
                <div key={i} className="text-sm font-mono">
                  <span className="text-primary font-semibold">
                    {line.split(" — ")[0]}
                  </span>
                  {line.includes(" — ") && (
                    <span className="text-bodydark dark:text-bodydark2 font-sans ml-2">
                      — {line.split(" — ").slice(1).join(" — ")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Reference */}
        <div className="p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
          <div className="text-sm font-medium mb-2">Replacement Tokens</div>
          <ul className="text-xs text-body dark:text-bodydark2 space-y-1 font-mono">
            <li><strong>$&amp;</strong> — Entire match</li>
            <li><strong>$1, $2, ...</strong> — Captured group by number</li>
            <li><strong>$`</strong> — Text before the match</li>
            <li><strong>$&apos;</strong> — Text after the match</li>
            <li><strong>$$</strong> — Literal dollar sign</li>
          </ul>
        </div>
      </div>
    </>
  );
}
