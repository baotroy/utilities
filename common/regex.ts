export interface RegexMatch {
  match: string;
  index: number;
  groups: string[];
}

// Upper bound so patterns like `a*` on a huge text cannot freeze the page
export const MAX_REGEX_MATCHES = 10000;

/**
 * Run a regex against a text and collect every match (or the first one when
 * the `g` flag is absent). Zero-length matches advance by one code point so
 * the loop always terminates. Throws if the pattern is invalid.
 */
export function findMatches(
  pattern: string,
  flags: string,
  text: string,
  limit = MAX_REGEX_MATCHES
): RegexMatch[] {
  const regex = new RegExp(pattern, flags);
  const results: RegexMatch[] = [];
  const toResult = (m: RegExpExecArray): RegexMatch => ({
    match: m[0],
    index: m.index,
    groups: m.slice(1),
  });

  if (!regex.global && !regex.sticky) {
    const m = regex.exec(text);
    if (m) results.push(toResult(m));
    return results;
  }

  const unicode = regex.unicode || flags.includes("v");
  let m: RegExpExecArray | null;
  while (results.length < limit && (m = regex.exec(text)) !== null) {
    results.push(toResult(m));
    if (m[0].length === 0) {
      // Prevent an infinite loop on zero-length matches
      const code = text.codePointAt(regex.lastIndex);
      regex.lastIndex += unicode && code !== undefined && code > 0xffff ? 2 : 1;
    }
    if (!regex.global) break; // sticky without global: only one match
  }
  return results;
}

/** Split text into plain and matched parts for highlighting. */
export function splitByMatches(
  text: string,
  matches: RegexMatch[]
): { text: string; isMatch: boolean }[] {
  const parts: { text: string; isMatch: boolean }[] = [];
  let lastIndex = 0;
  for (const m of matches) {
    if (m.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, m.index), isMatch: false });
    }
    if (m.match.length > 0) parts.push({ text: m.match, isMatch: true });
    lastIndex = Math.max(lastIndex, m.index + m.match.length);
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), isMatch: false });
  }
  return parts;
}
