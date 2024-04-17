"use client";
import Button from "@/components/Input/Button";
import TextArea from "@/components/Input/TextArea";
import InputDataDecoder from "ethereum-input-data-decoder";
import { FC, useState } from "react";
interface EthereumInputDataDecoderProps {}
const EthereumInputDataDecoderComponent: FC<
  EthereumInputDataDecoderProps
> = () => {
  const [abi, setAbi] = useState("");
  const [inputData, setInputData] = useState("");
  const [output, setOutput] = useState("");

  const doDecode = () => {
    //
    if (inputData.trim() === "") {
      return;
    }
    try {
      const jsonAbi = JSON.parse(abi);
      const parsed = new InputDataDecoder(jsonAbi).decodeData(inputData);

      setOutput(JSON.stringify(parsed, null, 2));
    } catch (e) {
      // console.error(e);
      setOutput("");
    }
  };
  return (
    <>
      <div className="flex w-full">
        <div className="w-1/3 mr-3">
          <label htmlFor="" className="text-sm">
            ABI
          </label>
          <TextArea
            rows={35}
            additionalClass="w-full text-sm leading-4"
            onChange={(e) => setAbi(e.target.value)}
            value={abi}
          />
        </div>
        <div className="w-1/3  mr-3">
          <label htmlFor="" className="text-sm">
            Input Data
          </label>
          <TextArea
            rows={35}
            additionalClass="w-full text-sm leading-4"
            onChange={(e) => setInputData(e.target.value)}
            value={inputData}
          />
        </div>
        <div className="w-1/3">
          <label htmlFor="" className="text-sm">
            Output
          </label>
          <TextArea
            rows={35}
            additionalClass="w-full text-sm leading-4"
            value={output}
          />
        </div>
      </div>
      <div className="text-right mt-2">
        <Button label="Decode" handleOnClick={doDecode} />
      </div>
    </>
  );
};

export default EthereumInputDataDecoderComponent;
