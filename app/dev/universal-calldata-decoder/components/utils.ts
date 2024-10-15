import axios from "axios";
import { Interface } from "ethers";
import { IFunctionFragement } from "./type";

const signatureDataApi = process.env.NEXT_PUBLIC_SIGNATURE_DATA_API
export const decodeFunctionDataNoABI = async (inputData: string, root: boolean = false) => {
  const funcName = getFunctionName(inputData);
  try {
    const response = await axios.get(signatureDataApi + funcName)

    const funcRes = response.data.result.function[funcName] ? response.data.result.function[funcName][0].name : null

    if (!funcRes) return null

    const functionName = funcRes.split("(")[0];

    const iface = new Interface([`function ${funcRes}`]);
    // const params = iface.parseTransaction({ data: inputData });
    // console.log("🚀  params:", params)

    const decodeData = iface.decodeFunctionData(functionName, inputData);
    // console.log("🚀 decodeData:", decodeData)

    const funcFrag = iface.getFunction(funcRes);
    // console.log("🚀 funcFrag:", funcFrag)

    if (funcFrag) {
      const newFuncFrag: IFunctionFragement = {
        type: "function",
        name: funcFrag.name,
        inputs: [],
        // inputs: funcFrag.inputs.map((input, index: number) => {
        //   return {
        //     type: input.type,
        //     baseType: input.baseType,
        //     name: input.name,
        //     arrayChildren: input.arrayChildren,
        //     value: decodeData[index]
        //   } as IParamInput
        // })
      }

      // Append inputs to newFuncFrag
      for (let i = 0; i < funcFrag.inputs.length; i++) {
        const paramType = funcFrag.inputs[i];
        const newInput = await getParamType(paramType, decodeData[i])
        // if (input.baseType === "tuple" && input.components) {
        //   // console.log("array children", input.arrayChildren)
        //   newInput.arrayChildren = input.components.map((child, index) => {
        //     return {
        //       type: child.type,
        //       baseType: child.baseType,
        //       name: child.name,
        //       value: decodeData[i][index]
        //     } as IParamInput
        //   })
        // }




        newFuncFrag.inputs.push(newInput)
      }

      return newFuncFrag
    }

    return null
  } catch (e) {
    console.error(e)
    if (!root) {
      return null
    }
    throw Error("Unable to decode function data")
  }
}

// component của tuple
// arrayChildren của array
async function getParamType(paramType: any, value: any) {

  const newParamType: any = {
    name: "",
    type: paramType.type,
    baseType: paramType.baseType,
    value: paramType.arrayChildren ? value.flat().join(",") : value,
  }

  // case array type[], eg: uint256[], string[], address[], tuple[]
  if (paramType.baseType === "array" && paramType.arrayChildren) {
    const child = paramType.arrayChildren
    newParamType.arrayChildren = await Promise.all(
      value.map((childValue: any) => {
        return getParamType(child, childValue)
      })
    )
  }
  else {
    if (paramType.baseType === "tuple" && paramType.components) {
      newParamType.components = await Promise.all(
        paramType.components.map((child: any, index: number) => {
          return getParamType(child, value[index])
        })
      )
    } else if (paramType.type === "bytes") {
      newParamType.functionFragment = await decodeFunctionDataNoABI(value)
    }
    newParamType.value = value
  }
  return newParamType
}

function getFunctionName(inputData: string) {
  return inputData.substring(0, 10);
}