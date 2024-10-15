import { FC, useState } from "react";
import {  IFunctionFragement } from "./type";
import { MdContentCopy } from "react-icons/md";
import { copyToClipboard } from "@/common/utils";
import clsx from "clsx";
import FunctionComponent from "./FunctionComponent";
import { convertNumberBetweenEtherUnit, ethUnitDecimals } from "@/app/number/utils";

enum Uint {
  ether = "ETH",
  wei = "WEI",
}

interface ItemProps {
  name: string;
  type: string;
  baseType: string;
  value: string;
  components?: ItemProps[];
  funcFragment?: IFunctionFragement
  arrayChildren?: ItemProps[],
  childIndex?: number,
  depth: number
}

const Item: FC<ItemProps> = ({
  name,
  type,
  baseType,
  value,
  funcFragment,
  arrayChildren,
  components,
  childIndex,
  depth = 0,
}) => {
  depth++;

  const [sltUint, setSltUint] = useState("wei");
  const [values, setValue] = useState(value);
  const handleCopy = (v: string) => {
    copyToClipboard(v);
  };
  const handleUnitChange = (newUnit: string) => {
    convertData(sltUint, newUnit);
    setSltUint(newUnit as Uint);

  }

  const convertData = (fromUnit: string, toUnit: string) => {

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

      <div className={clsx(`block px-4 my-3 bg-level-${depth} rounded-lg py-4`)}>
        <div className="mb-1 mt-2">{type}
          {childIndex !== undefined && ` (index: ${childIndex})`}
          {arrayChildren?.length && ` (length: ${arrayChildren.length})`}
        </div>
        <div className="flex">
          {baseType !== "array" && (
            <>
              <div className="w-full">
                <input
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
                  value={values.toString()}
                  onChange={() => { }}
                />


              </div>
              <div className="flex">
                <span className="bg-gray-2  dark:bg-graydark border border-bodydark  block py-2 px-4 rounded-tr-lg rounded-br-lg hover:cursor-pointer">
                  <MdContentCopy size={20} onClick={() => handleCopy(value.toString())} />
                </span>
              </div>
            </>
          )
          }
          {
            baseType.includes("uint") ? (
              <div className="ml-2">
                <select value={sltUint} className="p-1.5 rounded-lg border-bodydark border" onChange={(e) => handleUnitChange(e.target.value)}>
                  {
                    Object.keys(Uint).map((unit, index) => {
                      return <option key={index}  value={unit}>{Uint[unit as keyof typeof Uint]}</option>
                    })
                  }
                </select>
              </div>
            ) : null
          }
        </div>

        {
          baseType === "array" && (
            <div className="flex flex-col">
              {
                arrayChildren?.map((item, index) => <Item
                  key={index}
                  name={item.name}
                  baseType={item.baseType}
                  type={item.type}
                  value={item.value}
                  funcFragment={item.funcFragment}
                  arrayChildren={item.arrayChildren}
                  components={item.components}
                  childIndex={index}
                  depth={depth}
                />)
              }
            </div>
          )
        }

        {
          components && (
            <div className="flex flex-col">
              {
                components?.map((item, index) => <Item
                  key={index}
                  name={item.name}
                  baseType={item.baseType}
                  type={item.type}
                  value={item.value}
                  funcFragment={item.funcFragment}
                  arrayChildren={item.arrayChildren}
                  components={item.components}
                  depth={depth}
                />)
              }
            </div>
          )
        }
        {
          funcFragment && (
            <div className="flex flex-col">
              <FunctionComponent
                fragment={funcFragment}
                isChild={true}
              />
            </div>
          )
        }
      </div>
    }
  </>;
};
export default Item;
