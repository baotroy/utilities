/** File signatures ("magic numbers") for common types. */
const SIGNATURES: { mime: string; ext: string; bytes: (number | null)[]; offset?: number }[] = [
  { mime: "image/png", ext: "png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/jpeg", ext: "jpg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/gif", ext: "gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: "image/webp", ext: "webp", bytes: [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50] },
  { mime: "image/bmp", ext: "bmp", bytes: [0x42, 0x4d] },
  { mime: "image/x-icon", ext: "ico", bytes: [0x00, 0x00, 0x01, 0x00] },
  { mime: "image/avif", ext: "avif", bytes: [0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66], offset: 4 },
  { mime: "application/pdf", ext: "pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
  { mime: "application/zip", ext: "zip", bytes: [0x50, 0x4b, 0x03, 0x04] },
  { mime: "application/gzip", ext: "gz", bytes: [0x1f, 0x8b] },
  { mime: "application/x-7z-compressed", ext: "7z", bytes: [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c] },
  { mime: "application/x-rar-compressed", ext: "rar", bytes: [0x52, 0x61, 0x72, 0x21] },
  { mime: "audio/mpeg", ext: "mp3", bytes: [0x49, 0x44, 0x33] },
  { mime: "audio/wav", ext: "wav", bytes: [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x41, 0x56, 0x45] },
  { mime: "audio/ogg", ext: "ogg", bytes: [0x4f, 0x67, 0x67, 0x53] },
  { mime: "video/mp4", ext: "mp4", bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
  { mime: "video/webm", ext: "webm", bytes: [0x1a, 0x45, 0xdf, 0xa3] },
  { mime: "font/woff", ext: "woff", bytes: [0x77, 0x4f, 0x46, 0x46] },
  { mime: "font/woff2", ext: "woff2", bytes: [0x77, 0x4f, 0x46, 0x32] },
  { mime: "application/wasm", ext: "wasm", bytes: [0x00, 0x61, 0x73, 0x6d] },
  { mime: "application/x-sqlite3", ext: "sqlite", bytes: [0x53, 0x51, 0x4c, 0x69, 0x74, 0x65] },
];

const EXT_BY_MIME: Record<string, string> = {
  "image/svg+xml": "svg",
  "application/json": "json",
  "text/plain": "txt",
  "text/html": "html",
  "text/css": "css",
  "text/csv": "csv",
  "application/xml": "xml",
  "text/xml": "xml",
  "application/javascript": "js",
  "text/javascript": "js",
  "application/octet-stream": "bin",
};

export interface DecodedFile {
  bytes: Uint8Array;
  mime: string;
  ext: string;
  declaredMime?: string;
  isText: boolean;
}

export function detectType(bytes: Uint8Array): { mime: string; ext: string } | null {
  for (const sig of SIGNATURES) {
    const off = sig.offset || 0;
    if (bytes.length < off + sig.bytes.length) continue;
    if (sig.bytes.every((b, i) => b === null || bytes[off + i] === b)) return { mime: sig.mime, ext: sig.ext };
  }
  return null;
}

const looksLikeText = (bytes: Uint8Array): boolean => {
  const sample = bytes.subarray(0, 4096);
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(sample.length < bytes.length ? sample.subarray(0, sample.length - 4) : sample);
  } catch {
    return false;
  }
  return !sample.some((b) => b === 0);
};

function textType(text: string): { mime: string; ext: string } {
  const t = text.trimStart();
  if (t.startsWith("<svg") || (t.startsWith("<?xml") && t.includes("<svg"))) return { mime: "image/svg+xml", ext: "svg" };
  if (/^<!doctype html|^<html/i.test(t)) return { mime: "text/html", ext: "html" };
  if (t.startsWith("<?xml")) return { mime: "application/xml", ext: "xml" };
  if (t.startsWith("{") || t.startsWith("[")) {
    try {
      JSON.parse(text);
      return { mime: "application/json", ext: "json" };
    } catch {
      // not JSON
    }
  }
  return { mime: "text/plain", ext: "txt" };
}

/** Accepts plain Base64, URL-safe Base64 and data: URIs; whitespace is ignored. */
export function decodeBase64Input(input: string): DecodedFile {
  let text = input.trim();
  let declaredMime: string | undefined;
  const dataUri = text.match(/^data:([^;,]*)(;[^,]*)?,/i);
  if (dataUri) {
    declaredMime = dataUri[1] || undefined;
    if (!/;base64/i.test(dataUri[2] || "")) {
      const bytes = new TextEncoder().encode(decodeURIComponent(text.slice(dataUri[0].length)));
      const mime = declaredMime || "text/plain";
      return { bytes, mime, ext: EXT_BY_MIME[mime] || "txt", declaredMime, isText: true };
    }
    text = text.slice(dataUri[0].length);
  }
  text = text.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(text)) throw new Error("The input contains characters that are not Base64");
  while (text.length % 4) text += "=";
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const detected = detectType(bytes);
  const isText = !detected && looksLikeText(bytes);
  const guess = detected || (isText ? textType(new TextDecoder().decode(bytes.subarray(0, 4096))) : null);
  const mime = guess?.mime || declaredMime || "application/octet-stream";
  const ext = guess?.ext || (declaredMime && EXT_BY_MIME[declaredMime]) || declaredMime?.split("/")[1]?.split("+")[0] || "bin";
  return { bytes, mime, ext, declaredMime, isText };
}

export const hexPreview = (bytes: Uint8Array, rows = 8): string => {
  const lines: string[] = [];
  for (let i = 0; i < Math.min(bytes.length, rows * 16); i += 16) {
    const chunk = Array.from(bytes.subarray(i, i + 16));
    const hex = chunk.map((b) => b.toString(16).padStart(2, "0")).join(" ").padEnd(47, " ");
    const ascii = chunk.map((b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : ".")).join("");
    lines.push(`${i.toString(16).padStart(8, "0")}  ${hex}  ${ascii}`);
  }
  return lines.join("\n");
};
