// import BigNumber from "bignumber.js";
import { Web3 } from "web3";
import {ethUnitMap} from "web3-utils";
import {trimEnd} from "lodash";
export const ethUnitDecimals = {
  wei: -18,
  kwei: -15,
  mwei: -12,
  gwei: -9,
  szabo: -6,
  finney: -3,
  ether: 1,
  kether: 3,
  mether: 6,
  gether: 9,
  tether: 12,
};


export const convertEthereumUnits = (value: string, from: keyof typeof ethUnitDecimals):  Record<keyof typeof ethUnitDecimals, string>  => {
  const wei = convertToWei(value, from)

  const result: Record<keyof typeof ethUnitDecimals, string> = {} as Record<keyof typeof ethUnitDecimals, string>
  for (const unit in ethUnitDecimals) {
    result[unit as keyof typeof ethUnitDecimals] = unit.toString() === from.toString() ? value : convertFromWei(wei.toString(), unit as keyof typeof ethUnitDecimals);
  }
  return result;
};

const convertToWei = (weiValue: string, from: keyof typeof ethUnitDecimals) : string => {
  try {
    const result = Web3.utils.toWei(weiValue.toString(), from as keyof typeof ethUnitMap);
    return trimEnd(result, '.')
  } catch (error) {
    return "0";
  }
};
const convertFromWei = (weiValue: string, to: keyof typeof ethUnitMap) : string => {
  try {
    const result = Web3.utils.fromWei(weiValue.toString(), to);
    return trimEnd(result, '.')
  } catch (error) {
    return "0";
  }
};