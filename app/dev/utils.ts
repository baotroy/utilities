import { parse } from "@prantlf/jsonlint";

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
