import { FileFormat } from "../../type";

interface ExportSettingsProps {
  handleChangeOutputFormat: (f: FileFormat) => void;
}
const ExportSettings: React.FC<ExportSettingsProps> = ({
  handleChangeOutputFormat,
}) => {
  return (
    <>
      <div className="mb-4">
        <h3>Export Settings</h3>
        <div>
          <div className="mb-2">
            <label htmlFor="format">Save Image As</label>
          </div>
          <div>
            <select
              name="format"
              id="format"
              className="w-full"
              onChange={(e) =>
                handleChangeOutputFormat(e.target.value as FileFormat)
              }
            >
              <option value="image/jpg">JPG</option>
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
