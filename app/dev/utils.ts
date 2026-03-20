import { parse } from "@prantlf/jsonlint";
import { TypeAlgorithm } from "./type";

// JSON
export function prettyJson(str: string, indent = 2): string {
  try {
    const obj = JSON.parse(str);
    return JSON.stringify(obj, null, indent);
  } catch (error: any) {
    return validateJSON(str);
  }
}

export function validateJSON(e: string): string {
  try {
    parse(e);
    return "";
  } catch (e: any) {
    return e.message;
  }
}

export function validJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (error) {
    // console.error(error, str, typeof str);
    return false;
  }
}

export const base64UrlEncode = (input: string): string => {
  if (!input) return "";
  // Use browser-compatible btoa instead of Buffer for client-side
  if (typeof window !== "undefined") {
    const base64 = btoa(unescape(encodeURIComponent(input)));
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  const base64 = Buffer.from(input).toString("base64");
  const base64Url = base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return base64Url;
};

export const base64UrlDecode = (input: string): string => {
  if (!input) return "";
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  // Use browser-compatible atob instead of Buffer for client-side
  if (typeof window !== "undefined") {
    return decodeURIComponent(escape(atob(base64 + padding)));
  }
  const decoded = Buffer.from(base64 + padding, "base64").toString("utf-8");
  return decoded;
};

// Browser-compatible JWT creation using Web Crypto API
const algorithmMap: Record<string, { name: string; hash: string }> = {
  HS256: { name: "HMAC", hash: "SHA-256" },
  HS384: { name: "HMAC", hash: "SHA-384" },
  HS512: { name: "HMAC", hash: "SHA-512" },
};

const arrayBufferToBase64Url = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const createJwt = async (
  payload: string | object,
  algorithm: TypeAlgorithm,
  secret: string
): Promise<string> => {
  const alg = algorithmMap[algorithm];
  if (!alg) {
    throw new Error(`Unsupported algorithm: ${algorithm}`);
  }

  const header = { alg: algorithm, typ: "JWT" };
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(
    typeof payload === "string" ? payload : JSON.stringify(payload)
  );

  const data = `${headerEncoded}.${payloadEncoded}`;

  // Import the secret key
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: alg.name, hash: alg.hash },
    false,
    ["sign"]
  );

  // Sign the data
  const signature = await crypto.subtle.sign(
    alg.name,
    cryptoKey,
    encoder.encode(data)
  );

  const signatureEncoded = arrayBufferToBase64Url(signature);

  return `${data}.${signatureEncoded}`;
};
