"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import TextArea from "@/components/Input/TextArea";
import axios from "axios";
// import InputDataDecoder from "ethereum-input-data-decoder";
import { Interface, N } from "ethers";
import { FC, useState } from "react";
import toast from "react-hot-toast";
import { Component } from "./type";
import Item from "./Item";
import { result } from "lodash";
import { copyToClipboard } from "@/common/utils";
interface UniversalCallDataDecoderProps { }
const UniversalCallDataDecoderComponent: FC<
  UniversalCallDataDecoderProps
> = () => {
  const [inputData, setInputData] = useState("0x04e45aaf000000000000000000000000e4864c1a5c3d941ff973a489fe2167b1c51e8bf1000000000000000000000000acb5413c06c303f968df20e83851cb0465c946fc0000000000000000000000000000000000000000000000000000000000000bb80000000000000000000000000a936a3a1746f3a3fed69a3ea9f3604adc7d3e1f000000000000000000000000000000000000000000000000fa5af46b840c000000000000000000000000000000000000000000000000008d6d30ced0b0f840010000000000000000000000000000000000000000000000000000000000000000");
  const signatureDataApi = "https://api.openchain.xyz/signature-database/v1/lookup?function="
  const [component, setComponent] = useState<Component>();
  const [functionName, setFunctionName] = useState<string>("");
  const [inputValues, setInputValues] = useState<any>();
  const doDecode = () => {
    const funcName = inputData.substring(0, 10);
    axios.get(signatureDataApi + funcName).then((response) => {
      try {
        const funcRes = response.data.result.function[funcName][0].name

        const functionName = funcRes.split("(")[0];

        const iface = new Interface([`function ${funcRes}`]);
        const parsedData = iface.parseTransaction({ data: inputData });
        console.log("🚀 ----------------------------------------------------------------------------------🚀")
        console.log("🚀 ~ file: universal-call-data-decoder.tsx:33 ~ axios.get ~ parsedData:", parsedData)
        console.log("🚀 ----------------------------------------------------------------------------------🚀")


        const decodeData = iface.decodeFunctionData(functionName, inputData);
        console.log("🚀 ----------------------------------------------------------------------------------🚀")
        console.log("🚀 ~ file: universal-call-data-decoder.tsx:39 ~ axios.get ~ decodeData:", decodeData)
        console.log("🚀 ----------------------------------------------------------------------------------🚀")

        setInputValues(decodeData);
        setFunctionName(functionName);

        const components = parsedData?.fragment?.inputs.map((input) => {
          return {
            name: input.name,
            type: input.type,
            baseType: input.baseType,
            components: input.components,
          } as Component
        })
        console.log("🚀 -----------------------------------------------------------------------------------🚀")
        console.log("🚀 ~ file: universal-call-data-decoder.tsx:50 ~ components ~ parsedData:", parsedData)
        console.log("🚀 -----------------------------------------------------------------------------------🚀")

        setComponent({
          type: "function",
          baseType: "",
          components: components as Component[],
        });
        toast.success("Data decoded successfully");
      } catch (e) {
        console.log(e)
        reset();
        toast.success("Data decoded successfully");
      }
    }).catch(() => {
      toast.error("Unable to decode data");
    });
    const reset = () => {
      setComponent(undefined);
      setFunctionName("");
    }

  };
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
      <div>
        {
          functionName && (
            <div>
              <span className="text-bodydark">
              function
              </span>
              <p className="font-semibold"> {functionName}</p>
            </div>
          )
        }
        {
          component !== undefined && <Item
            component={component}
            values={inputValues as any}
          />
        }
      </div>
    </>
  );
};

export default UniversalCallDataDecoderComponent;
