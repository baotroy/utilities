"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useMemo, useState } from "react";
import convertCase, { CaseType } from "../utils";
import { copyToClipboard, download } from "@/common/utils";

export default function ConvertCaseComponent() {
  const [text, setText] = useState("");
  // Derive counts from the current text so they stay correct after a
  // conversion or Clear (not only while typing)
  const { characterCount, wordCount, lineCount, sentenceCount } = useMemo(() => {
    if (!text) {
      return { characterCount: 0, wordCount: 0, lineCount: 0, sentenceCount: 0 };
    }
    return {
      characterCount: text.length,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      lineCount: text.split("\n").length,
      sentenceCount: text.split(/[.!?]+/).filter((s) => s.trim() !== "").length,
    };
  }, [text]);
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
      label: "slug-case",
      handleClick: () => {
        setText(convertCase(text, CaseType.Slug));
      },
    },
    {
      label: "kebab-case",
      handleClick: () => {
        setText(convertCase(text, CaseType.Kebab));
      },
    },
    {
      label: "snake_case",
      handleClick: () => {
        setText(convertCase(text, CaseType.Snake));
      },
    },
    {
      label: "camelCase",
      handleClick: () => {
        setText(convertCase(text, CaseType.Camel));
      },
    },
    {
      label: "PascalCase",
      handleClick: () => {
        setText(convertCase(text, CaseType.Pascal));
      },
    },
    {
      label: "Download Text",
      handleClick: () => {
        download(text, "text.txt");
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
      <div className="max-w-6xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Convert text between different case formats including lowercase, UPPERCASE, Title Case, Sentence case, and more.
        </p>
        <textarea
          rows={15}
          placeholder="Paste or type your text here..."
          onChange={(e) => setText(e.target.value)}
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
        <div className="my-3 text-sm text-bodydark dark:text-bodydark2">
          Character Count: {characterCount} | Word Count: {wordCount} | Sentence Count: {sentenceCount} | Line Count: {lineCount}
        </div>
        <div className="flex flex-wrap gap-2">
          {buttons.map((btn, index) => (
            <button
              type="button"
              key={index}
              className="rounded bg-bodydark1 dark:bg-boxdark px-3 py-1.5 font-medium text-sm text-graydark hover:bg-bodydark2"
              onClick={btn.handleClick}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
