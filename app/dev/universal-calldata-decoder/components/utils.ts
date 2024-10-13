import axios from "axios";
import { Interface } from "ethers";
import { Component } from "./type";
const signatureDataApi = "https://api.openchain.xyz/signature-database/v1/lookup?function="

export const dedeInputDataNoAbi = async (inputData: string) => {
  console.log("🚀 -----------------------------------------------------------------🚀")
  console.log("🚀 ~ file: utils.ts:7 ~ dedeInputDataNoAbi ~ inputData:", inputData)
  console.log("🚀 -----------------------------------------------------------------🚀")

  const funcName = inputData.substring(0, 10);
  return axios.get(signatureDataApi + funcName).then((response) => {
    try {
      const funcRes = response.data.result.function[funcName][0].name

      const functionName = funcRes.split("(")[0];
      // setFunctionName(functionName);


      const iface = new Interface([`function ${funcRes}`]);
      const parsedData = iface.parseTransaction({ data: inputData });
      console.log("🚀 ----------------------------------------------------------------------------------🚀")
      console.log("🚀 ~ file: universal-call-data-decoder.tsx:33 ~ axios.get ~ parsedData:", parsedData)
      console.log("🚀 ----------------------------------------------------------------------------------🚀")


      const decodeData = iface.decodeFunctionData(functionName, inputData);
      console.log("🚀 ----------------------------------------------------------------------------------🚀")
      console.log("🚀 ~ file: universal-call-data-decoder.tsx:39 ~ axios.get ~ decodeData:", decodeData)
      console.log("🚀 ----------------------------------------------------------------------------------🚀")

      // setInputValues(decodeData);

      const components = parsedData?.fragment?.inputs.map((input) => {
        return {
          name: input.name,
          type: input.type,
          baseType: input.baseType,
          components: input.components,
          arrayChildren: input.arrayChildren,
        } as Component
      })
      console.log("🚀 -----------------------------------------------------------------------------------🚀")
      console.log("🚀 ~ file: universal-call-data-decoder.tsx:50 ~ components ~ parsedData:", parsedData)
      console.log("🚀 -----------------------------------------------------------------------------------🚀")

      // setComponent();
      const component = {
        type: "function",
        baseType: "",
        components: components as Component[],
      } as Component


      return [functionName, component, decodeData];
      // toast.success("Data decoded successfully");
    } catch (e) {
      console.log(e)
      // reset();
      // toast.success("Data decoded successfully");
      return []
    }
  }).catch(() => {
    // toast.error("Unable to decode data");
    throw new Error("Unable to decode data");
  });
};