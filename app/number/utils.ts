// import BigNumber from "bignumber.js";
import { Web3 } from "web3";
import {ethUnitMap} from "web3-utils";
export const ethUnitDecimals = {
  wei: -18,
  kwei: -15,
  mwei: -12,
  gwei: -9,
  szsabo: -6,
  finney: -3,
  ether: 1,
  kether: 3,
  mether: 6,
  gether: 9,
  tether: 12,
};


export const convertEthereumUnits = (value: string, from: keyof typeof ethUnitDecimals):  Record<keyof typeof ethUnitMap, string>  => {
  const wei = convertToWei(value, from as keyof typeof ethUnitMap)

  const result: Record<keyof typeof ethUnitMap, string> = {} as Record<keyof typeof ethUnitMap, string>
  for (const unit in ethUnitMap) {
    result[unit as keyof typeof ethUnitMap] = unit === from ? wei.toString() : convertFromWei(wei.toString(), unit as keyof typeof ethUnitMap);
  }
  return result;
};

const convertToWei = (weiValue: string, from: keyof typeof ethUnitMap) : string => {
  try {
    return Web3.utils.toWei(weiValue.toString(), from);
  } catch (error) {
    return "0";
  }
};
const convertFromWei = (weiValue: string, to: keyof typeof ethUnitMap) : string => {
  try {
    return Web3.utils.fromWei(weiValue.toString(), to);
  } catch (error) {
    return "0";
  }
};