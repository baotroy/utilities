"use client";
import { useState, Suspense, lazy } from "react";
import Header from "@/components/Header";
import ToasterContext from "@/context/ToasterContext";

// Lazy load Sidebar to reduce initial bundle
const Sidebar = lazy(() => import("@/components/Sidebar"));

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <ToasterContext />
      <div className="dark:bg-boxdark-2 dark:text-bodydark">
        <div className="flex h-screen overflow-hidden">
          <Suspense fallback={<aside className="w-72 lg:w-72.5 bg-white dark:bg-boxdark" />}>
            <Sidebar
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
          </Suspense>
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
