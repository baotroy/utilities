"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState, useEffect } from "react";
import Button from "@/components/Input/Button";
import TextBox from "@/components/Input/TextBox";
import { MdOutlineClear } from "react-icons/md";
import { LiaPlaySolid } from "react-icons/lia";

interface MatchResult {
  match: string;
  index: number;
  groups: string[];
}

export default function RegexTesterComponent() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [testString, setTestString] = useState("");
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [error, setError] = useState("");
  const [highlightedText, setHighlightedText] = useState<React.ReactNode>("");

  const flagOptions = [
    { flag: "g", label: "Global", description: "Find all matches" },
    { flag: "i", label: "Case Insensitive", description: "Ignore case" },
    { flag: "m", label: "Multiline", description: "^ and $ match line boundaries" },
    { flag: "s", label: "Dot All", description: ". matches newlines" },
    { flag: "u", label: "Unicode", description: "Enable Unicode support" },
  ];

  const toggleFlag = (flag: string) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ""));
    } else {
      setFlags(flags + flag);
    }
  };

  const testRegex = () => {
    setError("");
    setMatches([]);
    setHighlightedText("");

    if (!pattern) {
      setHighlightedText(testString);
      return;
    }

    try {
      const regex = new RegExp(pattern, flags);
      const results: MatchResult[] = [];

      if (flags.includes("g")) {
        let match;
        while ((match = regex.exec(testString)) !== null) {
          results.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
          // Prevent infinite loop for zero-length matches
          if (match[0].length === 0) {
            regex.lastIndex++;
          }
        }
      } else {
        const match = regex.exec(testString);
        if (match) {
          results.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      }

      setMatches(results);

      // Create highlighted text
      if (results.length > 0) {
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;

        results.forEach((result, i) => {
          if (result.index > lastIndex) {
            parts.push(
              <span key={`text-${i}`}>{testString.slice(lastIndex, result.index)}</span>
            );
          }
          parts.push(
            <mark key={`match-${i}`} className="bg-yellow-300 dark:bg-yellow-600 px-0.5 rounded">
              {result.match}
            </mark>
          );
          lastIndex = result.index + result.match.length;
        });

        if (lastIndex < testString.length) {
          parts.push(<span key="text-end">{testString.slice(lastIndex)}</span>);
        }

        setHighlightedText(<>{parts}</>);
      } else {
        setHighlightedText(testString);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid regular expression");
      setHighlightedText(testString);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      testRegex();
    }, 300);
    return () => clearTimeout(timer);
  }, [pattern, flags, testString]);

  const reset = () => {
    setPattern("");
    setFlags("g");
    setTestString("");
    setMatches([]);
    setError("");
    setHighlightedText("");
  };

  const examplePatterns = [
    { label: "Email", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}" },
    { label: "URL", pattern: "https?://[\\w.-]+(?:/[\\w./-]*)?" },
    { label: "Phone", pattern: "\\+?[0-9]{1,4}?[-.\\s]?\\(?[0-9]{1,3}\\)?[-.\\s]?[0-9]{1,4}[-.\\s]?[0-9]{1,9}" },
    { label: "IPv4", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b" },
    { label: "Date", pattern: "\\d{4}-\\d{2}-\\d{2}" },
  ];

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Test and validate regular expressions with real-time matching and highlighting.
        </p>

        <div className="space-y-4">
          {/* Pattern Input */}
          <div>
            <div className="mb-2">Regular Expression</div>
            <div className="flex items-center">
              <span className="px-3 py-2 bg-gray-100 dark:bg-boxdark border border-r-0 border-stroke dark:border-strokedark rounded-l">
                /
              </span>
              <TextBox
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="Enter regex pattern (e.g., [a-z]+)"
                additionalClass="flex-1 !rounded-none"
                isError={!!error}
              />
              <span className="px-3 py-2 bg-gray-100 dark:bg-boxdark border border-l-0 border-stroke dark:border-strokedark rounded-r">
                /{flags}
              </span>
            </div>
            {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
          </div>

          {/* Flags */}
          <div>
            <div className="mb-2">Flags</div>
            <div className="flex flex-wrap gap-2">
              {flagOptions.map((opt) => (
                <button
                  key={opt.flag}
                  onClick={() => toggleFlag(opt.flag)}
                  className={`px-3 py-1.5 rounded border text-sm transition-colors ${
                    flags.includes(opt.flag)
                      ? "bg-primary text-white border-primary"
                      : "bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-primary"
                  }`}
                  title={opt.description}
                >
                  {opt.flag} - {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Patterns */}
          <div>
            <div className="mb-2">Quick Patterns</div>
            <div className="flex flex-wrap gap-2">
              {examplePatterns.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => setPattern(ex.pattern)}
                  className="px-3 py-1 rounded border text-xs bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-primary transition-colors"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* Test String */}
          <div>
            <div className="mb-2">Test String</div>
            <textarea
              rows={6}
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="Enter text to test against the regex pattern..."
              className="custom-input w-full"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex">
            <Button
              handleOnClick={testRegex}
              label="Test"
              additionalClass="mr-2"
              icon={{
                icon: LiaPlaySolid,
                position: "left",
                size: 20,
              }}
            />
            <Button
              handleOnClick={reset}
              label="Reset"
              type="reset"
              additionalClass="mr-2"
              icon={{
                icon: MdOutlineClear,
                position: "left",
                size: 20,
              }}
            />
          </div>

          {/* Results */}
          {testString && (
            <>
              <div>
                <div className="my-3">
                  Highlighted Result
                  <span className="ml-2 text-sm text-body dark:text-bodydark2">
                    ({matches.length} match{matches.length !== 1 ? "es" : ""})
                  </span>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark whitespace-pre-wrap font-mono text-sm">
                  {highlightedText}
                </div>
              </div>

              {matches.length > 0 && (
                <div>
                  <div className="my-3">Match Details</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-boxdark">
                          <th className="px-3 py-2 text-left border border-stroke dark:border-strokedark">#</th>
                          <th className="px-3 py-2 text-left border border-stroke dark:border-strokedark">Match</th>
                          <th className="px-3 py-2 text-left border border-stroke dark:border-strokedark">Index</th>
                          <th className="px-3 py-2 text-left border border-stroke dark:border-strokedark">Groups</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matches.map((m, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-3 py-2 border border-stroke dark:border-strokedark">{i + 1}</td>
                            <td className="px-3 py-2 border border-stroke dark:border-strokedark font-mono">
                              <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">{m.match}</code>
                            </td>
                            <td className="px-3 py-2 border border-stroke dark:border-strokedark">{m.index}</td>
                            <td className="px-3 py-2 border border-stroke dark:border-strokedark font-mono">
                              {m.groups.length > 0 ? m.groups.map((g, j) => (
                                <span key={j} className="mr-2 bg-blue-100 dark:bg-blue-900 px-1 rounded">
                                  ${j + 1}: {g}
                                </span>
                              )) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Cheat Sheet */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
            <div className="text-sm font-medium mb-2">Quick Reference</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
              <div><code>.</code> Any char</div>
              <div><code>\d</code> Digit</div>
              <div><code>\w</code> Word char</div>
              <div><code>\s</code> Whitespace</div>
              <div><code>^</code> Start</div>
              <div><code>$</code> End</div>
              <div><code>*</code> 0 or more</div>
              <div><code>+</code> 1 or more</div>
              <div><code>?</code> 0 or 1</div>
              <div><code>{"{n}"}</code> Exactly n</div>
              <div><code>[abc]</code> Character set</div>
              <div><code>(abc)</code> Group</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
