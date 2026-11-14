import { FC } from "react";
import { IFunctionFragement } from "./type";
import Item from "./Item";
import clsx from "clsx";

interface FunctionComponentProps {
  fragment: IFunctionFragement;
  // nested call decoded from a bytes argument
  isChild?: boolean;
  depth?: number;
}

const FunctionComponent: FC<FunctionComponentProps> = ({
  fragment,
  isChild,
  depth = 0,
}) => {
  return (
    <div
      className={clsx(
        isChild && "mt-3 rounded-lg border-l-2 border-dashed border-primary pl-3"
      )}
    >
      <div className="text-sm">
        <span className="text-bodydark">
          {isChild ? "nested call" : "function"}
        </span>
        <p className="break-all font-mono font-semibold">
          {fragment.signature || fragment.name}
          {fragment.selector && (
            <span className="ml-2 font-normal text-bodydark">{fragment.selector}</span>
          )}
        </p>
      </div>
      {fragment.inputs.length === 0 ? (
        <p className="mt-2 text-sm text-bodydark">No arguments</p>
      ) : (
        fragment.inputs.map((input, index) => (
          <Item key={index} param={input} index={index} depth={depth} />
        ))
      )}
    </div>
  );
};

export default FunctionComponent;
