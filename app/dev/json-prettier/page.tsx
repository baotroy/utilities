"use client";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/theme-eclipse";
import "ace-builds/src-noconflict/mode-json";

import { useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { prettyJson } from "../utils";
import { copyToClipboard, download } from "@/common/utils";
const JsonPrettier = () => {
  // @ts-ignore
  const modes = [
    "javascript",
    "java",
    "python",
    "xml",
    "ruby",
    "sass",
    "markdown",
    "mysql",
    "json",
    "html",
    "handlebars",
    "golang",
    "csharp",
    "elixir",
    "typescript",
    "css",
  ];
  const [inputValue, setInputValue] = useState("");
  const [parseValue, setParseValue] = useState("");
  const [tabSize, setTabSize] = useState(2);
  const [mode, setMode] = useState("json");

  const handleTabSizeChange = (tab: number) => {
    setTabSize(tab);
  };

  const handleOnChangeInput = (value: string) => {
    setInputValue(value);
  };

  const handleModeChange = (value: string) => {
    setMode(value);
  };

  // Download file with content is parseValue
  const handleDownload = () => {
    download(parseValue, "download.json", "application/json");
  };

  const handleConvert = async () => {
    setParseValue(prettyJson(inputValue, tabSize));
  };
  const handleCopy = () => {
    copyToClipboard(parseValue);
  };
  return (
    <>
      <Breadcrumb />
      <div className="flex w-full">
        <div className="w-1/2">
          <AceEditor
            width="100%"
            mode="json"
            theme="github"
            name="blah0"
            onChange={(value) => handleOnChangeInput(value)}
            fontSize={14}
            showPrintMargin={true}
            highlightActiveLine={true}
            value={inputValue}
            wrapEnabled={true}
            setOptions={{
              enableBasicAutocompletion: false,
              enableLiveAutocompletion: false,
              enableSnippets: false,
              showLineNumbers: true,
              tabSize,
              spellcheck: true,
            }}
          />
        </div>
        <div className="w-[150px] justify-center text-center">
          <button
            type="button"
            onClick={handleConvert}
            className="w-[120px] m-1 mb-3 rounded bg-bodydark1 dark:bg-boxdark px-2 py-[5px] font-medium text-[14px] text-graydark dark:text-bodydark2"
          >
            Beautify
          </button>
          {/* <select
            className="w-[120px] m-1 rounded p-2 border border-bodydark outline-bodydark dark:outline-boxdark text-[14px]"
            value={mode}
            onChange={(e) => handleModeChange(e.target.value as string)}
          >
            {modes.map((mode, index) => (
              <option key={index} value={mode}>
                {mode}
              </option>
            ))}
          </select> */}
          <select
            className="w-[120px] m-1 rounded p-2 border border-bodydark outline-bodydark dark:outline-boxdark text-[14px]"
            value={tabSize}
            onChange={(e) => handleTabSizeChange(parseInt(e.target.value))}
          >
            <option value="2">2 tab space</option>
            <option value="3">3 tab space</option>
            <option value="4">4 tab space</option>
          </select>
          <button
            type="button"
            onClick={handleCopy}
            className="w-[120px] m-1 rounded bg-bodydark1 dark:bg-boxdark px-2 py-[5px] font-medium text-[14px] text-graydark dark:text-bodydark2"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="w-[120px] m-1 rounded bg-bodydark1 dark:bg-boxdark px-2 py-[5px] font-medium text-[14px] text-graydark dark:text-bodydark2"
          >
            Download
          </button>
        </div>
        <div className="w-1/2">
          <AceEditor
            width="100%"
            mode="json"
            theme="eclipse"
            name="blah2"
            fontSize={14}
            showPrintMargin={true}
            highlightActiveLine={true}
            value={parseValue}
            readOnly={true}
            wrapEnabled={true}
            setOptions={{
              enableBasicAutocompletion: false,
              enableLiveAutocompletion: false,
              enableSnippets: false,
              showLineNumbers: true,
              tabSize,
            }}
          />
        </div>
      </div>
    </>
  );
};

export default JsonPrettier;
