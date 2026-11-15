"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import TextArea from "@/components/Input/TextArea";
import { ErrorText, Field, Intro, OutputBox, Tabs } from "@/components/Tool/ui";
import { FC, useMemo, useState } from "react";
import { ESCAPE_KINDS, EscapeKind, escapeText, unescapeText } from "./utils";

const StringEscapeComponent: FC = () => {
  const [kind, setKind] = useState<EscapeKind>("json");
  const [direction, setDirection] = useState<"escape" | "unescape">("escape");
  const [input, setInput] = useState('He said "Xin chào" <b>& left</b>\nPath: C:\\temp\\file.txt');

  const { output, error } = useMemo(() => {
    try {
      return { output: direction === "escape" ? escapeText(input, kind) : unescapeText(input, kind), error: "" };
    } catch (e) {
      return { output: "", error: `Cannot unescape: ${(e as Error).message}` };
    }
  }, [input, kind, direction]);

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <Intro>
          Escape special characters so text can go inside a JSON string, JavaScript, HTML, XML, a SQL
          literal, a CSV cell, a regex or a shell argument, or turn escaped text back.
        </Intro>
        <Tabs value={direction} onChange={setDirection} options={[{ value: "escape", label: "Escape" }, { value: "unescape", label: "Unescape" }]} />
        <Tabs value={kind} onChange={setKind} options={ESCAPE_KINDS} />
        <Field label="Input">
          <TextArea rows={7} value={input} onChange={(e) => setInput(e.target.value)} additionalClass="w-full font-mono text-sm leading-5" />
        </Field>
        <Field
          label="Output"
          right={
            <Button
              label="Use as input"
              type="outline"
              disabled={!output}
              handleOnClick={() => {
                setInput(output);
                setDirection(direction === "escape" ? "unescape" : "escape");
              }}
            />
          }
        >
          <OutputBox value={output} rows={7} />
          <ErrorText>{error}</ErrorText>
        </Field>
      </div>
    </>
  );
};

export default StringEscapeComponent;
