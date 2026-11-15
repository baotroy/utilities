import {
  getAddress,
  hashMessage,
  hashTypedData,
  Hex,
  hexToNumber,
  isHex,
  recoverAddress,
  recoverMessageAddress,
  recoverTypedDataAddress,
  TypedDataDefinition,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

export type SigMode = "message" | "typed" | "hash";

export const SAMPLE_TYPED = JSON.stringify(
  {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Permit",
    domain: {
      name: "USD Coin",
      version: "2",
      chainId: 1,
      verifyingContract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    },
    message: {
      owner: "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf",
      spender: "0x1111111254EEB25477B68fb85Ed929f73A960582",
      value: "1000000",
      nonce: 0,
      deadline: 1893456000,
    },
  },
  null,
  2
);

/** Parse eth_signTypedData_v4 JSON into what viem expects. */
export function parseTypedData(text: string): TypedDataDefinition {
  const json = JSON.parse(text);
  if (!json?.types || !json?.primaryType || !json?.message) {
    throw new Error("Typed data needs types, primaryType, domain and message");
  }
  const domain = { ...(json.domain || {}) };
  if (typeof domain.chainId === "string") domain.chainId = Number(domain.chainId);
  return { types: json.types, primaryType: json.primaryType, domain, message: json.message } as TypedDataDefinition;
}

/** The digest that gets signed, so it can be compared with on-chain code. */
export function digestOf(mode: SigMode, input: string): Hex {
  if (mode === "message") return hashMessage(messageArg(input));
  if (mode === "typed") return hashTypedData(parseTypedData(input));
  if (!isHex(input.trim()) || input.trim().length !== 66) throw new Error("The hash must be 32 bytes of hex");
  return input.trim() as Hex;
}

/** personal_sign of hex input signs the bytes, like wallets do. */
const messageArg = (input: string) =>
  /^0x([0-9a-fA-F]{2})+$/.test(input.trim()) ? { raw: input.trim() as Hex } : input;

export async function recoverSigner(mode: SigMode, input: string, signature: Hex): Promise<string> {
  if (mode === "message") return recoverMessageAddress({ message: messageArg(input), signature });
  if (mode === "typed") return recoverTypedDataAddress({ ...parseTypedData(input), signature });
  return recoverAddress({ hash: digestOf("hash", input), signature });
}

export async function signWithKey(mode: SigMode, input: string, privateKey: Hex): Promise<Hex> {
  const account = privateKeyToAccount(privateKey);
  if (mode === "message") return account.signMessage({ message: messageArg(input) });
  if (mode === "typed") return account.signTypedData(parseTypedData(input));
  return account.sign({ hash: digestOf("hash", input) });
}

/** r, s, v and the EIP-2098 compact form. */
export function splitSignature(sig: Hex) {
  const body = sig.slice(2);
  if (body.length === 128) {
    // already compact (r + yParityAndS)
    const r = `0x${body.slice(0, 64)}`;
    const vs = BigInt(`0x${body.slice(64)}`);
    const yParity = Number(vs >> BigInt(255));
    const s = `0x${(vs & ((BigInt(1) << BigInt(255)) - BigInt(1))).toString(16).padStart(64, "0")}`;
    return { r, s, v: 27 + yParity, yParity, compact: sig };
  }
  if (body.length !== 130) throw new Error("A signature is 65 bytes (130 hex characters), or 64 in compact form");
  const r = `0x${body.slice(0, 64)}`;
  const s = `0x${body.slice(64, 128)}`;
  let v = hexToNumber(`0x${body.slice(128)}`);
  if (v < 27) v += 27;
  const yParity = v - 27;
  const vs = (BigInt(yParity) << BigInt(255)) | BigInt(s);
  return { r, s, v, yParity, compact: `${r}${vs.toString(16).padStart(64, "0")}` };
}

export const sameAddress = (a: string, b: string) => {
  try {
    return getAddress(a.toLowerCase()) === getAddress(b.toLowerCase());
  } catch {
    return false;
  }
};
