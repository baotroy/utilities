// AES encryption helpers built on the browser's WebCrypto API (crypto.subtle).
// Everything runs locally; no key, password or text ever leaves the page.

export type AesMode = "AES-GCM" | "AES-CBC" | "AES-CTR";
export type KeySource = "password" | "raw";
export type BinaryEncoding = "base64" | "hex";
export type Pbkdf2Hash = "SHA-256" | "SHA-512";

export const SALT_LENGTH = 16;
export const DEFAULT_ITERATIONS = 600_000; // OWASP 2023 recommendation for PBKDF2-HMAC-SHA256

export function ivLength(mode: AesMode): number {
  // GCM uses a 96-bit nonce; CBC and CTR use a full 128-bit block
  return mode === "AES-GCM" ? 12 : 16;
}

// ---------- encoding helpers ----------

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().replace(/^0x/i, "").replace(/[\s:]/g, "");
  if (clean.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(clean)) {
    throw new Error("Invalid hex string");
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return out;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

export function base64ToBytes(b64: string): Uint8Array {
  // Accept URL-safe base64 and missing padding too
  let clean = b64.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) {
    throw new Error("Invalid base64 string");
  }
  clean = clean.replace(/=+$/, "");
  if (clean.length % 4 === 1) throw new Error("Invalid base64 string");
  clean += "=".repeat((4 - (clean.length % 4)) % 4);
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeBytes(bytes: Uint8Array, enc: BinaryEncoding): string {
  return enc === "hex" ? bytesToHex(bytes) : bytesToBase64(bytes);
}

export function decodeBytes(text: string, enc: BinaryEncoding): Uint8Array {
  return enc === "hex" ? hexToBytes(text) : base64ToBytes(text);
}

/** Parse a raw AES key given as hex (32/48/64 chars) or base64. */
export function parseRawKey(text: string): Uint8Array {
  const t = text.trim().replace(/^0x/i, "");
  if (!t) throw new Error("Key is empty");
  let bytes: Uint8Array | null = null;
  if (/^[0-9a-fA-F]+$/.test(t) && [32, 48, 64].includes(t.length)) {
    bytes = hexToBytes(t);
  } else {
    try {
      bytes = base64ToBytes(t);
    } catch {
      throw new Error("Key must be hex or base64");
    }
  }
  if (![16, 24, 32].includes(bytes.length)) {
    throw new Error(
      `Key must be 16, 24 or 32 bytes (AES-128/192/256), got ${bytes.length} bytes`,
    );
  }
  return bytes;
}

export function randomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length);
  crypto.getRandomValues(out);
  return out;
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

// ---------- key handling ----------

export interface KeyOptions {
  keySource: KeySource;
  password?: string;
  rawKey?: string; // hex or base64
  keySize?: 128 | 256; // password-derived key size
  iterations?: number;
  hash?: Pbkdf2Hash;
}

// WebCrypto's typings want ArrayBuffer-backed views
const buf = (u: Uint8Array) => u as Uint8Array<ArrayBuffer>;

async function importKey(mode: AesMode, opts: KeyOptions, salt: Uint8Array | null): Promise<CryptoKey> {
  const subtle = crypto.subtle;
  if (opts.keySource === "raw") {
    const raw = parseRawKey(opts.rawKey || "");
    try {
      return await subtle.importKey("raw", buf(raw), { name: mode }, false, ["encrypt", "decrypt"]);
    } catch (e) {
      if (raw.length === 24) {
        throw new Error("This browser does not support 192-bit AES keys. Use a 128 or 256-bit key.");
      }
      throw e;
    }
  }
  if (!opts.password) throw new Error("Password is empty");
  if (!salt) throw new Error("Salt is missing");
  const iterations = opts.iterations || DEFAULT_ITERATIONS;
  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new Error("Iterations must be a positive integer");
  }
  const base = await subtle.importKey(
    "raw",
    buf(new TextEncoder().encode(opts.password)),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return subtle.deriveKey(
    { name: "PBKDF2", salt: buf(salt), iterations, hash: opts.hash || "SHA-256" },
    base,
    { name: mode, length: opts.keySize || 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function algorithmParams(mode: AesMode, iv: Uint8Array): AlgorithmIdentifier | AesGcmParams | AesCbcParams | AesCtrParams {
  if (mode === "AES-CTR") return { name: mode, counter: buf(iv), length: 64 };
  return { name: mode, iv: buf(iv) };
}

// ---------- encrypt / decrypt ----------

export interface EncryptResult {
  salt: Uint8Array | null;
  iv: Uint8Array;
  ciphertext: Uint8Array; // for GCM the 16-byte auth tag is appended
  combined: Uint8Array; // salt (password mode only) || iv || ciphertext
}

export async function aesEncrypt(
  plaintext: Uint8Array,
  mode: AesMode,
  opts: KeyOptions,
  customIv?: string, // hex; random when empty
): Promise<EncryptResult> {
  const salt = opts.keySource === "password" ? randomBytes(SALT_LENGTH) : null;
  let iv: Uint8Array;
  if (customIv && customIv.trim()) {
    iv = hexToBytes(customIv);
    if (iv.length !== ivLength(mode)) {
      throw new Error(`IV for ${mode} must be ${ivLength(mode)} bytes (${ivLength(mode) * 2} hex chars)`);
    }
  } else {
    iv = randomBytes(ivLength(mode));
  }
  const key = await importKey(mode, opts, salt);
  const ct = new Uint8Array(await crypto.subtle.encrypt(algorithmParams(mode, iv), key, buf(plaintext)));
  return {
    salt,
    iv,
    ciphertext: ct,
    combined: salt ? concatBytes(salt, iv, ct) : concatBytes(iv, ct),
  };
}

export interface DecryptInput {
  data: Uint8Array;
  /** true: salt (password mode) and IV are at the start of `data` */
  embedded: boolean;
  iv?: string; // hex, when not embedded
  salt?: string; // hex, when not embedded (password mode)
}

export async function aesDecrypt(mode: AesMode, opts: KeyOptions, input: DecryptInput): Promise<Uint8Array> {
  const ivLen = ivLength(mode);
  let salt: Uint8Array | null = null;
  let iv: Uint8Array;
  let ct: Uint8Array;
  if (input.embedded) {
    const saltLen = opts.keySource === "password" ? SALT_LENGTH : 0;
    if (input.data.length <= saltLen + ivLen) {
      throw new Error("Ciphertext is too short to contain the salt and IV");
    }
    salt = saltLen ? input.data.slice(0, saltLen) : null;
    iv = input.data.slice(saltLen, saltLen + ivLen);
    ct = input.data.slice(saltLen + ivLen);
  } else {
    iv = hexToBytes(input.iv || "");
    if (iv.length !== ivLen) {
      throw new Error(`IV for ${mode} must be ${ivLen} bytes (${ivLen * 2} hex chars)`);
    }
    if (opts.keySource === "password") {
      salt = hexToBytes(input.salt || "");
      if (salt.length === 0) throw new Error("Salt is required when using a password");
    }
    ct = input.data;
  }
  const key = await importKey(mode, opts, salt);
  try {
    return new Uint8Array(await crypto.subtle.decrypt(algorithmParams(mode, iv), key, buf(ct)));
  } catch {
    // WebCrypto throws an opaque OperationError
    throw new Error(
      mode === "AES-CTR"
        ? "Decryption failed"
        : "Decryption failed: wrong key/password, wrong mode, or the data was modified",
    );
  }
}

/** Decode bytes as UTF-8 text, or null when they are not valid UTF-8. */
export function tryUtf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}
