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
    return Math.floor(date.getTime() / 1000).toString(16) + "0000000000000000";
  };

  const dateFromObjectId = function (objectId: string): Date {
    return new Date(parseInt(objectId.substring(0, 8), 16) * 1000);
  };

  const [date, setDate] = useState(new Date("2024-01-17T17:00:00.000Z"));
  const [objectId, setObjectId] = useState(objectIdFromDate(date));
  const [mObjectId, setMObjectId] = useState(objectId);
  const [errorId, setErrorId] = useState(false);

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

  const handleInputObjectId = (e: any) => {
    const value = e;
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
      setObjectId(objectIdFromDate(newDate));
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <>
      <Breadcrumb pageName="" />
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
              readOnly
              value={`ObjectId("${mObjectId}")`}
              className="w-full p-1.5 outline-none border-t border-b border-l rounded-tl-lg rounded-bl-lg border-t-bodydark border-b-bodydark dark:border-t-body dark:border-b-body border-bodydark dark:bg-graydark"
              onFocus={onFocus}
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
          <div>
            <table className="w-full">
              <tbody>
                <tr>
                  <td>Year (YYYY)</td>
                  <td>
                    <input
                      type="number"
                      value={date.getFullYear()}
                      onChange={(e) =>
                        handleInputTime(e.target.value, TypeDate.y)
                      }
                      className="w-full p-1.5 outline-none border rounded-lg border-t-bodydark border-b-bodydark dark:border-t-body dark:border-b-body border-bodydark dark:bg-graydark"
                    />
                  </td>
                </tr>
                <tr>
                  <td>Month (1-12)</td>
                  <td>
                    <input
                      type="number"
                      value={date.getMonth() + 1}
                      onChange={(e) =>
                        handleInputTime(e.target.value, TypeDate.m)
                      }
                      className="w-full p-1.5 outline-none border rounded-lg border-t-bodydark border-b-bodydark dark:border-t-body dark:border-b-body border-bodydark dark:bg-graydark"
                    />
                  </td>
                </tr>
                <tr>
                  <td>Date (1-31)</td>
                  <td>
                    <input
                      type="number"
                      value={date.getDate()}
                      onChange={(e) =>
                        handleInputTime(e.target.value, TypeDate.d)
                      }
                      className="w-full p-1.5 outline-none border rounded-lg border-t-bodydark border-b-bodydark dark:border-t-body dark:border-b-body border-bodydark dark:bg-graydark"
                    />
                  </td>
                </tr>
                <tr>
                  <td>Hours</td>
                  <td>
                    <input
                      type="number"
                      value={date.getHours()}
                      onChange={(e) =>
                        handleInputTime(e.target.value, TypeDate.h)
                      }
                      className="w-full p-1.5 outline-none border rounded-lg border-t-bodydark border-b-bodydark dark:border-t-body dark:border-b-body border-bodydark dark:bg-graydark"
                    />
                  </td>
                </tr>
                <tr>
                  <td>Minutes</td>
                  <td>
                    <input
                      type="number"
                      value={date.getMinutes()}
                      onChange={(e) =>
                        handleInputTime(e.target.value, TypeDate.min)
                      }
                      className="w-full p-1.5 outline-none border rounded-lg border-t-bodydark border-b-bodydark dark:border-t-body dark:border-b-body border-bodydark dark:bg-graydark"
                    />
                  </td>
                </tr>
                <tr>
                  <td>Seconds</td>
                  <td>
                    <input
                      type="number"
                      value={date.getSeconds()}
                      onChange={(e) =>
                        handleInputTime(e.target.value, TypeDate.s)
                      }
                      className="w-full p-1.5 outline-none border rounded-lg border-t-bodydark border-b-bodydark dark:border-t-body dark:border-b-body border-bodydark dark:bg-graydark"
                    />
                  </td>
                </tr>
                <tr>
                  <td>ISO Timestamp</td>
                  <td>
                    <input
                      type="text"
                      value={date.toISOString()}
                      onFocus={onFocus}
                      className="w-full p-1.5 outline-none border rounded-lg border-t-bodydark border-b-bodydark dark:border-t-body dark:border-b-body border-bodydark dark:bg-graydark"
                    />
                  </td>
                </tr>
                <tr>
                  <td>Unix Timestamp</td>
                  <td>
                    <input
                      type="text"
                      value={Math.round(date.getTime() / 1000)}
                      onFocus={onFocus}
                      className="w-full p-1.5 outline-none border rounded-lg border-t-bodydark border-b-bodydark dark:border-t-body dark:border-b-body border-bodydark dark:bg-graydark"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
