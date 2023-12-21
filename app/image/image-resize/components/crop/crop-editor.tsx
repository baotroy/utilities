import Image from "next/image";
import { RefObject } from "react";
import ReactCrop, { PixelCrop, type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface CropEditorProps {
  base64: string;
  width: number;
  height: number;
  aspect: number;
  handleChangeCropArea: (x: number, y: number, w: number, h: number) => void;
  initialCrop: Crop;
  imgRef: RefObject<HTMLImageElement>;
  previewCanvasRef: RefObject<HTMLCanvasElement>;
  setCompletedCrop: (a: PixelCrop) => void;
  completedCrop?: PixelCrop;
}
const CropEditor: React.FC<CropEditorProps> = ({
  base64,
  width,
  height,
  aspect,
  handleChangeCropArea,
  initialCrop,
  imgRef,
  previewCanvasRef,
  setCompletedCrop,
  completedCrop,
}) => {
  return (
    <>
      <ReactCrop
        crop={initialCrop}
        aspect={aspect}
        onChange={(c) => handleChangeCropArea(c.x, c.y, c.width, c.height)}
        onComplete={(c) => setCompletedCrop(c)}
      >
        <Image
          ref={imgRef}
          alt="Crop"
          src={base64}
          className="max-w-full"
          width={width}
          height={height}
        />
        <canvas
          width={completedCrop?.width}
          height={completedCrop?.height}
          ref={previewCanvasRef}
          hidden
        />
      </ReactCrop>
    </>
  );
};
export default CropEditor;
