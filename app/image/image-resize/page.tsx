"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useEffect, useState } from "react";
import Resize from "./components/resize";
import { getImageDimensions } from "../utils";
import { Dimensions, FileFormat } from "../type";
import Toast from "react-hot-toast";
import { MdCrop, MdPhotoSizeSelectLarge, MdRotateLeft } from "react-icons/md";

type Tabs = "resize" | "crop" | "rotate";

const ImageResize = () => {
  const [, setSelectFile] = useState<File | null>(null);
  const [base64, setBase64] = useState("");
  const [activeTab, setActiveTab] = useState<Tabs>("resize");
  const [dimensions, setDimensions] = useState<Dimensions>();
  const [format, setFormat] = useState<FileFormat>("original");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      console.log(file);
      setSelectFile(file);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const b64 = reader.result as string;
        try {
          setBase64(b64);
          setFormat(file.type as FileFormat);
        } catch (error: any) {
          Toast.error(error.message);
        }
      };
    }
  };
  useEffect(() => {
    if (base64.trim() !== "") {
      getImageDimensions(base64).then((demens) => {
        setDimensions(demens);
      });
    }
  }, [base64]);
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
          <div className="border border-bodydark ">
            <div className="xl:flex block">
              <div className="xl:w-[350px] text-center w-full border-r border-b py-2 border-bodydark">
                <button
                  className={`px-4 py-1.5 rounded-[0.375rem] ${
                    activeTab === "resize" ? "bg-meta-5 text-white" : ""
                  }`}
                  onClick={() => handleTabClick("resize")}
                >
                  <div className="flex items-center">
                    <MdPhotoSizeSelectLarge className="mr-1" /> Resize
                  </div>
                </button>
                <button
                  className={`px-4 py-2 rounded-[0.375rem] ${
                    activeTab === "crop" ? "bg-meta-5 text-white" : ""
                  }`}
                  onClick={() => handleTabClick("crop")}
                >
                  <div className="flex items-center">
                    <MdCrop className="mr-1" /> Crop
                  </div>
                </button>
                <button
                  className={`px-4 py-2 rounded-[0.375rem] ${
                    activeTab === "rotate" ? "bg-meta-5 text-white" : ""
                  }`}
                  onClick={() => handleTabClick("rotate")}
                >
                  <div className="flex items-center">
                    <MdRotateLeft className="mr-1" /> Rotate
                  </div>
                </button>
              </div>
              <div className="xl:flex xl:flex-1 xl:w-[cal(100%-350px)] xl:m-0 mt-8 w-full justify-center align-middle  px-4 py-6 ">
                {/* for ads */}
              </div>
            </div>
            <div>
              {activeTab === "resize" && (
                <Resize
                  base64={base64}
                  dimensions={dimensions}
                  originalFormat={format}
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
