"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import { Card, Field, Intro, Tabs } from "@/components/Tool/ui";
import { bytesToSize } from "@/common/utils";
import clsx from "clsx";
import { FC, useCallback, useEffect, useRef, useState } from "react";
import { MdClose, MdFileDownload, MdUploadFile } from "react-icons/md";

type OutFormat = "keep" | "image/jpeg" | "image/webp" | "image/png" | "image/avif";

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/webp": "webp", "image/png": "png", "image/avif": "avif" };

interface Item {
  id: number;
  file: File;
  status: "pending" | "done" | "error";
  out?: Blob;
  outUrl?: string;
  width?: number;
  height?: number;
  error?: string;
}

/** Browsers silently fall back to PNG for types they cannot encode. */
async function canEncode(type: string): Promise<boolean> {
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, type));
  return blob?.type === type;
}

async function compress(file: File, format: OutFormat, quality: number, maxW: number, maxH: number) {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  const scale = Math.min(1, maxW > 0 ? maxW / width : 1, maxH > 0 ? maxH / height : 1);
  width = Math.max(1, Math.round(width * scale));
  height = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const type = format === "keep" ? (EXT[file.type] ? file.type : "image/png") : format;
  if (type === "image/jpeg") {
    // JPEG has no transparency: paint white behind it
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, type, quality / 100));
  if (!blob) throw new Error("The browser could not encode this image");
  return { blob, width, height };
}

const outName = (item: Item) => {
  const base = item.file.name.replace(/\.[^.]+$/, "");
  return `${base}.${EXT[item.out?.type || ""] || "png"}`;
};

const ImageCompressorComponent: FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [format, setFormat] = useState<OutFormat>("image/webp");
  const [quality, setQuality] = useState(80);
  const [maxW, setMaxW] = useState("");
  const [maxH, setMaxH] = useState("");
  const [avif, setAvif] = useState(false);
  const [dragging, setDragging] = useState(false);
  const nextId = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    canEncode("image/avif").then(setAvif);
  }, []);

  // re-run every image when the settings change
  const runAll = useCallback(
    async (list: Item[]) => {
      for (const item of list) {
        try {
          const { blob, width, height } = await compress(item.file, format, quality, Number(maxW) || 0, Number(maxH) || 0);
          const outUrl = URL.createObjectURL(blob);
          setItems((cur) =>
            cur.map((x) => {
              if (x.id !== item.id) return x;
              if (x.outUrl) URL.revokeObjectURL(x.outUrl);
              return { ...x, status: "done", out: blob, outUrl, width, height, error: undefined };
            })
          );
        } catch (e) {
          setItems((cur) => cur.map((x) => (x.id === item.id ? { ...x, status: "error", error: (e as Error).message } : x)));
        }
      }
    },
    [format, quality, maxW, maxH]
  );

  useEffect(() => {
    const t = setTimeout(() => runAll(items), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, quality, maxW, maxH]);

  const addFiles = (files: FileList | File[]) => {
    const added = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({ id: nextId.current++, file, status: "pending" as const }));
    if (!added.length) return;
    setItems((cur) => [...cur, ...added]);
    runAll(added);
  };

  const remove = (id: number) =>
    setItems((cur) => {
      const item = cur.find((x) => x.id === id);
      if (item?.outUrl) URL.revokeObjectURL(item.outUrl);
      return cur.filter((x) => x.id !== id);
    });

  const downloadAll = () => {
    items.forEach((item, i) => {
      if (!item.outUrl) return;
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = item.outUrl!;
        a.download = outName(item);
        a.click();
      }, i * 300);
    });
  };

  const totalIn = items.reduce((s, x) => s + x.file.size, 0);
  const totalOut = items.reduce((s, x) => s + (x.out?.size || 0), 0);
  const lossless = format === "image/png" || (format === "keep" && items.every((x) => x.file.type === "image/png"));

  return (
    <>
      <Breadcrumb />
      <div className="max-w-5xl">
        <Intro>
          Shrink images or change their format. Everything happens in your browser, so the images
          never leave your computer.
        </Intro>
        <Card className="mb-4">
          <Field label="Output format">
            <Tabs
              value={format}
              onChange={setFormat}
              className="mb-0!"
              options={[
                { value: "keep", label: "Same as input" },
                { value: "image/webp", label: "WebP" },
                { value: "image/jpeg", label: "JPEG" },
                { value: "image/png", label: "PNG" },
                ...(avif ? [{ value: "image/avif" as OutFormat, label: "AVIF" }] : []),
              ]}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={`Quality: ${quality}`} hint={lossless ? "(PNG is lossless; quality has no effect)" : undefined}>
              <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full" disabled={lossless} />
            </Field>
            <Field label="Max width" hint="(px, optional)">
              <input className="custom-input w-full" inputMode="numeric" value={maxW} onChange={(e) => setMaxW(e.target.value.replace(/\D/g, ""))} placeholder="original" />
            </Field>
            <Field label="Max height" hint="(px, optional)">
              <input className="custom-input w-full" inputMode="numeric" value={maxH} onChange={(e) => setMaxH(e.target.value.replace(/\D/g, ""))} placeholder="original" />
            </Field>
          </div>
        </Card>

        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={clsx(
            "mb-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center",
            dragging ? "border-primary bg-primary/5" : "border-stroke dark:border-strokedark"
          )}
        >
          <MdUploadFile size={36} className="mb-2 text-primary" />
          <p className="font-medium">Drop images here or click to choose</p>
          <p className="text-sm text-bodydark">JPEG, PNG, WebP, GIF (first frame), AVIF, BMP</p>
          <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
        </div>

        {items.length > 0 && (
          <Card
            title={`${items.length} image${items.length > 1 ? "s" : ""}: ${bytesToSize(totalIn)} → ${bytesToSize(totalOut)}${
              totalOut ? ` (${totalOut <= totalIn ? "-" : "+"}${Math.abs(Math.round((1 - totalOut / totalIn) * 100))}%)` : ""
            }`}
            right={
              <span className="flex gap-2">
                <Button label="Clear" type="reset" handleOnClick={() => setItems([])} />
                <Button label="Download all" handleOnClick={downloadAll} />
              </span>
            }
          >
            <ul className="divide-y divide-stroke dark:divide-strokedark">
              {items.map((item) => {
                const saved = item.out ? Math.round((1 - item.out.size / item.file.size) * 100) : 0;
                return (
                  <li key={item.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                    {item.outUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.outUrl} alt="" className="h-12 w-12 rounded object-cover" />
                    ) : (
                      <span className="h-12 w-12 rounded bg-gray dark:bg-meta-4" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{item.file.name}</span>
                      <span className="text-bodydark">
                        {bytesToSize(item.file.size)}
                        {item.out && (
                          <>
                            {" → "}
                            <span className="font-semibold text-graydark dark:text-white">{bytesToSize(item.out.size)}</span>{" "}
                            <span className={saved >= 0 ? "text-green-600" : "text-red-500"}>
                              ({saved >= 0 ? `-${saved}` : `+${-saved}`}%)
                            </span>
                            {" · "}
                            {item.width}×{item.height} · {EXT[item.out.type]?.toUpperCase()}
                          </>
                        )}
                        {item.status === "pending" && " · working…"}
                        {item.error && <span className="text-red-500"> · {item.error}</span>}
                      </span>
                    </span>
                    {item.outUrl && (
                      <a href={item.outUrl} download={outName(item)} className="flex items-center gap-1 text-primary hover:underline">
                        <MdFileDownload size={18} /> Download
                      </a>
                    )}
                    <button type="button" aria-label={`Remove ${item.file.name}`} className="cursor-pointer text-bodydark hover:text-red-500" onClick={() => remove(item.id)}>
                      <MdClose size={18} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>
    </>
  );
};

export default ImageCompressorComponent;
