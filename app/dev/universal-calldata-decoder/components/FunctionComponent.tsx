import { FC } from "react";
import { IFunctionFragement } from "./type"
import Item from "./Item";
import clsx from "clsx";
interface FunctionComponentProps {
  fragment: IFunctionFragement
  isChild?: boolean
}
const FunctionComponent: FC<FunctionComponentProps> = ({ fragment, isChild }) => {
  return (
    <div className={clsx(isChild ? "pb-4 pl-4 pr-4 mt-4 border-dashed border-l border-b rounded-lg" : "")}>
      {
        fragment?.name && (
          <div className="">
            <span className="text-bodydark">
              function
            </span>
            <p className="font-semibold"> {fragment.name}</p>
          </div>
        )
      }
      <div className="bg-[#f8fafc] p-4">
        {
          fragment.inputs.map((input, index) => {
            return <Item key={index}
              name={input.name}
              baseType={input.baseType}
              type={input.type}
              value={input.value}
              funcFragment={input.functionFragment}
              arrayChildren={input.arrayChildren}
              depth={0}
            />;
          })
        }
      </div>
    </div>
  )
}

export default FunctionComponent;