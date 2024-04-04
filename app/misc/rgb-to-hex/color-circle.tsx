interface ColorCircleProps {
  color: string;
  bgColor: string;
  label?: string;
}
const ColorCircle: React.FC<ColorCircleProps> = ({ color, bgColor, label }) => {
  return (
    <div className="inline-block mr-2 leading-10">
      <span
        key={color}
        className="circular label"
        style={{ backgroundColor: bgColor }}
      >
        {color}
      </span>
      &nbsp;
      <strong>{label}</strong>
    </div>
  );
};
export default ColorCircle;
