"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState } from "react";
import BN from "bignumber.js";

export default function NumberConversionComponent() {
  const numbers = ["Binary", "Octal", "Decimal", "Hexadecimal"] as const;
  const name2base = {
    Binary: 2,
    Octal: 8,
    Decimal: 10,
    Hexadecimal: 16,
  };
  const defaultFrom = "Decimal";
  const defaultTo = "Binary";
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [result, setResult] = useState("");
  const [error, setError] = useState(false);

  const [value, setValue] = useState("");

  const convert = () => {
    setError(false);
    try {
      const bn = BN(value, name2base[from as (typeof numbers)[number]]);
      setResult(bn.toString(name2base[to as (typeof numbers)[number]]));
    } catch (e) {
      setError(true);
      setResult("");
    }
  };

  const reset = () => {
    setValue("");
    setResult("");
  };

  const swap = () => {
    const t = from;
    setFrom(to);
    setTo(t);
    reset();
  };

  return (
    <>
      <Breadcrumb />
      <div className="w-1/2">
        <div className="flex ">
          <div className="w-1/2">From</div>
          <div className="w-1/2">To</div>
        </div>
        <div className="flex">
          <div className="w-1/2">
            <select value={from} onChange={(e) => setFrom(e.target.value)}>
              {numbers.map((number) => (
                <option key={number}>{number}</option>
              ))}
            </select>
          </div>
          <div className="w-1/2">
            <select value={to} onChange={(e) => setTo(e.target.value)}>
              {numbers.map((number) => (
                <option key={number}>{number}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="">
          <div>Enter {from.toLowerCase()} number</div>
          <div>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={error ? "bg-error" : ""}
            />
            <span>{name2base[from as (typeof numbers)[number]]}</span>
          </div>
        </div>
        <div className="flex">
          <button onClick={convert}>Convert</button>
          <button onClick={reset}>Reset</button>
          <button onClick={swap}>Swap</button>
        </div>
        <div className="">
          <div>{to} number</div>
          {/* <input type="text" value={result} readOnly /> */}
          <textarea rows={4} readOnly value={result}></textarea>
          <span>{name2base[to as (typeof numbers)[number]]}</span>
        </div>
      </div>
    </>
  );
}
