"use client";
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { copyToClipboard } from "@/common/utils";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { MdContentCopy, MdRefresh } from "react-icons/md";
import toast from "react-hot-toast";

const QRCodeReaderComponent = () => {
  const [qrContent, setQrContent] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, img.width, img.height);

        if (code) {
          setQrContent(code.data);
          toast.success("QR code decoded successfully!");
        } else {
          toast.error("No QR code found in the image");
          setQrContent(null);
        }
      };
      img.src = event.target?.result as string;
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
      const ctx = canvas.getContext("2d");
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
        const code = jsQR(imageData.data, canvas.width, canvas.height);

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

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <>
      <Breadcrumb pageName="QR Code Reader" />

      <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="mb-6">
          <h2 className="mb-4 text-title-md2 font-bold text-black dark:text-white">
            QR Code Reader
          </h2>
          <p className="text-sm text-bodydark2">
            Upload an image of a QR code or use your camera to scan it
          </p>
        </div>

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
      </div>
    </>
  );
};

export default QRCodeReaderComponent;
