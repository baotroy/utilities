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
      toast.success("Successfully decoded the input data");
    } catch (error) {
      toast.error("Unable to decode the calldata");
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

  const handleInputChange = (e: any) => {
    if (e.nativeEvent.inputType !== "insertFromPaste") {
      setInputData(e.target.value);
    }
  }
  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Decode Ethereum calldata without an ABI. Automatically fetches function signatures and recursively decodes nested calls.
        </p>
        <div className="mb-4">
          <label className="font-semibold text-sm mb-2 block">
            Calldata
          </label>
          <TextArea
            rows={5}
            additionalClass="w-full text-sm leading-4"
            onChange={(e) => handleInputChange(e)}
            onPaste={(e) => handleOnPaste(e)}
            value={inputData}
          />
        </div>

        <div className="text-right mb-4">
          <Button label="Copy" additionalClass="mr-2" type="success"
            handleOnClick={() => copyToClipboard(inputData)} />
          <Button label="Decode" handleOnClick={() => doDecode(inputData)} isLoading={isLoading} />
        </div>
        {func && <FunctionComponent fragment={func} />}
      </div>
    </>
  );
};

export default UniversalCallDataDecoderComponent;
