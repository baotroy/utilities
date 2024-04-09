"use client";

import TextBox from "@/components/Input/TextBox";
import ColorCircle from "./color-circle";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { copyToClipboard, isNumber } from "@/common/utils";
import Button from "@/components/Input/Button";
import rgbHex from "rgb-hex";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { MdContentCopy } from "react-icons/md";

export default function RgbToHexComponent() {
  const [red, setRed] = useState("");
  const [green, setGreen] = useState("");
  const [blue, setBlue] = useState("");
  const [hex, setHex] = useState("");

  const onHandleChange = (
    value: string,
    setValue: Dispatch<SetStateAction<string>>
  ) => {
    if (value === "") {
      setValue("");
      return;
    }

    if (isNumber(value) && parseInt(value) <= 255) {
      setValue(value);
    }
  };

  const onHandleRedChange = (value: string) => {
    onHandleChange(value, setRed);
  };

  const onHandleGreenChange = (value: string) => {
    onHandleChange(value, setGreen);
  };

  const onHandleBlueChange = (value: string) => {
    onHandleChange(value, setBlue);
  };

  useEffect(() => {
    convertToHex();
  }, [red, green, blue]);

  const convertToHex = () => {
    if (!red && !green && !blue) {
      setHex("");
    } else {
      const hex = rgbHex(
        parseInt(red || "0"),
        parseInt(green || "0"),
        parseInt(blue || "0")
      );
      setHex(`#${hex.toUpperCase()}`);
    }
  };

  return (
    <>
      <Breadcrumb pageName="" />
      <div className="w-1/2 m-auto">
        <div className="flex">
          <div className="w-1/3">
            <ColorCircle color="R" label="Red" bgColor="#ff0000" />
          </div>
          <div className="w-1/3">
            <ColorCircle color="G" label="Green" bgColor="#00ff00" />
          </div>
          <div className="w-1/3">
            <ColorCircle color="B" label="Blue" bgColor="#0000ff" />
          </div>
        </div>
        <div className="flex">
          <div className="w-1/3 mr-2">
            <TextBox
              onChange={(e) => onHandleRedChange(e.target.value)}
              placeholder="0"
              maxLength={3}
              value={red}
              additionalClass="w-full"
            />
          </div>
          <div className="w-1/3 mr-2">
            <TextBox
              onChange={(e) => onHandleGreenChange(e.target.value)}
              placeholder="0"
              maxLength={3}
              value={green}
              additionalClass="w-full"
            />
          </div>
          <div className="w-1/3 mr-2">
            <TextBox
              onChange={(e) => onHandleBlueChange(e.target.value)}
              placeholder="0"
              maxLength={3}
              value={blue}
              additionalClass="w-full"
            />
          </div>
        </div>
        {hex && (
          <div className="mt-4">
            <div className="text-center">
              <ColorCircle color="R" bgColor="#ff0000" label={red} />
              <ColorCircle color="G" bgColor="#00ff00" label={green} />
              <ColorCircle color="B" bgColor="#0000ff" label={blue} />
            </div>
            <div className="mt-8 text-center">
              <strong>{hex}</strong>{" "}
              <Button
                label="Copy"
                handleOnClick={() => copyToClipboard(hex)}
                additionalClass="primary"
                icon={{
                  icon: MdContentCopy,
                  position: "left",
                  size: 20,
                }}
              />
            </div>
            <div className="mt-4">
              <div
                className={"w-25 h-25 m-auto rounded-full"}
                style={{ backgroundColor: hex }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
