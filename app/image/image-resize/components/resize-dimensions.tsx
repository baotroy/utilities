import { FileFormat, Unit } from "../../type";
import ExportSettings from "./export-settings";

interface ResizeDimensionsProps {
  width?: number;
  height?: number;
  unit?: Unit;
  dpi: number;
  lockAspectRatio: boolean;
  handleChangeOutputWidth: (w: string) => void;
  handleChangeOutputHeight: (h: string) => void;
  handleChangeLockAspectRatio: () => void;
  handleChangeUnit: (u: Unit) => void;
  handleChangeOutputFormat: (f: FileFormat) => void;
  resizeImage: () => void;
  handleChangeDpi: (d: number) => void;
}
const ResizeDimensions: React.FC<ResizeDimensionsProps> = ({
  width,
  height,
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
}) => {
  return (
    <>
      <div className="mb-4">
        <div className="flex">
          <div className="w-1/2">
            <label className="block" htmlFor="width">
              Width
            </label>
            <input
              type="text"
              id="width"
              name="width"
              required
              className="w-[100%]"
              value={width}
              onChange={(e) => handleChangeOutputWidth(e.target.value || "")}
            />
          </div>
          <div className="w-1/2 ml-1">
            <label htmlFor="height">Height</label>
            <select
              id="unit"
              name="unit"
              className="w-[50px] float-right"
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
                value={height}
                required
                className="w-[100%]"
                onChange={(e) => handleChangeOutputHeight(e.target.value || "")}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="dpi">DPI</label>
        <select
          id="unit"
          name="unit"
          className="w-[50px] float-right"
          value={dpi}
          onChange={(e) => handleChangeDpi(e.target.value)}
        >
          <option value="10">10</option>
          <option value="72">72</option>
          <option value="96">96</option>
          <option value="150">150</option>
          <option value="200">200</option>
          <option value="240">240</option>
          <option value="300">300</option>
        </select>
      </div>
      <div className="mb-4">
        <input
          type="checkbox"
          checked={lockAspectRatio}
          onChange={handleChangeLockAspectRatio}
          id="lockRatio"
        />
        <label htmlFor="lockRatio"> Lock Aspect Ratio</label>
      </div>
      <ExportSettings handleChangeOutputFormat={handleChangeOutputFormat} />
      <div className="text-center">
        <button
          onClick={resizeImage}
          className="rounded bg-meta-5 dark:bg-meta-5 px-5 py-2 font-semi text-[18px] text-white dark:text-bodydark2"
        >
          Resize
        </button>
      </div>
    </>
  );
};
export default ResizeDimensions;
