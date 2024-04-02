import { Metadata } from "next";
import ImageResizeComponent from "../components/image-resize";
export const metadata: Metadata = {
  title: "Resize Image",
  description:
    "Resize image, crop image, flip image, rotate image online. Resize image to specific dimensions, crop image to specific dimensions, flip image horizontally or vertically, rotate image by 90 degrees clockwise or anti-clockwise.",
};
const ImageResize = () => {
  return <ImageResizeComponent />;
};

export default ImageResize;
