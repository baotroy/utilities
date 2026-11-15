"use client";
import { copyToClipboard } from "@/common/utils";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import clsx from "clsx";
import { useState } from "react";
import { MdLock, MdLockOpen, MdOutlineClear, MdSwapVert, MdVisibility, MdVisibilityOff } from "react-icons/md";
import {
  AesMode,
  BinaryEncoding,
  DEFAULT_ITERATIONS,
  KeySource,
  Pbkdf2Hash,
  SALT_LENGTH,
  aesDecrypt,
  aesEncrypt,
  bytesToBase64,
  bytesToHex,
  decodeBytes,
  encodeBytes,
  ivLength,
  randomBytes,
  tryUtf8,
} from "./utils";

type Action = "encrypt" | "decrypt";

interface EncryptOutput {
  combined: string;
  salt: string | null;
  iv: string;
  ciphertext: string;
}

interface DecryptOutput {
  text: string | null; // null when the plaintext is not valid UTF-8
  hex: string;
  base64: string;
}

const MODES: { id: AesMode; label: string; note: string }[] = [
  { id: "AES-GCM", label: "GCM", note: "Authenticated, recommended" },
  { id: "AES-CBC", label: "CBC", note: "PKCS#7 padding" },
  { id: "AES-CTR", label: "CTR", note: "Stream mode, no integrity check" },
];

function ToggleButton({
  active,
  onClick,
  children,
  small,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded border transition-colors",
        small ? "px-3 py-1.5 text-sm" : "px-4 py-2",
        active
          ? "bg-primary text-white border-primary"
          : "bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-primary",
      )}
    >
      {children}
    </button>
  );
}

function OutputField({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="p-3 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <button onClick={() => copyToClipboard(value)} className="text-xs text-primary hover:underline">
          Copy
        </button>
      </div>
      <div className={clsx("text-sm break-all whitespace-pre-wrap", mono && "font-mono")}>{value}</div>
    </div>
  );
}

export default function AesEncryptDecryptComponent() {
  const [action, setAction] = useState<Action>("encrypt");
  const [mode, setMode] = useState<AesMode>("AES-GCM");
  const [keySource, setKeySource] = useState<KeySource>("password");
  const [password, setPassword] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [keySize, setKeySize] = useState<128 | 256>(256);
  const [iterations, setIterations] = useState(DEFAULT_ITERATIONS);
  const [hash, setHash] = useState<Pbkdf2Hash>("SHA-256");
  const [rawKey, setRawKey] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Encrypt
  const [plaintext, setPlaintext] = useState("");
  const [customIv, setCustomIv] = useState("");
  const [outEncoding, setOutEncoding] = useState<BinaryEncoding>("base64");
  const [encResult, setEncResult] = useState<EncryptOutput | null>(null);

  // Decrypt
  const [cipherInput, setCipherInput] = useState("");
  const [inEncoding, setInEncoding] = useState<BinaryEncoding>("base64");
  const [embedded, setEmbedded] = useState(true);
  const [decIv, setDecIv] = useState("");
  const [decSalt, setDecSalt] = useState("");
  const [decResult, setDecResult] = useState<DecryptOutput | null>(null);

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const keyOptions = () => ({ keySource, password, rawKey, keySize, iterations, hash });

  const run = async () => {
    setError("");
    setBusy(true);
    try {
      if (action === "encrypt") {
        setEncResult(null);
        const r = await aesEncrypt(new TextEncoder().encode(plaintext), mode, keyOptions(), customIv);
        setEncResult({
          combined: encodeBytes(r.combined, outEncoding),
          salt: r.salt ? bytesToHex(r.salt) : null,
          iv: bytesToHex(r.iv),
          ciphertext: encodeBytes(r.ciphertext, outEncoding),
        });
      } else {
        setDecResult(null);
        if (!cipherInput.trim()) throw new Error("Ciphertext is empty");
        let data: Uint8Array;
        try {
          data = decodeBytes(cipherInput, inEncoding);
        } catch {
          throw new Error(`Ciphertext is not valid ${inEncoding === "hex" ? "hex" : "base64"}`);
        }
        const out = await aesDecrypt(mode, keyOptions(), { data, embedded, iv: decIv, salt: decSalt });
        setDecResult({ text: tryUtf8(out), hex: bytesToHex(out), base64: bytesToBase64(out) });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setPlaintext("");
    setCustomIv("");
    setCipherInput("");
    setDecIv("");
    setDecSalt("");
    setEncResult(null);
    setDecResult(null);
    setError("");
  };

  // Move the encryption output to the Decrypt tab, keeping the same settings
  const sendToDecrypt = () => {
    if (!encResult) return;
    setCipherInput(encResult.combined);
    setInEncoding(outEncoding);
    setEmbedded(true);
    setDecResult(null);
    setError("");
    setAction("decrypt");
  };

  const generateKey = (bytes: number) => {
    setRawKey(bytesToHex(randomBytes(bytes)));
  };

  const layout =
    keySource === "password"
      ? `salt (${SALT_LENGTH} bytes) + IV (${ivLength(mode)} bytes) + ciphertext`
      : `IV (${ivLength(mode)} bytes) + ciphertext`;

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Encrypt and decrypt text with AES (GCM, CBC or CTR) using a password or a raw key. Everything runs in your
          browser with the Web Crypto API; nothing is sent to a server.
        </p>

        <div className="space-y-4">
          {/* Action */}
          <div className="flex gap-2">
            <ToggleButton active={action === "encrypt"} onClick={() => { setAction("encrypt"); setError(""); }}>
              <MdLock className="inline-block mr-1" /> Encrypt
            </ToggleButton>
            <ToggleButton active={action === "decrypt"} onClick={() => { setAction("decrypt"); setError(""); }}>
              <MdLockOpen className="inline-block mr-1" /> Decrypt
            </ToggleButton>
          </div>

          {/* Mode */}
          <div>
            <div className="mb-2">Mode</div>
            <div className="flex flex-wrap gap-2">
              {MODES.map((m) => (
                <ToggleButton key={m.id} small active={mode === m.id} onClick={() => setMode(m.id)}>
                  {m.id} <span className="opacity-75">· {m.note}</span>
                </ToggleButton>
              ))}
            </div>
          </div>

          {/* Key */}
          <div>
            <div className="mb-2">Key</div>
            <div className="flex gap-2 mb-2">
              <ToggleButton small active={keySource === "password"} onClick={() => setKeySource("password")}>
                Password (PBKDF2)
              </ToggleButton>
              <ToggleButton small active={keySource === "raw"} onClick={() => setKeySource("raw")}>
                Raw key
              </ToggleButton>
            </div>
            {keySource === "password" ? (
              <div className="flex">
                <input
                  type={showSecret ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="off"
                  className="custom-input w-full rounded-r-none"
                />
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="px-3 border border-l-0 border-bodydark rounded-r bg-gray-2 dark:bg-graydark"
                  title={showSecret ? "Hide" : "Show"}
                >
                  {showSecret ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={rawKey}
                  onChange={(e) => setRawKey(e.target.value)}
                  placeholder="Key as hex (32 / 48 / 64 chars) or base64"
                  spellCheck={false}
                  autoComplete="off"
                  className="custom-input w-full font-mono"
                />
                <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                  <span className="text-body dark:text-bodydark2">Generate random key:</span>
                  <button onClick={() => generateKey(16)} className="text-primary hover:underline">
                    128-bit
                  </button>
                  <button onClick={() => generateKey(32)} className="text-primary hover:underline">
                    256-bit
                  </button>
                  {rawKey && (
                    <button onClick={() => copyToClipboard(rawKey)} className="text-primary hover:underline ml-auto">
                      Copy key
                    </button>
                  )}
                </div>
              </div>
            )}

            {keySource === "password" && (
              <div className="mt-2">
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm text-primary hover:underline">
                  {showAdvanced ? "Hide" : "Show"} key derivation settings
                </button>
                {showAdvanced && (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <label className="flex flex-col gap-1">
                      Key size
                      <select
                        value={keySize}
                        onChange={(e) => setKeySize(+e.target.value as 128 | 256)}
                        className="custom-input"
                      >
                        <option value={256}>256-bit</option>
                        <option value={128}>128-bit</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      PBKDF2 hash
                      <select value={hash} onChange={(e) => setHash(e.target.value as Pbkdf2Hash)} className="custom-input">
                        <option value="SHA-256">SHA-256</option>
                        <option value="SHA-512">SHA-512</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      Iterations
                      <input
                        type="number"
                        min={1}
                        value={iterations}
                        onChange={(e) => setIterations(Math.max(0, Math.floor(+e.target.value)))}
                        className="custom-input"
                      />
                    </label>
                    <div className="sm:col-span-3 text-xs text-body dark:text-bodydark2">
                      Decrypting needs the same key size, hash and iterations that were used to encrypt.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {action === "encrypt" ? (
            <>
              <div>
                <div className="mb-2">Plain text</div>
                <textarea
                  rows={6}
                  value={plaintext}
                  onChange={(e) => setPlaintext(e.target.value)}
                  placeholder="Enter text to encrypt..."
                  spellCheck={false}
                  className="custom-input w-full"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="mb-2">IV (optional, hex)</div>
                  <input
                    type="text"
                    value={customIv}
                    onChange={(e) => setCustomIv(e.target.value)}
                    placeholder={`Random ${ivLength(mode)}-byte IV if empty`}
                    spellCheck={false}
                    className="custom-input w-full font-mono"
                  />
                </div>
                <div>
                  <div className="mb-2">Output encoding</div>
                  <div className="flex gap-2">
                    <ToggleButton small active={outEncoding === "base64"} onClick={() => setOutEncoding("base64")}>
                      Base64
                    </ToggleButton>
                    <ToggleButton small active={outEncoding === "hex"} onClick={() => setOutEncoding("hex")}>
                      Hex
                    </ToggleButton>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="mb-2">Ciphertext</div>
                <textarea
                  rows={6}
                  value={cipherInput}
                  onChange={(e) => setCipherInput(e.target.value)}
                  placeholder="Paste the encrypted data..."
                  spellCheck={false}
                  className="custom-input w-full font-mono"
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex gap-2">
                  <ToggleButton small active={inEncoding === "base64"} onClick={() => setInEncoding("base64")}>
                    Base64
                  </ToggleButton>
                  <ToggleButton small active={inEncoding === "hex"} onClick={() => setInEncoding("hex")}>
                    Hex
                  </ToggleButton>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={embedded}
                    onChange={(e) => setEmbedded(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>{keySource === "password" ? "Salt and IV are" : "IV is"} prepended to the ciphertext</span>
                </label>
              </div>
              {!embedded && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="mb-2">IV (hex)</div>
                    <input
                      type="text"
                      value={decIv}
                      onChange={(e) => setDecIv(e.target.value)}
                      placeholder={`${ivLength(mode)} bytes`}
                      spellCheck={false}
                      className="custom-input w-full font-mono"
                    />
                  </div>
                  {keySource === "password" && (
                    <div>
                      <div className="mb-2">Salt (hex)</div>
                      <input
                        type="text"
                        value={decSalt}
                        onChange={(e) => setDecSalt(e.target.value)}
                        placeholder="PBKDF2 salt"
                        spellCheck={false}
                        className="custom-input w-full font-mono"
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex">
            <Button
              handleOnClick={run}
              label={action === "encrypt" ? "Encrypt" : "Decrypt"}
              additionalClass="mr-2"
              isLoading={busy}
              icon={{ icon: action === "encrypt" ? MdLock : MdLockOpen, position: "left", size: 18 }}
            />
            <Button
              handleOnClick={reset}
              label="Reset"
              type="reset"
              additionalClass="mr-2"
              icon={{ icon: MdOutlineClear, position: "left", size: 20 }}
            />
          </div>

          {error && (
            <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Results */}
          {action === "encrypt" && encResult && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Result</span>
                <button onClick={sendToDecrypt} className="text-sm text-primary hover:underline flex items-center gap-1">
                  <MdSwapVert /> Decrypt this
                </button>
              </div>
              <OutputField label={`Encrypted (${layout})`} value={encResult.combined} />
              <details className="text-sm">
                <summary className="cursor-pointer text-body dark:text-bodydark2 mb-2">Separate parts</summary>
                <div className="space-y-2">
                  {encResult.salt && <OutputField label="Salt (hex)" value={encResult.salt} />}
                  <OutputField label="IV (hex)" value={encResult.iv} />
                  <OutputField
                    label={`Ciphertext${mode === "AES-GCM" ? " + 16-byte auth tag" : ""} (${outEncoding})`}
                    value={encResult.ciphertext}
                  />
                </div>
              </details>
            </div>
          )}

          {action === "decrypt" && decResult && (
            <div className="space-y-2">
              <div>Result</div>
              {decResult.text !== null ? (
                <OutputField label="Plain text (UTF-8)" value={decResult.text} mono={false} />
              ) : (
                <div className="text-sm text-body dark:text-bodydark2">The decrypted data is not valid UTF-8 text.</div>
              )}
              <details className="text-sm" open={decResult.text === null}>
                <summary className="cursor-pointer text-body dark:text-bodydark2 mb-2">Raw bytes</summary>
                <div className="space-y-2">
                  <OutputField label="Hex" value={decResult.hex} />
                  <OutputField label="Base64" value={decResult.base64} />
                </div>
              </details>
            </div>
          )}

          {/* Info */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
            <div className="text-sm font-medium mb-2">How it works</div>
            <ul className="text-xs text-body dark:text-bodydark2 space-y-1 list-disc pl-4">
              <li>
                <strong>Password:</strong> the key is derived with PBKDF2 using a random {SALT_LENGTH}-byte salt
                (default {DEFAULT_ITERATIONS.toLocaleString("en-US")} iterations of HMAC-SHA-256, 256-bit key).
              </li>
              <li>
                <strong>Raw key:</strong> a 16, 24 or 32-byte key (AES-128/192/256) used as is. Some browsers do not
                support 192-bit keys.
              </li>
              <li>
                <strong>Output:</strong> {layout}, encoded as one string. A new random IV is used each time, so the same
                text encrypts differently every time.
              </li>
              <li>
                <strong>GCM</strong> appends a 16-byte authentication tag and refuses to decrypt modified data.
                <strong> CBC</strong> uses PKCS#7 padding. <strong>CTR</strong> uses a 64-bit counter and cannot detect a
                wrong key.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
