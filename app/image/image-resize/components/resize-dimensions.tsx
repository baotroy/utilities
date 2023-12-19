import { MdOutlineArrowCircleRight } from "react-icons/md";
import { FileFormat, Measure, Unit } from "../../type";
import ExportSettings from "./export-settings";

interface ResizeDimensionsProps {
  outWidths: Measure;
  outHeights: Measure;
  unit?: Unit;
  dpi: number;
  lockAspectRatio: boolean;
  outputFormat: FileFormat;
  handleChangeOutputWidth: (w: string) => void;
  handleChangeOutputHeight: (h: string) => void;
  handleChangeLockAspectRatio: () => void;
  handleChangeUnit: (u: Unit) => void;
  handleChangeOutputFormat: (f: FileFormat) => void;
  resizeImage: (p: boolean) => void;
  handleChangeDpi: (d: number) => void;
}
const ResizeDimensions: React.FC<ResizeDimensionsProps> = ({
  outWidths,
  outHeights,
  unit,
  dpi,
  lockAspectRatio,
  handleChangeOutputWidth,
  handleChangeOutputHeight,
  handleChangeLockAspectRatio,
  handleChangeUnit,
  handleChangeOutputFormat,
  handleChangeDpi,
  resizeImage,
  outputFormat,
}) => {
  return (
    <>
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
              value={outWidths[unit || "px"]}
              onChange={(e) => handleChangeOutputWidth(e.target.value || "")}
            />
          </div>
          <div className="w-1/2 ml-1">
            <label htmlFor="height" className="text-[14px]">
              Height
            </label>
            <select
              id="unit"
              name="unit"
              className="w-[50px] float-right rounded-lg border border-none bg-transparent outline-bodydark dark:outline-boxdark text-[14px] p-0.5"
              value={unit}
              onChange={(e) => handleChangeUnit(e.target.value as Unit)}
            >
              <option value="px">px</option>
              <option value="in">inch</option>
              <option value="cm">cm</option>
              <option value="mm">mm</option>
            </select>
            <div>
              <input
                type="text"
                id="height"
                name="height"
                value={outHeights[unit || "px"]}
                required
                className="w-[100%] mt-2 p-2 rounded-lg border border-bodydark outline-bodydark dark:outline-boxdark text-[14px]"
                onChange={(e) => handleChangeOutputHeight(e.target.value || "")}
              />
            </div>
          </div>
        </div>
      </div>
      {unit !== "px" && (
        <div className="mb-4">
          <div className="mb-2">
            <label htmlFor="dpi" className="text-[14px]">
              DPI
            </label>
          </div>
          <select
            id="dpi"
            name="dpi"
            className="w-full p-2 rounded-lg border border-bodydark bg-white outline-bodydark dark:outline-boxdark text-[14px]"
            value={dpi}
            onChange={(e) => handleChangeDpi(Number(e.target.value))}
          >
            <option value="10">10 DPI (billboard)</option>
            <option value="72">72 DPI (newspaper)</option>
            <option value="96">96 DPI (screen)</option>
            <option value="150">150 DPI (magazine)</option>
            <option value="200">200 DPI (inkjet)</option>
            <option value="240">240 DPI (inkjet)</option>
            <option value="300">300 DPI (inkjet)</option>
            <option value="360">360 DPI (inkjet)</option>
            <option value="600">600 DPI (laser)</option>
            <option value="1200">1200 DPI (ultra-hires)</option>
          </select>
          <p className="text-[14px] mt-2">
            DPI (dots per inch) is for printing. Choose 300 if unsure
          </p>
        </div>
      )}
      <div className="block">
        <input
          type="checkbox"
          checked={lockAspectRatio}
          onChange={handleChangeLockAspectRatio}
          id="lockRatio"
        />
        <label htmlFor="lockRatio" className="text-[14px]">
          {" "}
          Lock Aspect Ratio
        </label>
      </div>
      <ExportSettings
        handleChangeOutputFormat={handleChangeOutputFormat}
        outputFormat={outputFormat}
      />
      <div className="mt-6">
        <h3 className="font-bold text-[20px]">Output</h3>
        <div className="text-[14px] mt-2">
          Width: {outWidths["px"]}px <br />
          Height: {outHeights["px"]}px
        </div>
      </div>
      <div className="text-center mt-10">
        <button
          onClick={() => resizeImage(false)}
          className="rounded bg-meta-5 dark:bg-meta-5 px-8 py-2 font-semi text-[18px] text-white dark:text-bodydark2"
        >
          Resize <MdOutlineArrowCircleRight className="inline-block " />
        </button>
      </div>
    </>
  );
};
export default ResizeDimensions;
