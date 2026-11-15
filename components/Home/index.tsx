"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MdHistory, MdSearch, MdStar } from "react-icons/md";
import menus from "@/common/menu";
import { searchMenu } from "@/common/menuSearch";
import { TOOL_DESCRIPTIONS, readRecentTools } from "@/common/toolInfo";
import FavoriteButton from "@/components/common/FavoriteButton";
import useFavoriteTools from "@/hooks/useFavoriteTools";

interface Tool {
  label: string;
  href: string;
  group: string;
  beta?: boolean;
}

// "STRING" -> "String"
const groupTitle = (name: string) =>
  name.charAt(0) + name.slice(1).toLowerCase();

const groups = menus.filter((group) => group.groupName);
const allTools: Tool[] = groups.flatMap((group) =>
  group.items.map((item) => ({
    label: item.label,
    href: item.href,
    group: group.groupName || "",
    beta: item.beta,
  }))
);
const toolByHref = new Map(allTools.map((tool) => [tool.href, tool]));

const gridClass = "grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";

function ToolCard({ tool, showGroup }: { tool: Tool; showGroup?: boolean }) {
  return (
    <Link
      href={tool.href}
      className="group flex flex-col rounded-lg border border-stroke bg-white p-4 transition-colors hover:border-primary focus-visible:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-boxdark dark:hover:border-primary"
    >
      <span className="flex items-start justify-between gap-2">
        <span className="font-medium text-graydark group-hover:text-primary dark:text-white">
          {tool.label}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <FavoriteButton href={tool.href} size={18} />
          {tool.beta && (
            <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-600">
              beta
            </span>
          )}
          {showGroup && (
            <span className="rounded bg-gray px-1.5 py-0.5 text-[10px] font-semibold text-bodydark dark:bg-meta-4 dark:text-bodydark2">
              {tool.group}
            </span>
          )}
        </span>
      </span>
      {TOOL_DESCRIPTIONS[tool.href] && (
        <span className="mt-1 text-sm text-body dark:text-bodydark2">
          {TOOL_DESCRIPTIONS[tool.href]}
        </span>
      )}
    </Link>
  );
}

export default function HomeComponent() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<Tool[]>([]);
  const favoriteHrefs = useFavoriteTools();
  const favorites = useMemo(
    () => favoriteHrefs.map((href) => toolByHref.get(href)).filter((tool): tool is Tool => !!tool),
    [favoriteHrefs]
  );

  // localStorage exists only in the browser
  useEffect(() => {
    setRecent(
      readRecentTools()
        .map((href) => toolByHref.get(href))
        .filter((tool): tool is Tool => !!tool)
        .slice(0, 4)
    );
  }, []);

  const results = useMemo(() => searchMenu(query).filter((r) => r.href !== "/"), [query]);
  const searching = query.trim() !== "";

  return (
    <div className="mx-auto max-w-7xl">
      <header className="pb-6 pt-2 sm:pt-6">
        <h1 className="text-3xl font-bold text-graydark dark:text-white sm:text-4xl">
          Utilities
        </h1>
        <p className="mt-2 text-body dark:text-bodydark2">
          {allTools.length} small tools for developers. Everything runs in your browser.
        </p>
        <div className="relative mt-5 max-w-xl">
          <MdSearch
            size={22}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-bodydark"
          />
          <input
            type="search"
            aria-label="Search all tools"
            placeholder="What do you need? Try jwt, base64, timestamp..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) router.push(results[0].href);
              if (e.key === "Escape") setQuery("");
            }}
            spellCheck={false}
            autoComplete="off"
            className="w-full rounded-lg border border-stroke bg-white py-3 pl-11 pr-4 text-graydark outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
          />
        </div>
      </header>

      {searching ? (
        <section aria-label="Search results">
          <h2 className="mb-3 text-sm font-semibold text-bodydark dark:text-bodydark2">
            {results.length === 0
              ? `No tool matches "${query.trim()}"`
              : `${results.length} result${results.length > 1 ? "s" : ""}, Enter opens the first`}
          </h2>
          <div className={gridClass}>
            {results.map((tool) => (
              <ToolCard key={tool.href} tool={tool} showGroup />
            ))}
          </div>
        </section>
      ) : (
        <>
          {favorites.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-bodydark dark:text-bodydark2">
                <MdStar size={18} />
                Favorites
              </h2>
              <div className={gridClass}>
                {favorites.map((tool) => (
                  <ToolCard key={tool.href} tool={tool} showGroup />
                ))}
              </div>
            </section>
          )}
          {recent.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-bodydark dark:text-bodydark2">
                <MdHistory size={18} />
                Recently used
              </h2>
              <div className={gridClass}>
                {recent.map((tool) => (
                  <ToolCard key={tool.href} tool={tool} showGroup />
                ))}
              </div>
            </section>
          )}
          {groups.map((group) => {
            const Icon = group.groupIcon;
            return (
              <section key={group.groupName} className="mb-8">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-bodydark dark:text-bodydark2">
                  {Icon && <Icon size={18} />}
                  {groupTitle(group.groupName || "")}
                  <span className="font-normal normal-case tracking-normal">
                    {group.items.length}
                  </span>
                </h2>
                <div className={gridClass}>
                  {group.items.map((item) => (
                    <ToolCard
                      key={item.href}
                      tool={{ ...item, group: group.groupName || "" }}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
