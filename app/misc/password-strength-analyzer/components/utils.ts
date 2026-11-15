import type { ZxcvbnFactory, ZxcvbnResult } from "@zxcvbn-ts/core";

// The dictionaries are ~1 MB, so they are loaded only when this tool is opened
let factoryPromise: Promise<ZxcvbnFactory> | null = null;

export function loadZxcvbn(): Promise<ZxcvbnFactory> {
  if (!factoryPromise) {
    factoryPromise = Promise.all([
      import("@zxcvbn-ts/core"),
      import("@zxcvbn-ts/language-common"),
      import("@zxcvbn-ts/language-en"),
    ])
      .then(
        ([core, common, en]) =>
          new core.ZxcvbnFactory({
            translations: en.translations,
            graphs: common.adjacencyGraphs,
            dictionary: { ...common.dictionary, ...en.dictionary },
            useLevenshteinDistance: true,
          }),
      )
      .catch((e) => {
        factoryPromise = null; // allow a retry
        throw e;
      });
  }
  return factoryPromise;
}

export type { ZxcvbnResult };

export interface CharStats {
  length: number;
  lower: number;
  upper: number;
  digits: number;
  symbols: number;
  other: number; // letters outside a-z, emoji, ...
  unique: number;
  poolSize: number;
  entropyBits: number; // length * log2(pool): an upper bound for a random password
}

export function charStats(password: string): CharStats {
  const chars = Array.from(password); // split by code point, not UTF-16 unit
  let lower = 0,
    upper = 0,
    digits = 0,
    symbols = 0,
    other = 0;
  for (const c of chars) {
    if (/[a-z]/.test(c)) lower++;
    else if (/[A-Z]/.test(c)) upper++;
    else if (/[0-9]/.test(c)) digits++;
    else if (/[\x20-\x7e]/.test(c)) symbols++;
    else other++;
  }
  const poolSize = (lower ? 26 : 0) + (upper ? 26 : 0) + (digits ? 10 : 0) + (symbols ? 33 : 0) + (other ? 100 : 0);
  return {
    length: chars.length,
    lower,
    upper,
    digits,
    symbols,
    other,
    unique: new Set(chars).size,
    poolSize,
    entropyBits: poolSize ? chars.length * Math.log2(poolSize) : 0,
  };
}

export const SCORE_LABELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
export const SCORE_COLORS = ["bg-red-600", "bg-amber-600", "bg-amber-300", "bg-lime-400", "bg-green-500"];
export const SCORE_TEXT_COLORS = [
  "text-red-600",
  "text-amber-600",
  "text-amber-500",
  "text-lime-600",
  "text-green-600",
];

export const ATTACK_SCENARIOS: {
  key: keyof ZxcvbnResult["crackTimes"];
  label: string;
  detail: string;
}[] = [
  {
    key: "onlineThrottlingXPerHour",
    label: "Online, rate limited",
    detail: "100 guesses/hour against a login form with throttling",
  },
  {
    key: "onlineNoThrottlingXPerSecond",
    label: "Online, no rate limit",
    detail: "10 guesses/second against an unprotected login",
  },
  {
    key: "offlineSlowHashingXPerSecond",
    label: "Offline, slow hash",
    detail: "10k guesses/second on a leaked bcrypt / scrypt / PBKDF2 hash",
  },
  {
    key: "offlineFastHashingXPerSecond",
    label: "Offline, fast hash",
    detail: "10 billion guesses/second on a leaked MD5 / SHA-1 / NTLM hash",
  },
];

/** Readable description of one pattern zxcvbn found in the password. */
export function describeMatch(m: ZxcvbnResult["sequence"][number]): string {
  const a = m as unknown as Record<string, unknown>;
  switch (m.pattern) {
    case "dictionary": {
      const parts = [`"${a.matchedWord}" in ${dictionaryLabel(String(a.dictionaryName))}`];
      if (a.rank) parts.push(`rank ${a.rank}`);
      if (a.reversed) parts.push("reversed");
      if (a.l33t) parts.push(`l33t (${a.subDisplay})`);
      if (a.levenshteinDistance) parts.push(`${a.levenshteinDistance} char(s) different`);
      return parts.join(", ");
    }
    case "spatial":
      return `keyboard pattern on ${a.graph}, ${a.turns} turn(s)`;
    case "repeat":
      return `"${Array.isArray(a.baseToken) ? a.baseToken.join("") : a.baseToken}" repeated ${a.repeatCount} times`;
    case "sequence":
      return `${a.sequenceName} sequence, ${a.ascending ? "ascending" : "descending"}`;
    case "regex":
      return a.regexName === "recentYear" ? "recent year" : String(a.regexName);
    case "date":
      return `date ${[a.day, a.month, a.year].join(String(a.separator || "/"))}`;
    case "bruteforce":
      return "no pattern found (random characters)";
    case "separator":
      return "separator";
    case "wordSequence":
      return `sequence of ${a.wordCount} words`;
    default:
      return m.pattern;
  }
}

function dictionaryLabel(name: string): string {
  if (name === "userInputs") return "your personal info";
  if (name.startsWith("passwords")) return "common passwords";
  if (name.startsWith("commonWords")) return "common words";
  if (name.startsWith("firstnames")) return "first names";
  if (name.startsWith("lastnames")) return "last names";
  if (name.startsWith("wikipedia")) return "Wikipedia words";
  if (name.startsWith("diceware")) return "diceware words";
  return name.replace(/-\w+$/, "");
}

/** 10^x guesses, shown as a short number. */
export function formatGuesses(guesses: number, log10: number): string {
  if (guesses < 1e6) return Math.round(guesses).toLocaleString("en-US");
  return `10^${log10.toFixed(1)}`;
}
