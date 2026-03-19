"use client";
import { copyToClipboard } from "@/common/utils";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useEffect, useState } from "react";
import { MdContentCopy } from "react-icons/md";
import crypto from "crypto";
import bcrypt from "bcryptjs";

enum Algorithm {
  APR1 = "APR1",
  BCRYPT = "BCRYPT",
  SHA256 = "SHA256",
  SHA512 = "SHA512",
  PLAIN = "PLAIN",
}

const algorithmDescriptions: Record<Algorithm, string> = {
  [Algorithm.APR1]: "APR1-MD5 - Apache compatible, recommended",
  [Algorithm.BCRYPT]: "bcrypt - Most secure",
  [Algorithm.SHA256]: "SHA-256 - Plain SHA-256",
  [Algorithm.SHA512]: "SHA-512 - Plain SHA-512",
  [Algorithm.PLAIN]: "Plain text - not recommended",
};

// Generate random salt
function generateSalt(length: number = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789./";
  let salt = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    salt += chars[bytes[i] % chars.length];
  }
  return salt;
}

// APR1-MD5 algorithm (Apache htpasswd compatible)
function apr1Md5(password: string): string {
  const salt = generateSalt(8);

  // APR1-MD5 algorithm implementation
  const apr1Magic = "$apr1$";

  // Initial hash: password + magic + salt
  let ctx = crypto.createHash("md5");
  ctx.update(password);
  ctx.update(apr1Magic);
  ctx.update(salt);

  // Alternate hash: password + salt + password
  let ctx1 = crypto.createHash("md5");
  ctx1.update(password);
  ctx1.update(salt);
  ctx1.update(password);
  let final = ctx1.digest();

  // Add alternate hash bytes
  for (let pl = password.length; pl > 0; pl -= 16) {
    ctx.update(new Uint8Array(final.buffer, final.byteOffset, pl > 16 ? 16 : pl));
  }

  // Add password bits
  for (let i = password.length; i !== 0; i >>= 1) {
    if (i & 1) {
      ctx.update(new Uint8Array([0]));
    } else {
      ctx.update(password.charAt(0));
    }
  }

  final = ctx.digest();

  // 1000 iterations
  for (let i = 0; i < 1000; i++) {
    ctx1 = crypto.createHash("md5");
    if (i & 1) {
      ctx1.update(password);
    } else {
      ctx1.update(new Uint8Array(final.buffer, final.byteOffset, final.length));
    }
    if (i % 3) {
      ctx1.update(salt);
    }
    if (i % 7) {
      ctx1.update(password);
    }
    if (i & 1) {
      ctx1.update(new Uint8Array(final.buffer, final.byteOffset, final.length));
    } else {
      ctx1.update(password);
    }
    final = ctx1.digest();
  }

  // Custom base64 encoding for APR1
  const itoa64 = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const to64 = (v: number, n: number): string => {
    let s = "";
    while (--n >= 0) {
      s += itoa64[v & 0x3f];
      v >>= 6;
    }
    return s;
  };

  let result = "";
  result += to64((final[0] << 16) | (final[6] << 8) | final[12], 4);
  result += to64((final[1] << 16) | (final[7] << 8) | final[13], 4);
  result += to64((final[2] << 16) | (final[8] << 8) | final[14], 4);
  result += to64((final[3] << 16) | (final[9] << 8) | final[15], 4);
  result += to64((final[4] << 16) | (final[10] << 8) | final[5], 4);
  result += to64(final[11], 2);

  return `${apr1Magic}${salt}$${result}`;
}

// bcrypt hash
function bcryptHash(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  // Convert $2a$ or $2b$ to $2y$ for Apache compatibility
  return hash.replace(/^\$2[ab]\$/, "$2y$");
}

// SHA-256 plain hash with {SHA256} prefix
function sha256Plain(password: string): string {
  const hash = crypto.createHash("sha256").update(password).digest("base64");
  return `{SHA256}${hash}`;
}

// SHA-512 plain hash with {SHA512} prefix  
function sha512Plain(password: string): string {
  const hash = crypto.createHash("sha512").update(password).digest("base64");
  return `{SHA512}${hash}`;
}

export default function HttpBasicAuthenticationComponent() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [htpasswd, setHtpasswd] = useState("");
  const [sltAlgorithm, setSltAlgorithm] = useState<Algorithm>(Algorithm.APR1);
  const [nginxConfig, setNginxConfig] = useState("");

  const handleCopy = () => {
    copyToClipboard(htpasswd);
  };

  const handleCopyNginx = () => {
    copyToClipboard(nginxConfig);
  };

  useEffect(() => {
    if (username && password) {
      let hash = "";
      switch (sltAlgorithm) {
        case Algorithm.APR1:
          hash = apr1Md5(password);
          break;
        case Algorithm.BCRYPT:
          hash = bcryptHash(password);
          break;
        case Algorithm.SHA256:
          hash = sha256Plain(password);
          break;
        case Algorithm.SHA512:
          hash = sha512Plain(password);
          break;
        case Algorithm.PLAIN:
          hash = password;
          break;
      }
      setHtpasswd(`${username}:${hash}`);

      // Generate NGINX config example
      setNginxConfig(`# Add to your NGINX server block or location
auth_basic "Restricted Area";
auth_basic_user_file /etc/nginx/.htpasswd;`);
    } else {
      setHtpasswd("");
      setNginxConfig("");
    }
  }, [username, password, sltAlgorithm]);

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Generate htpasswd entries for NGINX basic authentication. The encoding runs in your browser - no credentials are sent to any server.
        </p>

        <div className="mt-4">
          <label
            className="text-sm font-semibold block mb-1"
            htmlFor="username"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            className="w-full p-2 outline-none border rounded-lg border-bodydark dark:border-body dark:bg-body text-sm"
          />
        </div>

        <div className="mt-4">
          <label
            className="text-sm font-semibold block mb-1"
            htmlFor="password"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full p-2 outline-none border rounded-lg border-bodydark dark:border-body dark:bg-body text-sm"
          />
        </div>

        <div className="mt-4">
          <label
            className="text-sm font-semibold block mb-1"
            htmlFor="algorithm"
          >
            Hash Algorithm
          </label>
          <select
            id="algorithm"
            value={sltAlgorithm}
            onChange={(e) => setSltAlgorithm(e.target.value as Algorithm)}
            className="w-full p-2 outline-none border rounded-lg border-bodydark dark:border-body dark:bg-body text-sm"
          >
            {Object.values(Algorithm).map((algorithm) => (
              <option key={algorithm} value={algorithm}>
                {algorithmDescriptions[algorithm]}
              </option>
            ))}
          </select>
        </div>

        {htpasswd && (
          <>
            <div className="mt-6">
              <label className="text-sm font-semibold block mb-1">
                htpasswd Entry
              </label>
              <p className="text-xs text-bodydark dark:text-bodydark2 mb-2">
                Add this line to your .htpasswd file
              </p>
              <div className="flex">
                <input
                  type="text"
                  readOnly
                  value={htpasswd}
                  className="flex-1 p-2 outline-none border border-r-0 rounded-l-lg border-bodydark dark:border-body dark:bg-body font-mono text-sm"
                />
                <button
                  onClick={handleCopy}
                  className="bg-bodydark/10 dark:bg-body/20 border border-bodydark dark:border-body px-4 rounded-r-lg hover:bg-bodydark/20 dark:hover:bg-body/30 transition-colors"
                >
                  <MdContentCopy size={18} />
                </button>
              </div>
            </div>

            <div className="mt-6">
              <label className="text-sm font-semibold block mb-1">
                NGINX Configuration
              </label>
              <p className="text-xs text-bodydark dark:text-bodydark2 mb-2">
                Add this to your NGINX config
              </p>
              <div className="relative">
                <pre className="p-3 bg-boxdark dark:bg-body rounded-lg font-mono text-sm text-white dark:text-bodydark1 overflow-x-auto">
                  {nginxConfig}
                </pre>
                <button
                  onClick={handleCopyNginx}
                  className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded"
                >
                  <MdContentCopy size={16} className="text-white" />
                </button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-bodydark/10 dark:bg-body/20 rounded-lg">
              <h4 className="text-sm font-semibold mb-2">Setup Instructions</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Create the htpasswd file: <code className="bg-boxdark text-white px-1 rounded text-xs">sudo touch /etc/nginx/.htpasswd</code></li>
                <li>Add the generated line to the file</li>
                <li>Add the NGINX config to your server block</li>
                <li>Test and reload: <code className="bg-boxdark text-white px-1 rounded text-xs">sudo nginx -t && sudo nginx -s reload</code></li>
              </ol>
            </div>
          </>
        )}
      </div>
    </>
  );
}
