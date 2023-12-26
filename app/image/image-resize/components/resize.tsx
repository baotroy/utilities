import { useEffect, useState } from "react";
import { Dimensions, FileFormat, Measure, Unit } from "../../type";
import Image from "next/image";
import ResizeDimensions from "./resize/resize-dimensions";
import ResizePercentage from "./resize/resize-percentage";
import {
  convertOtherUnitToPixel,
  convertPixelOtherUnit,
  resizeImageExec,
} from "../../utils";

interface ResizeProps {
  base64: string;
  dimensions?: Dimensions;
  originalFormat: FileFormat;
}

type Tabs = "dimensions" | "percentage";

const Resize: React.FC<ResizeProps> = ({
  base64,
  dimensions,
  originalFormat,
}) => {
  const [originalWidth, setOriginalWidth] = useState(dimensions?.width || 0);
  const [originalHeight, setOriginalHeight] = useState(dimensions?.height || 0);
  const [activeTab, setActiveTab] = useState<Tabs>("dimensions");
  const [outWidth, setOutWidth] = useState(0);
  const [outHeight, setOutHeight] = useState(0);

  const [widthString, setWidthString] = useState("0");
  const [heightString, setHeightString] = useState("0");

  const [outWidths, setOutWidths] = useState<Measure>({
    px: dimensions?.width || 0,
    in: 0,
    cm: 0,
    mm: 0,
  });
  const [outHeights, setOutHeights] = useState<Measure>({
    px: dimensions?.height || 0,
    in: 0,
    cm: 0,
    mm: 0,
  });
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [unit, setUnit] = useState<Unit>("px");
  const [outputFormat, setOutputFormat] = useState<FileFormat>("original");
  const [dpi, setDpi] = useState(300);

  const [resizePercentage, setResizePercentage] = useState(100);

  useEffect(() => {
    // reset config when file changes
    setUnit("px");
    setOutputFormat("original");
    setDpi(300);
    setLockAspectRatio(true);
  }, [base64, originalFormat]);

  useEffect(() => {
    setOriginalWidth(dimensions?.width || 0);
    setOriginalHeight(dimensions?.height || 0);
    setOutHeight(dimensions?.height || 0);
    setOutWidth(dimensions?.width || 0);

    setWidthString((dimensions?.width || 0).toString());
    setHeightString((dimensions?.height || 0).toString());
  }, [dimensions]);

  useEffect(() => {
    updateOtherUnits();
  }, [outWidth, outHeight, dpi]);

  useEffect(() => {
    setOutWidth(outWidths[unit]);
    setOutHeight(outHeights[unit]);
  }, [unit]);

  const handleTabClick = (tab: Tabs) => {
    setActiveTab(tab);
  };

  const handleChangeOutputWidth = (w: string) => {
    if (w.trim() === "") w = "0";
    if (Number.isNaN(w)) {
      return;
    }
    setWidthString(w);
    setOutWidth(Number(w));
    if (lockAspectRatio && dimensions?.width && dimensions?.height) {
      const nh = getValueByUnit(
        Number(w) / (dimensions.width / dimensions.height)
      );
      setOutHeight(nh);
      setHeightString(nh.toString());
    }
  };

  const handleChangeOutputHeight = (h: string) => {
    if (h.trim() === "") h = "0";
    if (Number.isNaN(h)) {
      return;
    }
    setHeightString(h);
    setOutHeight(Number(h));
    if (lockAspectRatio && dimensions?.width && dimensions?.height) {
      const nw = getValueByUnit(
        Number(h) * (dimensions.width / dimensions.height)
      );
      setOutWidth(nw);
      setWidthString(nw.toString());
    }
  };

  const updateOtherUnits = () => {
    const pixelWidth =
      unit === "px" ? outWidth : convertOtherUnitToPixel(outWidth, unit, dpi);
    const pixelHeight =
      unit === "px" ? outHeight : convertOtherUnitToPixel(outHeight, unit, dpi);

    const newWidths = {
      px: pixelWidth,
      in:
        unit !== "in" ? convertPixelOtherUnit(pixelWidth, "in", dpi) : outWidth,
      cm:
        unit !== "cm" ? convertPixelOtherUnit(pixelWidth, "cm", dpi) : outWidth,
      mm:
        unit !== "mm" ? convertPixelOtherUnit(pixelWidth, "mm", dpi) : outWidth,
    };
    setOutWidths(newWidths as Measure);

    const newHeights = {
      px: pixelHeight,
      in:
        unit !== "in"
          ? convertPixelOtherUnit(pixelHeight, "in", dpi)
          : outHeight,
      cm:
        unit !== "cm"
          ? convertPixelOtherUnit(pixelHeight, "cm", dpi)
          : outHeight,
      mm:
        unit !== "mm"
          ? convertPixelOtherUnit(pixelHeight, "mm", dpi)
          : outHeight,
    };
    setOutHeights(newHeights as Measure);

    // set to width, height string
    setWidthString(newWidths[unit].toString());
    setHeightString(newHeights[unit].toString());
  };

  const handleChangeUnit = (unit: "px" | "in" | "cm" | "mm") => {
    setUnit(unit);
    setWidthString(outWidths[unit].toString());
    setHeightString(outHeights[unit].toString());
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

  const handleChangeOutputFormat = (f: FileFormat) => {
    setOutputFormat(f);
  };

  const handleChangePercentage = (p: number) => {
    if (p < 1 || p > 200) return;
    setResizePercentage(p);
  };

  const resizeImage = async (percentage = false) => {
    const fileFormat =
      outputFormat === "original" ? originalFormat : outputFormat;

    const resizedImageBase64 = await resizeImageExec(
      base64,
      percentage === false
        ? outWidths["px"]
        : Math.round((originalWidth * resizePercentage) / 100),
      percentage === false
        ? outHeights["px"]
        : Math.round((originalHeight * resizePercentage) / 100),
      fileFormat
    );
    // download image file with input base 64
    const link = document.createElement("a");
    link.download = "resized";
    link.href = resizedImageBase64;
    link.click();
  };

  return (
    <div className="">
      <div className="xl:flex block">
        <div className="xl:w-[350px] w-full px-4 py-6 border-r border-bodydark">
          <h3 className="xl:w-full mb-4 font-bold text-[20px]">
            Resize Settings
          </h3>
          <div className="mb-4 text-center">
            <button
              className={`px-4 py-2 border-b-2 font-semibold text-[14px] ${
                activeTab === "dimensions"
                  ? " border-meta-5"
                  : "border-transparent text-bodydark"
              }`}
              onClick={() => handleTabClick("dimensions")}
            >
              By Dimensions
            </button>
            <button
              className={`px-4 py-2 border-b-2 font-semibold  text-[14px] ${
                activeTab === "percentage"
                  ? "bg-blue-500  border-meta-5"
                  : "bg-gray-200 border-transparent text-bodydark"
              }`}
              onClick={() => handleTabClick("percentage")}
            >
              As Percentage
            </button>
          </div>

          <div className="mb-4">
            {activeTab === "dimensions" && (
              <ResizeDimensions
                outWidths={outWidths}
                outHeights={outHeights}
                widthString={widthString}
                heightString={heightString}
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
                outputFormat={outputFormat}
              />
            )}
            {activeTab === "percentage" && (
              <ResizePercentage
                originalWidth={originalWidth}
                originalHeight={originalHeight}
                percentage={resizePercentage}
                handleChangePercentage={handleChangePercentage}
                handleChangeOutputFormat={handleChangeOutputFormat}
                resizeImagePercentage={resizeImage}
                outputFormat={outputFormat}
              />
            )}
          </div>
        </div>
        <div className="xl:flex xl:flex-1 xl:w-[cal(100%-350px)] xl:m-0 mt-8 w-full justify-center align-middle  px-4 py-6 ">
          <div className="text-center">
            <Image
              className="max-w-[500px]"
              src={base64}
              alt=""
              width={originalWidth}
              height={originalHeight}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default Resize;
