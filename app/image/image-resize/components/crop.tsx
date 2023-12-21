import { useEffect, useState } from "react";
import { Dimensions, FileFormat } from "../../type";
import AspectRatio from "./crop/aspect-ratio";
import CropEditor from "./crop/crop-editor";
import { type Crop } from "react-image-crop";

interface CropProps {
  base64: string;
  dimensions?: Dimensions;
  originalFormat: FileFormat;
}
const Crop: React.FC<CropProps> = ({ base64, dimensions }) => {
  const [width, setWidth] = useState(
    dimensions?.width ? Math.round(dimensions.width / 2) : 0
  );
  const [height, setHeight] = useState(
    dimensions?.height ? Math.round(dimensions.height / 2) : 0
  );
  const [originalWidth] = useState(dimensions?.width || 0);
  const [originalHeight] = useState(dimensions?.height || 0);
  const [aspect, setAspect] = useState(1);
  const [positionX, setPositionX] = useState(
    dimensions?.width ? Math.round(dimensions.width / 4) : 0
  );
  const [positionY, setPositionY] = useState(
    dimensions?.height ? Math.round(dimensions.height / 4) : 0
  );

  const [initialCrop, setInitialCrop] = useState<Crop>({
    x: positionX,
    y: positionY,
    width,
    height,
    unit: "px",
  });

  const [selectedAspect, setSelectedAspect] = useState<number | string>(
    "original"
  );

  const handleChangeOutputWidth = (w: number) => {
    setWidth(w);
  };
  const handleChangeOutputHeight = (h: number) => {
    setHeight(h);
  };

  const handleChangeAspect = (a: number | string) => {
    setSelectedAspect(a);
    if (a === "original") setAspect(originalWidth / originalHeight);
    else setAspect(Number(a));
  };

  const handleChangePositionX = (a: number) => {
    setPositionX(a);
  };

  const handleChangePositionY = (a: number) => {
    setPositionY(a);
  };

  const handleChangeCropArea = (x: number, y: number, w: number, h: number) => {
    setWidth(Math.round(w));
    setHeight(Math.round(h));
    setPositionX(Math.round(x));
    setPositionY(Math.round(y));
  };

  useEffect(() => {
    setInitialCrop({
      x: positionX,
      y: positionY,
      width,
      height,
      unit: "px",
    });
  }, [positionX, positionY, width, height]);

  return (
    <div className="">
      <div className="xl:flex block">
        <div className="xl:w-[350px] w-full px-4 py-6 border-r border-bodydark">
          <h3 className="xl:w-full mb-4 font-bold text-[20px]">
            Crop Rectangle
          </h3>
          <div className="mb-4">
            <div className="flex">
              <div className="w-1/2">
                <label className="block text-[14px]" htmlFor="width">
                  Width
                </label>
                <input
                  type="text"
                  id="width"
                  name="width"
                  required
                  className="w-[100%] mt-2  p-2 rounded-lg border border-bodydark outline-bodydark dark:outline-boxdark text-[14px]"
                  value={width}
                  onChange={(e) =>
                    handleChangeOutputWidth(parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="w-1/2 ml-1">
                <label htmlFor="height" className="text-[14px]">
                  Height
                </label>
                <div>
                  <input
                    type="text"
                    id="height"
                    name="height"
                    value={height}
                    required
                    className="w-[100%] mt-2 p-2 rounded-lg border border-bodydark outline-bodydark dark:outline-boxdark text-[14px]"
                    onChange={(e) =>
                      handleChangeOutputHeight(parseInt(e.target.value) || 0)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <AspectRatio
              handleChangeAspect={handleChangeAspect}
              dimensions={dimensions}
              selectedAspect={selectedAspect}
            />
          </div>
          <div className="mt-10">
            <h3 className="xl:w-full mb-4 font-bold text-[20px]">
              Crop Position
            </h3>
            <div className="flex">
              <div className="w-1/2">
                <label className="block text-[14px]" htmlFor="width">
                  Position (X)
                </label>
                <input
                  type="text"
                  id="positionX"
                  name="positionX"
                  required
                  className="w-[100%] mt-2  p-2 rounded-lg border border-bodydark outline-bodydark dark:outline-boxdark text-[14px]"
                  value={positionX}
                  onChange={(e) =>
                    handleChangePositionX(parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="w-1/2 ml-1">
                <label htmlFor="height" className="text-[14px]">
                  Position (Y)
                </label>
                <div>
                  <input
                    type="text"
                    id="positionY"
                    name="positionY"
                    value={positionY}
                    required
                    className="w-[100%] mt-2 p-2 rounded-lg border border-bodydark outline-bodydark dark:outline-boxdark text-[14px]"
                    onChange={(e) =>
                      handleChangePositionY(parseInt(e.target.value) || 0)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-center mt-10">
              <button
                onClick={() => {}}
                className="rounded bg-meta-5 dark:bg-meta-5 px-10 py-2 font-semi text-[18px] text-white dark:text-bodydark2"
              >
                Crop
              </button>
              <button
                type="reset"
                className="rounded bg-bodydark px-4 py-2 font-semi text-[18px] text-white dark:text-bodydark2 ml-2"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
        <div className="xl:flex xl:flex-1 xl:w-[cal(100%-350px)] xl:m-0 mt-8 w-full justify-center align-middle  px-4 py-6 ">
          <div className="justify-center">
            <CropEditor
              base64={base64}
              width={originalWidth}
              height={originalHeight}
              aspect={aspect}
              handleChangeCropArea={handleChangeCropArea}
              initialCrop={initialCrop}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Crop;
