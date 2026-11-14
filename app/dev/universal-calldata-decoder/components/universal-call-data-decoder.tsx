"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import TextArea from "@/components/Input/TextArea";
import { FC, useRef, useState } from "react";
import toast from "react-hot-toast";
import { IDecodeResult, IFunctionFragement } from "./type";
import { copyToClipboard } from "@/common/utils";
import { DecodeError, decodeCalldata, decodeWithSignature } from "./utils";
import FunctionComponent from "./FunctionComponent";

// multicall(bytes[]) wrapping transfer(address,uint256) and approve(address,uint256)
const SAMPLE_CALLDATA =
  "0xac9650d8" +
  "0000000000000000000000000000000000000000000000000000000000000020" +
  "0000000000000000000000000000000000000000000000000000000000000002" +
  "0000000000000000000000000000000000000000000000000000000000000040" +
  "00000000000000000000000000000000000000000000000000000000000000c0" +
  "0000000000000000000000000000000000000000000000000000000000000044" +
  "a9059cbb" +
  "000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045" +
  "0000000000000000000000000000000000000000000000000de0b6b3a7640000" +
  "00000000000000000000000000000000000000000000000000000000" +
  "0000000000000000000000000000000000000000000000000000000000000044" +
  "095ea7b3" +
  "0000000000000000000000007a250d5630b4cf539739df2c5dacb4c659f2488d" +
  "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" +
  "00000000000000000000000000000000000000000000000000000000";

interface UniversalCallDataDecoderProps { }

const UniversalCallDataDecoderComponent: FC<
  UniversalCallDataDecoderProps
> = () => {
  const [inputData, setInputData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  // optional ABI: its functions are used before the signature database
  const [showAbi, setShowAbi] = useState(false);
  const [abiText, setAbiText] = useState("");
  const [abiError, setAbiError] = useState("");
  const activeAbi = showAbi ? abiText : "";
  const [result, setResult] = useState<IDecodeResult | null>(null);
  // signature currently shown (one of result.candidates) and its decoding
  const [signature, setSignature] = useState("");
  const [fragment, setFragment] = useState<IFunctionFragement | null>(null);
  // bumped on every decode: resets per-argument UI state and drops the answer
  // of an older request that finishes late
  const [decodeId, setDecodeId] = useState(0);
  const requestRef = useRef(0);

  const doDecode = async (calldata: string) => {
    const request = ++requestRef.current;
    setIsLoading(true);
    setError("");
    setAbiError("");
    try {
      const decoded = await decodeCalldata(calldata, activeAbi);
      if (request !== requestRef.current) return;
      setResult(decoded);
      setFragment(decoded.fragment);
      setSignature(decoded.candidates[0] || "");
      setDecodeId(request);
      if (decoded.fragment) {
        toast.success("Successfully decoded the input data");
      }
    } catch (e) {
      if (request !== requestRef.current) return;
      setResult(null);
      setFragment(null);
      const message = e instanceof Error ? e.message : "Unable to decode the calldata";
      if (e instanceof DecodeError && e.code === "abi") setAbiError(message);
      else setError(message);
    } finally {
      if (request === requestRef.current) setIsLoading(false);
    }
  };

  // Another signature with the same selector also fits: let the user switch
  const handleSignatureChange = async (newSignature: string) => {
    if (!result) return;
    const request = ++requestRef.current;
    setSignature(newSignature);
    setIsLoading(true);
    try {
      const decoded = await decodeWithSignature(result.calldata, newSignature, activeAbi);
      if (request !== requestRef.current) return;
      setFragment(decoded);
      setDecodeId(request);
    } catch {
      if (request === requestRef.current) toast.error("Unable to decode with this signature");
    } finally {
      if (request === requestRef.current) setIsLoading(false);
    }
  };

  // Pasting decodes right away
  const handleOnPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    // let the browser insert the text first (keeps cursor position/selection)
    setTimeout(() => {
      if (target.value.trim()) doDecode(target.value);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      doDecode(inputData);
    }
  };

  const handleSample = () => {
    setInputData(SAMPLE_CALLDATA);
    doDecode(SAMPLE_CALLDATA);
  };

  const handleClear = () => {
    requestRef.current++;
    setInputData("");
    setResult(null);
    setFragment(null);
    setSignature("");
    setError("");
    setAbiError("");
    setIsLoading(false);
  };

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Decode Ethereum calldata without an ABI. Automatically fetches function signatures and recursively decodes nested calls.
        </p>
        <div className="mb-4">
          <label className="font-semibold text-sm mb-2 block">
            Calldata
          </label>
          <TextArea
            rows={5}
            additionalClass="w-full text-sm leading-4 font-mono"
            placeholder="0xa9059cbb000000000000000000000000... (paste to decode, or press Ctrl+Enter)"
            onChange={(e) => setInputData(e.target.value)}
            onPaste={handleOnPaste}
            onKeyDown={handleKeyDown}
            value={inputData}
            isError={!!error}
          />
          {error && <div className="mt-1 text-sm text-red-500">{error}</div>}
        </div>

        <div className="mb-4">
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={showAbi}
              onChange={(e) => setShowAbi(e.target.checked)}
            />
            Decode with my ABI
          </label>
          {showAbi && (
            <div className="mt-2">
              <TextArea
                rows={6}
                additionalClass="w-full text-sm leading-4 font-mono"
                placeholder={
                  'JSON ABI: [{"type":"function","name":"transfer","inputs":[...]}]\nor one signature per line: function transfer(address to, uint256 amount)'
                }
                onChange={(e) => {
                  setAbiText(e.target.value);
                  setAbiError("");
                }}
                value={abiText}
                isError={!!abiError}
              />
              {abiError ? (
                <div className="mt-1 text-sm text-red-500">{abiError}</div>
              ) : (
                <div className="mt-1 text-xs text-bodydark">
                  Functions of this ABI are used first, with their parameter names, also for
                  nested calls. Selectors it does not have are looked up in the signature
                  database.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-right mb-4">
          <Button label="Sample" additionalClass="mr-2" type="outline"
            handleOnClick={handleSample} />
          <Button label="Clear" additionalClass="mr-2" type="reset"
            handleOnClick={handleClear} />
          <Button label="Copy" additionalClass="mr-2" type="success"
            handleOnClick={() => copyToClipboard(inputData)} />
          <Button label="Decode" handleOnClick={() => doDecode(inputData)} isLoading={isLoading} />
        </div>

        {result && result.candidates.length > 1 && (
          <div className="mb-4 text-sm">
            <label className="mb-1 block text-bodydark">
              {result.candidates.length} known signatures match this selector and data:
            </label>
            <select
              value={signature}
              aria-label="Function signature"
              onChange={(e) => handleSignatureChange(e.target.value)}
              className="custom-input w-full font-mono"
            >
              {result.candidates.map((candidate) => (
                <option key={candidate} value={candidate}>
                  {candidate}
                </option>
              ))}
            </select>
          </div>
        )}

        {result?.notInAbi && fragment && (
          <div className="mb-3 text-sm text-warning">
            Your ABI has no function with selector{" "}
            <span className="font-mono">{result.selector}</span>, so the signature database
            was used.
          </div>
        )}

        {fragment && <FunctionComponent key={decodeId} fragment={fragment} />}

        {/* Unknown selector: still show something useful */}
        {result && !fragment && (
          <div>
            <div className="mb-3 rounded-lg border border-stroke bg-gray-50 p-3 text-sm">
              {result.notInAbi
                ? "Neither your ABI nor the signature database has a function for selector "
                : "No known function signature matches selector "}
              <span className="font-mono font-semibold">{result.selector}</span>.
              Below are the raw 32-byte words of the arguments.
            </div>
            {result.words.length === 0 ? (
              <p className="text-sm text-bodydark">No arguments</p>
            ) : (
              <ol className="font-mono text-xs">
                {result.words.map((word, index) => (
                  <li key={index} className="flex gap-3 border-b border-stroke py-1">
                    <span className="w-8 shrink-0 text-right text-bodydark">{index}</span>
                    <span className="break-all">{word}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default UniversalCallDataDecoderComponent;
