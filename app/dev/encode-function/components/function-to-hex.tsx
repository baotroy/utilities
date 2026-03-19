"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import TextArea from "@/components/Input/TextArea";
import { Web3 } from "web3";
import { FC, useState } from "react";
import toast from "react-hot-toast";
import {
  getFunctionSignature,
  keccak256,
} from "viem";

interface FunctionToHexComponentProps { }

const FunctionToHexComponent: FC<
  FunctionToHexComponentProps
> = () => {
  const [abi, setAbi] = useState("");
  const [functions, setFunctions] = useState([]);
  const [views, setViews] = useState<string[]>([]);

  const [events, setEvents] = useState([]);
  const [hexEvents, setHexEvents] = useState<string[]>([]);

  const [errors, setErrors] = useState([]);
  const [hexErrors, setHexErrors] = useState<string[]>([]);

  const doEncode = () => {
    try {
      const jsonAbi = JSON.parse(abi);
      const functions = jsonAbi.filter((item: any) => item.type === "function");
      setFunctions(functions);
      const web3 = new Web3();
      const hexs = functions.map((item: any) => web3.eth.abi.encodeFunctionSignature(item));
      setViews(hexs);

      const events = jsonAbi.filter((item: any) => item.type === "event");
      setEvents(events);
      const hexEvents = events.map((item: any) => web3.eth.abi.encodeEventSignature(item));
      setHexEvents(hexEvents);

      const errs = jsonAbi.filter((item: any) => item.type === "error");
      setErrors(errs);
      const hexErrs = errs.map((err: any) => {
        const signature = getFunctionSignature(err);
        const hash = keccak256(signature.split("error ")[1] as `0x${string}`);
        return hash
      });
      setHexErrors(hexErrs);
    } catch (e) {
      toast.error("Invalid ABI");
      setFunctions([]);
      setViews([]);
      setEvents([]);
      setHexEvents([]);
    }
  };
  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Encode Solidity function signatures to their 4-byte hex selectors. Paste your ABI to extract function, event, and error selectors.
        </p>
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
        <div className="text-right mt-2">
          <Button label="Encode" handleOnClick={doEncode} />
        </div>
        {functions.length > 0 && (
          <div className="w-full mt-2">
            <div>Functions</div>
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
            <div className="mt-2">Events</div>
            <div>
              <table className="table-code">
                {
                  events.map((item: any, index) => {
                    const inputs = item.inputs.map((input: any) => input.type).join(",");
                    const f = `${item.name}(${inputs})`;
                    return (
                      <tr className="code" key={index}>
                        <td>{f}</td>
                        <td>{hexEvents[index]}</td>
                      </tr>
                    )
                  })
                }
              </table>
            </div>
            <div className="mt-2">Errors</div>
            <div>
              <table className="table-code">
                {
                  errors.map((item: any, index) => {
                    const inputs = item.inputs.map((input: any) => input.type).join(",");
                    const f = `${item.name}(${inputs})`;
                    return (
                      <tr className="code" key={index}>
                        <td>{f}</td>
                        <td>{hexErrors[index]}</td>
                      </tr>
                    )
                  })
                }
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FunctionToHexComponent;
