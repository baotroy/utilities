import clsx from "clsx";

interface ButtonComponentProps {
  label: string;
  handleOnClick?: () => void;
  additionalClass?: string;
}

const ButtonComponent: React.FC<ButtonComponentProps> = ({
  label,
  handleOnClick,
  additionalClass,
}) => {
  return (
    <button
      onClick={handleOnClick}
      className={clsx("custom-button", additionalClass)}
    >
      {label}
    </button>
  );
};
export default ButtonComponent;
