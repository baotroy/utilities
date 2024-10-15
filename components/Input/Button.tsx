import clsx from "clsx";
import { IconType } from "react-icons";

interface IconProps {
  icon: IconType;
  position?: "left" | "right";
  size?: number;
}
interface ButtonProps {
  label: string;
  handleOnClick?: () => void;
  type?:
    | "primary"
    | "secondary"
    | "danger"
    | "warning"
    | "success"
    | "reset"
    | "outline";
  additionalClass?: string;
  icon?: IconProps;
  disabled?: boolean;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  label,
  handleOnClick,
  additionalClass,
  type = "primary",
  icon,
  disabled,
  isLoading,
}) => {
  return (
    <>
      <button
        onClick={handleOnClick}
        className={clsx("custom-button", type, additionalClass)}
        disabled={disabled || isLoading}
      >
        {icon && (icon.position === "left" || !icon.position) ? (
          <icon.icon className="inline-block" size={icon.size || 12} />
        ) : null}
        {
          isLoading ? <span className="loader"></span> : label
        }
        {icon && icon.position === "right" ? (
          <icon.icon className="inline-block " size={icon.size || 12} />
        ) : null}
        
      </button>
    </>
  );
};
export default Button;
