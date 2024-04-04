import { MdContentCopy } from "react-icons/md";

interface CopyProps {
  handleCopy: () => void;
}

const Copy: React.FC<CopyProps> = ({ handleCopy }) => {
  return (
    <button className="suffix-label cursor-pointer" onClick={handleCopy}>
      <MdContentCopy size={20} />
    </button>
  );
};

export default Copy;
