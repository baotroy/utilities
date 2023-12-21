import Image from "next/image";
import { useCallback } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface CropEditorProps {
  base64: string;
  width: number;
  height: number;
  aspect: number;
  handleChangeCropArea: (x: number, y: number, w: number, h: number) => void;
  initialCrop: Crop;
}
const CropEditor: React.FC<CropEditorProps> = ({
  base64,
  width,
  height,
  aspect,
  handleChangeCropArea,
  initialCrop,
}) => {
  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      console.log(croppedArea, croppedAreaPixels);
    },
    []
  );
  return (
    <>
      <ReactCrop
        crop={initialCrop}
        aspect={aspect}
        onChange={(c) => handleChangeCropArea(c.x, c.y, c.width, c.height)}
        onCropComplete={onCropComplete}
      >
        <Image
          alt="Crop"
          src={base64}
          className="max-w-full"
          width={width}
          height={height}
        />
      </ReactCrop>
    </>
  );
};
export default CropEditor;
