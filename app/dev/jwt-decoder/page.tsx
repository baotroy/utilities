"use client";
import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import {
  base64UrlDecode,
  base64UrlEncode,
  createJwt,
  prettyJson,
  validJSON,
} from "../utils";
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

  const [algorithm, setAlgorithm] = useState<TypeAlgorithm>(defaultAlgorithm);
  const [header, setHeader] = useState(
    `{"alg": "${defaultAlgorithm}", "typ": "JWT"}`
  );
  const [payload, setPayload] = useState(
    `{"name": "John Doe","iat": 1516239022}`
  );
  const defaultSecret = "your-256-bit-secret";
  const [secret, setSecret] = useState(defaultSecret);
  const [headerHash, setHeaderHash] = useState(base64UrlEncode(header));
  const [payloadHash, setPayloadHash] = useState(base64UrlEncode(payload));
  const [secretHash, setSecretHash] = useState(base64UrlEncode(secret));
  const [token, setToken] = useState(
    `${headerHash}.${payloadHash}.${secretHash}`
  );
  const [verified, setVerified] = useState(true);
  // States error
  const [errorHeader, setErrorHeader] = useState(false);
  const [errorPayload, setErrorPayload] = useState(false);
  const [errorToken, setErrorToken] = useState(false);

  // User changes token
  const handleChangeToken = (newToken: string) => {
    const newHashes = newToken.split(".");
    if (newHashes[0] && newHashes[0] !== headerHash) {
      setHeaderHash(newHashes[0]);

      const decode = base64UrlDecode(newHashes[0]);
      if (validJSON(decode)) {
        setHeader(decode);
      } else {
        setHeader(prettyJson("{}", tabSize));
      }
    }

    if (newHashes[1] && newHashes[1] !== payloadHash) {
      setPayloadHash(newHashes[1]);

      const decode = base64UrlDecode(newHashes[1]);
      console.log("decode", decode);
      if (validJSON(decode)) {
        setPayload(prettyJson(decode, tabSize));
        setErrorPayload(false);
      } else {
        setPayload(decode);
        setErrorPayload(true);
      }
    }

    if (newHashes[2] && newHashes[2] !== secretHash) {
      setSecretHash(newHashes[2]);
    }
    console.log("header hash", headerHash);
    console.log("payload hash", payloadHash);
    setToken(newToken);
  };

  // const decodeToken = () => {
  //   let errHeader,
  //     errPayload = false;
  //   console.log("token", token);
  //   const [headerHash, payloadHash, secretHash] = token.split(".");

  //   console.log("headerHash", headerHash);
  //   // return;
  //   const headers = base64UrlDecode(headerHash);
  //   console.log("headers", headers);

  //   if (headers) {
  //     if (validHeader(headers)) {
  //       console.log("h1");
  //       setHeader(headers);
  //       setHeaderHash(headerHash);
  //       setAlgorithm(JSON.parse(headers).alg);
  //     } else {
  //       errHeader = true;
  //       console.log("h2");
  //       setHeader(prettyJson("{}", tabSize));
  //       setHeaderHash("");
  //     }
  //   }

  //   const payloads = base64UrlDecode(payloadHash);
  //   if (payloads) {
  //     if (validPayload(payloads)) {
  //       setPayload(prettyJson(payloads, tabSize));
  //       setPayloadHash(payloadHash);
  //     } else {
  //       errPayload = true;
  //       setPayload(payloads);
  //       setPayloadHash("");
  //     }
  //   }

  //   setErrorToken(errHeader || errPayload);
  // };

  // const validHeader = (s: string): boolean => {
  //   if (validJSON(s)) {
  //     // setErrorHeader(false);
  //     return true;
  //   } else {
  //     setErrorHeader(true);
  //     return false;
  //   }
  // };
  // const validPayload = (s: string): boolean => {
  //   if (validJSON(s)) {
  //     // setErrorPayload(false);
  //     return true;
  //   } else {
  //     setErrorPayload(true);
  //     return false;
  //   }
  // };

  // Update token when header or payload or secret change
  // const updateToken = (
  //   pHeader?: string,
  //   pPayload?: string,
  //   pSecret?: string
  // ) => {
  //   if (pHeader) {
  //     if (validHeader(pHeader)) {
  //       setHeaderHash(base64UrlEncode(JSON.stringify(pHeader)));
  //       setHeader(pHeader);
  //       setErrorHeader(false);
  //     } else {
  //       setErrorHeader(true);
  //     }
  //   }

  //   if (pPayload) {
  //     if (validPayload(pPayload)) {
  //       setPayloadHash(base64UrlEncode(JSON.stringify(pPayload)));
  //       setPayload(pPayload);
  //       setErrorHeader(false);
  //     } else {
  //       setErrorPayload(true);
  //     }
  //   }

  //   if (pSecret) {
  //     if (validHeader(header) && validPayload(payload)) {
  //       const token = createJwt(JSON.parse(payload), algorithm, pSecret);
  //       const hashes = token.split(".");
  //       setHeaderHash(hashes[0]);
  //       setPayloadHash(hashes[1]);
  //       setSecretHash(hashes[2]);
  //       setSecret(pSecret);
  //       setToken(token);
  //     }
  //   }

  //   // if (algorithm === pAlgorithm) {
  //   //   setHeaderHash(pHeader);
  //   //   setPayloadHash(hashes[1]);
  //   //   setSecretHash(hashes[2]);
  //   //   return
  //   // }

  //   // if (!pHeader || !pPayload) {
  //   //   return setToken("");
  //   // }

  //   // if (validHeader(pHeader) && validPayload(pPayload)) {
  //   //   const token = createJwt(JSON.parse(pPayload), pAlgorithm, pSecret);
  //   //   const hashes = token.split(".");
  //   //   setHeaderHash(hashes[0]);
  //   //   setPayloadHash(hashes[1]);
  //   //   setSecretHash(hashes[2]);
  //   //   setToken(token);
  //   // } else {
  //   //   setToken("");
  //   // }
  // };

  // useEffect(() => {
  // const nHeader = `{"alg": "${algorithm}", "typ": "JWT"}`;
  // updateToken(header);
  // setHeader(nHeader);
  // }, [header]);

  // useEffect(() => {
  //   const nHeader = `{"alg": "${algorithm}", "typ": "JWT"}`;
  //   setHeader(nHeader);
  //   setHeaderHash(base64UrlEncode(nHeader));
  // }, [algorithm]);

  // useEffect(() => {
  //   if (validJSON(header) && validJSON(payload)) {
  //     const tmpToken = createJwt(
  //       JSON.parse(payload),
  //       algorithm as TypeAlgorithm,
  //       secret || defaultSecret
  //     );
  //     setVerified(tmpToken === `${headerHash}.${payloadHash}.${secretHash}`);
  //   } else {
  //     setVerified(false);
  //   }
  // }, [header, payload, secret, headerHash, payloadHash, secretHash]);

  useEffect(() => {
    // decodeToken();
    // const verified = verifyJwt(token, secret || "", algorithm);
    // if (header && payload) {
    //   if (validJSON(header) && validJSON(payload)) {
    //     const tmpToken = createJwt(
    //       JSON.parse(payload),
    //       algorithm as TypeAlgorithm,
    //       secret || defaultSecret
    //     );
    //     setVerified(tmpToken === `${headerHash}.${payloadHash}.${secretHash}`);
    //   } else {
    //     setVerified(false);
    //   }
    // } else {
    //   setVerified(false);
    // }
    // console.log("verified", verified);
  }, [token]);

  const handleInputJSONChange = (
    value: string,
    target: "payload" | "header"
  ) => {
    if (target === "header") {
      console.log("h3");
      setHeader(value);
      // updateToken(value, payload, secret, algorithm);
    } else {
      setPayload(value);
      // updateToken(undefined, value);
    }
  };
  
  const handleInputHeaderChange = (value: string) => {
    // if (target === "header") {
    //   console.log("h3");
    //   setHeader(value);
    //   // updateToken(value, payload, secret, algorithm);
    // } else {
    //   setPayload(value);
    //   // updateToken(undefined, value);
    // }
  };

  const handleInputPayloadChange = (value: string) => {
    setPayload(value);
    if (validJSON(value)) {
      setErrorPayload(false);
      setPayloadHash(base64UrlEncode(value));
      setToken(`${headerHash}.${base64UrlEncode(value)}.${secretHash}`);
    } else {
      setErrorPayload(true);
      setToken("");
    }
  };

  const handleUpdateSecret = (value: string) => {
    setSecret(value);
    // updateToken(undefined, undefined, value);
  };

  const showJSON = (s: string) => {
    try {
      return JSON.stringify(JSON.parse(s), null, tabSize);
    } catch (error) {
      return s;
    }
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
              defaultValue={`${headerHash}.${payloadHash}.${secretHash}`}
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
              defaultValue={showJSON(header)}
              value={showJSON(header)}
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
              defaultValue={showJSON(payload)}
              value={showJSON(payload)}
              onChange={(e) => handleInputPayloadChange(e.target.value)}
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
