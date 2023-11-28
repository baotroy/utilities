"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { convertEthereumUnits, ethUnitDecimals } from "../utils";
import { ethUnitMap } from "web3-utils";
import EtherUnit from "../components/ethereum-unit";
import { useState } from "react";
const EtherUnitConverter = () => {
  const [inputValues, setInputValues] = useState(
    convertEthereumUnits("1", "ether")
  );

  const handleOnChange = (str: string, unit: keyof typeof ethUnitDecimals) => {
    setInputValues(convertEthereumUnits(str, unit));
  };
  return (
    <>
      <Breadcrumb />
      <div>
        <p>
          Ether or ETH is often used in different denominations of its currency,
          such as Wei for interacting with smart contracts and Gwei for
          calculating gas prices. Use our Unit Converter to easily convert
          between them!
        </p>
        <div className="my-4">Enter any value</div>
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
};

export default EtherUnitConverter;
