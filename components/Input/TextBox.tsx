import clsx from "clsx";
import { ChangeEvent } from "react";

interface TextBoxProps {
  value?: string | number;
  defaultValue?: string;
  type?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  additionalClass?: string;
  maxLength?: number;
  readonly?: boolean;
  isError?: boolean;
}

const TextBox: React.FC<TextBoxProps> = ({
  placeholder = "",
  type = "text",
  value,
  onChange,
  onKeyDown,
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
        type={type}
        className={clsx("custom-input", additionalClass, isError && "error")}
        value={value}
        readOnly={readonly}
        onChange={onChange}
        onKeyDown={onKeyDown}
      />
    </>
  );
};
export default TextBox;
