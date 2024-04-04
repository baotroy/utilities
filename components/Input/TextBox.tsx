import clsx from "clsx";
import { ChangeEvent } from "react";

interface TextInputComponentProps {
  handleOnChange: (e: ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  placeholder?: string;
  additionalClass?: string;
  maxLength?: number;
  isError?: boolean;
}

const TextBoxComponent: React.FC<TextInputComponentProps> = ({
  placeholder = "",
  value,
  handleOnChange,
  additionalClass,
  maxLength,
  isError = false,
}) => {
  return (
    <input
      placeholder={placeholder}
      maxLength={maxLength}
      type="text"
      className={clsx(
        "rounded border border-bodydark px-2 py-[5px] outline-bodydark dark:outline-boxdark",
        additionalClass,
        isError && "error"
      )}
      value={value}
      onChange={(e) => handleOnChange(e)}
    />
  );
};
export default TextBoxComponent;
