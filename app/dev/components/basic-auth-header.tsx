"use client";
import { copyToClipboard, utf8ToBase64 } from "@/common/utils";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useMemo, useState } from "react";
import { MdContentCopy } from "react-icons/md";

export default function BasicAuthHeaderComponent() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // Derived value: stays in sync when a field is cleared (it used to keep the
  // old header) and uses the standard "Authorization: Basic <base64>" format.
  // An empty password is valid for Basic auth, so either field is enough.
  const authHeader = useMemo(
    () =>
      username || password
        ? `Authorization: Basic ${utf8ToBase64(`${username}:${password}`)}`
        : "",
    [username, password]
  );

  const handleCopy = () => {
    copyToClipboard(authHeader);
  };


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
