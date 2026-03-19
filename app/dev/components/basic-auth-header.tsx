"use client";
import { copyToClipboard } from "@/common/utils";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useEffect, useState } from "react";
import { MdContentCopy } from "react-icons/md";

export default function BasicAuthHeaderComponent() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authHeader, setAuthHeader] = useState("");

  const handleCopy = () => {
    copyToClipboard(authHeader);
  };

  useEffect(() => {
    if (username && password) {
      const base64 = Buffer.from(`${username}:${password}`).toString("base64");
      setAuthHeader(`Authorization Basic: ${base64}`);
    }
  }, [username, password]);

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Generate HTTP Basic Authentication headers. The encoding runs in your browser - no credentials are sent to any server.
        </p>
        <div className="mb-4">
          <label className="font-semibold text-sm mb-2 block" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded p-2 border border-bodydark outline-bodydark dark:outline-boxdark dark:bg-body text-sm dark:text-bodydark1"
          />
        </div>
        <div className="mb-4">
          <label className="font-semibold text-sm mb-2 block" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded p-2 border border-bodydark outline-bodydark dark:outline-boxdark dark:bg-body text-sm dark:text-bodydark1"
          />
        </div>
        <div className="mb-4">
          <label className="font-semibold text-sm mb-2 block">
            Basic Authentication Header
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={authHeader}
              className="flex-1 rounded p-2 border border-bodydark outline-bodydark dark:outline-boxdark dark:bg-body text-sm dark:text-bodydark1 font-mono"
            />
            <button
              onClick={() => handleCopy()}
              className="px-4 py-2 text-sm underline decoration-dashed hover:no-underline"
            >
              copy
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
