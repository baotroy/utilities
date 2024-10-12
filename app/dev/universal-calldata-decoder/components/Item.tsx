import { FC, useState } from "react";
import { Component } from "./type";

import { MdContentCopy } from "react-icons/md";
import { copyToClipboard } from "@/common/utils";

enum Uint {
  eth = "ETH",
  wei = "WEI",
}

interface ItemProps {
  // name: string;
  // baseType: string;
  // components: Component[] | null;
  // values: string | any[]
  value: Component
}

const Item: FC<ItemProps> = ({value}) => {
  console.log({value})
  const {baseType, components, values, type} = value;
  console.log({
    baseType, components, values, type
  })
  const [sltUint, setSltUint] = useState("wei");
  const handleCopy = (v: string) => {
    copyToClipboard(v);
  };

  const handleUnitChange = (value: string) => {
    setSltUint(value as Uint);
  } 
  return <>
    {
      components !== null ? (
        <>
          <div className="p-4 w-full">
            <div className="">{baseType}</div>
            <div className="">
              {
                components.map((component, index) => {
                  return <Item key={index} value={component} />;
                })
              }
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="p-4 w-full">
            <div className="">{type}</div>
            <div className="">
              <div className="flex">
                <div className="flex">
                  <input
                    type="text"
                    className="
                      w-100 p-1.5 
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
                    value={values?.toString()}
                    onChange={() => { }}
                  />
                </div>
                <div className="flex">
                  <span className="bg-gray-2  dark:bg-graydark border border-bodydark  block py-2 px-4 rounded-tr-lg rounded-br-lg hover:cursor-pointer">
                    <MdContentCopy size={20} onClick={() => handleCopy(values.toString())} />
                  </span>
                </div>
                {
                  baseType.includes("uint") ? (
                    <select onChange={(e) => handleUnitChange(e.target.value)}>
                      <option selected={sltUint === Uint.eth.toLowerCase()} value={Uint.eth}>ETH</option>
                      <option selected={sltUint === Uint.wei.toLowerCase()} value={Uint.wei}>WEI</option>
                    </select>
                  ): null
                }
              </div>
            </div>
          </div>
        </>
      )


    }
  </>;
};
export default Item;
