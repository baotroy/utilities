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
      <Breadcrumb pageName="" />
      <h3>
        The encoding script runs in your browser, and none of your credentials
        are seen or stored by this site.
      </h3>
      <div>
        <div className="mt-2">
          <label
            className="text-lg text-gray-500 dark:text-gray-400"
            htmlFor="username"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-1.5 outline-none border rounded-lg border-t-bodydark border-b-bodydark dark:border-t-body dark:border-b-body border-bodydark dark:bg-graydark"
          />
        </div>
        <div className="mt-2">
          <label
            className="text-lg text-gray-500 dark:text-gray-400"
            htmlFor="password"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-1.5 outline-none border rounded-lg border-t-bodydark border-b-bodydark dark:border-t-body dark:border-b-body border-bodydark dark:bg-graydark"
          />
        </div>
        <div className="mt-6">
          <label
            className="text-lg text-gray-500 dark:text-gray-400"
            htmlFor="password"
          >
            Basic Authentication Header
          </label>
          <div className="flex">
            <input
              type="text"
              readOnly
              disabled
              value={authHeader}
              className="w-full p-1.5 outline-none border-t border-b border-l rounded-tl-lg rounded-bl-lg border-t-bodydark border-b-bodydark dark:border-t-body dark:border-b-body border-bodydark dark:bg-graydark"
            />
            <div className="flex">
              <span className="bg-gray-2 dark:bg-graydark border border-bodydark dark:border-body block py-2 px-4 rounded-tr-lg rounded-br-lg hover:cursor-pointer">
                <MdContentCopy size={20} onClick={() => handleCopy()} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
