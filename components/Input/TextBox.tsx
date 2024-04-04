import clsx from "clsx";
import { ChangeEvent } from "react";

interface TextBoxProps {
  handleOnChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  value: string;
  placeholder?: string;
  additionalClass?: string;
  maxLength?: number;
  readonly?: boolean;
  isError?: boolean;
}

const TextBox: React.FC<TextBoxProps> = ({
  placeholder = "",
  value,
  handleOnChange = () => {},
  additionalClass,
  maxLength,
  readonly = false,
  isError = false,
}) => {
  return (
    <>
      <input
        placeholder={placeholder}
        maxLength={maxLength}
        type="text"
        className={clsx("custom-input", additionalClass, isError && "error")}
        value={value}
        readOnly={readonly}
        onChange={(e) => handleOnChange(e)}
      />
    </>
  );
};
export default TextBox;
