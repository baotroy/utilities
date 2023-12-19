"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import React, { useState } from "react";
import clsx from "clsx";
import { prettyJson } from "@/app/dev/utils";
import { bytesToSize, copyToClipboard, download } from "@/common/utils";

const ImageToBase64 = () => {
  const outputs: Record<string, string> = {
    txt: "Plain text -- just the Base64 value",
    uri: "Data URI -- data:content/type;base64",
    html_hyperlink: "HTML Hyperlink -- <a></a>",
    json: "JSON -- {file:{mime,data}}",
    xml: "XML -- <file></file>",
  };
  
  const h3Style = "font-bold text-20 mb-2";
  const [selectedFormat, setSelectedFormat] = useState("txt");
  const [base64, setBase64] = useState("");
  const [formatData, setFormatData] = useState("");
  const [selectFile, setSelectFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectFile(event.target.files[0]);
      const reader = new FileReader();
      reader.readAsDataURL(event.target.files[0]);
      reader.onload = () => {
        const base64 = reader.result as string;
        setBase64(base64);
      };
    }
  };

  const handleFormatChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFormat(event.target.value);
  };
  const handleEncode = () => {
    setFormatData(formatBase64());
  };
  const formatBase64 = () => {
    switch (selectedFormat) {
      case "txt":
        return base64.split("base64,")[1];
      case "uri":
        return base64;
      case "html_hyperlink":
        return `<a href="${base64}">File</a>`;
      case "json":
        return prettyJson(
          JSON.stringify({ file: { mime: selectFile?.type, data: base64 } })
        );
      case "xml":
        return formatXml(
          `<?xml version="1.0" encoding="UTF-8"?><root><file>${base64}</file></root>`
        );
      default:
        return base64;
    }
  };

  // need optimizing
  function formatXml(xmlString: string) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");
    const serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc);
  }

  const handleDownload = () => {
    if (formatData) download(formatData, "base64.txt", "text/plain");
  };
  const handleClear = () => {
    setFormatData("");
  };

  const handleCopy = () => {
    copyToClipboard(formatData);
  };

  return (
    <>
      <Breadcrumb />
      <div>
        <div className="mb-4">
          <h3 className={h3Style}>Local File</h3>
          <input
            type="file"
            onChange={handleFileChange}
            className="dark:text-bodydark2"
          />
          <p className="text-sm">Choose a file or drag and drop it here</p>
          {selectFile && (
            <div>File size: {bytesToSize(selectFile?.size || 0)}</div>
          )}
        </div>
        <div className="mb-4">
          <h3 className={h3Style}>Output Format</h3>
          <select
            value={selectedFormat}
            onChange={handleFormatChange}
            className="w-full rounded p-2 mx-0.5 border border-bodydark outline-bodydark dark:outline-boxdark dark:bg-body text-[14px] dark:text-bodydark1"
          >
            {Object.keys(outputs).map((key: string) => (
              <option key={key} value={key}>
                {outputs[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <button
            onClick={handleEncode}
            className="rounded bg-bodydark dark:bg-boxdark px-3 py-1.5 font-medium text-[14px] text-graydark dark:text-bodydark2"
          >
            Encode File to Base64
          </button>
        </div>
        <div className="mb-4 w-full">
          <div className="block">
            <h3 className={clsx(`${h3Style} inline-block`)}>Base64</h3>
            <div className="flex float-right">
              <a
                href="#"
                className="ml-3 text-xs underline decoration-dashed"
                onClick={handleCopy}
              >
                copy
              </a>
              <a
                href="#"
                className="ml-3 text-xs underline decoration-dashed"
                onClick={handleClear}
              >
                clear
              </a>
              <a
                href="#"
                className="ml-3 text-xs underline decoration-dashed"
                onClick={handleDownload}
              >
                download
              </a>
            </div>
          </div>
          <div>
            <textarea
              rows={20}
              placeholder=""
              value={formatData}
              readOnly
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
          {/* <div>
            {formatData && (
              <div>{bytesToSize(getSizeFileFromBase64(base64))}</div>
            )}
          </div> */}
        </div>
        <div className="mb-4"></div>
      </div>
    </>
  );
};

export default ImageToBase64;
