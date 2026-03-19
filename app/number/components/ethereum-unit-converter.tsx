"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { convertEthereumUnits, ethUnitDecimals } from "../utils";
import { ethUnitMap } from "web3-utils";
import EtherUnit from "./ethereum-unit";
import { useState } from "react";

export default function EtherUnitConverterComponent() {
  const [inputValues, setInputValues] = useState(
    convertEthereumUnits("1", "ether")
  );

  const handleOnChange = (str: string, unit: keyof typeof ethUnitDecimals) => {
    setInputValues(convertEthereumUnits(str, unit));
  };
  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Convert between Ethereum units including Wei, Gwei, and Ether. Useful for calculating gas prices and smart contract interactions.
        </p>
        <div className="mb-4">Enter any value</div>
        {Object.keys(ethUnitDecimals).map((unit, index) => {
          return (
            <EtherUnit
              key={index}
              unit={unit as keyof typeof ethUnitMap}
              decimals={ethUnitDecimals[unit as keyof typeof ethUnitDecimals]}
              value={inputValues[unit as keyof typeof inputValues]}
              handleOnChange={(e) =>
                handleOnChange(e, unit as keyof typeof ethUnitDecimals)
              }
            />
          );
        })}
      </div>
    </>
  );
}
