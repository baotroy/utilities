import clsx from "clsx";

interface ColorLabelProps {
  color: string;
  bgColor: string;
}
const ColorLabel: React.FC<ColorLabelProps> = ({ color, bgColor }) => {
  return (
    <div>
      <span key={color} className={clsx(`circular label ${bgColor}`)}>
        {color.substring(0, 1)}
      </span>
      &nbsp;
      <strong>{color}</strong>
    </div>
  );
};
export default ColorLabel;
