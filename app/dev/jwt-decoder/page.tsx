"use client";
import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { base64UrlDecode, createJwt, prettyJson, validJSON } from "../utils";
import { TypeAlgorithm, algorithms } from "../type";
import clsx from "clsx";
// import { copyToClipboard, download } from "@/common/utils";
const JwtDecoder = () => {
  const errorStyle = "bg-[#ffc4cc] text-[#f3005b]";
  const h3Style = "text-[26px] mb-2";
  const textareaStyle = `dark:text-graydark2
                        dark:bg-graydark
                        w-full 
                        text-sm
                        border-[1.5px] 
                        border-stroke  
                        dark:border-strokedark
                        py-3 px-5 outline-none
                        resize-none
                        `;
  const defaultAlgorithm: TypeAlgorithm = "HS256";
  const [tabSize] = useState(2);
  const [token, setToken] = useState("");
  const [algorithm, setAlgorithm] = useState<TypeAlgorithm>(defaultAlgorithm);
  const [header, setHeader] = useState(
    prettyJson(`{"alg": "${defaultAlgorithm}", "typ": "JWT"}`)
  );
  const [payload, setPayload] = useState(`{
    "sub": "1234567890",
    "name": "John Doe",
    "iat": 1516239022
  }`);
  const defaultSecret = "your-256-bit-secret";
  const [secret, setSecret] = useState(defaultSecret);
  const [verified, setVerified] = useState(false);
  // States error
  const [errorHeader, setErrorHeader] = useState(false);
  const [errorPayload, setErrorPayload] = useState(false);
  const [errorToken, setErrorToken] = useState(false);
  const handleChangeToken = (value: string) => {
    setToken(value);
  };

  const decodeToken = () => {
    let errHeader,
      errPayload = false;

    const headers = base64UrlDecode(token.split(".")[0]);
    if (validHeader(headers)) {
      console.log("h1");
      setHeader(prettyJson(headers, tabSize));
      setAlgorithm(JSON.parse(headers).alg);
    } else {
      errHeader = true;
      console.log("h2");
      setHeader(prettyJson("{}", tabSize));
    }
    const payloads = base64UrlDecode(token.split(".")[1]);
    console.log("payloads", typeof payloads, payloads);
    if (validPayload(payloads)) {
      setPayload(prettyJson(payloads, tabSize));
    } else {
      errPayload = true;
      //   setPayload(prettyJson("{}", tabSize));
      setPayload(payloads);
    }

    setErrorToken(errHeader || errPayload);
  };

  const validHeader = (s: string): boolean => {
    if (validJSON(s)) {
      setErrorHeader(false);
      return true;
    } else {
      setErrorHeader(true);
      return false;
    }
  };
  const validPayload = (s: string): boolean => {
    if (validJSON(s)) {
      setErrorPayload(false);
      return true;
    } else {
      setErrorPayload(true);
      return false;
    }
  };

  // Update token when header or payload or secret change
  const updateToken = (
    pHeader: string,
    pPayload: string,
    pSecret: string,
    pAlgorithm: TypeAlgorithm
  ) => {
    if (!pHeader || !pPayload) {
      return setToken("");
    }
    if (validHeader(pHeader) && validPayload(pPayload)) {
      const token = createJwt(JSON.parse(pPayload), pAlgorithm, pSecret);
      setToken(token);
    } else {
      setToken("");
    }
  };
  useEffect(() => {
    updateToken(header, payload, secret, algorithm);
  }, [algorithm]);

  useEffect(() => {
    decodeToken();
    // const verified = verifyJwt(token, secret || "", algorithm);
    if (header && payload) {
      if (validJSON(header) && validJSON(payload)) {
        const tmpToken = createJwt(
          JSON.parse(payload),
          algorithm as TypeAlgorithm,
          secret || defaultSecret
        );
        setVerified(tmpToken === token);
      } else {
        setVerified(false);
      }
    } else {
      setVerified(false);
    }
    console.log("verified", verified);
  }, [token]);

  const handleInputJSONChange = (
    value: string,
    target: "payload" | "header"
  ) => {
    if (target === "header") {
      console.log("h3");
      setHeader(value);
      updateToken(value, payload, secret, algorithm);
    } else {
      setPayload(value);
      updateToken(header, value, secret, algorithm);
    }
  };
  const handleUpdateSecret = (value: string) => {
    setSecret(value);
    updateToken(header, payload, value, algorithm);
  };
  return (
    <>
      <Breadcrumb />
      <div className="w-full mb-4">
        Algorithm
        <select
          className="ml-2"
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value as TypeAlgorithm)}
        >
          {algorithms.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <div className="flex w-full">
        <div className="w-1/2">
          <h3 className={h3Style}>Encoded</h3>
          <div>
            <textarea
              rows={20}
              placeholder=""
              value={token}
              onChange={(e) => handleChangeToken(e.target.value)}
              spellCheck={false}
              className="
                dark:text-graydark2
                bg-white
                dark:bg-graydark
                w-full 
                rounded-md
                border-[1.5px] 
                border-stroke  
                dark:border-strokedark
                py-3 px-5
                outline-none
                resize-none"
            ></textarea>
          </div>
        </div>

        <div className="w-1/2 ml-2   ">
          <h3 className={h3Style}>Decoded</h3>
          <div>
            <p className="text-xs p-2  border-x-[1.5px] border-t-[1.5px] border-stroke">
              HEADER
            </p>
            <textarea
              rows={5}
              placeholder=""
              defaultValue={header}
              value={header}
              onChange={(e) => handleInputJSONChange(e.target.value, "header")}
              spellCheck={false}
              className={clsx(textareaStyle, errorHeader && errorStyle)}
            ></textarea>
          </div>
          <div>
            <p className="text-xs p-2 border-x-[1.5px] border-stroke">
              PAYLOAD
            </p>
            <textarea
              rows={5}
              placeholder=""
              defaultValue={payload}
              value={payload}
              onChange={(e) => handleInputJSONChange(e.target.value, "payload")}
              spellCheck={false}
              className={clsx(textareaStyle, errorPayload && errorStyle)}
            ></textarea>
          </div>
          <div>
            <p className="text-xs p-2  border-x-[1.5px] border-stroke">
              VERIFY SIGNATURE
            </p>
            <textarea
              rows={5}
              placeholder=""
              defaultValue={secret}
              value={secret}
              onChange={(e) => handleUpdateSecret(e.target.value)}
              className={textareaStyle}
            ></textarea>
          </div>
        </div>
      </div>
      <p>{verified ? "Verified" : "Not verified"}</p>
    </>
  );
};

export default JwtDecoder;
