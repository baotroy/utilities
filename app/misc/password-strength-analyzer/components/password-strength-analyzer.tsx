"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MdErrorOutline, MdLightbulbOutline, MdVisibility, MdVisibilityOff } from "react-icons/md";
import {
  ATTACK_SCENARIOS,
  SCORE_COLORS,
  SCORE_LABELS,
  SCORE_TEXT_COLORS,
  ZxcvbnResult,
  charStats,
  describeMatch,
  formatGuesses,
  loadZxcvbn,
} from "./utils";

export default function PasswordStrengthAnalyzerComponent() {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [personal, setPersonal] = useState("");
  const [result, setResult] = useState<ZxcvbnResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Start loading the dictionaries as soon as the page opens
  useEffect(() => {
    loadZxcvbn()
      .then(() => setLoading(false))
      .catch(() => {
        setLoading(false);
        setLoadError("Could not load the password dictionaries. Check your connection and reload the page.");
      });
  }, []);

  const userInputs = useMemo(
    () =>
      personal
        .split(/[,\s;]+/)
        .map((w) => w.trim())
        .filter(Boolean)
        // also check the parts of an email address
        .flatMap((w) => (w.includes("@") ? [w, ...w.split(/[@.]/).filter((p) => p.length > 2)] : [w])),
    [personal],
  );

  // Debounced analysis: zxcvbn can take a few hundred ms on long passwords
  useEffect(() => {
    if (loading || loadError) return;
    if (!password) {
      setResult(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const z = await loadZxcvbn();
      const r = z.check(password, userInputs);
      if (!cancelled) setResult(r);
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [password, userInputs, loading, loadError]);

  const stats = useMemo(() => charStats(password), [password]);
  const score = result?.score ?? 0;

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Check how hard a password is to guess. It looks for common passwords, dictionary words, names, keyboard
          patterns, dates and repeats, and estimates how long an attacker would need. The password never leaves your
          browser.
        </p>

        <div className="space-y-4">
          <div>
            <div className="mb-2">Password</div>
            <div className="flex">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Type or paste a password"
                autoComplete="new-password"
                spellCheck={false}
                autoFocus
                className="custom-input w-full rounded-r-none font-mono"
              />
              <button
                onClick={() => setShow(!show)}
                className="px-3 border border-l-0 border-bodydark rounded-r bg-gray-2 dark:bg-graydark"
                title={show ? "Hide" : "Show"}
              >
                {show ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2">
              Personal info <span className="text-sm text-body dark:text-bodydark2">(optional)</span>
            </div>
            <input
              type="text"
              value={personal}
              onChange={(e) => setPersonal(e.target.value)}
              placeholder="Name, username, email, birth year... separated by commas"
              spellCheck={false}
              autoComplete="off"
              className="custom-input w-full"
            />
            <div className="mt-1 text-xs text-body dark:text-bodydark2">
              Words an attacker who knows you would try first. A password containing them scores lower.
            </div>
          </div>

          {loading && <div className="text-sm text-body dark:text-bodydark2">Loading dictionaries...</div>}
          {loadError && <div className="text-sm text-red-600">{loadError}</div>}

          {/* Strength meter */}
          <div>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={clsx(
                    "h-2 flex-1 rounded-full transition-colors",
                    result && i <= score ? SCORE_COLORS[score] : "bg-stroke dark:bg-strokedark",
                  )}
                />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
              <span className={clsx("text-lg font-semibold", result ? SCORE_TEXT_COLORS[score] : "text-body")}>
                {result ? SCORE_LABELS[score] : password ? "..." : "Enter a password"}
              </span>
              {result && (
                <span className="text-sm text-body dark:text-bodydark2">
                  Score {score}/4 · about {formatGuesses(result.guesses, result.guessesLog10)} guesses
                </span>
              )}
            </div>
          </div>

          {result && (result.feedback.warning || result.feedback.suggestions.length > 0) && (
            <div className="p-3 rounded border border-stroke dark:border-strokedark space-y-2 text-sm">
              {result.feedback.warning && (
                <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
                  <MdErrorOutline size={18} className="shrink-0 mt-0.5" />
                  <span>{result.feedback.warning}</span>
                </div>
              )}
              {result.feedback.suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <MdLightbulbOutline size={18} className="shrink-0 mt-0.5 text-amber-500" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}

          {result && (
            <>
              {/* Crack times */}
              <div>
                <div className="mb-2">Estimated time to crack</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ATTACK_SCENARIOS.map((s) => (
                    <div
                      key={s.key}
                      className="p-3 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium">{s.label}</span>
                        <span className="font-semibold">{result.crackTimes[s.key].display}</span>
                      </div>
                      <div className="text-xs text-body dark:text-bodydark2 mt-1">{s.detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Patterns */}
              <div>
                <div className="mb-2">What was found</div>
                <div className="overflow-x-auto rounded border border-stroke dark:border-strokedark">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-boxdark text-left">
                      <tr>
                        <th className="px-3 py-2 font-medium">Part</th>
                        <th className="px-3 py-2 font-medium">Pattern</th>
                        <th className="px-3 py-2 font-medium">Details</th>
                        <th className="px-3 py-2 font-medium text-right">Guesses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.sequence.map((m, i) => (
                        <tr key={i} className="border-t border-stroke dark:border-strokedark">
                          <td className="px-3 py-2 font-mono break-all">{show ? m.token : "•".repeat(Array.from(m.token).length)}</td>
                          <td className="px-3 py-2">{m.pattern}</td>
                          <td className="px-3 py-2 text-body dark:text-bodydark2">
                            {show || m.pattern === "bruteforce" ? describeMatch(m) : describeMatch(m).replace(/"[^"]*"/g, "\"•••\"")}
                          </td>
                          <td className="px-3 py-2 text-right whitespace-nowrap">
                            {typeof m.guesses === "number" ? formatGuesses(m.guesses, m.guessesLog10 ?? Math.log10(m.guesses)) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Character stats */}
          {password && (
            <div>
              <div className="mb-2">Characters</div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                {[
                  ["Length", stats.length],
                  ["Lowercase", stats.lower],
                  ["Uppercase", stats.upper],
                  ["Digits", stats.digits],
                  ["Symbols", stats.symbols + stats.other],
                  ["Unique", stats.unique],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="p-2 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark"
                  >
                    <div className="text-lg font-semibold">{value}</div>
                    <div className="text-xs text-body dark:text-bodydark2">{label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-body dark:text-bodydark2">
                Character-set entropy: {stats.entropyBits.toFixed(1)} bits ({stats.length} chars from a pool of{" "}
                {stats.poolSize}). This is the maximum, reached only if every character is picked at random; the
                estimate above accounts for patterns and is what matters.
              </div>
            </div>
          )}

          {/* Info */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
            <div className="text-sm font-medium mb-2">About the score</div>
            <ul className="text-xs text-body dark:text-bodydark2 space-y-1 list-disc pl-4">
              <li>
                Powered by zxcvbn, which estimates the number of guesses an attacker needs, using lists of common
                passwords, English words and names, keyboard layouts, dates and repeats.
              </li>
              <li>
                Score 0 to 4: under 10^3, 10^6, 10^8, 10^10 guesses, and above. Aim for 3 or 4 for accounts that matter.
              </li>
              <li>
                Length beats complexity: four random words are stronger than <code>P@ssw0rd!</code>. Need one?{" "}
                <Link href="/misc/random-password-generator" className="text-primary hover:underline">
                  Random Password Generator
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
