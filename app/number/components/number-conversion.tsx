"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useEffect, useState } from "react";
import BN from "bignumber.js";
import SelectBox from "@/components/Input/SelectBox";
import TextBox from "@/components/Input/TextBox";
import Button from "@/components/Input/Button";
import { MdOutlineClear, MdOutlineSwapVert } from "react-icons/md";
import { LiaEqualsSolid } from "react-icons/lia";
import Copy from "@/components/common/copy";
import { copyToClipboard } from "@/common/utils";

export default function NumberConversionComponent() {
  const numbers = ["Binary", "Octal", "Decimal", "Hexadecimal"];
  const name2base: Record<string, number> = {
    Binary: 2,
    Octal: 8,
    Decimal: 10,
    Hexadecimal: 16,
  };
  const defaultFrom = "Decimal";
  const defaultTo = "Binary";
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [result, setResult] = useState("");
  const [error, setError] = useState(false);

  const [value, setValue] = useState("");

  useEffect(() => {
    if (result) {
      convert();
    }
  }, [from, to]);

  const convert = () => {
    setError(false);
    const bn = BN(value, name2base[from]);
    if (bn.isNaN()) {
      setError(true);
      setResult("");
      return;
    }
    setResult(bn.toString(name2base[to]));
  };

  const reset = () => {
    setValue("");
    setResult("");
  };

  const swap = () => {
    const t = from;
    setFrom(to);
    setTo(t);
    reset();
  };

  const handleCopy = () => {
    copyToClipboard(result);
  };
  return (
    <>
      <Breadcrumb />
      <div className="w-full m-auto">
        <div className="flex ">
          <div className="w-1/2 mr-4">From</div>
          <div className="w-1/2">To</div>
        </div>
        <div className="flex">
          <div className="w-1/2 mr-4">
            <SelectBox
              items={numbers}
              value={from}
              handleOnChange={(e) => setFrom(e.target.value)}
              additionalClass="w-full"
            />
          </div>
          <div className="w-1/2">
            <SelectBox
              items={numbers}
              value={to}
              handleOnChange={(e) => setTo(e.target.value)}
              additionalClass="w-full"
            />
          </div>
        </div>
        <div className="">
          <div className="my-3">Enter {from.toLowerCase()} number</div>
          <div className="flex">
            <TextBox
              value={value}
              onChange={(e) => setValue(e.target.value)}
              isError={error}
              additionalClass="w-full no-border-right"
            />
            <span className="suffix-label">
              {name2base[from as (typeof numbers)[number]]}
            </span>
          </div>
        </div>
        <div className="flex mt-4">
          <Button
            handleOnClick={convert}
            label="Convert"
            additionalClass="mr-2"
            icon={{
              icon: LiaEqualsSolid,
              position: "left",
              size: 20,
            }}
          />
          <Button
            handleOnClick={reset}
            label="Reset"
            type="reset"
            additionalClass="mr-2"
            icon={{
              icon: MdOutlineClear,
              position: "left",
              size: 20,
            }}
          />
          <Button
            handleOnClick={swap}
            label="Swap"
            type="outline"
            icon={{
              icon: MdOutlineSwapVert,
              position: "left",
              size: 20,
            }}
          />
        </div>
        <div>
          <div className="my-3">
            {to} number{" "}
            {result ? <span>({result.toString().length} digits)</span> : null}
          </div>
          <div className="flex">
            <span className="prefix-label">{name2base[to]}</span>
            <textarea
              rows={4}
              disabled
              value={result}
              className="custom-input w-full no-border-x"
            ></textarea>
            <Copy handleCopy={handleCopy} />
          </div>
        </div>
      </div>
    </>
  );
}
