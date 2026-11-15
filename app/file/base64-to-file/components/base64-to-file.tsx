"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import TextArea from "@/components/Input/TextArea";
import { Card, ErrorText, Field, Intro, ValueRow } from "@/components/Tool/ui";
import { bytesToSize } from "@/common/utils";
import { FC, useEffect, useMemo, useState } from "react";
import { decodeBase64Input, hexPreview } from "./utils";

const SAMPLE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAJklEQVR42mNgKHz8HxkDAQMyJig/DAwgWQOa/HAwYDQdjKYDIAYAeHuoH9wpp0sAAAAASUVORK5CYII=";

const Base64ToFileComponent: FC = () => {
  const [input, setInput] = useState(SAMPLE);
  const [name, setName] = useState("");

  const result = useMemo(() => {
    if (!input.trim()) return { file: null, error: "" };
    try {
      return { file: decodeBase64Input(input), error: "" };
    } catch (e) {
      return { file: null, error: (e as Error).message.includes("atob") ? "This is not valid Base64" : (e as Error).message };
    }
  }, [input]);

  const file = result.file;
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!file) return setUrl("");
    const u = URL.createObjectURL(new Blob([file.bytes as BlobPart], { type: file.mime }));
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const fileName = (name.trim() || "file") + (name.includes(".") ? "" : `.${file?.ext || "bin"}`);
  const text = file?.isText ? new TextDecoder().decode(file.bytes.subarray(0, 20000)) : "";

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <Intro>
          Paste a Base64 string or a <span className="font-mono">data:</span> URI to get the file back.
          The type is detected from the file&apos;s first bytes, so plain Base64 works too.
        </Intro>
        <Field
          label="Base64 or data URI"
          right={
            <button type="button" className="cursor-pointer text-sm text-primary hover:underline" onClick={() => setInput("")}>
              Clear
            </button>
          }
        >
          <TextArea rows={8} value={input} onChange={(e) => setInput(e.target.value)} isError={!!result.error} additionalClass="w-full break-all font-mono text-xs leading-4" />
        </Field>
        <ErrorText>{result.error}</ErrorText>
        {file && (
          <Card title="File">
            <dl className="mb-3">
              <ValueRow label="Type" value={file.mime} main />
              {file.declaredMime && file.declaredMime !== file.mime && <ValueRow label="Declared type" value={file.declaredMime} />}
              <ValueRow label="Size" value={`${bytesToSize(file.bytes.length)} (${file.bytes.length.toLocaleString()} bytes)`} />
            </dl>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <input className="custom-input min-w-0 flex-1 font-mono text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder={`file.${file.ext}`} aria-label="File name" />
              <a href={url} download={fileName}>
                <Button label="Download" />
              </a>
            </div>
            {url && file.mime.startsWith("image/") && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="Preview" className="max-h-96 max-w-full rounded border border-stroke bg-[repeating-conic-gradient(#e5e7eb_0_25%,transparent_0_50%)] bg-size-[16px_16px] dark:border-strokedark" />
            )}
            {url && file.mime === "application/pdf" && <iframe src={url} title="PDF preview" className="h-[32rem] w-full rounded border border-stroke dark:border-strokedark" />}
            {url && file.mime.startsWith("audio/") && <audio src={url} controls className="w-full" />}
            {url && file.mime.startsWith("video/") && <video src={url} controls className="max-h-96 max-w-full" />}
            {file.isText && !file.mime.startsWith("image/") && (
              <textarea readOnly rows={10} value={text} className="custom-input w-full font-mono text-sm" />
            )}
            {!file.isText && !/^(image|audio|video)\/|pdf/.test(file.mime) && (
              <pre className="overflow-x-auto rounded bg-gray p-3 text-xs dark:bg-meta-4">{hexPreview(file.bytes)}</pre>
            )}
          </Card>
        )}
      </div>
    </>
  );
};

export default Base64ToFileComponent;
