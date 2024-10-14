import { FC } from "react";
import { Component, IFunctionFragement } from "./type"
import Item from "./Item";
interface ResultComponentProps {
  fragment: IFunctionFragement
}
const ResultComponent: FC<ResultComponentProps> = ({ fragment }) => {
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
            component={input}
            values={value[index]}
            deep={0}
          />;
        })
      }
    </div>
  )
}

export default ResultComponent;