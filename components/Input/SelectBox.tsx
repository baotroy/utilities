import clsx from "clsx";
import { ChangeEvent } from "react";

interface SelectBoxProps {
  items: string[];
  value: string;
  handleOnChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  additionalClass?: string;
  disabled?: boolean;
  isError?: boolean;
}

const SelectBox: React.FC<SelectBoxProps> = ({
  items,
  value,
  handleOnChange = () => {},
  additionalClass,
  disabled = false,
  isError = false,
}) => {
  return (
    <select
      value={value}
      onChange={(e) => handleOnChange(e)}
      className={clsx("custom-input", additionalClass, isError && "error")}
      disabled={disabled}
    >
      {items.map((item) => (
        <option key={item}>{item}</option>
      ))}
    </select>
  );
};
export default SelectBox;
