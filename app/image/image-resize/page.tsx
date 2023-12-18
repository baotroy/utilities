"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState } from "react";
import Resize from "./components/resize";
import { getImageDimensions } from "../utils";
import { Dimensions, FileFormat } from "../type";
import Toast from "react-hot-toast";

type Tabs = "resize" | "crop" | "rotate";

const ImageResize = () => {
  const [selectFile, setSelectFile] = useState<File | null>(null);
  const [base64, setBase64] = useState("");
  const [activeTab, setActiveTab] = useState<Tabs>("resize");
  const [dimensions, setDimensions] = useState<Dimensions>();
  const [format, setFormat] = useState<FileFormat>("image/jpg");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectFile(file);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const b64 = reader.result as string;
        try {
          const demens: Dimensions = await getImageDimensions(b64);
          setBase64(b64);
          setDimensions(demens);
          setFormat(file.type as FileFormat);
        } catch (error: any) {
          Toast.error(error.message);
        }
      };
    }
  };

  const handleTabClick = (tab: Tabs) => {
    setActiveTab(tab);
  };

  return (
    <>
      <Breadcrumb />
      <div>
        <div className="mb-4">
          <input
            type="file"
            onChange={handleFileChange}
            className="dark:text-bodydark2"
          />
        </div>
        {base64 && (
          <div>
            <div className="">
              <button
                className={`px-4 py-2 rounded-t-lg ${
                  activeTab === "resize"
                    ? "bg-blue-500 text-bodydark"
                    : "bg-gray-200"
                }`}
                onClick={() => handleTabClick("resize")}
              >
                Resize
              </button>
              <button
                className={`px-4 py-2 ${
                  activeTab === "crop"
                    ? "bg-blue-500 text-bodydark"
                    : "bg-gray-200"
                }`}
                onClick={() => handleTabClick("crop")}
              >
                Crop
              </button>
              <button
                className={`px-4 py-2 rounded-b-lg ${
                  activeTab === "rotate"
                    ? "bg-blue-500 text-bodydark"
                    : "bg-gray-200"
                }`}
                onClick={() => handleTabClick("rotate")}
              >
                Rotate
              </button>
            </div>

            <div className="mt-4">
              {activeTab === "resize" && (
                <Resize
                  base64={base64}
                  dimensions={dimensions}
                  format={format}
                />
              )}
              {activeTab === "crop" && <p>Content for Tab 2</p>}
              {activeTab === "rotate" && <p>Content for Tab 3</p>}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ImageResize;
