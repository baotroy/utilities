"use client";
import { useEffect, useState, Suspense, lazy } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { rememberTool } from "@/common/toolInfo";

// Lazy load non-critical components
const ToasterContext = lazy(() => import("@/context/ToasterContext"));

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // feeds "Recently used" on the home page
  useEffect(() => {
    rememberTool(pathname);
  }, [pathname]);

  return (
    <>
      <Suspense fallback={null}>
        <ToasterContext />
      </Suspense>
      <div className="dark:bg-boxdark-2 dark:text-bodydark">
        <div className="flex h-screen overflow-hidden">
          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
          <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
            <Header
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
            <main>
              <div className="mx-auto max-w-screen-2xl p-4 pt-1 md:p-6 2xl:p-10">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
      <div className="text-gray-400 text-xs text-right m-2">
        <a href="mailto:baotroy@gmail.com"><i>baotroy@gmail.com</i></a>
      </div>
    </>
  );
}
