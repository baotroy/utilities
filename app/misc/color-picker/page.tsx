import { Metadata } from "next";
import ColorPickerComponent from "../components/color-picker";

export const metadata: Metadata = {
  title: "Color Picker",
  description: "Pick colors and get values in multiple formats: HEX, RGB, HSL, with alpha support.",
};

const ColorPicker = () => {
  return <ColorPickerComponent />;
};

export default ColorPicker;
