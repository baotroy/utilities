import { ErrorFragment, EventFragment, FunctionFragment, id } from "ethers";

export type SignatureKind = "function" | "event" | "error";

export interface SelectorResult {
  /** the line as typed */
  input: string;
  kind: SignatureKind;
  /** canonical signature that is hashed, e.g. transfer(address,uint256) */
  signature: string;
  /** first 4 bytes of the hash: selector of a function or error */
  selector: string;
  /** full keccak-256 hash: topic0 of an event */
  hash: string;
  error?: string;
}

/**
 * Convert one signature to its selector and hash.
 *
 * Accepts the canonical form "transfer(address,uint256)" as well as Solidity
 * style declarations: an optional "function" / "event" / "error" keyword,
 * parameter names, "indexed", and aliases such as uint (= uint256). Without a
 * keyword the line is read as a function; the hash is the same for all three
 * kinds, only the part that is used differs.
 */
export function signatureToSelector(line: string): SelectorResult {
  const input = line.trim().replace(/;$/, "").trim();
  const keyword = input.match(/^(function|event|error)\b/)?.[1] as
    | SignatureKind
    | undefined;
  const kind: SignatureKind = keyword || "function";
  try {
    const fragment =
      kind === "event"
        ? EventFragment.from(input)
        : kind === "error"
          ? ErrorFragment.from(input)
          : FunctionFragment.from(keyword ? input : `function ${input}`);
    const signature = fragment.format("sighash");
    const hash = id(signature);
    return { input, kind, signature, selector: hash.slice(0, 10), hash };
  } catch {
    return {
      input,
      kind,
      signature: "",
      selector: "",
      hash: "",
      error: "Not a valid signature. Expected something like transfer(address,uint256)",
    };
  }
}

/** One result per non-empty line. */
export const signaturesToSelectors = (text: string): SelectorResult[] =>
  text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map(signatureToSelector);
