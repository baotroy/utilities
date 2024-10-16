"use client";
import { copyToClipboard } from "@/common/utils";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useEffect, useState } from "react";
import { MdContentCopy } from "react-icons/md";
import crypto from "crypto";

enum algorithms {
  NONE = "NONE",
  MD5 = "MD5",
  SHA1 = "SHA1",
  SHA256 = "SHA256",
  SHA512 = "SHA512",
}

export default function HttpBasicAuthenticationComponent() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [htpasswd, setHtpasswd] = useState("");
  const [sltAlgorithm, setSltAlgorithm] = useState(algorithms.MD5);

  const handleCopy = () => {
    copyToClipboard(htpasswd);
  };

  useEffect(() => {
    if (username && password) {
      switch (sltAlgorithm) {
        case algorithms.MD5:
          const md5 = crypto.createHash("md5").update(password);
        
          setHtpasswd(`${username}:${md5.digest("base64")}`);
          break
      }
    }
  }, [username, password, sltAlgorithm]);

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

        <div className="mt-2">
          <label
            className="text-lg text-gray-500 dark:text-gray-400"
            htmlFor="algorithm"
          >
            Password
          </label>
          <select defaultValue={algorithms.MD5}>
            {
              Object.values(algorithms).map((algorithm) => (
                <option key={algorithm} value={algorithm}>
                  {algorithm}
                </option>
              ))

            }
          </select>
        </div>
        <div className="mt-6">
          <p
            className="text-lg text-gray-500 dark:text-gray-400"
          >
            Copy this line into your .htpasswd file
          </p>
          <div className="flex">
            <input
              type="text"
              readOnly
              disabled
              value={htpasswd}
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
