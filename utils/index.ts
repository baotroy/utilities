export function stringExplode(str: string): string[] {
  return str.split("\n");
}

export function isAlphabet(char: string): boolean {
  return /^[A-Za-z]$/.test(char);
}