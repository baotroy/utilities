"use client";
import "./globals.css";
import "./custom.css";
import { useState } from "react";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ToasterContext from "@/context/ToasterContext";
import { GoogleAnalytics } from "@next/third-parties/google";


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading] = useState<boolean>(false);

  // useEffect(() => {
  //   setTimeout(() => setLoading(false), 1000);
  // }, []);

  return (
    <html lang="en">
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GTAG!} />
      <body suppressHydrationWarning={true}>
        <ToasterContext />
        <div className="dark:bg-boxdark-2 dark:text-bodydark">
          {loading ? (
            // <Loader />
            <></>
          ) : (
            <div className="flex h-screen overflow-hidden">
              {/* <!-- ===== Sidebar Start ===== --> */}
              <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />
              {/* <!-- ===== Sidebar End ===== --> */}

              {/* <!-- ===== Content Area Start ===== --> */}
              <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                {/* <!-- ===== Header Start ===== --> */}
                <Header
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                />
                {/* <!-- ===== Header End ===== --> */}

                {/* <!-- ===== Main Content Start ===== --> */}
                <main>
                  <div className="mx-auto max-w-screen-2xl p-4 pt-1 md:p-6 2xl:p-10">
                    {children}
                  </div>
                </main>
                {/* <!-- ===== Main Content End ===== --> */}
              </div>
              {/* <!-- ===== Content Area End ===== --> */}
            </div>
          )}
        </div>
        <div className=" text-gray-400 text-xs text-right m-2">
          <a href="mailto:baotroy@gmail.com"><i>baotroy@gmail.com</i></a>
        </div>
      </body>
    </html>
  );
}
