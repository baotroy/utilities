"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import TextArea from "@/components/Input/TextArea";
import { FC, useState } from "react";
import toast from "react-hot-toast";
import { IFunctionFragement } from "./type";
import { copyToClipboard } from "@/common/utils";
import { decodeFunctionDataNoABI } from "./utils";
import FunctionComponent from "./FunctionComponent";
interface UniversalCallDataDecoderProps { }
const UniversalCallDataDecoderComponent: FC<
  UniversalCallDataDecoderProps
> = () => {
  const [inputData, setInputData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [func, setFunc] = useState<IFunctionFragement | null>();

  const doDecode = async (calldata: string) => {
    setIsLoading(true);
    try {
      const initFunc = await decodeFunctionDataNoABI(calldata, true);

      setFunc(initFunc);
    } catch (error) {
      toast.error("Unable to decode the input data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnPaste = (e: any) => {
    if (inputData !== e.clipboardData.getData("text/plain")) {
      setInputData(e.clipboardData.getData("text/plain"));
      doDecode(e.clipboardData.getData("text/plain"));
    }
  }
  return (
    <>
      <Breadcrumb pageName="" />
      <div className="w-full">
        <div className="">
          <label htmlFor="" className="text-sm">
            Calldata
          </label>
          <TextArea
            rows={5}
            additionalClass="w-full text-sm leading-4"
            onChange={(e) => setInputData(e.target.value)}
            onPaste={(e) => handleOnPaste(e)}
            value={inputData}
          />
        </div>

      </div>
      <div className="text-right mt-4 mb-4">
        <Button label="Copy" additionalClass="mr-2" type="success"
          handleOnClick={() => copyToClipboard(inputData)} />
        <Button label="Decode" handleOnClick={() => doDecode(inputData)} isLoading={isLoading} />
      </div>
      {func && <FunctionComponent fragment={func} />}
    </>
  );
};

export default UniversalCallDataDecoderComponent;
