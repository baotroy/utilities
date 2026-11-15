"use client";
import { FC, useEffect, useState } from "react";
import toast from "react-hot-toast";
import TextArea from "@/components/Input/TextArea";
import { readAbiLibrary, SavedAbi, writeAbiLibrary } from "@/common/evmTools";

/**
 * ABI textarea with a saved-ABI library shared by all EVM tools: pick a saved
 * ABI, or save the one typed here under a name so other tools can reuse it.
 */
const AbiField: FC<{
  value: string;
  onChange: (value: string) => void;
  error?: string;
  rows?: number;
  label?: string;
  hint?: string;
  placeholder?: string;
}> = ({
  value,
  onChange,
  error,
  rows = 6,
  label = "ABI",
  hint = "(JSON ABI, a build artifact, or one signature per line)",
  placeholder = '[{"type":"function","name":"transfer",...}]\nor\nfunction transfer(address to, uint256 amount)',
}) => {
  const [library, setLibrary] = useState<SavedAbi[]>([]);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    const load = () => setLibrary(readAbiLibrary());
    load();
    window.addEventListener("evm-abi-library", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("evm-abi-library", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  const save = () => {
    const name = window.prompt("Save this ABI as:", selected || "My contract")?.trim();
    if (!name) return;
    writeAbiLibrary([{ name, abi: value }, ...library.filter((x) => x.name !== name)]);
    setSelected(name);
    toast.success(`Saved "${name}" for all EVM tools`);
  };

  const remove = () => {
    if (!selected) return;
    writeAbiLibrary(library.filter((x) => x.name !== selected));
    setSelected("");
  };

  return (
    <div className="mb-4">
      <div className="mb-1.5 flex flex-wrap items-end justify-between gap-2">
        <label className="block text-sm font-semibold">
          {label}
          <span className="ml-1 font-normal text-bodydark dark:text-bodydark2">{hint}</span>
        </label>
        <div className="flex items-center gap-2 text-sm">
          <select
            aria-label="Saved ABIs"
            className="custom-input max-w-48 py-1! text-sm"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              const item = library.find((x) => x.name === e.target.value);
              if (item) onChange(item.abi);
            }}
          >
            <option value="">{library.length ? "Saved ABIs…" : "No saved ABI"}</option>
            {library.map((x) => (
              <option key={x.name} value={x.name}>
                {x.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="cursor-pointer text-primary hover:underline disabled:cursor-default disabled:opacity-40"
            disabled={!value.trim() || !!error}
            onClick={save}
          >
            Save
          </button>
          {selected && (
            <button type="button" className="cursor-pointer text-red-500 hover:underline" onClick={remove}>
              Delete
            </button>
          )}
        </div>
      </div>
      <TextArea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        isError={!!error}
        additionalClass="w-full font-mono text-sm leading-5"
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default AbiField;
