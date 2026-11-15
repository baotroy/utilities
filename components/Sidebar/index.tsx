import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MdSearch, MdClose, MdKeyboardArrowDown } from "react-icons/md";
import clsx from "clsx";
import { searchMenu } from "@/common/menuSearch";
import SidebarLinkGroup from "./SidebarLinkGroup";

import LinkItem from "./LinkItem";
import ChildrenLinkItems from "./ChildrenListItems";
import menus from "@/common/menu";
// import { MdOutlineEmail } from "react-icons/md";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const COLLAPSED_STORAGE_KEY = "sidebar-collapsed-groups";

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const sidebar = useRef<any>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  // --- Quick search -------------------------------------------------------
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const results = useMemo(() => searchMenu(query), [query]);
  const isSearching = query.trim() !== "";

  // Ctrl/Cmd+K anywhere, or "/" outside of a text field, jumps to the search box
  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      const isShortcut =
        ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "k") ||
        (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !typing);
      if (!isShortcut) return;
      e.preventDefault();
      setSidebarOpen(true); // on mobile the sidebar is hidden by default
      searchInput.current?.focus();
      searchInput.current?.select();
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [setSidebarOpen]);

  const clearSearch = () => {
    setQuery("");
    setActiveIndex(0);
  };

  const openResult = (href: string) => {
    clearSearch();
    searchInput.current?.blur();
    setSidebarOpen(false);
    router.push(href);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        results.length ? (i - 1 + results.length) % results.length : 0
      );
    } else if (e.key === "Enter") {
      const result = results[activeIndex];
      if (result) {
        e.preventDefault();
        openResult(result.href);
      }
    } else if (e.key === "Escape") {
      if (query) clearSearch();
      else searchInput.current?.blur();
    }
  };

  // Keep the highlighted result visible while moving with the arrow keys
  useEffect(() => {
    if (!isSearching) return;
    document
      .getElementById(`sidebar-search-result-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, isSearching]);

  // --- Collapsible groups -------------------------------------------------
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Restore after mount (not during render, to keep SSR markup identical)
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COLLAPSED_STORAGE_KEY);
      if (stored) setCollapsed(JSON.parse(stored));
    } catch {
      // ignore unreadable storage
    }
  }, []);

  // The group of the current page is always opened when the page changes
  useEffect(() => {
    const activeGroup = menus.find((group) =>
      group.items.some((item) => item.href === pathname)
    )?.groupName;
    if (!activeGroup) return;
    setCollapsed((prev) =>
      prev[activeGroup] ? { ...prev, [activeGroup]: false } : prev
    );
  }, [pathname]);

  const toggleGroup = (groupName: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [groupName]: !prev[groupName] };
      try {
        window.localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors (private mode, quota)
      }
      return next;
    });
  };

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  // let storedSidebarExpanded = "true";
  // const [sidebarExpanded, setSidebarExpanded] = useState(storedSidebarExpanded === null ? false : storedSidebarExpanded === "true");

  // close on click outside
  // useEffect(() => {
  //   const clickHandler = ({ target }: MouseEvent) => {
  //     if (!sidebar.current || !trigger.current) return;
  //     if (!sidebarOpen || sidebar.current.contains(target) || trigger.current.contains(target)) return;
  //     setSidebarOpen(false);
  //   };
  //   document.addEventListener("click", clickHandler);
  //   return () => document.removeEventListener("click", clickHandler);
  // });

  // // close if the esc key is pressed
  // useEffect(() => {
  //   const keyHandler = ({ keyCode }: KeyboardEvent) => {
  //     if (!sidebarOpen || keyCode !== 27) return;
  //     setSidebarOpen(false);
  //   };
  //   document.addEventListener("keydown", keyHandler);
  //   return () => document.removeEventListener("keydown", keyHandler);
  // });

  // useEffect(() => {
  //   localStorage.setItem("sidebar-expanded", sidebarExpanded.toString());
  //   if (sidebarExpanded) {
  //     document.querySelector("body")?.classList.add("sidebar-expanded");
  //   } else {
  //     document.querySelector("body")?.classList.remove("sidebar-expanded");
  //   }
  // }, [sidebarExpanded]);

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`
          fixed inset-0 z-998 bg-black/50 lg:hidden
          transition-opacity duration-300 ease-in-out
          ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        ref={sidebar}
        className={`
        fixed
        left-0
        top-0
        z-999 
        flex 
        h-screen
        w-72 lg:w-72.5
        flex-col
        overflow-y-hidden
        transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
        will-change-transform
        bg-white dark:bg-boxdark
        shadow-lg lg:shadow-none
        lg:static
        lg:translate-x-0 
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* <!-- SIDEBAR HEADER --> */}
        <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5 border-b border-stroke dark:border-strokedark lg:border-0">
          <Link href="/" className="text-xl font-bold text-gray-800 dark:text-white">
            {/* <Image width={176} height={32} src={"/images/logo/logo.svg"} alt="Logo" /> */}
            Utilities
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
            className="block lg:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-meta-4 ml-auto"
          >
            <svg
              className="fill-current text-gray-600 dark:text-bodydark2"
              width="20"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 5L5 15M5 5l10 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* <!-- QUICK SEARCH --> */}
        <div className="px-4 pt-3 lg:pt-0">
          <div className="relative">
            <MdSearch
              size={18}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-bodydark2"
            />
            <input
              ref={searchInput}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search tools..."
              aria-label="Search tools"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-md border border-stroke bg-white py-1.5 pl-8 pr-14 text-sm text-gray-800 outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  clearSearch();
                  searchInput.current?.focus();
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-500 hover:bg-gray-100 dark:text-bodydark2 dark:hover:bg-meta-4"
              >
                <MdClose size={16} />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-stroke px-1.5 text-[10px] leading-5 text-gray-500 dark:border-strokedark dark:text-bodydark2 lg:block">
                Ctrl K
              </kbd>
            )}
          </div>
        </div>

        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
          {isSearching ? (
            <nav className="py-3 px-4" aria-label="Search results">
              {results.length === 0 ? (
                <p className="px-2 py-2 text-sm text-gray-500 dark:text-bodydark2">
                  No tools found
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {results.map((result, index) => (
                    <li key={result.href}>
                      <Link
                        id={`sidebar-search-result-${index}`}
                        href={result.href}
                        onClick={() => openResult(result.href)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={clsx(
                          "flex items-center justify-between gap-2 rounded-sm px-4 py-1.5 text-base lg:text-sm leading-tight",
                          index === activeIndex
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-gray-700 dark:text-bodydark2"
                        )}
                      >
                        <span>
                          {result.label}
                          {result.beta && (
                            <span className="text-xs ml-1 text-gray-500 italic">(beta)</span>
                          )}
                        </span>
                        {result.group && (
                          <span className="shrink-0 text-[10px] font-semibold text-gray-400 dark:text-bodydark2">
                            {result.group}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </nav>
          ) : (
          <nav className="py-4 px-4">
            {menus.map((group, index) => {
              const GroupIcon = group.groupIcon;
              const groupName = group.groupName || "";
              const isCollapsed = !!groupName && !!collapsed[groupName];
              return (
                <div key={index}>
                  {groupName && (
                    <h3 className="mb-1">
                      <button
                        type="button"
                        onClick={() => toggleGroup(groupName)}
                        aria-expanded={!isCollapsed}
                        className="w-full px-2 py-1.5 rounded-md text-sm font-semibold text-gray-600 dark:text-bodydark2 bg-gray-100 dark:bg-meta-4 flex items-center gap-1.5 cursor-pointer"
                      >
                        {GroupIcon && <GroupIcon size={16} />}
                        {groupName}
                        <span className="ml-auto flex items-center gap-1 font-normal text-xs text-gray-500 dark:text-bodydark2">
                          {isCollapsed && group.items.length}
                          <MdKeyboardArrowDown
                            size={18}
                            className={clsx(
                              "transition-transform duration-200",
                              isCollapsed && "-rotate-90"
                            )}
                          />
                        </span>
                      </button>
                    </h3>
                  )}
                  <ul className={clsx("mb-2 flex flex-col gap-1", isCollapsed && "hidden")}>
                    {group.items.map((item, index) => {
                      if (item.children?.length) {
                        return (
                          <SidebarLinkGroup
                            key={index}
                            activeCondition={
                              pathname === item.href
                              //  || pathname.includes(item.slug)
                            }
                          >
                            {(handleClick, open) => {
                              return (
                                <React.Fragment>
                                  <LinkItem
                                    label={item.label}
                                    isParent={true}
                                    isOpen={open}
                                    handleClick={handleClick}
                                    href="#"
                                    icon={item.icon}
                                    isFocus={
                                      pathname === item.href
                                    }
                                  />
                                  <ChildrenLinkItems
                                    items={item.children}
                                    currentPathname={pathname}
                                    isOpen={open}
                                  />
                                </React.Fragment>
                              );
                            }}
                          </SidebarLinkGroup>
                        );
                      } else {
                        return (
                          <React.Fragment key={index}>
                            <LinkItem
                              label={item.label}
                              href={item.href}
                              icon={item.icon}
                              handleClick={() => setSidebarOpen(false)}
                              isFocus={pathname === item.href}
                              isBeta={item.beta}
                            />

                          </React.Fragment>
                        );
                      }
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
