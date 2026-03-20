"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useState, useRef } from "react";
import Button from "@/components/Input/Button";
import { MdOutlineClear, MdDownload, MdContentCopy, MdImage } from "react-icons/md";
import { copyToClipboard } from "@/common/utils";
import Toast from "react-hot-toast";

interface FaviconSize {
  size: number;
  name: string;
  description: string;
  dataUrl?: string;
}

const FAVICON_SIZES: FaviconSize[] = [
  { size: 16, name: "favicon-16x16.png", description: "Standard favicon (small)" },
  { size: 32, name: "favicon-32x32.png", description: "Standard favicon (large)" },
  { size: 48, name: "favicon-48x48.png", description: "Windows site icon" },
  { size: 64, name: "favicon-64x64.png", description: "Windows site icon (large)" },
  { size: 96, name: "favicon-96x96.png", description: "Google TV icon" },
  { size: 128, name: "favicon-128x128.png", description: "Chrome Web Store" },
  { size: 180, name: "apple-touch-icon.png", description: "Apple Touch Icon" },
  { size: 192, name: "android-chrome-192x192.png", description: "Android Chrome" },
  { size: 512, name: "android-chrome-512x512.png", description: "Android Chrome (large)" },
];

export default function FaviconGeneratorComponent() {
  const [sourceImage, setSourceImage] = useState<string>("");
  const [favicons, setFavicons] = useState<FaviconSize[]>([]);
  const [generating, setGenerating] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [useBackground, setUseBackground] = useState(false);
  const [borderRadius, setBorderRadius] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setSourceImage(reader.result as string);
        setFavicons([]);
      };
    }
  };

  const generateFavicons = async () => {
    if (!sourceImage) return;

    setGenerating(true);

    try {
      const img = new Image();
      img.src = sourceImage;
      await new Promise((resolve) => (img.onload = resolve));

      const generatedFavicons: FaviconSize[] = [];

      for (const faviconSize of FAVICON_SIZES) {
        const canvas = document.createElement("canvas");
        canvas.width = faviconSize.size;
        canvas.height = faviconSize.size;
        const ctx = canvas.getContext("2d")!;

        // Apply background if enabled
        if (useBackground) {
          ctx.fillStyle = backgroundColor;
          if (borderRadius > 0) {
            const radius = (borderRadius / 100) * (faviconSize.size / 2);
            ctx.beginPath();
            ctx.roundRect(0, 0, faviconSize.size, faviconSize.size, radius);
            ctx.fill();
            ctx.clip();
          } else {
            ctx.fillRect(0, 0, faviconSize.size, faviconSize.size);
          }
        } else if (borderRadius > 0) {
          const radius = (borderRadius / 100) * (faviconSize.size / 2);
          ctx.beginPath();
          ctx.roundRect(0, 0, faviconSize.size, faviconSize.size, radius);
          ctx.clip();
        }

        // Calculate aspect-fit dimensions
        const aspectRatio = img.width / img.height;
        let drawWidth = faviconSize.size;
        let drawHeight = faviconSize.size;
        let offsetX = 0;
        let offsetY = 0;

        if (aspectRatio > 1) {
          drawHeight = faviconSize.size / aspectRatio;
          offsetY = (faviconSize.size - drawHeight) / 2;
        } else if (aspectRatio < 1) {
          drawWidth = faviconSize.size * aspectRatio;
          offsetX = (faviconSize.size - drawWidth) / 2;
        }

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw the image
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        generatedFavicons.push({
          ...faviconSize,
          dataUrl: canvas.toDataURL("image/png"),
        });
      }

      // Generate ICO file (16x16 and 32x32 combined)
      setFavicons(generatedFavicons);
      Toast.success("Favicons generated successfully!");
    } catch (error) {
      Toast.error("Failed to generate favicons");
    } finally {
      setGenerating(false);
    }
  };

  const downloadFavicon = (favicon: FaviconSize) => {
    if (!favicon.dataUrl) return;
    const link = document.createElement("a");
    link.download = favicon.name;
    link.href = favicon.dataUrl;
    link.click();
  };

  const downloadAll = async () => {
    // Download each file individually (simple approach without zip library)
    for (const favicon of favicons) {
      if (favicon.dataUrl) {
        const link = document.createElement("a");
        link.download = favicon.name;
        link.href = favicon.dataUrl;
        link.click();
        // Small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    Toast.success("All favicons downloaded!");
  };

  const generateHtmlCode = () => {
    return `<!-- Favicons -->
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<!-- Android Chrome -->
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">

<!-- Web App Manifest -->
<link rel="manifest" href="/site.webmanifest">`;
  };

  const generateManifest = () => {
    return JSON.stringify(
      {
        name: "Your App Name",
        short_name: "App",
        icons: [
          { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
        ],
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
      },
      null,
      2
    );
  };

  const handleClear = () => {
    setSourceImage("");
    setFavicons([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <Breadcrumb />
      <div className="max-w-5xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Generate multiple favicon sizes from a single image. All processing is done in your browser - no files are uploaded.
        </p>

        {/* Upload Section */}
        <div className="mb-6 p-6 border-2 border-dashed border-stroke dark:border-strokedark rounded-lg">
          <div className="text-center">
            <MdImage className="mx-auto mb-4 text-4xl text-bodydark2" />
            <p className="mb-4 text-sm text-body dark:text-bodydark2">
              Upload an image (PNG, JPG, SVG recommended)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              id="favicon-upload"
            />
            <label
              htmlFor="favicon-upload"
              className="inline-block px-6 py-2 bg-primary text-white rounded cursor-pointer hover:bg-opacity-90"
            >
              Choose Image
            </label>
          </div>
        </div>

        {/* Source Image Preview */}
        {sourceImage && (
          <div className="mb-6">
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Source Image</label>
                <img
                  src={sourceImage}
                  alt="Source"
                  className="max-w-32 max-h-32 rounded border border-stroke dark:border-strokedark"
                />
              </div>

              <div className="flex-1 space-y-3">
                {/* Background Color */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useBackground}
                      onChange={(e) => setUseBackground(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    Background color
                  </label>
                  {useBackground && (
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                  )}
                </div>

                {/* Border Radius */}
                <div className="flex items-center gap-3">
                  <label className="text-sm">Border radius:</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={borderRadius}
                    onChange={(e) => setBorderRadius(Number(e.target.value))}
                    className="w-32"
                  />
                  <span className="text-sm text-body dark:text-bodydark2">{borderRadius}%</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                handleOnClick={generateFavicons}
                label={generating ? "Generating..." : "Generate Favicons"}
                icon={{ icon: MdImage, position: "left", size: 18 }}
              />
              <Button
                handleOnClick={handleClear}
                label="Clear"
                type="reset"
                icon={{ icon: MdOutlineClear, position: "left", size: 18 }}
              />
              {favicons.length > 0 && (
                <Button
                  handleOnClick={downloadAll}
                  label="Download All"
                  type="outline"
                  icon={{ icon: MdDownload, position: "left", size: 18 }}
                />
              )}
            </div>
          </div>
        )}

        {/* Generated Favicons */}
        {favicons.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-4 font-medium">Generated Favicons</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {favicons.map((favicon) => (
                <div
                  key={favicon.size}
                  className="p-4 border border-stroke dark:border-strokedark rounded-lg text-center"
                >
                  <div className="mb-2 h-20 flex items-center justify-center">
                    <img
                      src={favicon.dataUrl}
                      alt={favicon.name}
                      className="max-w-full max-h-full"
                      style={{ imageRendering: favicon.size <= 32 ? "pixelated" : "auto" }}
                    />
                  </div>
                  <div className="text-xs font-medium mb-1">{favicon.size}x{favicon.size}</div>
                  <div className="text-xs text-body dark:text-bodydark2 mb-2 truncate" title={favicon.name}>
                    {favicon.name}
                  </div>
                  <button
                    onClick={() => downloadFavicon(favicon)}
                    className="text-xs text-primary hover:underline"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HTML Code */}
        {favicons.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">HTML Code</h3>
              <button
                onClick={() => copyToClipboard(generateHtmlCode())}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <MdContentCopy size={14} /> Copy
              </button>
            </div>
            <pre className="p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark text-xs overflow-x-auto">
              {generateHtmlCode()}
            </pre>
          </div>
        )}

        {/* Web Manifest */}
        {favicons.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">site.webmanifest</h3>
              <button
                onClick={() => copyToClipboard(generateManifest())}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <MdContentCopy size={14} /> Copy
              </button>
            </div>
            <pre className="p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark text-xs overflow-x-auto">
              {generateManifest()}
            </pre>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-gray-50 dark:bg-boxdark rounded border border-stroke dark:border-strokedark">
          <div className="text-sm font-medium mb-2">Favicon Sizes Explained</div>
          <ul className="text-xs text-body dark:text-bodydark2 space-y-1">
            <li>• <strong>16x16 & 32x32:</strong> Standard browser tab favicons</li>
            <li>• <strong>48x48 & 64x64:</strong> Windows site icons</li>
            <li>• <strong>180x180:</strong> Apple Touch Icon for iOS devices</li>
            <li>• <strong>192x192 & 512x512:</strong> Android Chrome and PWA icons</li>
            <li>• For best results, use a square image with at least 512x512 pixels</li>
          </ul>
        </div>
      </div>
    </>
  );
}
