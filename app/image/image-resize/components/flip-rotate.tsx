import Image from "next/image";
import { useEffect, useState } from "react";
import { Dimensions, FileFormat } from "../../type";
import { flip, rotate } from "../../utils";
import { MdOutlineRotateLeft, MdOutlineRotateRight } from "react-icons/md";
import { RiMergeCellsHorizontal, RiMergeCellsVertical } from "react-icons/ri";

interface FlipRotateProps {
  base64: string;
  dimensions?: Dimensions;
  originalFormat: FileFormat;
}

const FlipRotate: React.FC<FlipRotateProps> = ({
  base64,
  dimensions,
  originalFormat,
}) => {
  const [width, setWidth] = useState(dimensions?.width || 0);
  const [height, setHeight] = useState(dimensions?.height || 0);
  const [base64Data, setBase64Data] = useState(base64);

  useEffect(() => {
    setBase64Data(base64);
  }, [base64]);

  const handleRoate = async (degree: number) => {
    const roateBase64 = await rotate(base64Data, degree, originalFormat);
    setBase64Data(roateBase64);
    setWidth(height);
    setHeight(width);
  };
  const handleFlip = async (direction: "horizontal" | "vertical") => {
    const flipBase64 = await flip(base64Data, direction, originalFormat);
    setBase64Data(flipBase64);
  };

  const saveTransformImage = () => {
    const link = document.createElement("a");
    link.download = "transformed-image";
    link.href = base64Data;
    link.click();
  };
  return (
    <div className="">
      <div className="xl:flex block">
        <div className="xl:w-[350px] w-full px-4 py-6 border-r border-bodydark">
          <h3 className="xl:w-full mb-4 font-bold text-[20px]">Flip Image</h3>
          <div className="mb-4 text-center">
            <button
              onClick={() => handleFlip("horizontal")}
              className="border p-4 rounded-lg"
            >
              <RiMergeCellsVertical size={34} />
              Horizontally
            </button>
            <button
              onClick={() => handleFlip("vertical")}
              className="border p-4 rounded-lg ml-4"
            >
              <RiMergeCellsHorizontal size={34} />
              Vertically
            </button>
          </div>
          <h3 className="xl:w-full mb-4 mt-8 font-bold text-[20px]">
            Rotate Image
          </h3>
          <div className="mb-4 text-center">
            <button
              onClick={() => handleRoate(90)}
              className="border p-4 rounded-lg text-center"
            >
              <MdOutlineRotateRight size={34} />
              Clock Wise
            </button>
            <button
              onClick={() => handleRoate(-90)}
              className="border p-4 rounded-lg ml-4"
            >
              <MdOutlineRotateLeft size={34} />
              Counter Clock Wise
            </button>
          </div>
          <div className="text-center mt-10">
            <button
              onClick={() => saveTransformImage()}
              className="rounded bg-meta-5 dark:bg-meta-5 px-10 py-2 font-semi text-[18px] text-white dark:text-bodydark2"
            >
              Save
            </button>
          </div>
        </div>
        <div className="xl:flex xl:flex-1 xl:w-[cal(100%-350px)] xl:m-0 mt-8 w-full justify-center align-middle px-4 py-6">
          {/* <div className="text-center"> */}
          <Image
            className="max-w-[500px]"
            src={base64Data}
            alt=""
            width={width}
            height={height}
          />
          {/* </div> */}
        </div>
      </div>
    </div>
  );
};

export default FlipRotate;
