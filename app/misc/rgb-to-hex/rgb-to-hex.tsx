"use client";

import TextBoxComponent from "@/components/Input/TextBox";
import ColorLabel from "./color-label";
import { Dispatch, SetStateAction, useState } from "react";
import { isNumber } from "@/common/utils";
import { set } from "lodash";

export default function RgbToHexComponent() {
  const [red, setRed] = useState("");
  const [green, setGreen] = useState("");
  const [blue, setBlue] = useState("");

  const [errorRed, setErrorRed] = useState(false);
  const [errorGreen, setErrorGreen] = useState(false);
  const [errorBlue, setErrorBlue] = useState(false);

  const onHandleChange = (
    value: string,
    setValue: Dispatch<SetStateAction<string>>,
    setError: Dispatch<SetStateAction<boolean>>
  ) => {
    if (isNumber(value)) {
      setError(false);
      setValue(value);
    } else {
      setError(true);
    }
  };

  const onHandleRedChange = (value: string) => {
    onHandleChange(value, setRed, setErrorRed);
  };

  const onHandleGreenChange = (value: string) => {
    onHandleChange(value, setGreen, setErrorGreen);
  };

  const onHandleBlueChange = (value: string) => {
    onHandleChange(value, setBlue, setErrorBlue);
  };

  return (
    <>
      <div className="w-1/2">
        <div className="flex">
          <div className="w-1/3">
            <ColorLabel color="Red" bgColor="bg-true-red" />
          </div>
          <div className="w-1/3">
            <ColorLabel color="Green" bgColor="bg-true-green" />
          </div>
          <div className="w-1/3">
            <ColorLabel color="Blue" bgColor="bg-true-blue" />
          </div>
        </div>
        <div className="flex">
          <div className="w-1/3">
            <TextBoxComponent
              handleOnChange={(e) => onHandleRedChange(e.target.value)}
              placeholder="255"
              maxLength={3}
              isError={errorRed}
            />
          </div>
          <div className="w-1/3">
            <TextBoxComponent
              handleOnChange={(e) => onHandleGreenChange(e.target.value)}
              placeholder="255"
              maxLength={3}
              isError={errorGreen}
            />
          </div>
          <div className="w-1/3">
            <TextBoxComponent
              handleOnChange={(e) => onHandleBlueChange(e.target.value)}
              placeholder="255"
              maxLength={3}
              isError={errorBlue}
            />
          </div>
        </div>
      </div>
    </>
  );
}
