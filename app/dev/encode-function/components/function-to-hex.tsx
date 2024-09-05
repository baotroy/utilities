"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import TextArea from "@/components/Input/TextArea";
import { Web3 } from "web3";
import { FC, useState } from "react";
import toast from "react-hot-toast";

interface FunctionToHexComponentProps { }

const FunctionToHexComponent: FC<
  FunctionToHexComponentProps
> = () => {
  const [abi, setAbi] = useState("");
  const [functions, setFunctions] = useState([]);
  const [views, setViews] = useState<string[]>([]);

  const doEncode = () => {
    try {
      const jsonAbi = JSON.parse(abi);
      const functions = jsonAbi.filter((item: any) => item.type === "function" && item.stateMutability === "nonpayable");
      setFunctions(functions);
      const web3 = new Web3()
      const hexs = functions.map((item: any) => web3.eth.abi.encodeFunctionSignature(item));
      setViews(hexs);
    } catch (e) {
      toast.error("Invalid ABI");
    }
  };
  return (
    <>
      <Breadcrumb pageName="" />
      <div className=" w-full">
        <div className="w-full">
          <label htmlFor="" className="text-sm">
            ABI
          </label>
          <TextArea
            rows={10}
            additionalClass="w-full text-sm leading-4"
            onChange={(e) => setAbi(e.target.value)}
            value={abi}
          />
        </div>
        {/* <div className="w-1/3  mr-3">
          <label htmlFor="" className="text-sm">
            Input Data
          </label>
          <TextArea
            rows={35}
            additionalClass="w-full text-sm leading-4"
            onChange={(e) => setInputData(e.target.value)}
            value={inputData}
          />
        </div> */}
        <div className="w-full mt-2">
          <label htmlFor="" className="text-sm">
            Output
          </label>
          {/* <TextArea
            rows={35}
            additionalClass="w-full text-sm leading-4"
            value={output}
            readonly={true}
          /> */}
          <div>
            <table className="table-code">
              {
                functions.map((item: any, index) => {
                  const inputs = item.inputs.map((input: any) => input.type).join(",");
                  const f = `${item.name}(${inputs})`;
                  return (
                    <tr className="code" key={index}>
                      <td>{f}</td>
                      <td>{views[index]}</td>
                    </tr>
                  )
                })
              }
            </table>
          </div>
        </div>
      </div>
      <div className="text-right mt-2">
        <Button label="Encode" handleOnClick={doEncode} />
      </div>
    </>
  );
};

export default FunctionToHexComponent;
