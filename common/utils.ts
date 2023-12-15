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

export const download = (content: string, filename: string, type = "text/plain") => {
  const element = document.createElement("a");
  const file = new Blob([content], { type });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element); // Required for this to work in FireFox
  element.click();
}

export const getSizeFileFromBase64 = (str: string) => {
  const numberEq = str.slice(str.length - 5).split("=").length - 1
  return str.length * (3 / 4) - numberEq
}