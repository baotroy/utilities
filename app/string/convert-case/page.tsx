"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState } from "react";
import convertCase, { CaseType } from "../utils";
import toast from "react-hot-toast";
const ConvertCase = () => {
  const [text, setText] = useState("");
  const [characterCount, setCharacterCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);
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
          })
          .catch(() => {
            toast.error("Unable to copy");
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
      <Breadcrumb />
      <div>
        <textarea
          rows={20}
          placeholder=""
          onChange={(e) => {
            setCharacterCount(e.target.value.length);
            setWordCount(e.target.value.split(" ").length);
            setLineCount(e.target.value.split("\n").length);
            setText(e.target.value);
          }}
          value={text}
          className="
          dark:text-graydark2
          bg-white
          dark:bg-graydark
          w-full 
          rounded-lg
          border-[1.5px] 
          border-stroke  
          dark:border-strokedark
          py-3 px-5 font-medium outline-none "
        ></textarea>
      </div>
      <div>
        Character Count: {characterCount} | Word Count: {wordCount} | Line
        Count: {lineCount}
      </div>
      <div>
        {buttons.map((btn, index) => (
          <button
            type="button"
            key={index}
            className="m-1 rounded bg-bodydark1 dark:bg-boxdark p-1 font-medium text-graydark dark:text-bodydark2"
            onClick={btn.handleClick}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <p className="text-sm mt-20 italic">
        Functions depend on https://convertcase.net/
      </p>
    </>
  );
};

export default ConvertCase;
