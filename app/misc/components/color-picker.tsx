"use client";
import { copyToClipboard } from "@/common/utils";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState, useRef, useEffect } from "react";
import Button from "@/components/Input/Button";
import TextBox from "@/components/Input/TextBox";
import { MdOutlineClear, MdColorLens } from "react-icons/md";

interface ColorFormats {
  hex: string;
  rgb: string;
  hsl: string;
  rgba: string;
  hsla: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : null;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export default function ColorPickerComponent() {
  const [color, setColor] = useState("#3C50E0");
  const [alpha, setAlpha] = useState(100);
  const [formats, setFormats] = useState<ColorFormats>({
    hex: "#3C50E0",
    rgb: "rgb(60, 80, 224)",
    hsl: "hsl(231, 75%, 56%)",
    rgba: "rgba(60, 80, 224, 1)",
    hsla: "hsla(231, 75%, 56%, 1)",
  });
  const [copied, setCopied] = useState<string | null>(null);
  const [rgbInput, setRgbInput] = useState({ r: "60", g: "80", b: "224" });
  const [hexInput, setHexInput] = useState("#3C50E0");

  const colorInputRef = useRef<HTMLInputElement>(null);
  const rgbEditingRef = useRef(false);
  const hexEditingRef = useRef(false);

  const updateFormats = (hex: string, alphaVal: number) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return;

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const alphaDecimal = alphaVal / 100;

    setFormats({
      hex: hex.toUpperCase(),
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alphaDecimal})`,
      hsla: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alphaDecimal})`,
    });
  };

  useEffect(() => {
    updateFormats(color, alpha);
    const rgb = hexToRgb(color);
    if (rgb) {
      if (!rgbEditingRef.current) {
        setRgbInput({ r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) });
      }
      if (!hexEditingRef.current) {
        setHexInput(color.toUpperCase());
      }
    }
  }, [color, alpha]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
  };

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value !== "" && !value.startsWith("#")) value = "#" + value;
    setHexInput(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setColor(value);
    }
  };

  const handleHexFocus = () => { hexEditingRef.current = true; };

  const handleHexBlur = () => {
    hexEditingRef.current = false;
    setHexInput(color.toUpperCase());
  };

  const handleRgbInput = (channel: "r" | "g" | "b", value: string) => {
    if (value !== "" && !/^\d+$/.test(value)) return;
    const newRgb = { ...rgbInput, [channel]: value };
    setRgbInput(newRgb);
    const r = parseInt(newRgb.r);
    const g = parseInt(newRgb.g);
    const b = parseInt(newRgb.b);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b) &&
      r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      const toHex = (n: number) => n.toString(16).padStart(2, "0");
      setColor(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
    }
  };

  const handleRgbFocus = () => { rgbEditingRef.current = true; };

  const handleRgbBlur = () => {
    rgbEditingRef.current = false;
    const rgb = hexToRgb(color);
    if (rgb) {
      setRgbInput({ r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) });
    }
  };

  const handleCopy = (format: keyof ColorFormats) => {
    copyToClipboard(formats[format]);
    setCopied(format);
    setTimeout(() => setCopied(null), 1500);
  };

  const reset = () => {
    setColor("#3C50E0");
    setAlpha(100);
  };

  const presetColors = [
    "#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16",
    "#22C55E", "#10B981", "#14B8A6", "#06B6D4", "#0EA5E9",
    "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7", "#D946EF",
    "#EC4899", "#F43F5E", "#78716C", "#1F2937", "#000000",
  ];

  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Pick colors and get values in multiple formats: HEX, RGB, HSL, with alpha support.
        </p>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-6">
            {/* Color Picker */}
            <div>
              <div className="mb-2">Color Picker</div>
              <div
                className="w-48 h-48 rounded-lg border-2 border-stroke dark:border-strokedark cursor-pointer overflow-hidden relative"
                onClick={() => colorInputRef.current?.click()}
              >
                <div
                  className="w-full h-full"
                  style={{ backgroundColor: color, opacity: alpha / 100 }}
                />
                <input
                  ref={colorInputRef}
                  type="color"
                  value={color}
                  onChange={handleColorChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex-1 min-w-64">
              {/* HEX Input */}
              <div className="mb-4">
                <div className="mb-2">HEX</div>
                <TextBox
                  value={hexInput}
                  onChange={handleHexInput}
                  onFocus={handleHexFocus}
                  onBlur={handleHexBlur}
                  placeholder="#000000"
                  additionalClass="w-full font-mono"
                  maxLength={7}
                />
              </div>

              {/* RGB Input */}
              <div className="mb-4">
                <div className="mb-2">RGB</div>
                <div className="flex gap-2">
                  {(["r", "g", "b"] as const).map((channel) => (
                    <div key={channel} className="flex-1">
                      <div className="text-xs text-body dark:text-bodydark2 mb-1 text-center uppercase">{channel}</div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={rgbInput[channel]}
                        onChange={(e) => handleRgbInput(channel, e.target.value)}
                        onFocus={handleRgbFocus}
                        onBlur={handleRgbBlur}
                        className="custom-input w-full text-center font-mono"
                        placeholder="0"
                        maxLength={3}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Alpha Slider */}
              <div className="mb-4">
                <div className="mb-2">Alpha: {alpha}%</div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={alpha}
                  onChange={(e) => setAlpha(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Preset Colors */}
              <div>
                <div className="mb-2">Presets</div>
                <div className="flex flex-wrap gap-1">
                  {presetColors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className="w-6 h-6 rounded border border-stroke dark:border-strokedark hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex">
            <Button
              handleOnClick={() => colorInputRef.current?.click()}
              label="Pick Color"
              additionalClass="mr-2"
              icon={{
                icon: MdColorLens,
                position: "left",
                size: 20,
              }}
            />
            <Button
              handleOnClick={reset}
              label="Reset"
              type="reset"
              additionalClass="mr-2"
              icon={{
                icon: MdOutlineClear,
                position: "left",
                size: 20,
              }}
            />
          </div>

          {/* Color Formats */}
          <div>
            <div className="my-3">Color Formats</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(Object.keys(formats) as (keyof ColorFormats)[]).map((format) => (
                <div
                  key={format}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark"
                >
                  <div>
                    <div className="text-xs text-body dark:text-bodydark2 uppercase">{format}</div>
                    <code className="font-mono text-sm">{formats[format]}</code>
                  </div>
                  <button
                    onClick={() => handleCopy(format)}
                    className={`px-3 py-1 text-xs rounded transition-colors ${copied === format
                      ? "bg-green-500 text-white"
                      : "bg-primary text-white hover:bg-opacity-90"
                      }`}
                  >
                    {copied === format ? "Copied!" : "Copy"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <div className="my-3">Preview</div>
            <div className="flex gap-4 p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
              <div
                className="w-24 h-24 rounded"
                style={{ backgroundColor: formats.hex }}
              />
              <div
                className="w-24 h-24 rounded"
                style={{ backgroundColor: formats.rgba.replace(/[\d.]+\)$/, `${alpha / 100})`) }}
              />
              <div className="flex-1">
                <div className="text-sm mb-2">Sample Text</div>
                <p style={{ color: formats.hex }}>
                  The quick brown fox jumps over the lazy dog.
                </p>
                <div
                  className="mt-2 p-2 rounded text-white text-sm"
                  style={{ backgroundColor: formats.hex }}
                >
                  Background color sample
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
