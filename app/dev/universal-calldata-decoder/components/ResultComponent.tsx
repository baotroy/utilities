import { FC } from "react";
import { Component } from "./type"
import Item from "./Item";
interface ResultComponentProps {
  functionName: string;
  component: Component | undefined;
  value: string | any[];
  deep: number;
}
const ResultComponent: FC<ResultComponentProps> = ({ functionName, component, value, deep = 0 }) => {
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
        component !== undefined && <Item
          component={component}
          values={value as any}
          deep={deep}
        />
      }
    </div>
  )
}

export default ResultComponent;