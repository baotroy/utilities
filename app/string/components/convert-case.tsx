"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState } from "react";
import convertCase, { CaseType } from "../utils";
import { copyToClipboard } from "@/common/utils";
import { set } from "lodash";
import { cls } from "react-image-crop";
import clsx from "clsx";

export default function ConvertCaseComponent() {
  const [text, setText] = useState("");
  const [sltBtn, setSltBtn] = useState("");
  const [characterCount, setCharacterCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);
  const [sentenceCount, setSentenceCount] = useState(0);
  const buttons = [
    {
      label: "lower case",
      handleClick: () => {
        setText(convertCase(text, CaseType.Lowercase));
        setSltBtn("lower case");
      },
    },
    {
      label: "UPPER CASE",
      handleClick: () => {
        setText(convertCase(text, CaseType.Uppercase));
        setSltBtn("UPPER CASE");
      },
    },
    {
      label: "Capitalized Case",
      handleClick: () => {
        setText(convertCase(text, CaseType.Capitalized));
        setSltBtn("Capitalized Case");
      },
    },
    {
      label: "Sentence case",
      handleClick: () => {
        setText(convertCase(text, CaseType.Sentence));
        setSltBtn("Sentence case");
      },
    },
    {
      label: "aLtErNaTiNg cAsE",
      handleClick: () => {
        setText(convertCase(text, CaseType.Alternating));
        setSltBtn("aLtErNaTiNg cAsE");
      },
    },
    {
      label: "Title Case",
      handleClick: () => {
        setText(convertCase(text, CaseType.Title));
        setSltBtn("Title Case");
      },
    },
    {
      label: "InVeRsE cAsE",
      handleClick: () => {
        setText(convertCase(text, CaseType.Inverse));
        setSltBtn("InVeRsE cAsE");
      },
    },
    {
      label: "Rotate Text",
      handleClick: () => {
        setText(convertCase(text, CaseType.Rotate));
        setSltBtn("Rotate Text");
      },
    },
    {
      label: "Download Text",
      handleClick: () => {
        const element = document.createElement("a");
        const file = new Blob([text], { type: "text/plain" });
        element.href = URL.createObjectURL(file);
        element.download = "text.txt";
        document.body.appendChild(element);
        element.click();
      },
    },
    {
      label: "Copy to Clipboard",
      handleClick: () => {
        copyToClipboard(text);
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
            setWordCount(e.target.value.replaceAll("\n", " ").split(" ").length);
            setLineCount(e.target.value.split("\n").length);
            setSentenceCount(e.target.value.split(".").length);
            setText(e.target.value);
            setSltBtn("");
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
          py-3 px-5 outline-none
          font-normal
          "
        ></textarea>
      </div>
      <div>
        Character Count: {characterCount} | Word Count: {wordCount} | Sentence Count: {sentenceCount} |  Line Count: {lineCount}
      </div>
      <div>
        {buttons.map((btn, index) => (
          <button
            type="button"
            key={index}
            className={
              clsx("m-1 rounded bg-bodydark1 dark:bg-boxdark p-1 font-medium text-graydark hover:bg-bodydark2",
                btn.label === sltBtn ? "bg-bodydark2" : ""
              )
            }
            onClick={btn.handleClick}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </>
  );
}
