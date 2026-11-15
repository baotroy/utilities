"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import { copyToClipboard, download } from "@/common/utils";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { MdAdd, MdContentCopy, MdDelete, MdDownload, MdRestartAlt } from "react-icons/md";
import { Field, Segmented, inputClass, outputClass, textareaClass } from "@/app/devops/components/ui";
import { AI_BOTS, COMMON_BOTS, Policy, RobotsGroup, RobotsOptions, generateRobots, newGroup, testUrl } from "./utils";

const initialOptions = (): RobotsOptions => ({
  groups: [newGroup({ userAgents: "*", policy: "custom", disallow: "/admin/\n/api/\n/*?sort=", allow: "" })],
  sitemaps: "https://example.com/sitemap.xml",
  host: "",
  comment: "",
});

const PRESETS: { label: string; apply: (o: RobotsOptions) => RobotsOptions }[] = [
  { label: "Allow all", apply: (o) => ({ ...o, groups: [newGroup({ policy: "allow" })] }) },
  { label: "Block all", apply: (o) => ({ ...o, groups: [newGroup({ policy: "disallow" })] }) },
  {
    label: "Block AI crawlers",
    apply: (o) => ({
      ...o,
      groups: [
        ...o.groups.filter((g) => g.userAgents.trim() !== AI_BOTS.join("\n")),
        newGroup({ userAgents: AI_BOTS.join("\n"), policy: "disallow" }),
      ],
    }),
  },
  {
    label: "WordPress",
    apply: (o) => ({
      ...o,
      groups: [newGroup({ policy: "custom", disallow: "/wp-admin/\n/?s=\n/search/", allow: "/wp-admin/admin-ajax.php" })],
    }),
  },
  {
    label: "Next.js / Nuxt app",
    apply: (o) => ({ ...o, groups: [newGroup({ policy: "custom", disallow: "/api/\n/_next/data/", allow: "" })] }),
  },
];

export default function RobotsTxtGeneratorComponent() {
  const [o, setO] = useState<RobotsOptions>(initialOptions);
  const output = useMemo(() => generateRobots(o), [o]);

  const [testAgent, setTestAgent] = useState("Googlebot");
  const [testPath, setTestPath] = useState("/admin/login");
  const test = useMemo(() => (testPath.trim() ? testUrl(output, testAgent, testPath) : null), [output, testAgent, testPath]);

  const updateGroup = (id: number, patch: Partial<RobotsGroup>) =>
    setO((prev) => ({ ...prev, groups: prev.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
  const removeGroup = (id: number) => setO((prev) => ({ ...prev, groups: prev.groups.filter((g) => g.id !== id) }));
  const addGroup = (agent = "") => setO((prev) => ({ ...prev, groups: [...prev.groups, newGroup({ userAgents: agent, policy: "disallow" })] }));

  return (
    <>
      <Breadcrumb />
      <div className="w-full">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Create a <code>robots.txt</code> with rules per crawler, sitemaps and crawl delay, then check whether a URL is
          allowed for a given bot.
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setO((prev) => p.apply(prev))}
              className="px-3 py-1.5 rounded border text-sm transition-colors bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-primary"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
          <div className="space-y-4">
            {o.groups.map((g, idx) => (
              <div key={g.id} className="rounded border border-stroke p-4 dark:border-strokedark">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-black dark:text-white">Rule group {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeGroup(g.id)}
                    className="flex items-center gap-1 text-xs text-danger hover:underline"
                  >
                    <MdDelete size={14} /> Remove
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="User-agent(s)" hint="One per line. * means every crawler.">
                    <textarea
                      rows={g.userAgents.split("\n").length > 3 ? 6 : 3}
                      className={textareaClass}
                      spellCheck={false}
                      value={g.userAgents}
                      onChange={(e) => updateGroup(g.id, { userAgents: e.target.value })}
                    />
                  </Field>
                  <div className="space-y-3">
                    <div>
                      <span className="mb-1 block text-sm font-medium text-black dark:text-white">Access</span>
                      <Segmented<Policy>
                        value={g.policy}
                        onChange={(v) => updateGroup(g.id, { policy: v })}
                        options={[
                          { value: "allow", label: "Allow all" },
                          { value: "disallow", label: "Block all" },
                          { value: "custom", label: "Custom" },
                        ]}
                      />
                    </div>
                    <Field label="Crawl-delay (seconds)" hint="Ignored by Google; used by Bing and Yandex.">
                      <input
                        type="number"
                        min={0}
                        className={inputClass}
                        value={g.crawlDelay}
                        onChange={(e) => updateGroup(g.id, { crawlDelay: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>
                {g.policy === "custom" && (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <Field label="Disallow paths" hint="One per line. Supports * and $ (e.g. /*.pdf$).">
                      <textarea
                        rows={4}
                        className={textareaClass}
                        spellCheck={false}
                        value={g.disallow}
                        placeholder={"/admin/\n/private/"}
                        onChange={(e) => updateGroup(g.id, { disallow: e.target.value })}
                      />
                    </Field>
                    <Field label="Allow paths" hint="Exceptions inside a disallowed path.">
                      <textarea
                        rows={4}
                        className={textareaClass}
                        spellCheck={false}
                        value={g.allow}
                        placeholder="/admin/public/"
                        onChange={(e) => updateGroup(g.id, { allow: e.target.value })}
                      />
                    </Field>
                  </div>
                )}
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-2">
              <Button handleOnClick={() => addGroup("")} label="Add rule group" type="outline" icon={{ icon: MdAdd, position: "left", size: 18 }} />
              <select
                className="rounded border-[1.5px] border-stroke bg-transparent px-3 py-2 text-sm text-black outline-none dark:border-form-strokedark dark:bg-form-input dark:text-white"
                value=""
                onChange={(e) => e.target.value && addGroup(e.target.value)}
              >
                <option value="">+ Add rule for a bot…</option>
                <optgroup label="Search & social">
                  {COMMON_BOTS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </optgroup>
                <optgroup label="AI crawlers">
                  {AI_BOTS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="rounded border border-stroke p-4 dark:border-strokedark space-y-3">
              <Field label="Sitemap URLs" hint="One per line, absolute URLs.">
                <textarea
                  rows={2}
                  className={textareaClass}
                  spellCheck={false}
                  value={o.sitemaps}
                  onChange={(e) => setO({ ...o, sitemaps: e.target.value })}
                />
              </Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Host (optional)" hint="Only read by Yandex.">
                  <input type="text" className={inputClass} value={o.host} placeholder="example.com" onChange={(e) => setO({ ...o, host: e.target.value })} />
                </Field>
                <Field label="Comment (optional)">
                  <input type="text" className={inputClass} value={o.comment} placeholder="robots.txt for example.com" onChange={(e) => setO({ ...o, comment: e.target.value })} />
                </Field>
              </div>
            </div>
          </div>

          <div className="xl:sticky xl:top-24 xl:self-start">
            <div className="mb-2 font-medium text-black dark:text-white">robots.txt</div>
            <textarea value={output} readOnly rows={18} spellCheck={false} className={outputClass} />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button handleOnClick={() => copyToClipboard(output)} label="Copy" type="outline" icon={{ icon: MdContentCopy, position: "left", size: 18 }} />
              <Button handleOnClick={() => download(output, "robots.txt", "text/plain")} label="Download" type="outline" icon={{ icon: MdDownload, position: "left", size: 18 }} />
              <Button handleOnClick={() => setO(initialOptions())} label="Reset" type="reset" icon={{ icon: MdRestartAlt, position: "left", size: 18 }} />
            </div>

            <div className="mt-4 rounded border border-stroke p-4 dark:border-strokedark">
              <div className="mb-3 text-sm font-semibold text-black dark:text-white">Test a URL</div>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <Field label="User-agent">
                  <input type="text" list="robots-bots" className={inputClass} value={testAgent} onChange={(e) => setTestAgent(e.target.value)} />
                  <datalist id="robots-bots">
                    {[...COMMON_BOTS, ...AI_BOTS].map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </Field>
                <Field label="URL or path">
                  <input type="text" className={inputClass} value={testPath} placeholder="/admin/login" onChange={(e) => setTestPath(e.target.value)} />
                </Field>
              </div>
              {test && (
                <div
                  className={clsx(
                    "mt-3 rounded px-3 py-2 text-sm",
                    test.allowed
                      ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                      : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                  )}
                >
                  <strong>{test.allowed ? "Allowed" : "Blocked"}</strong>
                  {" · "}
                  {test.matchedAgent ? `group "User-agent: ${test.matchedAgent}"` : "no matching group"}
                  {test.rule ? ` · rule "${test.rule}"` : " · no rule matched"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
