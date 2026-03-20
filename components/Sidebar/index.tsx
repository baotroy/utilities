import React, { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SidebarLinkGroup from "./SidebarLinkGroup";

import LinkItem from "./LinkItem";
import ChildrenLinkItems from "./ChildrenListItems";
import menus from "@/common/menu";
// import { MdOutlineEmail } from "react-icons/md";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const pathname = usePathname();

  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

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
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-998 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
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
        duration-300 
        ease-linear
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
            ref={trigger}
            onClick={() => setSidebarOpen(false)}
            aria-controls="sidebar"
            aria-expanded={sidebarOpen}
            className="block lg:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-meta-4"
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

        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
          <nav className="py-4 px-4">
            {menus.map((group, index) => {
              const GroupIcon = group.groupIcon;
              return (
                <div key={index}>
                  {group.groupName && (
                    <h3 className="mb-1 ml-2 text-sm font-semibold text-gray-500 dark:text-bodydark2 flex items-center gap-1.5">
                      {GroupIcon && <GroupIcon size={16} />}
                      {group.groupName}
                    </h3>
                  )}
                  <ul className="mb-2 flex flex-col gap-1">
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
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
