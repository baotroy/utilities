import toast from "react-hot-toast";

export const copyToClipboard = (content: string) => {
  if (content === "") return;
  navigator.clipboard
    .writeText(content)
    .then(() => {
      toast.success( "Copied to clipboard");
    })
    .catch(() => {
      toast.error( "Unable to copy");
    });

}

export function stringExplode(str: string): string[] {
  return str.split("\n");
}

export function isAlphabet(char: string): boolean {
  return /^[A-Za-z]$/.test(char);
}

export const isNumber = (str: string): boolean => /^\d+$/.test(str);