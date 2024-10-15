"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useEffect, useState } from "react";
import SelectBox from "@/components/Input/SelectBox";
import TextBox from "@/components/Input/TextBox";
import Button from "@/components/Input/Button";
import { MdOutlineClear, MdOutlineSwapHoriz } from "react-icons/md";
import { LiaEqualsSolid } from "react-icons/lia";
import FractionComponent from "./fraction";
import Fraction from "fraction.js";

export default function DecimalToFractionComponent() {
  const numbers = ["Decimal", "Fraction"];

  const defaultFrom = "Decimal";
  const defaultTo = "Fraction";
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  const [decimal, setDecimal] = useState("");
  const [resultFracWhole, setResultFracWhole] = useState("");
  const [resultFracNum, setResultFracNum] = useState("");
  const [resultFracDen, setResultFracDen] = useState("");


  useEffect(() => {
    convert();
  }, [from, to, decimal]);

  const convert = () => {
    if (from === "Decimal") {
      if (decimal === "") {
        resetFrac();
        return;
      }
      const fraction = new Fraction(decimal);
      if (fraction.n > fraction.d) {
        setResultFracWhole(
          Math.floor((fraction.s * fraction.n) / fraction.d).toString()
        );
      } else {
        setResultFracWhole("");
      }

      if (fraction.n % fraction.d !== 0) {
        const n =
          (fraction.n % fraction.d) *
          (fraction.n > fraction.d ? 1 : fraction.s);
        setResultFracNum(n.toString());
        setResultFracDen(fraction.d.toString());
      } else {
        setResultFracNum("");
        setResultFracDen("");
      }
    }
  };

  const swap = () => {
    const t = from;
    setFrom(to);
    setTo(t);
    resetDecimal();
    resetFrac();
  };

  const resetDecimal = () => {
    setDecimal("");
  };
  const resetFrac = () => {
    setResultFracWhole("");
    setResultFracNum("");
    setResultFracDen("");
  };
  return (
    <>
      <Breadcrumb />
      <div className="m-auto">
        <div className="flex">
          <div className="flex w-1/2">From</div>
          <div className="flex w-[54px] !mx-[8px]">&nbsp;</div>
          <div className="w-1/2">To</div>
        </div>
        <div className="flex">
          <div className="w-1/2 ">
            <SelectBox
              items={numbers}
              value={from}
              handleOnChange={(e) => setFrom(e.target.value)}
              additionalClass="w-full"
            />
          </div>
          <div>
            <Button
              handleOnClick={swap}
              label=""
              type="outline"
              additionalClass="mx-2 !py-[4px]"
              icon={{
                icon: MdOutlineSwapHoriz,
                position: "left",
                size: 20,
              }}
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
        {from === "Decimal" ? <>
          <div className="">
            <div className="my-3">Enter {from.toLowerCase()}</div>
            <div className="flex">
              {from === "Decimal" ? (
                <TextBox
                  type="number"
                  value={decimal}
                  onChange={(e) => setDecimal(e.target.value)}
                  additionalClass="w-full"
                />
              ) : (
                <FractionComponent
                  whole={resultFracWhole}
                  numerator={resultFracNum}
                  denominator={resultFracDen}
                />
              )}
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
              handleOnClick={resetDecimal}
              label="Reset"
              type="reset"
              additionalClass="mr-2"
              icon={{
                icon: MdOutlineClear,
                position: "left",
                size: 20,
              }}
            />

          </div>
          <div>
            <div className="my-3">{to} result</div>
            <div className="flex">
              {to === "Decimal" && decimal ? (
                <TextBox
                  type="number"
                  value={decimal}
                  onChange={() => { }}
                  additionalClass="w-full"
                  defaultValue=""
                />
              ) : (
                <FractionComponent
                  whole={resultFracWhole}
                  numerator={resultFracNum}
                  denominator={resultFracDen}
                  handleIntegerChange={() => { }}
                  handleNumberatorChange={() => { }}
                  handleDenominatorChange={() => { }}
                  readonly
                />
              )}
            </div>
          </div>
        </> : <>Coming soon</>
        }
      </div>
    </>
  );
}
