"use client";
import { useState, Suspense, lazy } from "react";

// Lazy load components to reduce initial bundle and defer non-critical
const Sidebar = lazy(() => import("@/components/Sidebar"));
const Header = lazy(() => import("@/components/Header"));
const ToasterContext = lazy(() => import("@/context/ToasterContext"));

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Suspense fallback={null}>
        <ToasterContext />
      </Suspense>
      <div className="dark:bg-boxdark-2 dark:text-bodydark">
        <div className="flex h-screen overflow-hidden">
          <Suspense fallback={<aside className="w-72 lg:w-72.5 bg-white dark:bg-boxdark" />}>
            <Sidebar
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
          </Suspense>
          <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
            <Suspense fallback={<header className="sticky top-0 z-999 flex w-full h-14 bg-transparent" />}>
              <Header
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
            </Suspense>
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
