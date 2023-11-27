import BigNumber from "bignumber.js";
import { Web3 } from "web3";
export const ethUnitMap = {
  wei: -18,
  kwei: -15,
  mwei: -12,
  gwei: -9,
  szsabo: -6,
  finney: -3,
  ether: 0,
  kether: 3,
  mether: 6,
  gether: 9,
  tether: 12,
};


export const convert = (value: string, from: keyof typeof ethUnitMap):  Record<keyof typeof ethUnitMap, string>  => {
  const bnValue = BigNumber(value);
  const fromUnit = ethUnitMap[from];
  const wei = bnValue.multipliedBy(BigNumber(10).pow(fromUnit + 18));

  const result: Record<keyof typeof ethUnitMap, string> = {} as Record<keyof typeof ethUnitMap, string>
  for (const unit in ethUnitMap) {
    result[unit as keyof typeof ethUnitMap] = unit === from ? wei.toString() : convertFromWei(wei.toString(), unit as keyof typeof ethUnitMap);
  }
  return result;
};
const convertFromWei = (weiValue: string, to: keyof typeof ethUnitMap) : string => {
  try {
    return Web3.utils.fromWei(weiValue.toString(), to);
  } catch (error) {
    return "0";
  }
};