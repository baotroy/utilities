"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import TextArea from "@/components/Input/TextArea";
import axios from "axios";
import { Interface } from "ethers";
import { FC, useState } from "react";
import toast from "react-hot-toast";
import { Component } from "./type";
import Item from "./Item";
import { copyToClipboard } from "@/common/utils";
import { dedeInputDataNoAbi } from "./utils";
import ResultComponent from "./ResultComponent";
interface UniversalCallDataDecoderProps { }
const UniversalCallDataDecoderComponent: FC<
  UniversalCallDataDecoderProps
> = () => {
  const [inputData, setInputData] = useState("0x82ad56cb0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000120000000000000000000000000dc6ff44d5d932cbd77b52e5612ba0529dc6226f1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000044095ea7b300000000000000000000000021c4928109acb0659a88ae5329b5374a3024694c000000000000000000000000000000000000000000000000487d8e184ab141e00000000000000000000000000000000000000000000000000000000000000000000000000000000021c4928109acb0659a88ae5329b5374a3024694c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000024b6b55f25000000000000000000000000000000000000000000000000487d8e184ab141e000000000000000000000000000000000000000000000000000000000");
  
  const [component, setComponent] = useState<Component>();
  const [functionName, setFunctionName] = useState<string>("");
  const [inputValues, setInputValues] = useState<any>();
  const doDecode = async () => {
    try {
      const [functionName, component, decodeData] = await dedeInputDataNoAbi(inputData);
      setComponent(component);
      setFunctionName(functionName);
      setInputValues(decodeData);
    } catch (e) {
      toast.error("Unable to decode data");
      reset()
    }
  };

  const reset = () => {
    setComponent(undefined);
    setFunctionName("");
  }

  return (
    <>
      <Breadcrumb pageName="" />
      <div className="w-full">
        <div className="">
          <label htmlFor="" className="text-sm">
            Input Data
          </label>
          <TextArea
            rows={5}
            additionalClass="w-full text-sm leading-4"
            onChange={(e) => setInputData(e.target.value)}
            value={inputData}
          />
        </div>

      </div>
      <div className="text-right mt-2">
        <Button label="Copy" additionalClass="mr-2" type="success"
          handleOnClick={() => copyToClipboard(inputData)} />
        <Button label="Decode" handleOnClick={doDecode} />
      </div>
      <ResultComponent functionName={functionName} component={component} value={inputValues} deep={0} />
    </>
  );
};

export default UniversalCallDataDecoderComponent;
