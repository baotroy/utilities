"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import { copyToClipboard } from "@/common/utils";
import { TypeAlgorithm, algorithms } from "../type";
import {
  decodeJwt,
  generateKeyPair,
  generateSecret,
  hmacBits,
  isHmac,
  isSupportedAlgorithm,
  keyKind,
  signJwt,
  textToBase64Url,
  verifyJwt,
} from "../jwt";
import clsx from "clsx";
import {
  MdCheckCircleOutline,
  MdInfoOutline,
  MdOutlineCancel,
} from "react-icons/md";

const DEFAULT_ALGORITHM: TypeAlgorithm = "HS256";
const DEFAULT_SECRET = "secret";
const DEFAULT_HEADER = { alg: DEFAULT_ALGORITHM, typ: "JWT" };
const DEFAULT_PAYLOAD = { sub: "1234567890", name: "Foo Bar", iat: 1704067200 };
// DEFAULT_HEADER + DEFAULT_PAYLOAD signed with DEFAULT_SECRET: the page is
// usable right away, without waiting for Web Crypto
const DEFAULT_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkZvbyBCYXIiLCJpYXQiOjE3MDQwNjcyMDB9.HykWzzw7vzbYZgu9JHK8ned0cgPgEvSldmaxAjKJKLg";

// The colored <pre> and the textarea above it must use exactly the same font
const EDITOR_FONT = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
  letterSpacing: "normal",
};

const TAB_SIZE = 2;
const pretty = (value: unknown) => JSON.stringify(value, null, TAB_SIZE);

interface State {
  token: string;
  headerText: string;
  payloadText: string;
  algorithm: TypeAlgorithm;
  secret: string;
  secretBase64: boolean;
  publicKey: string;
  privateKey: string;
  // key kind (see keyKind) of a pair made by "Generate": such a pair is
  // replaced automatically when the algorithm needs another kind of key
  generatedFor: string;
  // why the token could not be signed after an edit
  signError: string;
}

type Verification =
  | { status: "idle" }
  | { status: "valid" }
  | { status: "invalid"; message?: string }
  | { status: "info"; message: string };

const TIME_CLAIMS: Record<string, string> = {
  iat: "Issued at",
  nbf: "Not valid before",
  exp: "Expires",
  auth_time: "Authenticated at",
};

const CLAIM_NAMES: Record<string, string> = {
  iss: "Issuer",
  sub: "Subject",
  aud: "Audience",
  jti: "JWT ID",
};

const parseObject = (text: string): Record<string, unknown> | null => {
  try {
    const value = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : null;
  } catch {
    return null;
  }
};

const parseJson = (text: string): { ok: boolean; value?: unknown } => {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
};

// "in 3 hours" / "2 days ago"
const relativeTime = (seconds: number): string => {
  const abs = Math.abs(seconds);
  const units: [number, string][] = [
    [31536000, "year"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
    [1, "second"],
  ];
  for (const [size, name] of units) {
    if (abs >= size) {
      const n = Math.floor(abs / size);
      const text = `${n} ${name}${n > 1 ? "s" : ""}`;
      return seconds >= 0 ? `in ${text}` : `${text} ago`;
    }
  }
  return "now";
};

const fieldLabel =
  "text-xs px-3 py-2 border-x-[1.5px] border-t-[1.5px] border-stroke dark:border-strokedark flex items-center justify-between";
const fieldArea = `dark:text-graydark2 bg-white dark:bg-graydark w-full text-sm font-mono
  border-[1.5px] border-stroke dark:border-strokedark py-3 px-3 outline-none resize-y block`;
const errorArea = "bg-[#ffc4cc]! text-[#f3005b]!";
const smallButton =
  "text-xs text-primary hover:underline cursor-pointer disabled:opacity-50";

export default function JwtDecoderComponent() {
  const [state, setState] = useState<State>({
    token: DEFAULT_TOKEN,
    headerText: pretty(DEFAULT_HEADER),
    payloadText: pretty(DEFAULT_PAYLOAD),
    algorithm: DEFAULT_ALGORITHM,
    secret: DEFAULT_SECRET,
    secretBase64: false,
    publicKey: "",
    privateKey: "",
    generatedFor: "",
    signError: "",
  });
  // latest state for the async handlers (signing, key generation)
  const stateRef = useRef(state);
  const update = (patch: Partial<State>): State => {
    stateRef.current = { ...stateRef.current, ...patch };
    setState(stateRef.current);
    return stateRef.current;
  };

  const [verification, setVerification] = useState<Verification>({
    status: "idle",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  // dates depend on the visitor's time zone: render them on the client only
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const signRequest = useRef(0);

  // Build a new token from the decoded side (header, payload, key)
  const resign = async (s: State) => {
    const request = ++signRequest.current;
    const header = parseObject(s.headerText);
    const payload = parseJson(s.payloadText);
    // invalid JSON: keep the last good token, the field is marked in red
    if (!header || !payload.ok) return;

    const signingInput = `${textToBase64Url(JSON.stringify(header))}.${textToBase64Url(
      JSON.stringify(payload.value)
    )}`;
    const oldSignature = s.token.trim().split(".")[2] || "";

    if (!isSupportedAlgorithm(header.alg)) {
      update({
        token: `${signingInput}.${oldSignature}`,
        signError:
          header.alg === undefined
            ? 'The header has no "alg".'
            : `Algorithm "${String(header.alg)}" is not supported, the token was not signed again.`,
      });
      return;
    }
    try {
      const signature = await signJwt(header.alg, signingInput, s);
      if (request !== signRequest.current) return;
      update({ token: `${signingInput}.${signature}`, signError: "" });
    } catch (e) {
      if (request !== signRequest.current) return;
      update({
        token: `${signingInput}.${oldSignature}`,
        signError:
          (e instanceof Error ? e.message : "Unable to sign") +
          ". The signature was not updated.",
      });
    }
  };

  // Make sure there is a usable key pair for an asymmetric algorithm, when
  // the user has not entered keys of their own
  const withKeys = async (s: State): Promise<State> => {
    const alg = s.algorithm;
    if (isHmac(alg)) return s;
    const noKeys = !s.publicKey.trim() && !s.privateKey.trim();
    const stale = s.generatedFor !== "" && s.generatedFor !== keyKind(alg);
    if (!noKeys && !stale) return s;
    setIsGenerating(true);
    try {
      const pair = await generateKeyPair(alg);
      // the algorithm changed again while the key was being generated
      if (stateRef.current.algorithm !== alg) return stateRef.current;
      return update({ ...pair, generatedFor: keyKind(alg) });
    } catch {
      return update({
        signError: `This browser cannot generate ${keyKind(alg)} keys.`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // ------------------------------------------------------------ handlers

  // Encoded side edited: decode only, never touch what the user pasted
  const handleTokenChange = (value: string) => {
    signRequest.current++;
    const decoded = decodeJwt(value);
    const patch: Partial<State> = { token: value, signError: "" };
    if (decoded.headerText !== null) {
      patch.headerText = decoded.header
        ? pretty(decoded.header)
        : decoded.headerText;
    }
    if (decoded.payloadText !== null) {
      patch.payloadText =
        decoded.payload !== undefined
          ? pretty(decoded.payload)
          : decoded.payloadText;
    }
    if (decoded.header && isSupportedAlgorithm(decoded.header.alg)) {
      patch.algorithm = decoded.header.alg;
    }
    update(patch);
  };

  const handleHeaderChange = async (value: string) => {
    let s = update({ headerText: value });
    const header = parseObject(value);
    if (header && isSupportedAlgorithm(header.alg) && header.alg !== s.algorithm) {
      s = await withKeys(update({ algorithm: header.alg }));
    }
    resign(s);
  };

  const handlePayloadChange = (value: string) => {
    resign(update({ payloadText: value }));
  };

  const handleAlgorithmChange = async (algorithm: TypeAlgorithm) => {
    const current = stateRef.current;
    // keep the other header fields (kid, typ...), only replace "alg"
    const header = parseObject(current.headerText) || { typ: "JWT" };
    const s = update({
      algorithm,
      headerText: pretty({ ...header, alg: algorithm }),
    });
    resign(await withKeys(s));
  };

  const handleGenerateKeys = async () => {
    const alg = stateRef.current.algorithm;
    setIsGenerating(true);
    try {
      const pair = await generateKeyPair(alg);
      resign(update({ ...pair, generatedFor: keyKind(alg) }));
    } catch {
      update({ signError: `This browser cannot generate ${keyKind(alg)} keys.` });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    signRequest.current++;
    update({ token: "", headerText: "", payloadText: "", signError: "" });
  };

  const handleSample = () => {
    signRequest.current++;
    update({
      token: DEFAULT_TOKEN,
      headerText: pretty(DEFAULT_HEADER),
      payloadText: pretty(DEFAULT_PAYLOAD),
      algorithm: DEFAULT_ALGORITHM,
      secret: DEFAULT_SECRET,
      secretBase64: false,
      signError: "",
    });
  };

  // ------------------------------------------------------------ derived

  const decoded = useMemo(() => decodeJwt(state.token), [state.token]);
  const tokenAlg = decoded.header?.alg;
  const hmac = isHmac(state.algorithm);

  const headerInvalid =
    state.headerText.trim() !== "" && !parseObject(state.headerText);
  const payloadJson = useMemo(() => parseJson(state.payloadText), [state.payloadText]);
  const payloadInvalid = state.payloadText.trim() !== "" && !payloadJson.ok;

  // Verify the token exactly as it is in the Encoded box (also a pasted
  // one), with the algorithm named in its own header
  const { token, secret, secretBase64, publicKey, privateKey } = state;
  useEffect(() => {
    let cancelled = false;
    const done = (v: Verification) => {
      if (!cancelled) setVerification(v);
    };
    const d = decodeJwt(token);
    if (d.parts.length === 0) {
      done({ status: "idle" });
    } else if (d.error) {
      done({ status: "invalid", message: d.error });
    } else if (d.header?.alg === "none") {
      done({
        status: "info",
        message: 'Unsecured JWT ("alg": "none"): there is no signature to verify.',
      });
    } else if (!isSupportedAlgorithm(d.header?.alg)) {
      done({
        status: "info",
        message: `The signature cannot be verified: algorithm "${String(
          d.header?.alg
        )}" is not supported.`,
      });
    } else if (!d.parts[2]) {
      done({ status: "invalid", message: "The token has no signature." });
    } else {
      verifyJwt(
        d.header!.alg as TypeAlgorithm,
        `${d.parts[0]}.${d.parts[1]}`,
        d.parts[2],
        { secret, secretBase64, publicKey, privateKey },
        typeof d.header!.kid === "string" ? d.header!.kid : undefined
      )
        .then((ok) => done({ status: ok ? "valid" : "invalid" }))
        .catch((e) =>
          done({
            status: "info",
            message: e instanceof Error ? e.message : "Unable to verify",
          })
        );
    }
    return () => {
      cancelled = true;
    };
  }, [token, secret, secretBase64, publicKey, privateKey]);

  // Registered claims in a readable form
  const claims = useMemo(() => {
    const payload = payloadJson.ok ? payloadJson.value : null;
    if (!payload || typeof payload !== "object" || Array.isArray(payload) || now === null) {
      return [];
    }
    const rows: { key: string; label: string; text: string; warn?: boolean }[] = [];
    const nowSeconds = now / 1000;
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      if (key in TIME_CLAIMS && typeof value === "number" && isFinite(value)) {
        const date = new Date(value * 1000);
        if (isNaN(date.getTime())) continue;
        const expired = key === "exp" && value <= nowSeconds;
        const notYet = key === "nbf" && value > nowSeconds;
        rows.push({
          key,
          label: TIME_CLAIMS[key],
          text:
            `${date.toLocaleString()} (${relativeTime(value - nowSeconds)})` +
            (expired ? ", token has expired" : notYet ? ", token is not valid yet" : ""),
          warn: expired || notYet,
        });
      } else if (key in CLAIM_NAMES && (typeof value === "string" || Array.isArray(value))) {
        rows.push({
          key,
          label: CLAIM_NAMES[key],
          text: Array.isArray(value) ? value.join(", ") : value,
        });
      }
    }
    return rows;
  }, [payloadJson, now]);

  const secretBytes = useMemo(() => {
    if (!state.secretBase64) return new TextEncoder().encode(state.secret).length;
    const clean = state.secret.replace(/[\s=]/g, "");
    return Math.floor((clean.length * 3) / 4);
  }, [state.secret, state.secretBase64]);
  const weakSecret =
    hmac && secretBytes > 0 && secretBytes * 8 < hmacBits(state.algorithm);

  // Encoded token split for coloring (header.payload.signature)
  const partColors = ["text-[#fb015b]", "text-[#d63aff]", "text-[#00b9f1]"];
  const coloredToken = useMemo(() => {
    const pieces = state.token.split(".");
    return pieces.map((piece, index) => (
      <span key={index}>
        {index > 0 && <span className="text-black dark:text-white">.</span>}
        <span className={partColors[Math.min(index, 2)]}>{piece}</span>
      </span>
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.token]);

  const editorBox =
    "col-start-1 row-start-1 w-full min-h-[320px] m-0 py-3 px-4 text-sm leading-6 font-mono whitespace-pre-wrap break-all rounded-md border-[1.5px]";

  return (
    <>
      <Breadcrumb />
      <div className="w-full">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Decode, verify and generate JSON Web Tokens. Supports HMAC (HS256/384/512), RSA
          (RS256/384/512, PS256/384/512), ECDSA (ES256/384/512) and EdDSA (Ed25519).
          Everything runs in your browser, tokens and keys are never sent anywhere.
        </p>
        <div className="mb-4 flex flex-wrap items-center gap-y-2">
          <label htmlFor="jwt-algorithm">Algorithm</label>
          <select
            id="jwt-algorithm"
            value={state.algorithm}
            onChange={(e) => handleAlgorithmChange(e.target.value as TypeAlgorithm)}
            className="rounded p-2 mx-3 border border-bodydark outline-bodydark dark:outline-boxdark dark:bg-body text-[14px] dark:text-bodydark1"
          >
            {algorithms.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {tokenAlg !== undefined && tokenAlg !== state.algorithm && (
            <span className="text-sm text-warning">
              The token header says &quot;{String(tokenAlg)}&quot;
            </span>
          )}
        </div>
        <div className="flex flex-col lg:flex-row w-full gap-4">
          <div className="w-full lg:w-1/2 min-w-0">
            <div className="flex items-end justify-between mb-2">
              <h3 className="text-[26px]">Encoded</h3>
              <div>
                <Button label="Sample" type="outline" additionalClass="mr-2" handleOnClick={handleSample} />
                <Button label="Clear" type="reset" additionalClass="mr-2" handleOnClick={handleClear} />
                <Button label="Copy" type="success" handleOnClick={() => copyToClipboard(state.token.trim())} />
              </div>
            </div>
            {/* colored text below a transparent textarea of the same size */}
            <div className="grid">
              <pre
                aria-hidden
                style={EDITOR_FONT}
                className={clsx(
                  editorBox,
                  "bg-white dark:bg-graydark border-stroke dark:border-strokedark"
                )}
              >
                {coloredToken}
                {"\n"}
              </pre>
              <textarea
                aria-label="Encoded JWT"
                style={EDITOR_FONT}
                placeholder="Paste a JWT here"
                value={state.token}
                onChange={(e) => handleTokenChange(e.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                className={clsx(
                  editorBox,
                  "h-full resize-none overflow-hidden bg-transparent text-transparent caret-black dark:caret-white border-transparent outline-none placeholder:text-bodydark"
                )}
              ></textarea>
            </div>
            {state.signError && (
              <p className="mt-2 text-sm text-warning">{state.signError}</p>
            )}
            <p
              role="status"
              className={clsx(
                "mt-3 text-[20px]",
                verification.status === "valid" && "text-success",
                verification.status === "invalid" && "text-danger",
                verification.status === "info" && "text-warning"
              )}
            >
              {verification.status === "valid" && (
                <span className="flex items-center">
                  <MdCheckCircleOutline className="shrink-0" />
                  &nbsp;Signature Verified
                </span>
              )}
              {verification.status === "invalid" && (
                <span className="flex items-center">
                  <MdOutlineCancel className="shrink-0" />
                  &nbsp;{verification.message ? "Invalid JWT" : "Invalid Signature"}
                </span>
              )}
              {verification.status === "info" && (
                <span className="flex items-center">
                  <MdInfoOutline className="shrink-0" />
                  &nbsp;Signature not verified
                </span>
              )}
            </p>
            {verification.status !== "idle" &&
              verification.status !== "valid" &&
              verification.message && (
                <p className="text-sm text-body dark:text-bodydark2">
                  {verification.message}
                </p>
              )}
          </div>

          <div className="w-full lg:w-1/2 min-w-0">
            <h3 className="text-[26px] mb-2">Decoded</h3>
            <div>
              <p className={fieldLabel}>
                <span className={partColors[0]}>HEADER: ALGORITHM &amp; TOKEN TYPE</span>
                <button type="button" className={smallButton} onClick={() => copyToClipboard(state.headerText)}>
                  Copy
                </button>
              </p>
              <textarea
                rows={5}
                aria-label="Header"
                value={state.headerText}
                onChange={(e) => handleHeaderChange(e.target.value)}
                spellCheck={false}
                className={clsx(fieldArea, headerInvalid && errorArea)}
              ></textarea>
            </div>
            <div>
              <p className={clsx(fieldLabel, "border-t-0")}>
                <span className={partColors[1]}>PAYLOAD: DATA</span>
                <button type="button" className={smallButton} onClick={() => copyToClipboard(state.payloadText)}>
                  Copy
                </button>
              </p>
              <textarea
                rows={8}
                aria-label="Payload"
                value={state.payloadText}
                onChange={(e) => handlePayloadChange(e.target.value)}
                spellCheck={false}
                className={clsx(fieldArea, payloadInvalid && errorArea)}
              ></textarea>
              {claims.length > 0 && (
                <dl className="border-x-[1.5px] border-stroke dark:border-strokedark px-3 py-2 text-xs">
                  {claims.map((claim) => (
                    <div key={claim.key} className="flex gap-2 py-0.5">
                      <dt className="w-36 shrink-0 text-body dark:text-bodydark2">
                        {claim.label} <span className="font-mono">({claim.key})</span>
                      </dt>
                      <dd className={clsx("break-all", claim.warn && "text-danger")}>
                        {claim.text}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
            <div>
              <p className={clsx(fieldLabel, claims.length === 0 && "border-t-0")}>
                <span className={partColors[2]}>
                  VERIFY SIGNATURE{hmac ? ": SECRET" : `: ${keyKind(state.algorithm)} KEY`}
                </span>
                {hmac ? (
                  <button
                    type="button"
                    className={smallButton}
                    onClick={() =>
                      resign(
                        update({
                          secret: generateSecret(stateRef.current.algorithm),
                          secretBase64: true,
                        })
                      )
                    }
                  >
                    Generate secret
                  </button>
                ) : (
                  <button
                    type="button"
                    className={smallButton}
                    disabled={isGenerating}
                    onClick={handleGenerateKeys}
                  >
                    {isGenerating ? "Generating..." : "Generate key pair"}
                  </button>
                )}
              </p>
              {hmac ? (
                <>
                  <textarea
                    rows={3}
                    aria-label="Secret"
                    placeholder="Secret used to sign and verify"
                    value={state.secret}
                    spellCheck={false}
                    onChange={(e) => resign(update({ secret: e.target.value }))}
                    className={fieldArea}
                  ></textarea>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.secretBase64}
                        onChange={(e) =>
                          resign(update({ secretBase64: e.target.checked }))
                        }
                      />
                      Secret is base64 encoded
                    </label>
                    {weakSecret && (
                      <span className="text-warning">
                        Weak secret: {secretBytes * 8} bits, {state.algorithm} should use at
                        least {hmacBits(state.algorithm)}.
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <textarea
                    rows={6}
                    aria-label="Public key"
                    placeholder={
                      "Public key to verify the signature, PEM or JWK\n-----BEGIN PUBLIC KEY-----"
                    }
                    value={state.publicKey}
                    spellCheck={false}
                    onChange={(e) =>
                      update({ publicKey: e.target.value, generatedFor: "" })
                    }
                    className={fieldArea}
                  ></textarea>
                  <textarea
                    rows={6}
                    aria-label="Private key"
                    placeholder={
                      "Private key to sign after editing (optional), PEM or JWK\n-----BEGIN PRIVATE KEY-----"
                    }
                    value={state.privateKey}
                    spellCheck={false}
                    onChange={(e) =>
                      resign(update({ privateKey: e.target.value, generatedFor: "" }))
                    }
                    className={clsx(fieldArea, "border-t-0")}
                  ></textarea>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
