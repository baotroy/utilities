import { FC } from "react";
import { Component, IFunctionFragement } from "./type"
import Item from "./Item";
interface FunctionComponentProps {
  fragment: IFunctionFragement
}
const FunctionComponent: FC<FunctionComponentProps> = ({ fragment }) => {
  const { name: functionName, inputs: value } = fragment;
  return (
    <div>
      {
        functionName && (
          <div>
            <span className="text-bodydark">
              function
            </span>
            <p className="font-semibold"> {functionName}</p>
          </div>
        )
      }
      {
        fragment.inputs.map((input, index) => {
          return <Item key={index}
            name={input.name}
            baseType={input.baseType}
            type={input.type}
            value={input.value}
            funcFragment={input.functionFragment}
            arrayChildren={input.arrayChildren}
            deep={0}
          />;
        })
      }
    </div>
  )
}

export default FunctionComponent;