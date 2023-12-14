"use client";
import Toast from "react-hot-toast";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/theme-eclipse";
import "ace-builds/src-noconflict/mode-json";

import { useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { validJSON, prettyJson } from "../utils";
const JsonPrettier = () => {
  const [inputValue, setInputValue] = useState("");
  const [parseValue, setParseValue] = useState("");
  const [tabSize, setTabSize] = useState(2);
  const handleTabSizeChange = (tab: number) => {
    setTabSize(tab);
  };
  const handleOnChangeInput = (value: string) => {
    setInputValue(value);
  };

  // Download file with content is parseValue
  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([parseValue], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "download.json";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  const handleConvert = () => {
    if (validJSON(inputValue)) {
      setParseValue(prettyJson(inputValue, tabSize));
    } else {
      Toast.error("Invalid input");
    }
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
            onClick={handleDownload}
            className="w-[120px] m-1 rounded bg-bodydark1 dark:bg-boxdark px-2 py-[5px] font-medium text-[14px] text-graydark dark:text-bodydark2"
          >
            Download
          </button>
        </div>
        <div className="w-1/2">
          <AceEditor
            width="100%"
            placeholder=""
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
