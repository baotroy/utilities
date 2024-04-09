import BigNumber from "bignumber.js";
import { ethers } from "ethers";

export const TOTAL_KEYS = BigNumber(16).pow(64);
export const PAGE_SIZE = 50;
export const TOTAL_PAGES = TOTAL_KEYS.dividedBy(PAGE_SIZE);

export const getAddressFromPrivateKey = (privateKey: string): string => {
  const ethWallet = new ethers.Wallet(privateKey);
  return ethWallet.address;
};

export const getKeysListFromPage = (page: BigNumber): string[] => {
  const keys: string[] = [];
  const start = page.minus(1).multipliedBy(PAGE_SIZE).plus(1); // start at 000...0001

  for (let i = 0; i < PAGE_SIZE; i++) {
    const key = start.plus(i);
    keys.push(key.toString(16).padStart(64, "0"));
  }
  return keys;
};
