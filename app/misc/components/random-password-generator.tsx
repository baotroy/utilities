"use client";
import { copyToClipboard } from "@/common/utils";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useEffect, useState } from "react";
import { MdContentCopy } from "react-icons/md";
import CheckboxTwo from "@/components/Checkboxes/CheckboxTwo";
import { HiMinus, HiOutlinePlus } from "react-icons/hi2";

export default function RandomPasswordGeneratorComponent() {
  const [password, setPassword] = useState("");
  const [length, setLength] = useState(15);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(false);

  const handleCopy = () => {
    copyToClipboard(password);
  };

  const generatePassword = () => {
    const upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowerChars = "abcdefghijklmnopqrstuvwxyz";
    const numberChars = "0123456789";
    const specialCharsList = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

    let characters = "";
    if (uppercase) characters += upperChars;
    if (lowercase) characters += lowerChars;
    if (numbers) characters += numberChars;
    if (symbols) characters += specialCharsList;

    let password = "";
    for (let i = 0; i < length; i++) {
      password += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }

    return password;
  };

  useEffect(() => {
    setPassword(generatePassword());
  }, [length, uppercase, lowercase, numbers, symbols]);

  return (
    <>
      <Breadcrumb pageName="" />
      <h3>
        Create strong and secure passwords to keep your account safe online.
      </h3>
      <div>
        <div className="flex mt-6">
          <input
            type="text"
            readOnly
            value={password}
            className="w-full p-1.5 outline-none border-t border-b border-l rounded-tl-lg rounded-bl-lg border-t-bodydark border-b-bodydark dark:border-t-body dark:border-b-body border-bodydark dark:bg-graydark"
          />
          <div className="flex">
            <span className="bg-gray-2 dark:bg-graydark border border-bodydark dark:border-body block py-2 px-4 rounded-tr-lg rounded-br-lg hover:cursor-pointer">
              <MdContentCopy size={20} onClick={() => handleCopy()} />
            </span>
          </div>
        </div>

        <div className="mt-6 flex">
          <div className="mr-10">
            Password length: <strong>{length}</strong>
          </div>
          <div className="flex">
            <div className="mr-3">
              <button
                className=" rounded-full border-bodydark border"
                onClick={() => {
                  setLength(length - 1);
                }}
              >
                <HiMinus className="m-2" />
              </button>
            </div>
            <div className="">
              <input
                type="range"
                min={1}
                max={50}
                value={length}
                className="w-[200px] h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 bg-meta-5 range-lg"
                onChange={(e) => setLength(+e.target.value)}
              />
            </div>
            <div className="ml-3">
              <button
                className="rounded-full border-bodydark border"
                onClick={() => {
                  setLength(length + 1);
                }}
              >
                <HiOutlinePlus className="m-2" />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6 flex">
          <div className="flex mr-10">Characters used: </div>
          <div className="flex">
            <div className="mr-4">
              <CheckboxTwo
                labelClass="font-bold"
                label="ABC"
                isChecked={uppercase}
                onChange={setUppercase}
              />
            </div>
            <div className="mr-4">
              <CheckboxTwo
                labelClass="font-bold"
                label="abc"
                isChecked={lowercase}
                onChange={(e) => setLowercase(e)}
              />
            </div>
            <div className="mr-4">
              <CheckboxTwo
                labelClass="font-bold"
                label="123"
                isChecked={numbers}
                onChange={setNumbers}
              />
            </div>
            <div>
              <CheckboxTwo
                labelClass="font-bold"
                label="#$&"
                isChecked={symbols}
                onChange={setSymbols}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
