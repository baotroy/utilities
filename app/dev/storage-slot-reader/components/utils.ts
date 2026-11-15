import { encodeAbiParameters, Hex, hexToBigInt, hexToString, keccak256, numberToHex, stringToHex, trim } from "viem";
import { parseAbiArg, parseBigIntInput } from "@/common/evmTools";

export type Step =
  | { kind: "mapping"; keyType: string; key: string }
  | { kind: "array"; index: string; itemSlots: string }
  | { kind: "offset"; offset: string };

export const PROXY_SLOTS = [
  { label: "EIP-1967 implementation", slot: "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc" },
  { label: "EIP-1967 admin", slot: "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103" },
  { label: "EIP-1967 beacon", slot: "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50" },
  { label: "EIP-1822 (UUPS, old)", slot: "0xc5f16f0fcc639fa48a6947836d9850f504798523bf8c9a3a87d5876cf622bcf7" },
];

export const toSlotHex = (n: bigint): Hex => numberToHex(n % (BigInt(1) << BigInt(256)), { size: 32 });

export function parseSlot(raw: string): bigint {
  return parseBigIntInput(raw || "0");
}

/** Walk mapping keys, array indexes and struct offsets from a base slot. */
export function computeSlot(base: string, steps: Step[]): { slot: Hex; trace: { label: string; slot: Hex }[] } {
  let slot = parseSlot(base);
  const trace: { label: string; slot: Hex }[] = [{ label: "base", slot: toSlotHex(slot) }];
  for (const step of steps) {
    if (step.kind === "mapping") {
      const type = step.keyType;
      let encoded: Hex;
      if (type === "string" || type === "bytes") {
        // dynamic keys are hashed as raw bytes, not ABI-encoded
        const raw = step.key.startsWith("0x") && type === "bytes" ? (step.key as Hex) : stringToHex(step.key);
        encoded = `${raw}${toSlotHex(slot).slice(2)}` as Hex;
      } else {
        const value = parseAbiArg({ type, name: "key" }, step.key);
        encoded = encodeAbiParameters([{ type }, { type: "uint256" }], [value, slot]);
      }
      slot = hexToBigInt(keccak256(encoded));
      const k = step.key.length > 18 ? `${step.key.slice(0, 10)}…${step.key.slice(-6)}` : step.key || "?";
      trace.push({ label: `[${k}] (${type} key)`, slot: toSlotHex(slot) });
    } else if (step.kind === "array") {
      const start = hexToBigInt(keccak256(toSlotHex(slot)));
      const index = parseBigIntInput(step.index || "0");
      const size = parseBigIntInput(step.itemSlots || "1");
      slot = start + index * size;
      trace.push({ label: `[${index}] (array item, ${size} slot${size === BigInt(1) ? "" : "s"} each)`, slot: toSlotHex(slot) });
    } else {
      const offset = parseBigIntInput(step.offset || "0");
      slot = slot + offset;
      trace.push({ label: `+${offset} (struct field)`, slot: toSlotHex(slot) });
    }
  }
  return { slot: toSlotHex(slot), trace };
}

/** ERC-7201: keccak256(abi.encode(uint256(keccak256(id)) - 1)) & ~0xff */
export function erc7201Slot(id: string): Hex {
  const inner = hexToBigInt(keccak256(stringToHex(id))) - BigInt(1);
  const outer = hexToBigInt(keccak256(encodeAbiParameters([{ type: "uint256" }], [inner])));
  return toSlotHex(outer & ~BigInt(0xff));
}

/** Show a 32-byte word in the ways it is commonly packed. */
export function interpretWord(word: Hex) {
  const n = hexToBigInt(word);
  const signed = n >= BigInt(1) << BigInt(255) ? n - (BigInt(1) << BigInt(256)) : n;
  const address = `0x${word.slice(-40)}`;
  // short string: data left-aligned, length*2 in the lowest byte
  let shortString = "";
  const last = Number(n & BigInt(0xff));
  if (last % 2 === 0 && last > 0 && last <= 62) {
    try {
      const text = hexToString(`0x${word.slice(2, 2 + last)}` as Hex);
      if (/^[\x20-\x7e -￿]*$/.test(text)) shortString = text;
    } catch {
      // not text
    }
  }
  return {
    uint: n.toString(),
    int: signed.toString(),
    address,
    bool: n === BigInt(0) ? "false" : n === BigInt(1) ? "true" : "",
    shortString,
    trimmed: trim(word),
  };
}
