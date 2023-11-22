"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState } from "react";
import convertCase, { CaseType } from "../utils";
import toast from "react-hot-toast";
const ConvertCase = () => {
  const [text, setText] = useState("");
  const buttons = [
    {
      label: "lower case",
      handleClick: () => {
        setText(convertCase(text, CaseType.Lowercase));
      },
    },
    {
      label: "UPPER CASE",
      handleClick: () => {
        setText(convertCase(text, CaseType.Uppercase));
      },
    },
    {
      label: "Capitalized Case",
      handleClick: () => {
        setText(convertCase(text, CaseType.Capitalized));
      },
    },
    {
      label: "Sentence case",
      handleClick: () => {
        setText(convertCase(text, CaseType.Sentence));
      },
    },
    {
      label: "aLtErNaTiNg cAsE",
      handleClick: () => {
        setText(convertCase(text, CaseType.Alternating));
      },
    },
    {
      label: "Title Case",
      handleClick: () => {
        setText(convertCase(text, CaseType.Title));
      },
    },
    {
      label: "InVeRsE cAsE",
      handleClick: () => {
        setText(convertCase(text, CaseType.Inverse));
      },
    },
    {
      label: "Rotate Text",
      handleClick: () => {
        setText(convertCase(text, CaseType.Rotate));
      },
    },
    {
      label: "Download Text",
      handleClick: () => {},
    },
    {
      label: "Copy to Clipboard",
      handleClick: () => {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            toast.success("Text copied to clipboard");
            // You can also provide a success message or perform other actions here
          })
          .catch((err) => {
            console.error("Unable to copy:", err);
            // Handle any errors that might occur during the copy process
          });
      },
    },
    {
      label: "Clear",
      handleClick: () => {
        setText("");
      },
    },
  ];
  return (
    <>
      <Breadcrumb pageName="Convert Case" />
      <div>
        <textarea
          rows={20}
          placeholder=""
          onChange={(e) => setText(e.target.value)}
          value={text}
          className="
          bg-white
          w-full 
          rounded-lg
          border-[1.5px] 
          border-stroke  
          py-3 px-5 font-medium outline-none "
        ></textarea>
      </div>
      <div>
        {buttons.map((btn, index) => (
          <button
            type="button"
            key={index}
            className="m-1 rounded bg-bodydark p-1 font-medium text-gray"
            onClick={btn.handleClick}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </>
  );
};

export default ConvertCase;
