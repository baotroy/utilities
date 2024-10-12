import { ethUnitMap, fromDecimal } from "web3-utils";
import { parseUnits as toWei, formatUnits as fromWei } from "ethers";
import { trimEnd } from "lodash";
import BigNumber from "bignumber.js";
BigNumber.set({ DECIMAL_PLACES: 30 })
export const ethUnitDecimals = {
  wei: -18,
  kwei: -15,
  mwei: -12,
  gwei: -9,
  szabo: -6,
  finney: -3,
  ether: 0,
  kether: 3,
  mether: 6,
  gether: 9,
  tether: 12,
};

export const convertEthereumUnits = (
  value: string,
  from: keyof typeof ethUnitDecimals
): Record<keyof typeof ethUnitDecimals, string> => {
  const result: Record<keyof typeof ethUnitDecimals, string> = {} as Record<
    keyof typeof ethUnitDecimals,
    string
  >;
  for (const unit in ethUnitDecimals) {
    result[unit as keyof typeof ethUnitDecimals] =
      unit.toString() === from.toString()
        ? value
        : convertToOtherUnit(value || "0", from, unit as keyof typeof ethUnitDecimals);
  }
  return result;
};

const convertToOtherUnit = (
  value: string,
  from: keyof typeof ethUnitDecimals,
  to: keyof typeof ethUnitDecimals
) => {
  const fromDecimal = ethUnitDecimals[from as keyof typeof ethUnitDecimals];
  const toDecimal = ethUnitDecimals[to as keyof typeof ethUnitDecimals];
  const result = BigNumber(value).multipliedBy(BigNumber(10).pow(fromDecimal - toDecimal));
  return parseScientific(result.toString());
}

function parseScientific(num: string): string {
  // If the number is not in scientific notation return it as it is.
  if (!/\d+\.?\d*e[+-]*\d+/i.test(num)) {
    return num;
  }

  // Remove the sign.
  const numberSign = Math.sign(Number(num));
  num = Math.abs(Number(num)).toString();

  // Parse into coefficient and exponent.
  const [coefficient, exponent] = num.toLowerCase().split("e");
  let zeros = Math.abs(Number(exponent));
  const exponentSign = Math.sign(Number(exponent));
  const [integer, decimals] = (coefficient.indexOf(".") != -1 ? coefficient : `${coefficient}.`).split(".");

  if (exponentSign === -1) {
    zeros -= integer.length;
    num =
      zeros < 0
        ? integer.slice(0, zeros) + "." + integer.slice(zeros) + decimals
        : "0." + "0".repeat(zeros) + integer + decimals;
  } else {
    if (decimals) zeros -= decimals.length;
    num =
      zeros < 0
        ? integer + decimals.slice(0, zeros) + "." + decimals.slice(zeros)
        : integer + decimals + "0".repeat(zeros);
  }

  return numberSign < 0 ? "-" + num : num;
}
// const convertToWei = (
//   weiValue: string,
//   from: keyof typeof ethUnitDecimals
// ): string => {
//   try {
//     if (from === "wei") return weiValue

//     // convert wei to base wei with decimals of 30
//     BASE_WEI = BigNumber(weiValue).multipliedBy(10 ** (BASE_DECIMALS - 18));

//     const fromDecimals = ethUnitDecimals[from as keyof typeof ethUnitDecimals];
//     console.log("🚀 ---------------------------------------------------🚀")
//     console.log("🚀 ~ file: utils.ts:55 ~ fromDecimals:", fromDecimals)
//     console.log("🚀 ---------------------------------------------------🚀")

//     const diffDecimals = fromDecimals +18;
//     console.log("diff",weiValue, from, diffDecimals)
//     const result = BigNumber(weiValue)
//       .multipliedBy(10 ** diffDecimals).toString();
//     console.log(weiValue, from, result);
//     return trimEnd(result.toString(), ".");
//   } catch (error) {
//     return "0";
//   }
// };
// const convertFromWei = (
//   weiValue: string,
//   to: keyof typeof ethUnitMap
// ): string => {
//   try {
//     if ([
//       "kether",
//       "mether",
//       "gether",
//       "tether",
//     ].includes(to)) {
//       return BigNumber(weiValue).dividedBy(10 ** (18 + ethUnitDecimals[to as keyof typeof ethUnitDecimals]))
//         //.toFixed(ethUnitDecimals[to as keyof typeof ethUnitDecimals])
//         .toString();
//     }

//     const result = fromWei(weiValue.toString(), to);
//     console.log(weiValue, to, result);
//     return result.substring(result.length - 2) === ".0" ? result.substring(0, result.length - 2) : result;
//   } catch (error) {
//     return "0";
//   }
// };
