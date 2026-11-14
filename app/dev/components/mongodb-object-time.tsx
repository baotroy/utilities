"use client";
import { copyToClipboard } from "@/common/utils";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import clsx from "clsx";
import { useState } from "react";
import { MdContentCopy } from "react-icons/md";

export default function MongoObjectTimeComponent() {
  enum TypeDate {
    y = "year",
    m = "month",
    d = "date",
    h = "hour",
    min = "minute",
    s = "second",
  }
  const h3Style = "text-[26px] mb-2";
  const objectIdFromDate = function (date: Date): string {
    // pad to 8 hex chars: dates before 1978 produced an invalid (short) ObjectId
    return (
      Math.floor(date.getTime() / 1000).toString(16).padStart(8, "0") +
      "0000000000000000"
    );
  };

  const dateFromObjectId = function (objectId: string): Date {
    return new Date(parseInt(objectId.substring(0, 8), 16) * 1000);
  };

  const [date, setDate] = useState(new Date("2024-01-17T17:00:00.000Z"));
  const [objectId, setObjectId] = useState(objectIdFromDate(date));
  const [mObjectId, setMObjectId] = useState(objectId);
  const [errorId, setErrorId] = useState(false);
  // Text of the second input while it is being edited; null = show the
  // ObjectId("...") form of the current id
  const [wrappedText, setWrappedText] = useState<string | null>(null);

  const handleCopy = (objectId = false) => {
    if (objectId) copyToClipboard(`ObjectId("${mObjectId}")`);
    else copyToClipboard(mObjectId);
  };

  const isMongoObjectId = (str: string): boolean => {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(str);
  };

  const onFocus = (e: any) => {
    e.target.select();
  };

  // Second input: accepts ObjectId("..."), ObjectId('...'), {"$oid":"..."}
  // or the bare 24 hex characters
  const parseWrapped = (value: string): string | null => {
    const trimmed = value.trim();
    const match =
      trimmed.match(/^(?:new\s+)?ObjectId\(\s*["']?([0-9a-fA-F]{24})["']?\s*\)$/i) ||
      trimmed.match(/^\{\s*"?\$oid"?\s*:\s*["']([0-9a-fA-F]{24})["']\s*\}$/) ||
      trimmed.match(/^["']?([0-9a-fA-F]{24})["']?$/);
    return match ? match[1] : null;
  };

  const handleInputWrapped = (value: string) => {
    setWrappedText(value);
    const id = parseWrapped(value);
    if (id) {
      setDate(dateFromObjectId(id));
      setObjectId(id);
      setMObjectId(id);
      setErrorId(false);
    }
  };

  const wrappedValue = wrappedText ?? `ObjectId("${mObjectId}")`;
  const wrappedError = wrappedText !== null && !parseWrapped(wrappedText);

  const handleInputObjectId = (e: any) => {
    const value = e;
    setWrappedText(null);
    if (isMongoObjectId(value)) {
      const date = dateFromObjectId(value);
      setDate(date);
      setMObjectId(value);
      setErrorId(false);
    } else {
      setErrorId(true);
    }
    setObjectId(value);
  };

  const handleInputTime = (value: string, type: TypeDate) => {
    if (!value) return;
    try {
      setWrappedText(null);
      const newDate = new Date(date);
      switch (type) {
        case TypeDate.y:
          newDate.setFullYear(parseInt(value));
          break;
        case TypeDate.m:
          newDate.setMonth(parseInt(value) - 1);
          break;
        case TypeDate.d:
          newDate.setDate(parseInt(value));
          break;
        case TypeDate.h:
          newDate.setHours(parseInt(value));
          break;
        case TypeDate.min:
          newDate.setMinutes(parseInt(value));
          break;
        case TypeDate.s:
          newDate.setSeconds(parseInt(value));
          break;
      }
      setDate(newDate);
      const newObjectId = objectIdFromDate(newDate);
      setObjectId(newObjectId);
      // keep the ObjectId("...") output and its copy button in sync
      setMObjectId(newObjectId);
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <>
      <Breadcrumb />
      <div className="max-w-4xl">
        <p className="mb-6 text-sm text-body dark:text-bodydark2">
          Convert MongoDB ObjectId to timestamp and vice versa. Extract date and time information from ObjectId or generate ObjectId from a specific date.
        </p>
        <div className="flex">
          <div className="w-1/2 mr-4">
            <h3 className={h3Style}>ObjectId</h3>

            <div className="flex mb-2">
              <input
                type="text"
                value={objectId}
                className={clsx(
                  "w-full p-1.5 outline-none border-t border-b border-l rounded-tl-lg rounded-bl-lg border-bodydark dark:bg-graydark",
                  errorId && "border-[#ff0000]"
                )}
                onChange={(e) => handleInputObjectId(e.target.value)}
              />
              <div className="flex">
                <span className="bg-gray-2 dark:bg-graydark border border-bodydark dark:border-body block py-2 px-4 rounded-tr-lg rounded-br-lg hover:cursor-pointer">
                  <MdContentCopy size={20} onClick={() => handleCopy(false)} />
                </span>
              </div>
            </div>

            <div className="flex">
              <input
                type="text"
                aria-label="ObjectId expression"
                spellCheck={false}
                value={wrappedValue}
                className={clsx(
                  "w-full p-1.5 outline-none border-t border-b border-l rounded-tl-lg rounded-bl-lg border-bodydark dark:bg-graydark",
                  wrappedError && "border-[#ff0000]"
                )}
                onChange={(e) => handleInputWrapped(e.target.value)}
                // back to the normalized ObjectId("...") form when leaving
                onBlur={() => setWrappedText(null)}
              />
              <div className="flex">
                <span className="bg-gray-2 dark:bg-graydark border border-bodydark dark:border-body block py-2 px-4 rounded-tr-lg rounded-br-lg hover:cursor-pointer">
                  <MdContentCopy size={20} onClick={() => handleCopy(true)} />
                </span>
              </div>
            </div>
          </div>
          <div className="w-1/2">
            <h3 className={h3Style}>Time</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="font-medium">Year (YYYY)</label>
                <input
                  type="number"
                  value={date.getFullYear()}
                  onChange={(e) =>
                    handleInputTime(e.target.value, TypeDate.y)
                  }
                  className="w-1/2 p-1.5 outline-none border rounded-lg border-t-bodydark border-b-bodydark dark:border-t-body dark:border-b-body border-bodydark dark:bg-graydark"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="font-medium">Month (1-12)</label>
                <input
                  type="number"
                  value={date.getMonth() + 1}
                  onChange={(e) =>
                    handleInputTime(e.target.value, TypeDate.m)
                  }
                  className="w-1/2 p-1.5 outline-none border rounded-lg border-t-bodydark border-b-bodydark dark:border-t-body dark:border-b-body border-bodydark dark:bg-graydark"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="font-medium">Date (1-31)</label>
                <input
                  type="number"
                  value={date.getDate()}
                  onChange={(e) =>
                    handleInputTime(e.target.value, TypeDate.d)
                  }
                  className="w-1/2 p-1.5 outline-none border rounded-lg border-t-bodydark border-b-bodydark dark:border-t-body dark:border-b-body border-bodydark dark:bg-graydark"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="font-medium">Hours</label>
                <input
                  type="number"
                  value={date.getHours()}
                  onChange={(e) =>
                    handleInputTime(e.target.value, TypeDate.h)
                  }
                  className="w-1/2 p-1.5 outline-none border rounded-lg border-t-bodydark border-b-bodydark dark:border-t-body dark:border-b-body border-bodydark dark:bg-graydark"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="font-medium">Minutes</label>
                <input
                  type="number"
                  value={date.getMinutes()}
                  onChange={(e) =>
                    handleInputTime(e.target.value, TypeDate.min)
                  }
                  className="w-1/2 p-1.5 outline-none border rounded-lg border-t-bodydark border-b-bodydark dark:border-t-body dark:border-b-body border-bodydark dark:bg-graydark"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="font-medium">Seconds</label>
                <input
                  type="number"
                  value={date.getSeconds()}
                  onChange={(e) =>
                    handleInputTime(e.target.value, TypeDate.s)
                  }
                  className="w-1/2 p-1.5 outline-none border rounded-lg border-t-bodydark border-b-bodydark dark:border-t-body dark:border-b-body border-bodydark dark:bg-graydark"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="font-medium">ISO Timestamp</label>
                <input
                  type="text"
                  value={date.toISOString()}
                  onFocus={onFocus}
                  readOnly
                  className="w-1/2 p-1.5 outline-none border rounded-lg border-t-bodydark border-b-bodydark dark:border-t-body dark:border-b-body border-bodydark dark:bg-graydark"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="font-medium">Unix Timestamp</label>
                <input
                  type="text"
                  value={Math.round(date.getTime() / 1000)}
                  onFocus={onFocus}
                  readOnly
                  className="w-1/2 p-1.5 outline-none border rounded-lg border-t-bodydark border-b-bodydark dark:border-t-body dark:border-b-body border-bodydark dark:bg-graydark"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
