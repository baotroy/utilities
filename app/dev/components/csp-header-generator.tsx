"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState } from "react";
import { copyToClipboard } from "@/common/utils";
import clsx from "clsx";

interface DirectiveConfig {
  key: string;
  label: string;
  description: string;
  commonValues: string[];
}

const DIRECTIVES: DirectiveConfig[] = [
  {
    key: "default-src",
    label: "default-src",
    description: "Fallback for other fetch directives",
    commonValues: ["'self'", "'none'", "*", "https:", "data:", "blob:"],
  },
  {
    key: "script-src",
    label: "script-src",
    description: "Valid sources for JavaScript",
    commonValues: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'strict-dynamic'", "'nonce-{random}'", "https:", "blob:"],
  },
  {
    key: "style-src",
    label: "style-src",
    description: "Valid sources for stylesheets",
    commonValues: ["'self'", "'unsafe-inline'", "https:", "data:"],
  },
  {
    key: "img-src",
    label: "img-src",
    description: "Valid sources for images",
    commonValues: ["'self'", "data:", "blob:", "https:", "*"],
  },
  {
    key: "font-src",
    label: "font-src",
    description: "Valid sources for fonts",
    commonValues: ["'self'", "data:", "https:"],
  },
  {
    key: "connect-src",
    label: "connect-src",
    description: "Valid sources for fetch, XHR, WebSocket",
    commonValues: ["'self'", "https:", "wss:", "*"],
  },
  {
    key: "media-src",
    label: "media-src",
    description: "Valid sources for audio/video",
    commonValues: ["'self'", "https:", "blob:", "data:"],
  },
  {
    key: "object-src",
    label: "object-src",
    description: "Valid sources for plugins (object, embed, applet)",
    commonValues: ["'none'", "'self'"],
  },
  {
    key: "frame-src",
    label: "frame-src",
    description: "Valid sources for frames",
    commonValues: ["'self'", "'none'", "https:"],
  },
  {
    key: "child-src",
    label: "child-src",
    description: "Valid sources for web workers and nested contexts",
    commonValues: ["'self'", "'none'", "blob:"],
  },
  {
    key: "worker-src",
    label: "worker-src",
    description: "Valid sources for Worker, SharedWorker, ServiceWorker",
    commonValues: ["'self'", "'none'", "blob:"],
  },
  {
    key: "frame-ancestors",
    label: "frame-ancestors",
    description: "Valid parents that can embed this page",
    commonValues: ["'self'", "'none'", "https:"],
  },
  {
    key: "form-action",
    label: "form-action",
    description: "Valid targets for form submissions",
    commonValues: ["'self'", "'none'", "https:"],
  },
  {
    key: "base-uri",
    label: "base-uri",
    description: "Valid URLs for the base element",
    commonValues: ["'self'", "'none'"],
  },
  {
    key: "manifest-src",
    label: "manifest-src",
    description: "Valid sources for application manifests",
    commonValues: ["'self'", "'none'"],
  },
  {
    key: "upgrade-insecure-requests",
    label: "upgrade-insecure-requests",
    description: "Upgrade HTTP to HTTPS (no value needed)",
    commonValues: [],
  },
  {
    key: "block-all-mixed-content",
    label: "block-all-mixed-content",
    description: "Block loading of mixed content (no value needed)",
    commonValues: [],
  },
];

const NO_VALUE_DIRECTIVES = ["upgrade-insecure-requests", "block-all-mixed-content"];

interface DirectiveState {
  enabled: boolean;
  values: string[];
  customValue: string;
}

type DirectivesMap = Record<string, DirectiveState>;

function buildInitialState(): DirectivesMap {
  const state: DirectivesMap = {};
  for (const d of DIRECTIVES) {
    state[d.key] = { enabled: false, values: [], customValue: "" };
  }
  return state;
}

function generateCSP(directives: DirectivesMap): string {
  const parts: string[] = [];
  for (const d of DIRECTIVES) {
    const state = directives[d.key];
    if (!state.enabled) continue;
    if (NO_VALUE_DIRECTIVES.includes(d.key)) {
      parts.push(d.key);
    } else if (state.values.length > 0) {
      parts.push(`${d.key} ${state.values.join(" ")}`);
    }
  }
  return parts.join("; ");
}

function parseCSP(header: string): DirectivesMap {
  const state = buildInitialState();
  const parts = header.split(";").map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const tokens = part.split(/\s+/);
    const key = tokens[0];
    if (state[key] !== undefined) {
      state[key].enabled = true;
      if (!NO_VALUE_DIRECTIVES.includes(key)) {
        state[key].values = tokens.slice(1);
      }
    }
  }
  return state;
}

const PRESETS: { label: string; csp: string }[] = [
  {
    label: "Strict (recommended)",
    csp: "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
  },
  {
    label: "Moderate",
    csp: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; upgrade-insecure-requests",
  },
  {
    label: "Allow CDNs",
    csp: "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; upgrade-insecure-requests",
  },
];

export default function CspHeaderGeneratorComponent() {
  const [directives, setDirectives] = useState<DirectivesMap>(buildInitialState);
  const [importValue, setImportValue] = useState("");

  const cspOutput = generateCSP(directives);

  const toggleDirective = (key: string) => {
    setDirectives((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
  };

  const toggleValue = (directiveKey: string, value: string) => {
    setDirectives((prev) => {
      const current = prev[directiveKey];
      const values = current.values.includes(value)
        ? current.values.filter((v) => v !== value)
        : [...current.values, value];
      return { ...prev, [directiveKey]: { ...current, values } };
    });
  };

  const addCustomValue = (directiveKey: string) => {
    const custom = directives[directiveKey].customValue.trim();
    if (!custom) return;
    setDirectives((prev) => {
      const current = prev[directiveKey];
      if (current.values.includes(custom)) return prev;
      return {
        ...prev,
        [directiveKey]: { ...current, values: [...current.values, custom], customValue: "" },
      };
    });
  };

  const removeValue = (directiveKey: string, value: string) => {
    setDirectives((prev) => {
      const current = prev[directiveKey];
      return {
        ...prev,
        [directiveKey]: { ...current, values: current.values.filter((v) => v !== value) },
      };
    });
  };

  const handleImport = () => {
    const cleaned = importValue.replace(/^Content-Security-Policy:\s*/i, "").trim();
    if (!cleaned) return;
    setDirectives(parseCSP(cleaned));
    setImportValue("");
  };

  const applyPreset = (csp: string) => {
    setDirectives(parseCSP(csp));
  };

  const handleReset = () => {
    setDirectives(buildInitialState());
  };

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Visually build Content-Security-Policy headers. Toggle directives, pick sources, and copy the result.
        </p>

        {/* Import existing CSP */}
        <div className="mb-6">
          <label className="font-semibold text-sm mb-2 block">Import Existing CSP</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={importValue}
              onChange={(e) => setImportValue(e.target.value)}
              placeholder="Paste an existing CSP header to edit..."
              className="custom-input flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleImport()}
            />
            <button
              onClick={handleImport}
              className="custom-button primary whitespace-nowrap"
            >
              Import
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="mb-6">
          <label className="font-semibold text-sm mb-2 block">Presets</label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset.csp)}
                className="px-3 py-1.5 rounded border text-sm transition-colors bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-primary"
              >
                {preset.label}
              </button>
            ))}
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded border text-sm transition-colors bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-danger text-danger"
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Generated Output */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="font-semibold text-sm">Generated CSP Header</label>
            <button
              onClick={() => copyToClipboard(cspOutput)}
              className="text-sm text-primary hover:underline"
            >
              Copy
            </button>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark min-h-15">
            {cspOutput ? (
              <code className="text-sm font-mono break-all whitespace-pre-wrap">{cspOutput}</code>
            ) : (
              <span className="text-sm text-bodydark dark:text-bodydark2">
                Enable directives below to generate a CSP header
              </span>
            )}
          </div>
          {cspOutput && (
            <div className="mt-2">
              <button
                onClick={() => copyToClipboard(`Content-Security-Policy: ${cspOutput}`)}
                className="text-xs text-primary hover:underline"
              >
                Copy as HTTP header
              </button>
              <span className="mx-2 text-bodydark">|</span>
              <button
                onClick={() =>
                  copyToClipboard(`<meta http-equiv="Content-Security-Policy" content="${cspOutput}">`)
                }
                className="text-xs text-primary hover:underline"
              >
                Copy as meta tag
              </button>
            </div>
          )}
        </div>

        {/* Directives */}
        <div className="space-y-3">
          <label className="font-semibold text-sm block">Directives</label>
          {DIRECTIVES.map((directive) => {
            const state = directives[directive.key];
            const isNoValue = NO_VALUE_DIRECTIVES.includes(directive.key);
            return (
              <div
                key={directive.key}
                className={clsx(
                  "p-4 rounded border transition-colors",
                  state.enabled
                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                    : "border-stroke dark:border-strokedark"
                )}
              >
                {/* Directive header */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.enabled}
                      onChange={() => toggleDirective(directive.key)}
                      className="w-4 h-4"
                    />
                    <div>
                      <span className="font-mono text-sm font-semibold">{directive.label}</span>
                      <p className="text-xs text-bodydark dark:text-bodydark2">
                        {directive.description}
                      </p>
                    </div>
                  </label>
                </div>

                {/* Values selection */}
                {state.enabled && !isNoValue && (
                  <div className="mt-3 ml-7">
                    {/* Common values as toggleable chips */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {directive.commonValues.map((val) => (
                        <button
                          key={val}
                          onClick={() => toggleValue(directive.key, val)}
                          className={clsx(
                            "px-2 py-1 rounded text-xs font-mono border transition-colors",
                            state.values.includes(val)
                              ? "bg-primary text-white border-primary"
                              : "bg-white dark:bg-boxdark border-stroke dark:border-strokedark hover:border-primary"
                          )}
                        >
                          {val}
                        </button>
                      ))}
                    </div>

                    {/* Current values */}
                    {state.values.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {state.values
                          .filter((v) => !directive.commonValues.includes(v))
                          .map((val) => (
                            <span
                              key={val}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-bodydark/10 dark:bg-body/20"
                            >
                              {val}
                              <button
                                onClick={() => removeValue(directive.key, val)}
                                className="text-danger hover:text-red-700 ml-1"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                      </div>
                    )}

                    {/* Custom value input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={state.customValue}
                        onChange={(e) =>
                          setDirectives((prev) => ({
                            ...prev,
                            [directive.key]: { ...prev[directive.key], customValue: e.target.value },
                          }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && addCustomValue(directive.key)}
                        placeholder="Add custom domain or value..."
                        className="custom-input flex-1 text-xs"
                      />
                      <button
                        onClick={() => addCustomValue(directive.key)}
                        className="px-3 py-1 text-xs rounded border border-stroke dark:border-strokedark hover:border-primary"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Reference */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
          <div className="text-sm font-medium mb-2">CSP Quick Reference</div>
          <ul className="text-xs text-body dark:text-bodydark2 space-y-1">
            <li><strong>&apos;self&apos;</strong> — Same origin only (scheme + host + port)</li>
            <li><strong>&apos;none&apos;</strong> — Block everything for this directive</li>
            <li><strong>&apos;unsafe-inline&apos;</strong> — Allow inline scripts/styles (weakens CSP)</li>
            <li><strong>&apos;unsafe-eval&apos;</strong> — Allow eval() and similar (weakens CSP)</li>
            <li><strong>&apos;strict-dynamic&apos;</strong> — Trust scripts loaded by already-trusted scripts</li>
            <li><strong>https:</strong> — Allow any HTTPS source</li>
            <li><strong>data:</strong> — Allow data: URIs (use cautiously)</li>
            <li><strong>blob:</strong> — Allow blob: URIs</li>
          </ul>
        </div>
      </div>
    </>
  );
}
