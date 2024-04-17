import clsx from "clsx";
import { ChangeEvent } from "react";

interface TextAreaProps {
  value?: string | number;
  defaultValue?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  additionalClass?: string;
  maxLength?: number;
  readonly?: boolean;
  isError?: boolean;
  rows?: number;
}

const TextArea: React.FC<TextAreaProps> = ({
  placeholder = "",
  value,
  onChange,
  onKeyDown,
  additionalClass,
  maxLength,
  readonly = false,
  isError = false,
  rows = 5,
}) => {
  return (
    <>
      {/* <input
        placeholder={placeholder}
        maxLength={maxLength}
        type={type}
        className={clsx("custom-input", additionalClass, isError && "error")}
        value={value}
        readOnly={readonly}
        onChange={onChange}
        onKeyDown={onKeyDown}
      /> */}
      <textarea
        rows={rows}
        placeholder={placeholder}
        readOnly={readonly}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        spellCheck={false}
        className={clsx("custom-input", additionalClass, isError && "error")}
      ></textarea>
    </>
  );
};
export default TextArea;
