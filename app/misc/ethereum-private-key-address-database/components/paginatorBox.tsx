import BigNumber from "bignumber.js";
import Paginator from "./paginator";
import { FC } from "react";
import TextBox from "@/components/Input/TextBox";
import Button from "@/components/Input/Button";
import { MdOutlineStar } from "react-icons/md";
interface PaginatorBoxProps {
  page: BigNumber;
  tempPage: string;
  handlePageChange: (newPage: BigNumber | number) => void;
  handleInputPage: (newPage: string) => void;
  handlePageKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  goToPage: () => void;
  randomPage: () => void;
}
const PaginatorBox: FC<PaginatorBoxProps> = ({
  page,
  handlePageChange,
  handleInputPage,
  tempPage,
  handlePageKeyDown,
  goToPage,
  randomPage,
}) => {
  return (
    <>
      <Paginator currentPage={page} handleOnClick={handlePageChange} />
      <TextBox
        value={tempPage}
        additionalClass="mx-2 flex h-8 text-sm"
        onChange={(e) => handleInputPage(e.target.value)}
        onKeyDown={handlePageKeyDown}
      />
      <Button
        label="Go to"
        handleOnClick={goToPage}
        additionalClass="mr-2 flex h-8 text-sm"
      />
      <Button
        label="I'm Feeling Lucky"
        handleOnClick={randomPage}
        type="warning"
        additionalClass="flex h-8 text-sm"
        icon={{
          icon: MdOutlineStar,
          position: "left",
          size: 20,
        }}
      />
    </>
  );
};

export default PaginatorBox;
