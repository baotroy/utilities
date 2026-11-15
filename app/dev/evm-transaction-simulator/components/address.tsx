"use client";
import clsx from "clsx";
import { FC, Fragment, createContext, useContext } from "react";
import { fmtValue, shortAddr } from "./utils";

/** Block explorer base URL of the selected chain (e.g. https://etherscan.io) */
export const ExplorerContext = createContext<string | undefined>(undefined);

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
export const isAddressString = (v: unknown): v is string =>
  typeof v === "string" && ADDRESS_RE.test(v);

interface AddressLinkProps {
  address: string;
  /** show 0x1234…abcd instead of the full address */
  short?: boolean;
  className?: string;
}

/** An address that opens its page on the selected chain's block explorer. */
export const AddressLink: FC<AddressLinkProps> = ({ address, short, className }) => {
  const explorer = useContext(ExplorerContext);
  const text = short ? shortAddr(address) : address;
  if (!explorer) {
    return (
      <span className={clsx("font-mono", !short && "break-all", className)} title={address}>
        {text}
      </span>
    );
  }
  return (
    <a
      href={`${explorer}/address/${address}`}
      target="_blank"
      rel="noreferrer"
      className={clsx("font-mono text-primary hover:underline", !short && "break-all", className)}
      title={`${address} — open on ${explorer.replace(/^https?:\/\//, "")}`}
    >
      {text}
    </a>
  );
};

/**
 * Renders a decoded value, turning every address inside it (also inside
 * arrays and structs) into an explorer link.
 */
export const ValueView: FC<{ value: unknown; short?: boolean }> = ({ value, short }) => {
  if (isAddressString(value)) return <AddressLink address={value} short={short} />;
  if (Array.isArray(value)) {
    return (
      <>
        [
        {value.map((v, i) => (
          <Fragment key={i}>
            {i > 0 && ", "}
            <ValueView value={v} short={short} />
          </Fragment>
        ))}
        ]
      </>
    );
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <>
        {"{"}
        {entries.map(([k, v], i) => (
          <Fragment key={k}>
            {i > 0 && ", "}
            {k}: <ValueView value={v} short={short} />
          </Fragment>
        ))}
        {"}"}
      </>
    );
  }
  return <>{fmtValue(value)}</>;
};
