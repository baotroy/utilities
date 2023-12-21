import { MdOutlineArrowCircleRight } from "react-icons/md";
import { FileFormat } from "../../type";
import ExportSettings from "./export-settings";

interface ResizePercentageProps {
  originalWidth: number;
  originalHeight: number;
  percentage: number;
  outputFormat: FileFormat;
  handleChangePercentage: (p: number) => void;
  handleChangeOutputFormat: (f: FileFormat) => void;
  resizeImagePercentage: (percentage: boolean) => void;
}

const ResizePercentage: React.FC<ResizePercentageProps> = ({
  percentage,
  handleChangePercentage,
  originalWidth,
  originalHeight,
  handleChangeOutputFormat,
  resizeImagePercentage,
  outputFormat,
}) => {
  return (
    <>
      <div className="mb-4">
        <label className="block text-[14px] mb-2" htmlFor="width">
          Size
        </label>
        <div className="flex items-center">
          <div className="flex w-full">
            <input
              type="range"
              min={1}
              max={200}
              defaultValue={percentage} // Set the default value as desired
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 bg-meta-5"
              id="width"
              onChange={(e) => handleChangePercentage(+e.target.value)}
            />
          </div>
          <div className="flex ml-4 text-[14px] w-[50px]">{percentage}%</div>
        </div>
        <div className="mt-2 text-[12px] text-bodydark2">
          Make my image {percentage}% of the original size (
          {Math.round((originalWidth * percentage) / 100)} X{" "}
          {Math.round((originalHeight * percentage) / 100)} px)
        </div>
        <ExportSettings
          handleChangeOutputFormat={handleChangeOutputFormat}
          outputFormat={outputFormat}
        />
        <div className="text-center mt-10">
          <button
            onClick={() => resizeImagePercentage(true)}
            className="rounded bg-meta-5 dark:bg-meta-5 px-10 py-2 font-semi text-[18px] text-white dark:text-bodydark2"
          >
            Resize <MdOutlineArrowCircleRight className="inline-block " />
          </button>
        </div>
      </div>
    </>
  );
};
export default ResizePercentage;
