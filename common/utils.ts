import toast from "react-hot-toast";

export const copyToClipboard = (content: string) => {
  if (content === "") return;
  navigator.clipboard
    .writeText(content)
    .then(() => {
      toast.success("Copied to clipboard");
    })
    .catch(() => {
      toast.error("Unable to copy");
    });
};

export function stringExplode(str: string): string[] {
  return str.split("\n");
}

export function isAlphabet(char: string): boolean {
  return /^[A-Za-z]$/.test(char);
}

export const isNumber = (str: string): boolean => /^\d+$/.test(str);

export function bytesToSize(bytes: number) {
  const BASE_UNIT = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes == 0) return "n/a";
  const i = parseInt(
    Math.floor(Math.log(bytes) / Math.log(BASE_UNIT)).toString()
  );
  if (i == 0) return bytes + " " + sizes[i];
  return (bytes / Math.pow(BASE_UNIT, i)).toFixed(1) + " " + sizes[i];
}

export const download = (
  content: string,
  filename: string,
  type = "text/plain"
) => {
  const element = document.createElement("a");
  const file = new Blob([content], { type });
  const url = URL.createObjectURL(file);
  element.href = url;
  element.download = filename;
  document.body.appendChild(element); // Required for this to work in FireFox
  element.click();
  document.body.removeChild(element);
  // Release the blob once the browser has started the download
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

/**
 * Convert bytes to a Base64 string. Works in chunks so large inputs do not
 * overflow the call stack (String.fromCharCode(...bytes) fails above ~100k).
 */
export const bytesToBase64 = (bytes: Uint8Array): string => {
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + CHUNK) as unknown as number[]
    );
  }
  return btoa(binary);
};

/** Base64-encode a string as UTF-8 (browser-safe, no Buffer polyfill). */
export const utf8ToBase64 = (str: string): string =>
  bytesToBase64(new TextEncoder().encode(str));

/** Add a file extension that matches an image MIME type, e.g. image/jpeg -> .jpg */
export const extensionFromMime = (mime: string): string => {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/bmp": "bmp",
    "image/svg+xml": "svg",
    "image/avif": "avif",
  };
  return map[mime] || "png";
};

export const getSizeFileFromBase64 = (str: string) => {
  const numberEq = str.slice(str.length - 5).split("=").length - 1;
  return str.length * (3 / 4) - numberEq;
};

export const getPageTitle = (pathname: string): string => {
  const pathElements = pathname.split("/");
  return pathElements[pathElements.length - 1].split("-").join(" ");
};
