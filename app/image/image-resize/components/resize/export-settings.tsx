import { FileFormat } from "../../../type";

interface ExportSettingsProps {
  handleChangeOutputFormat: (f: FileFormat) => void;
  outputFormat: FileFormat;
}
const ExportSettings: React.FC<ExportSettingsProps> = ({
  handleChangeOutputFormat,
  outputFormat,
}) => {
  return (
    <>
      <div className="mb-4 mt-10">
        <h3 className="font-bold text-[20px] mb-2">Export Settings</h3>
        <div>
          <div className="mb-2">
            <label htmlFor="format" className="text-[14px]">
              Save Image As
            </label>
          </div>
          <div>
            <select
              name="format"
              id="format"
              className="w-full p-2 rounded-lg border border-bodydark bg-white outline-bodydark dark:outline-boxdark text-[14px]"
              onChange={(e) =>
                handleChangeOutputFormat(e.target.value as FileFormat)
              }
              value={outputFormat}
            >
              <option value="image/jpeg">JPG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WEBP</option>
              <option value="original">Original</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
};
export default ExportSettings;
