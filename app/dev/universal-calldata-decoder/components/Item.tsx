import { FC, useEffect, useState } from "react";
import { Component } from "./type";

import { MdContentCopy } from "react-icons/md";
import { copyToClipboard } from "@/common/utils";
import clsx from "clsx";
import BigNumber from "bignumber.js";
import { convertNumberBetweenEtherUnit, ethUnitDecimals } from "@/app/number/utils";
import { dedeInputDataNoAbi } from "./utils";
import ResultComponent from "./FunctionComponent";

enum Uint {
  ether = "ETH",
  wei = "WEI",
}

interface ItemProps {
  component: Component,
  values: string | any[]
  deep: number
}

const Item: FC<ItemProps> = ({ component, values, deep = 0 }) => {
  deep++;
  const { baseType, components, type, arrayChildren } = component;
  console.log("🚀 -----------------------------------------------------🚀")
  console.log("🚀 ~ file: item.tsx:26 ~ arrayChildren:", arrayChildren)
  console.log("🚀 -----------------------------------------------------🚀")


  // const [childFunctionName, setChildFunctionName] = useState<string>("");
  // const [childComponent, setChildComponent] = useState<Component>();
  // const [childInputValues, setChildInputValues] = useState<any>();

  // useEffect(() => {
  //   if (type === "bytes" && typeof values === "string") {
  //     console.log(value)
  //     dedeInputDataNoAbi(values).then((response) => {
  //       const [functionName, component, decodeData] = response;
  //       console.log("🚀 --------------------------------------------------------------------🚀")
  //       console.table({ functionName, component, decodeData })

  //       console.log("🚀 --------------------------------------------------------------------🚀")

  //       if (functionName && component && decodeData) {
  //         setChildComponent(component);
  //         setChildFunctionName(functionName);
  //         setChildInputValues(decodeData);
  //       }
  //     }).catch(() => {
  //       throw new Error("Unable to decode data");
  //     })
  //   }
  // }, []);

  const [sltUint, setSltUint] = useState("wei");
  const [value, setValue] = useState<string>(typeof values !== "object" ? values.toString() : "");
  const handleCopy = (v: string) => {
    copyToClipboard(v);
  };
  const handleUnitChange = (newUnit: string) => {
    convertData(sltUint, newUnit);
    setSltUint(newUnit as Uint);

  }


  const convertData = (fromUnit: string, toUnit: string) => {
    console.log("cover", value, fromUnit.toLowerCase(), toUnit.toLowerCase())

    if (typeof values !== "object") {

      if (baseType.includes("uint")) {
        const newValue = convertNumberBetweenEtherUnit(
          value,
          fromUnit.toLowerCase() as keyof typeof ethUnitDecimals,
          toUnit.toLowerCase() as keyof typeof ethUnitDecimals);
        setValue(newValue);
      }
    }
  }

  return <>
    {
      components !== null ? (
        <>
          <div className={clsx(`p-5 w-full bg-level-${deep} rounded-lg`)}>
            <div className="">{baseType}</div>
            <div className="block">
              {
                components?.map((component, index) => {
                  return <Item key={index}
                    component={component}
                    values={values[index]}
                    deep={deep}
                  />;
                })
              }
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={clsx(`block p-5 my-4 bg-level-${deep} rounded-lg`)}>
            <div className="mb-2">{type}</div>
            <div className="flex">
              <div className="w-full">
                {
                  baseType !== "array" && (<input
                    type="text"
                    className="
                      w-full p-1.5 
                      outline-none 
                      border-t 
                      border-l 
                      border-b
                      border-t-bodydark 
                      border-l-bodydark 
                      border-b-bodydark
                      border-bodydark 
                      rounded-tl-lg 
                      rounded-bl-lg"
                    value={value}
                    onChange={() => { }}
                  />)
                }

                {
                  baseType === "array" && (
                    <div className="flex flex-col">
                      {/* {
                        arrayChildren && <Item
                          component={arrayChildren}
                          values={values}
                          deep={deep}
                        />
                      } */}
                    </div>
                  )
                }


              </div>
              <div className="flex">
                <span className="bg-gray-2  dark:bg-graydark border border-bodydark  block py-2 px-4 rounded-tr-lg rounded-br-lg hover:cursor-pointer">
                  <MdContentCopy size={20} onClick={() => handleCopy(value.toString())} />
                </span>
              </div>
              {
                baseType.includes("uint") ? (
                  <div className="ml-2">
                    <select className="p-1.5 rounded-lg border-bodydark border" onChange={(e) => handleUnitChange(e.target.value)}>
                      {
                        Object.keys(Uint).map((unit, index) => {
                          return <option key={index} selected={sltUint === unit.toLowerCase()} value={unit}>{Uint[unit as keyof typeof Uint]}</option>
                        })
                      }
                    </select>
                  </div>
                ) : null
              }
            </div>
            {/* child case of data is bytes */}
            {
              childComponent !== undefined
              && childFunctionName !== ""
              && <ResultComponent
                functionName={childFunctionName}
                component={childComponent}
                value={childInputValues}
                deep={deep}
              />
            }
          </div>
        </>
      )


    }
  </>;
};
export default Item;
