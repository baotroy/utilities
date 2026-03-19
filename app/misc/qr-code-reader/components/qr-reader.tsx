"use client";
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { copyToClipboard } from "@/common/utils";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import QRCode from "qrcode";
import { MdContentCopy, MdRefresh, MdDownload } from "react-icons/md";
import toast from "react-hot-toast";

const QRCodeReaderComponent = () => {
  // Reader states
  const [qrContent, setQrContent] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  // Generator states
  const [generatorInput, setGeneratorInput] = useState("");
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<"reader" | "generator">("reader");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const generatorCanvasRef = useRef<HTMLCanvasElement>(null);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return;

          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);

          // Ensure we have the correct data format for jsQR
          const data = new Uint8ClampedArray(imageData.data);
          const code = jsQR(data, img.width, img.height);

          if (code) {
            setQrContent(code.data);
            toast.success("QR code decoded successfully!");
          } else {
            toast.error("No QR code found in the image. Make sure the QR code is clearly visible.");
            setQrContent(null);
          }
        } catch (error) {
          console.error("Error processing image:", error);
          toast.error("Error processing image. Please try another image.");
          setQrContent(null);
        }
      };
      img.onerror = () => {
        toast.error("Failed to load image. Please try another file.");
        setQrContent(null);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      toast.error("Error reading file");
      setQrContent(null);
    };
    reader.readAsDataURL(file);
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setIsScanning(true);
        scanFrame();
      }
    } catch (err) {
      toast.error("Unable to access camera");
      console.error(err);
    }
  };

  // Scan frame from video
  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      try {
        const imageData = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        const data = new Uint8ClampedArray(imageData.data);
        const code = jsQR(data, canvas.width, canvas.height);

        if (code) {
          setQrContent(code.data);
          toast.success("QR code detected!");
          stopCamera();
          return;
        }
      } catch (e) {
        // Continue scanning
      }
    }

    if (isScanning) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setCameraActive(false);
      setIsScanning(false);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleCopy = () => {
    if (qrContent) {
      copyToClipboard(qrContent);
    }
  };

  const handleReset = () => {
    setQrContent(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Generator functions
  const handleGeneratorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGeneratorInput(e.target.value);
  };

  const generateQRCode = async (text: string) => {
    try {
      const canvas = generatorCanvasRef.current;
      if (!canvas) return;
      await QRCode.toCanvas(canvas, text, { width: 256, margin: 2 });
      setGeneratedQR(text);
    } catch (err) {
      toast.error("Failed to generate QR code");
      console.error(err);
    }
  };

  const handleGenerateClick = () => {
    if (!generatorInput.trim()) {
      toast.error("Please enter text or URL");
      return;
    }
    generateQRCode(generatorInput);
  };

  const downloadQRCode = () => {
    const canvas = generatorCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "qrcode.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const clearGenerator = () => {
    setGeneratorInput("");
    setGeneratedQR(null);
    const canvas = generatorCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <>
      <Breadcrumb />
      <p className="mb-6 text-sm text-body dark:text-bodydark2">
        Read QR codes from images or camera, or generate QR codes from text
      </p>

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-4 border-b border-stroke dark:border-strokedark">
        <button
          onClick={() => {
            setActiveTab("reader");
            stopCamera();
            handleReset();
          }}
          className={`pb-4 px-4 font-medium transition-colors ${activeTab === "reader"
            ? "border-b-2 border-primary text-primary"
            : "text-bodydark2"
            }`}
        >
          Reader
        </button>
        <button
          onClick={() => {
            setActiveTab("generator");
            stopCamera();
            handleReset();
          }}
          className={`pb-4 px-4 font-medium transition-colors ${activeTab === "generator"
            ? "border-b-2 border-primary text-primary"
            : "text-bodydark2"
            }`}
        >
          Generator
        </button>
      </div>

      {/* Reader Section */}
      {activeTab === "reader" && (
        <>
          {/* Tabs */}
          <div className="mb-6 flex gap-4 border-b border-stroke dark:border-strokedark">
            <button
              onClick={() => {
                stopCamera();
                handleReset();
              }}
              className={`pb-4 px-4 font-medium transition-colors ${!cameraActive
                ? "border-b-2 border-primary text-primary"
                : "text-bodydark2"
                }`}
            >
              Upload Image
            </button>
            <button
              onClick={() => {
                if (!cameraActive) {
                  handleReset();
                }
              }}
              className={`pb-4 px-4 font-medium transition-colors ${cameraActive
                ? "border-b-2 border-primary text-primary"
                : "text-bodydark2"
                }`}
            >
              Camera Scan
            </button>
          </div>

          {/* Upload Section */}
          {!cameraActive && (
            <div className="mb-6">
              <div className="mb-4.5 flex items-center justify-center rounded-lg border-2 border-dashed border-stroke bg-gray-1 p-6 dark:border-strokedark dark:bg-meta-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  className="hidden"
                  id="qr-upload"
                />
                <label
                  htmlFor="qr-upload"
                  className="flex cursor-pointer flex-col items-center justify-center"
                >
                  <svg
                    className="mb-2 h-10 w-10 text-bodydark2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <p className="text-sm font-medium text-bodydark">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-bodydark2">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </label>
              </div>
            </div>
          )}

          {/* Camera Section */}
          {!qrContent && (
            <div className="mb-6">
              <button
                onClick={cameraActive ? stopCamera : startCamera}
                className="w-full rounded-md bg-primary px-4 py-2.5 text-center font-medium text-white hover:bg-opacity-90"
              >
                {cameraActive ? "Stop Camera" : "Start Camera Scan"}
              </button>
            </div>
          )}

          {/* Video Element */}
          {cameraActive && (
            <div className="mb-6">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg border border-stroke dark:border-strokedark"
                style={{ maxHeight: "400px", objectFit: "cover" }}
              />
              <canvas
                ref={canvasRef}
                className="hidden"
                width={640}
                height={480}
              />
            </div>
          )}

          {/* Result Section */}
          {qrContent && (
            <div className="rounded-lg bg-green-50 p-6 dark:bg-meta-9">
              <div className="mb-4">
                <h3 className="mb-2 font-medium text-black dark:text-white">
                  QR Code Content:
                </h3>
                <div className="break-all rounded-lg bg-white p-4 font-mono text-sm text-bodydark dark:bg-boxdark dark:text-bodydark2">
                  {qrContent}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-center font-medium text-white hover:bg-opacity-90"
                >
                  <MdContentCopy className="h-5 w-5" />
                  Copy
                </button>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-primary px-4 py-2.5 text-center font-medium text-primary hover:bg-opacity-90"
                >
                  <MdRefresh className="h-5 w-5" />
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Info Box */}
          {qrContent === null && !cameraActive && (
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-bodydark dark:bg-meta-4 dark:text-bodydark2">
              <p className="font-medium">How to use:</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Upload an image containing a QR code, or</li>
                <li>
                  Click "Start Camera Scan" to scan a QR code using your camera
                </li>
                <li>The decoded content will be displayed automatically</li>
              </ul>
            </div>
          )}
        </>
      )}

      {/* Generator Section */}
      {activeTab === "generator" && (
        <>
          <div className="mb-6">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              Enter Text or URL
            </label>
            <input
              type="text"
              placeholder="Enter text or URL to generate QR code"
              value={generatorInput}
              onChange={handleGeneratorInputChange}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleGenerateClick();
                }
              }}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition placeholder:text-bodydark2 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>

          <div className="mb-6 flex gap-3">
            <button
              onClick={handleGenerateClick}
              className="flex-1 rounded-md bg-primary px-4 py-2.5 text-center font-medium text-white hover:bg-opacity-90"
            >
              Generate QR Code
            </button>
            <button
              onClick={clearGenerator}
              className="rounded-md border border-primary px-4 py-2.5 text-center font-medium text-primary hover:bg-opacity-90"
            >
              Clear
            </button>
          </div>

          {/* Generated QR Code */}
          {generatedQR && (
            <div className="mb-6 rounded-lg bg-blue-50 p-6 dark:bg-meta-4">
              <h3 className="mb-4 font-medium text-black dark:text-white">
                Generated QR Code
              </h3>
              <div className="mb-4 flex justify-center">
                <canvas
                  ref={generatorCanvasRef}
                  className="rounded-lg border border-stroke dark:border-strokedark"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={downloadQRCode}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-center font-medium text-white hover:bg-opacity-90"
                >
                  <MdDownload className="h-5 w-5" />
                  Download
                </button>
                <button
                  onClick={() => {
                    if (generatedQR) {
                      copyToClipboard(generatedQR);
                    }
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-primary px-4 py-2.5 text-center font-medium text-primary hover:bg-opacity-90"
                >
                  <MdContentCopy className="h-5 w-5" />
                  Copy Text
                </button>
              </div>
            </div>
          )}

          {/* Info Box */}
          {!generatedQR && (
            <div className="rounded-lg bg-green-50 p-4 text-sm text-bodydark dark:bg-meta-9 dark:text-bodydark2">
              <p className="font-medium">How to use:</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Enter any text or URL in the input field</li>
                <li>Click "Generate QR Code" to create the QR code</li>
                <li>Download the QR code as an image or copy the text</li>
              </ul>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default QRCodeReaderComponent;
