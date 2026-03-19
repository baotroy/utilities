"use client";
import { useEffect, useState, useCallback } from "react";
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
import { MdCheckCircleOutline, MdOutlineCancel } from "react-icons/md";

export default function JwtDecoderComponent() {
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
  const defaultHeader = `{"alg":"${defaultAlgorithm}","typ":"JWT"}`;
  const defaultPayload = `{"name":"Foo Bar","iat":1704067200}`;

  const [tabSize] = useState(2);
  const [isLoading, setIsLoading] = useState(true);

  const [algorithm, setAlgorithm] = useState<TypeAlgorithm>(defaultAlgorithm);
  const [header, setHeader] = useState(defaultHeader);
  const [payload, setPayload] = useState(defaultPayload);
  const [validPayload, setValidPayload] = useState(defaultPayload);

  const defaultSecret = "secret";
  const [secret, setSecret] = useState(defaultSecret);

  const [headerHash, setHeaderHash] = useState("");
  const [payloadHash, setPayloadHash] = useState("");
  const [secretHash, setSecretHash] = useState("");
  const [verifiedSecretHash, setVerifiedSecretHash] = useState("");

  const [token, setToken] = useState("");
  const [verified, setVerified] = useState(true);
  // States error
  const [errorHeader, setErrorHeader] = useState(false);
  const [errorPayload, setErrorPayload] = useState(false);

  // Initialize the component with async JWT creation
  useEffect(() => {
    const initializeJwt = async () => {
      const defaultToken = await createJwt(
        JSON.parse(defaultPayload),
        defaultAlgorithm,
        defaultSecret
      );
      const tokens = defaultToken.split(".");
      setHeaderHash(tokens[0]);
      setPayloadHash(tokens[1]);
      setSecretHash(tokens[2]);
      setVerifiedSecretHash(tokens[2]);
      setToken(defaultToken);
      setIsLoading(false);
    };
    initializeJwt();
  }, []);

  // User changes token
  const handleChangeToken = (newToken: string) => {
    const newHashes = newToken.split(".");
    if (newHashes[0] && newHashes[0] !== headerHash) {
      setHeaderHash(newHashes[0]);

      const decode = base64UrlDecode(newHashes[0]);
      if (validJSON(decode)) {
        setHeader(decode);
        // check if algorithm is changed
        const decodeJson = JSON.parse(decode);
        if (decodeJson.alg !== algorithm) {
          setAlgorithm(decodeJson.alg);
        }
      } else {
        setHeader(prettyJson("{}", tabSize));
      }
    }

    if (newHashes[1] && newHashes[1] !== payloadHash) {
      setPayloadHash(newHashes[1]);

      const decode = base64UrlDecode(newHashes[1]);
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

    setToken(newToken);
  };

  const updateToken = useCallback((token: string) => {
    const hashes = token.split(".");
    setHeaderHash(hashes[0]);
    setHeader(base64UrlDecode(hashes[0]));
    setPayloadHash(hashes[1]);
    setValidPayload(base64UrlDecode(hashes[1]));
    setToken(token);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const updateAlgorithm = async () => {
      const nHeader = `{"alg":"${algorithm}","typ":"JWT"}`;
      setHeader(nHeader);
      setHeaderHash(base64UrlEncode(nHeader));

      const newToken = await createJwt(JSON.parse(validPayload), algorithm, secret);
      updateToken(newToken);
      setVerifiedSecretHash(newToken.split(".")[2]);
    };
    updateAlgorithm();
  }, [algorithm, isLoading, secret, validPayload, updateToken]);

  const handleInputHeaderChange = (value: string) => {
    setHeader(value);
    if (validJSON(value)) {
      const json = JSON.parse(value);
      const { alg } = json;
      if (!algorithms.includes(alg)) {
        setVerified(false);
        setToken("");
        return;
      }
      setErrorHeader(false);
      setHeaderHash(base64UrlEncode(value));
      setToken(`${base64UrlEncode(value)}.${payloadHash}.${secretHash}`);
    } else {
      setErrorHeader(true);
      setToken("");
    }
  };

  const handleInputPayloadChange = (value: string) => {
    setPayload(value);
    if (validJSON(value)) {
      setErrorPayload(false);
      setValidPayload(value);
      setPayloadHash(base64UrlEncode(value));
      setToken(`${headerHash}.${base64UrlEncode(value)}.${secretHash}`);
    } else {
      setErrorPayload(true);
      setToken("");
    }
  };

  const handleUpdateSecret = async (value: string) => {
    value = value || defaultSecret;
    setSecret(value);
    const newToken = await createJwt(JSON.parse(validPayload), algorithm, value);
    const hashes = newToken.split(".");
    setSecretHash(hashes[2]);
    setVerifiedSecretHash(hashes[2]);
    updateToken(newToken);
  };

  useEffect(() => {
    const tokens = token.split(".");
    setVerified(tokens[2] === verifiedSecretHash);
  }, [token, verifiedSecretHash]);

  const showJSON = (s: string) => {
    try {
      return JSON.stringify(JSON.parse(s), null, tabSize);
    } catch (error) {
      return s;
    }
  };

  if (isLoading) {
    return (
      <>
        <Breadcrumb />
        <div className="w-full">
          <p className="mb-6 text-sm text-bodydark dark:text-bodydark2">
            Decode, verify and generate JSON Web Tokens. Supports various algorithms including HS256, HS384, HS512.
          </p>
          <div>Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb />
      <div className="w-full">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Decode, verify and generate JSON Web Tokens. Supports various algorithms including HS256, HS384, HS512.
        </p>
        <div className="mb-4">
          Algorithm
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as TypeAlgorithm)}
            className="rounded p-2 mx-3 border border-bodydark outline-bodydark dark:outline-boxdark dark:bg-body text-[14px] dark:text-bodydark1"
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
                onChange={(e) => handleInputHeaderChange(e.target.value)}
                spellCheck={false}
                className={clsx(textareaStyle, errorHeader && errorStyle)}
              ></textarea>
            </div>
            <div>
              <p className="text-xs p-2 border-x-[1.5px] border-stroke">
                PAYLOAD
              </p>
              <textarea
                rows={6}
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
                spellCheck={false}
                onChange={(e) => handleUpdateSecret(e.target.value)}
                className={textareaStyle}
              ></textarea>
            </div>
          </div>
        </div>
        <p
          className={clsx(
            "text-[20px]",
            verified ? "text-success" : "text-danger"
          )}
        >
          {verified ? (
            <span className="flex">
              <MdCheckCircleOutline />
              &nbsp;Signature Verified
            </span>
          ) : (
            <span className="flex">
              <MdOutlineCancel />
              &nbsp;Invalid Signature
            </span>
          )}
        </p>
      </div>
    </>
  );
}
