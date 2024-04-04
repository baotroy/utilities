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
}

const Button: React.FC<ButtonProps> = ({
  label,
  handleOnClick,
  additionalClass,
  type = "primary",
  icon,
}) => {
  return (
    <>
      <button
        onClick={handleOnClick}
        className={clsx("custom-button", type, additionalClass)}
      >
        {icon && (icon.position === "left" || !icon.position) ? (
          <icon.icon className="inline-block" size={icon.size || 12} />
        ) : null}
        {label}
        {icon && icon.position === "right" ? (
          <icon.icon className="inline-block " size={icon.size || 12} />
        ) : null}
      </button>
    </>
  );
};
export default Button;
