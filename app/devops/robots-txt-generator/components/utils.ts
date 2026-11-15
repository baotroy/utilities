export type Policy = "allow" | "disallow" | "custom";

export interface RobotsGroup {
  id: number;
  userAgents: string; // one or more, separated by commas or new lines
  policy: Policy;
  disallow: string; // one path per line
  allow: string; // one path per line
  crawlDelay: string;
}

export interface RobotsOptions {
  groups: RobotsGroup[];
  sitemaps: string; // one URL per line
  host: string;
  comment: string;
}

export const COMMON_BOTS = [
  "Googlebot",
  "Googlebot-Image",
  "Bingbot",
  "Slurp",
  "DuckDuckBot",
  "Baiduspider",
  "YandexBot",
  "Applebot",
  "facebookexternalhit",
  "Twitterbot",
  "LinkedInBot",
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
];

export const AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "PerplexityBot",
  "Bytespider",
  "Meta-ExternalAgent",
  "Amazonbot",
  "cohere-ai",
];

let nextId = 1;
export function newGroup(partial: Partial<RobotsGroup> = {}): RobotsGroup {
  return { id: nextId++, userAgents: "*", policy: "custom", disallow: "", allow: "", crawlDelay: "", ...partial };
}

const lines = (s: string) =>
  s
    .split(/[\n,]+/)
    .map((x) => x.trim())
    .filter(Boolean);

const pathLines = (s: string) =>
  s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((p) => (p.startsWith("/") || p.startsWith("*") ? p : "/" + p));

export function generateRobots(o: RobotsOptions): string {
  const out: string[] = [];
  if (o.comment.trim()) out.push(...o.comment.trim().split("\n").map((l) => `# ${l.replace(/^#\s?/, "")}`), "");
  for (const g of o.groups) {
    const agents = lines(g.userAgents);
    if (!agents.length) continue;
    agents.forEach((a) => out.push(`User-agent: ${a}`));
    if (g.policy === "allow") out.push("Disallow:");
    else if (g.policy === "disallow") out.push("Disallow: /");
    else {
      const allow = pathLines(g.allow);
      const disallow = pathLines(g.disallow);
      allow.forEach((p) => out.push(`Allow: ${p}`));
      disallow.forEach((p) => out.push(`Disallow: ${p}`));
      if (!allow.length && !disallow.length) out.push("Disallow:");
    }
    if (g.crawlDelay.trim()) out.push(`Crawl-delay: ${g.crawlDelay.trim()}`);
    out.push("");
  }
  if (o.host.trim()) out.push(`Host: ${o.host.trim()}`, "");
  const maps = lines(o.sitemaps.replace(/,/g, "\n"));
  maps.forEach((m) => out.push(`Sitemap: ${m}`));
  return out.join("\n").replace(/\n+$/, "") + "\n";
}

/* ------------------------------------------------------------------ */
/* Tester: Google's rules (RFC 9309)                                    */
/* ------------------------------------------------------------------ */

interface ParsedGroup {
  agents: string[];
  rules: { allow: boolean; path: string }[];
}

export function parseRobots(text: string): ParsedGroup[] {
  const groups: ParsedGroup[] = [];
  let current: ParsedGroup | null = null;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (!current) continue;
      if (key === "allow" || key === "disallow") {
        if (value === "" && key === "disallow") continue; // empty Disallow allows everything
        current.rules.push({ allow: key === "allow", path: value });
      }
    }
  }
  return groups;
}

function ruleToRegex(path: string): RegExp {
  const anchored = path.endsWith("$");
  const body = (anchored ? path.slice(0, -1) : path)
    .split("*")
    .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp("^" + body + (anchored ? "$" : ""));
}

export interface TestResult {
  allowed: boolean;
  matchedAgent: string | null;
  rule: string | null;
}

export function testUrl(robots: string, userAgent: string, url: string): TestResult {
  let path = url.trim();
  try {
    if (/^https?:\/\//i.test(path)) {
      const u = new URL(path);
      path = u.pathname + u.search;
    }
  } catch {
    // keep as is
  }
  if (!path.startsWith("/")) path = "/" + path;

  const groups = parseRobots(robots);
  const ua = userAgent.trim().toLowerCase();
  // Pick the group with the most specific (longest) matching user-agent token; fall back to "*".
  let best: ParsedGroup[] = [];
  let bestLen = -1;
  for (const g of groups) {
    for (const a of g.agents) {
      if (a !== "*" && ua.includes(a) && a.length >= bestLen) {
        if (a.length > bestLen) best = [];
        best.push(g);
        bestLen = a.length;
      }
    }
  }
  let matchedAgent: string | null = null;
  if (!best.length) {
    best = groups.filter((g) => g.agents.includes("*"));
    if (best.length) matchedAgent = "*";
  } else {
    matchedAgent = best[0].agents.find((a) => ua.includes(a)) || null;
  }
  const rules = best.flatMap((g) => g.rules);
  let winner: { allow: boolean; path: string } | null = null;
  for (const r of rules) {
    if (!ruleToRegex(r.path).test(path)) continue;
    if (!winner || r.path.length > winner.path.length || (r.path.length === winner.path.length && r.allow && !winner.allow)) {
      winner = r;
    }
  }
  return {
    allowed: winner ? winner.allow : true,
    matchedAgent,
    rule: winner ? `${winner.allow ? "Allow" : "Disallow"}: ${winner.path}` : null,
  };
}
