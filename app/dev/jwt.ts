// JSON Web Token helpers built on the Web Crypto API (browser, no dependency)
import { TypeAlgorithm, algorithms } from "./type";

type AlgFamily = "HMAC" | "RSA" | "RSA-PSS" | "ECDSA" | "EdDSA";

interface AlgInfo {
  family: AlgFamily;
  hash?: "SHA-256" | "SHA-384" | "SHA-512";
  curve?: "P-256" | "P-384" | "P-521";
}

const ALG_INFO: Record<TypeAlgorithm, AlgInfo> = {
  HS256: { family: "HMAC", hash: "SHA-256" },
  HS384: { family: "HMAC", hash: "SHA-384" },
  HS512: { family: "HMAC", hash: "SHA-512" },
  RS256: { family: "RSA", hash: "SHA-256" },
  RS384: { family: "RSA", hash: "SHA-384" },
  RS512: { family: "RSA", hash: "SHA-512" },
  PS256: { family: "RSA-PSS", hash: "SHA-256" },
  PS384: { family: "RSA-PSS", hash: "SHA-384" },
  PS512: { family: "RSA-PSS", hash: "SHA-512" },
  ES256: { family: "ECDSA", hash: "SHA-256", curve: "P-256" },
  ES384: { family: "ECDSA", hash: "SHA-384", curve: "P-384" },
  ES512: { family: "ECDSA", hash: "SHA-512", curve: "P-521" },
  EdDSA: { family: "EdDSA" },
};

export const isSupportedAlgorithm = (alg: unknown): alg is TypeAlgorithm =>
  typeof alg === "string" && (algorithms as readonly string[]).includes(alg);

export const isHmac = (alg: TypeAlgorithm): boolean =>
  ALG_INFO[alg].family === "HMAC";

/** Bits of the hash behind an HMAC algorithm (recommended minimum secret size). */
export const hmacBits = (alg: TypeAlgorithm): number =>
  parseInt((ALG_INFO[alg].hash || "SHA-256").slice(4), 10);

/**
 * Keys of the same kind can be reused between algorithms
 * (RS256/RS512/PS256 share an RSA key, ES256 and ES384 do not).
 */
export const keyKind = (alg: TypeAlgorithm): string => {
  const info = ALG_INFO[alg];
  switch (info.family) {
    case "HMAC":
      return "secret";
    case "RSA":
    case "RSA-PSS":
      return "RSA";
    case "ECDSA":
      return `EC ${info.curve}`;
    default:
      return "Ed25519";
  }
};

// ---------------------------------------------------------------- bytes

const encoder = new TextEncoder();

export const bytesToBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

/** Accepts base64url and plain base64. Throws on anything else. */
export const base64ToBytes = (input: string): Uint8Array => {
  const clean = input.replace(/\s+/g, "").replace(/=+$/, "");
  if (!/^[A-Za-z0-9+/_-]*$/.test(clean) || clean.length % 4 === 1) {
    throw new Error("Invalid base64 data");
  }
  const base64 = clean.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

export const textToBase64Url = (text: string): string =>
  bytesToBase64Url(encoder.encode(text));

/** Decodes one JWT segment to text. Throws when it is not base64url / UTF-8. */
export const base64UrlToText = (segment: string): string => {
  if (!/^[A-Za-z0-9_-]*$/.test(segment)) throw new Error("Invalid base64url");
  return new TextDecoder("utf-8", { fatal: true }).decode(base64ToBytes(segment));
};

// ---------------------------------------------------------------- keys

export interface JwtKeys {
  /** HMAC secret */
  secret: string;
  /** the secret is base64 / base64url encoded bytes instead of plain text */
  secretBase64: boolean;
  /** PEM or JWK */
  publicKey: string;
  /** PEM or JWK */
  privateKey: string;
}

const concat = (...parts: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
};

// DER: tag + length + content
const der = (tag: number, ...content: Uint8Array[]): Uint8Array => {
  const body = concat(...content);
  const len = body.length;
  let header: number[];
  if (len < 0x80) header = [tag, len];
  else if (len < 0x100) header = [tag, 0x81, len];
  else if (len < 0x10000) header = [tag, 0x82, len >> 8, len & 0xff];
  else header = [tag, 0x83, len >> 16, (len >> 8) & 0xff, len & 0xff];
  return concat(new Uint8Array(header), body);
};

const hex = (s: string) =>
  new Uint8Array((s.match(/../g) || []).map((b) => parseInt(b, 16)));

const VERSION_0 = hex("020100");
// AlgorithmIdentifier { rsaEncryption, NULL }
const RSA_ALG_ID = hex("300d06092a864886f70d0101010500");
const EC_PUBLIC_KEY_OID = hex("06072a8648ce3d0201");
const CURVE_OID: Record<string, Uint8Array> = {
  "P-256": hex("06082a8648ce3d030107"),
  "P-384": hex("06052b81040022"),
  "P-521": hex("06052b81040023"),
};

type ParsedKey =
  | { format: "jwk"; jwk: JsonWebKey; isPrivate: boolean }
  | { format: "spki" | "pkcs8"; der: Uint8Array; isPrivate: boolean };

function parseKey(text: string, alg: TypeAlgorithm, kid?: string): ParsedKey {
  const input = text.trim();
  if (!input) throw new Error("Key is empty");

  if (input.startsWith("{")) {
    let jwk: any;
    try {
      jwk = JSON.parse(input);
    } catch {
      throw new Error("Key is not valid JSON (JWK)");
    }
    // JWK Set: take the key named by the token's "kid", else the first one
    if (Array.isArray(jwk.keys)) {
      jwk = jwk.keys.find((k: any) => kid && k.kid === kid) || jwk.keys[0];
      if (!jwk) throw new Error("The JWK Set has no keys");
    }
    if (!jwk.kty) throw new Error('JWK is missing "kty"');
    // "alg"/"use"/"key_ops" only restrict what Web Crypto accepts (an RS256
    // key is perfectly usable for PS256), so they are dropped
    const { alg: _alg, use: _use, key_ops: _ops, ...rest } = jwk;
    return { format: "jwk", jwk: rest, isPrivate: typeof jwk.d === "string" };
  }

  const match = input.match(
    /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]+?)-----END \1-----/
  );
  if (!match) {
    throw new Error("Key must be PEM (-----BEGIN ...-----) or JWK ({...})");
  }
  const label = match[1];
  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(match[2]);
  } catch {
    throw new Error("The PEM body is not valid base64");
  }

  switch (label) {
    case "PUBLIC KEY":
      return { format: "spki", der: bytes, isPrivate: false };
    case "PRIVATE KEY":
      return { format: "pkcs8", der: bytes, isPrivate: true };
    case "RSA PUBLIC KEY": // PKCS#1, wrap into SubjectPublicKeyInfo
      return {
        format: "spki",
        der: der(0x30, RSA_ALG_ID, der(0x03, new Uint8Array([0]), bytes)),
        isPrivate: false,
      };
    case "RSA PRIVATE KEY": // PKCS#1, wrap into PKCS#8
      return {
        format: "pkcs8",
        der: der(0x30, VERSION_0, RSA_ALG_ID, der(0x04, bytes)),
        isPrivate: true,
      };
    case "EC PRIVATE KEY": {
      // SEC1, wrap into PKCS#8 (the curve comes from the algorithm)
      const curve = ALG_INFO[alg].curve;
      if (!curve) throw new Error(`An EC key cannot be used with ${alg}`);
      return {
        format: "pkcs8",
        der: der(
          0x30,
          VERSION_0,
          der(0x30, EC_PUBLIC_KEY_OID, CURVE_OID[curve]),
          der(0x04, bytes)
        ),
        isPrivate: true,
      };
    }
    case "CERTIFICATE":
      throw new Error(
        "Certificates are not supported: extract the public key first (openssl x509 -pubkey -noout)"
      );
    case "ENCRYPTED PRIVATE KEY":
      throw new Error("Encrypted private keys are not supported");
    default:
      throw new Error(`Unsupported PEM type "${label}"`);
  }
}

function importParams(alg: TypeAlgorithm): any {
  const info = ALG_INFO[alg];
  switch (info.family) {
    case "RSA":
      return { name: "RSASSA-PKCS1-v1_5", hash: info.hash };
    case "RSA-PSS":
      return { name: "RSA-PSS", hash: info.hash };
    case "ECDSA":
      return { name: "ECDSA", namedCurve: info.curve };
    case "EdDSA":
      return { name: "Ed25519" };
    default:
      return { name: "HMAC", hash: info.hash };
  }
}

function signParams(alg: TypeAlgorithm): any {
  const info = ALG_INFO[alg];
  switch (info.family) {
    case "RSA":
      return { name: "RSASSA-PKCS1-v1_5" };
    case "RSA-PSS":
      // RFC 7518: salt as long as the hash output
      return { name: "RSA-PSS", saltLength: hmacBits(alg) / 8 };
    case "ECDSA":
      return { name: "ECDSA", hash: info.hash };
    case "EdDSA":
      return { name: "Ed25519" };
    default:
      return { name: "HMAC" };
  }
}

async function importHmacKey(
  alg: TypeAlgorithm,
  keys: JwtKeys,
  usage: KeyUsage
): Promise<CryptoKey> {
  let raw: Uint8Array;
  if (keys.secretBase64) {
    try {
      raw = base64ToBytes(keys.secret);
    } catch {
      throw new Error("The secret is not valid base64");
    }
  } else {
    raw = encoder.encode(keys.secret);
  }
  if (raw.length === 0) throw new Error("Enter a secret");
  return crypto.subtle.importKey("raw", raw as BufferSource, importParams(alg), false, [
    usage,
  ]);
}

const keyError = (alg: TypeAlgorithm, what: string) =>
  new Error(
    `This ${what} key cannot be used with ${alg} (expected a ${keyKind(alg)} key)`
  );

async function importPrivateKey(
  alg: TypeAlgorithm,
  text: string,
  extractable = false
): Promise<CryptoKey> {
  const parsed = parseKey(text, alg);
  if (!parsed.isPrivate) {
    throw new Error("A private key is needed to sign (this is a public key)");
  }
  try {
    return parsed.format === "jwk"
      ? await crypto.subtle.importKey("jwk", parsed.jwk, importParams(alg), extractable, ["sign"])
      : await crypto.subtle.importKey(
          "pkcs8",
          parsed.der as BufferSource,
          importParams(alg),
          extractable,
          ["sign"]
        );
  } catch {
    throw keyError(alg, "private");
  }
}

// Private JWK members, removed to get the public half of a key
const PRIVATE_JWK_FIELDS = ["d", "p", "q", "dp", "dq", "qi", "oth", "key_ops", "alg", "use"];

async function importPublicKey(
  alg: TypeAlgorithm,
  text: string,
  kid?: string
): Promise<CryptoKey> {
  const parsed = parseKey(text, alg, kid);
  try {
    if (parsed.isPrivate) {
      // a private key was given: verify with its public half
      const priv =
        parsed.format === "jwk"
          ? await crypto.subtle.importKey("jwk", parsed.jwk, importParams(alg), true, ["sign"])
          : await crypto.subtle.importKey(
              "pkcs8",
              parsed.der as BufferSource,
              importParams(alg),
              true,
              ["sign"]
            );
      const jwk: any = await crypto.subtle.exportKey("jwk", priv);
      for (const field of PRIVATE_JWK_FIELDS) delete jwk[field];
      return await crypto.subtle.importKey("jwk", jwk, importParams(alg), true, ["verify"]);
    }
    return parsed.format === "jwk"
      ? await crypto.subtle.importKey("jwk", parsed.jwk, importParams(alg), true, ["verify"])
      : await crypto.subtle.importKey(
          "spki",
          parsed.der as BufferSource,
          importParams(alg),
          true,
          ["verify"]
        );
  } catch {
    throw keyError(alg, parsed.isPrivate ? "private" : "public");
  }
}

// ---------------------------------------------------------------- sign / verify

/** Signs "<header>.<payload>" and returns the base64url signature. */
export async function signJwt(
  alg: TypeAlgorithm,
  signingInput: string,
  keys: JwtKeys
): Promise<string> {
  let key: CryptoKey;
  if (isHmac(alg)) {
    key = await importHmacKey(alg, keys, "sign");
  } else {
    if (!keys.privateKey.trim()) {
      throw new Error(`A private key is needed to sign with ${alg}`);
    }
    key = await importPrivateKey(alg, keys.privateKey);
  }
  const signature = await crypto.subtle.sign(
    signParams(alg),
    key,
    encoder.encode(signingInput) as BufferSource
  );
  return bytesToBase64Url(new Uint8Array(signature));
}

/**
 * Checks the signature of "<header>.<payload>". Throws (with a readable
 * message) when the key is missing or unusable.
 */
export async function verifyJwt(
  alg: TypeAlgorithm,
  signingInput: string,
  signature: string,
  keys: JwtKeys,
  kid?: string
): Promise<boolean> {
  let key: CryptoKey;
  if (isHmac(alg)) {
    key = await importHmacKey(alg, keys, "verify");
  } else {
    // without a public key, fall back to the public half of the private key
    const source = keys.publicKey.trim() || keys.privateKey.trim();
    if (!source) throw new Error(`Enter a public key to verify ${alg}`);
    key = await importPublicKey(alg, source, kid);
  }
  let signatureBytes: Uint8Array;
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(signature)) throw new Error();
    signatureBytes = base64ToBytes(signature);
  } catch {
    return false;
  }
  return crypto.subtle.verify(
    signParams(alg),
    key,
    signatureBytes as BufferSource,
    encoder.encode(signingInput) as BufferSource
  );
}

const toPem = (label: string, data: ArrayBuffer): string => {
  const bytes = new Uint8Array(data);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const lines = btoa(binary).match(/.{1,64}/g) || [];
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
};

/** New PEM key pair suitable for the algorithm (RSA 2048, P-256/384/521, Ed25519). */
export async function generateKeyPair(
  alg: TypeAlgorithm
): Promise<{ publicKey: string; privateKey: string }> {
  const info = ALG_INFO[alg];
  if (info.family === "HMAC") throw new Error(`${alg} uses a shared secret`);
  const params =
    info.family === "RSA" || info.family === "RSA-PSS"
      ? {
          ...importParams(alg),
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
        }
      : importParams(alg);
  const pair = (await crypto.subtle.generateKey(params, true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;
  return {
    publicKey: toPem("PUBLIC KEY", await crypto.subtle.exportKey("spki", pair.publicKey)),
    privateKey: toPem("PRIVATE KEY", await crypto.subtle.exportKey("pkcs8", pair.privateKey)),
  };
}

/** Random secret with as many bits as the HMAC hash, base64url encoded. */
export function generateSecret(alg: TypeAlgorithm): string {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(hmacBits(alg) / 8)));
}

// ---------------------------------------------------------------- decode

export interface DecodedJwt {
  /** raw segments; a JWS has exactly 3 */
  parts: string[];
  /** decoded header text, null when the segment is not base64url / UTF-8 */
  headerText: string | null;
  /** parsed header when it is a JSON object */
  header: Record<string, unknown> | null;
  payloadText: string | null;
  /** undefined when the payload is not JSON */
  payload: unknown;
  /** problem with the structure of the token, "" when it is well formed */
  error: string;
}

const safeText = (segment: string): string | null => {
  try {
    return base64UrlToText(segment);
  } catch {
    return null;
  }
};

export function decodeJwt(input: string): DecodedJwt {
  // tolerate "Bearer <token>" and line breaks from copy/paste
  const token = input.trim().replace(/^Bearer\s+/i, "").replace(/\s+/g, "");
  const parts = token ? token.split(".") : [];
  const result: DecodedJwt = {
    parts,
    headerText: null,
    header: null,
    payloadText: null,
    payload: undefined,
    error: "",
  };
  if (!token) return result;

  if (parts.length > 0) result.headerText = safeText(parts[0]);
  if (parts.length > 1) result.payloadText = safeText(parts[1]);

  if (result.headerText !== null) {
    try {
      const header = JSON.parse(result.headerText);
      if (header && typeof header === "object" && !Array.isArray(header)) {
        result.header = header;
      }
    } catch {
      // reported below
    }
  }
  if (result.payloadText !== null) {
    try {
      result.payload = JSON.parse(result.payloadText);
    } catch {
      // reported below
    }
  }

  if (parts.length === 5) {
    result.error =
      "This is an encrypted token (JWE, 5 parts). Only signed tokens (JWS) can be decoded.";
  } else if (parts.length !== 3) {
    result.error = `A JWT has 3 parts separated by dots (header.payload.signature), this one has ${parts.length}.`;
  } else if (!result.header) {
    result.error = "The header is not a base64url encoded JSON object.";
  } else if (result.payload === undefined) {
    result.error = "The payload is not base64url encoded JSON.";
  }
  return result;
}
