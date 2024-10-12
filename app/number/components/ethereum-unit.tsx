import { MdContentCopy } from "react-icons/md";
import { ethUnitMap } from "web3-utils";
import convertCase, { CaseType } from "@/app/string/utils";
import { copyToClipboard } from "@/common/utils";
interface EtherUnitProps {
  unit: keyof typeof ethUnitMap;
  decimals: number;
  value: string;
  handleOnChange: (str: string, unit: keyof typeof ethUnitMap) => void;
}

const EtherUnit: React.FC<EtherUnitProps> = ({
  decimals,
  unit,
  value,
  handleOnChange,
}) => {
  const handleCopy = () => {
    copyToClipboard(value);
  };

  return (
    <div className="my-2">
      <div className="flex">
        <div className="flex">
          <span className="bg-gray-2 border border-bodydark block py-2 px-4 rounded-tl-lg rounded-bl-lg hover:cursor-pointer">
            <MdContentCopy size={20} onClick={handleCopy} />
          </span>
        </div>
        <div className="flex w-full">
          <input
            placeholder={convertCase(unit, CaseType.Title)}
            id={unit}
            type="text"
            className="w-full p-1.5 text-xl outline-none border-t border-b border-t-bodydark  border-b-bodydark border-bodydark"
            value={value}
            onChange={(e) => handleOnChange(e.target.value, unit)}
          />
          <label
            htmlFor={unit}
            className="p-2 bg-gray-2  border border-bodydark rounded-tr-lg rounded-br-lg min-w-[120px] text-sm"
          >
            {convertCase(unit, CaseType.Title)} (10<sup>{decimals}</sup>)
          </label>
        </div>
      </div>
    </div>
  );
};
export default EtherUnit;
