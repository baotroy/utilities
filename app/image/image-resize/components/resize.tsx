import { useEffect, useState } from "react";
import { Dimensions, FileFormat, Unit } from "../../type";
import Image from "next/image";
import ResizeDimensions from "./resize-dimensions";
import { convertOtherUnitToPixel, resizeImageExec } from "../../utils";
interface ResizeProps {
  base64: string;
  dimensions?: Dimensions;
  format: FileFormat;
}

type Tabs = "dimensions" | "percentage";
const Resize: React.FC<ResizeProps> = ({ base64, dimensions, format }) => {
  const [width, setWidth] = useState(dimensions?.width || 0);
  const [height, setHeight] = useState(dimensions?.height || 0);
  const [ration, setRation] = useState(0);
  const [activeTab, setActiveTab] = useState<Tabs>("dimensions");
  const [outWidth, setOutWidth] = useState(0);
  const [outHeight, setOutHeight] = useState(0);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [unit, setUnit] = useState<Unit>("px");
  const [outputFormat, setOutputFormat] = useState<FileFormat>(format);
  const [dpi, setDpi] = useState(300);

  useEffect(() => {
    setWidth(dimensions?.width || 0);
    setHeight(dimensions?.height || 0);
    setOutHeight(dimensions?.height || 0);
    setOutWidth(dimensions?.width || 0);
    if (dimensions?.height && dimensions?.width) {
      setRation(dimensions.width / dimensions.height);
    }
  }, [dimensions]);

  const handleTabClick = (tab: Tabs) => {
    setActiveTab(tab);
  };

  const handleChangeOutputWidth = (w: string) => {
    if (w.trim() === "") w = "0";
    if (Number.isNaN(w)) {
      return;
    }
    setOutWidth(Number(w));
    if (lockAspectRatio) {
      setOutHeight(getValueByUnit(Number(w) / ration));
    }
  };

  const handleChangeOutputHeight = (h: string) => {
    if (h.trim() === "") h = "0";
    if (Number.isNaN(h)) {
      return;
    }
    setOutHeight(Number(h));
    if (lockAspectRatio) {
      setOutWidth(getValueByUnit(Number(h) * ration));
    }
  };

  const handleChangeUnit = (unit: "px" | "in" | "cm" | "mm") => {
    setUnit(unit);
  };

  const getValueByUnit = (value: number) => {
    if (unit === "px") {
      return Math.round(value);
    }
    return value;
  };

  const handleChangeLockAspectRatio = () => {
    setLockAspectRatio(!lockAspectRatio);
  };

  const handleChangeOutputFormat = (f: FileFormat | "original") => {
    if (f === "original") {
      setOutputFormat(format);
    } else {
      setOutputFormat(f);
    }
  };
  const resizeImage = async () => {
    console.log("frmat", outputFormat);
    console.log("dimension", outWidth, outHeight), dpi;
    const wPx = convertOtherUnitToPixel(outWidth, unit, dpi);
    const hPx = convertOtherUnitToPixel(outHeight, unit, dpi);
    const resizedImageBase64 = await resizeImageExec(
      base64,
      wPx,
      hPx,
      outputFormat
    );

    // download image file with input base 64
    const link = document.createElement("a");
    link.download = "resized-image";
    link.href = resizedImageBase64;
    link.click();
  };
  return (
    <div className="my-2 ">
      <div className="">
        <div className=" w-[350px] border p-4">
          <h3 className="w-full mb-1">Settings</h3>
          <div>
            <button
              className={`px-4 py-2 rounded-t-lg ${
                activeTab === "dimensions"
                  ? "bg-blue-500 text-bodydark"
                  : "bg-gray-200"
              }`}
              onClick={() => handleTabClick("dimensions")}
            >
              Resize
            </button>
            <button
              className={`px-4 py-2 ${
                activeTab === "percentage"
                  ? "bg-blue-500 text-bodydark"
                  : "bg-gray-200"
              }`}
              onClick={() => handleTabClick("percentage")}
            >
              Crop
            </button>
          </div>

          <div className="mb-4">
            {activeTab === "dimensions" && (
              <ResizeDimensions
                width={outWidth}
                height={outHeight}
                unit={unit}
                dpi={dpi}
                lockAspectRatio={lockAspectRatio}
                handleChangeUnit={handleChangeUnit}
                handleChangeOutputWidth={handleChangeOutputWidth}
                handleChangeOutputHeight={handleChangeOutputHeight}
                handleChangeLockAspectRatio={handleChangeLockAspectRatio}
                handleChangeOutputFormat={handleChangeOutputFormat}
                handleChangeDpi={setDpi}
                resizeImage={resizeImage}
              />
            )}
            {activeTab === "percentage" && <p>Content for Tab 2</p>}
          </div>
        </div>
        <div className="flex">
          <Image
            className="max-w-[100%]"
            src={base64}
            alt=""
            width={width}
            height={height}
          />
        </div>
      </div>
    </div>
  );
};
export default Resize;
