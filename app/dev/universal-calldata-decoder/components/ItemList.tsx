import { FC } from "react";

interface ItemProps {
  type: string;
  value: string;
}

const Item: FC<ItemProps> = ({ type, value }) => {
  return <>
    <div className="p-4">
      <div className="w-1/3">{type}</div>
      <div className="w-2/3">{value}</div>
    </div>
  </>;
};
export default Item;
