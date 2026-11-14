import BigNumber from "bignumber.js";
import { Wallet } from "ethers";
// secp256k1 curve order. The base (16) was missing, so this was NaN and
// pages past the last valid key were never cut off.
const MAX_KEY = BigNumber(
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141",
  16
);
// Valid private keys are 1 .. (curve order - 1)
export const TOTAL_KEYS = MAX_KEY.minus(1);
export const PAGE_SIZE = 200;
export const TOTAL_PAGES = TOTAL_KEYS.dividedBy(PAGE_SIZE).integerValue(
  BigNumber.ROUND_CEIL
);

export const getAddressFromPrivateKey = (privateKey: string): string => {
  const ethWallet = new Wallet(privateKey);
  return ethWallet.address;
};

export const getKeysListFromPage = (page: BigNumber): string[] => {
  const keys: string[] = [];
  const start = page.minus(1).multipliedBy(PAGE_SIZE).plus(1); // start at 000...0001

  for (let i = 0; i < PAGE_SIZE; i++) {
    const key = start.plus(i);
    if (key.gte(MAX_KEY)) {
      break; // stop if we exceed the maximum key
    }
    keys.push(key.toString(16).padStart(64, "0"));
  }
  return keys;
};
