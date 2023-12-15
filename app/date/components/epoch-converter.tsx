"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useEffect, useState } from "react";
import { Metadata } from "next";
import {
  getCurrent,
  getRelativeTime,
  getTimestampUnit,
  dateFormat,
  createTimeUnix,
  getTimezoneOffsetFormat,
} from "../utils";
import { copyToClipboard, isNumber } from "@/common/utils";
import clsx from "clsx";
import Toast from "react-hot-toast";
import dayjs from "dayjs";

export const metadata: Metadata = {
  title: "Epoch Converter ",
  description:
    " Convert Timestamp To Human Readable Date. Supports Unix timestamps in seconds, milliseconds, microseconds and nanoseconds. Convert Human Readable Date To Timestamp",
  // other metadata
};

export default function EpochConverterComponent() {
  const [tickingUnixTimestamp, setTickingUnixTimestamp] =
    useState(getCurrent());
  const [intervalId, setIntervalId] = useState<NodeJS.Timer | number>(0);
  const [locale, setLocale] = useState("GMT");
  const [convertTimestampVal, setConvertTimestampVal] = useState("");
  const [inputCurrentTimestamp, setInputCurrentTimestamp] = useState("");

  const now = new Date();
  const [convertDateUnixVal, setConvertDateUnixVal] = useState("");
  const [inputYear, setInputYear] = useState(now.getFullYear().toString());
  const [inputMonth, setInputMonth] = useState((now.getMonth() + 1).toString());
  const [inputDay, setInputDay] = useState(now.getDate().toString());
  const [inputHour, setInputHour] = useState(now.getUTCHours().toString());
  const [inputMinute, setInputMinute] = useState(now.getMinutes().toString());
  const [inputSecond, setInputSecond] = useState(now.getSeconds().toString());

  useEffect(() => {
    const id = setInterval(() => {
      setTickingUnixTimestamp(getCurrent());
    }, 1000);

    
    setIntervalId(id);

    return () => clearInterval(id);
  }, []);
  const handleMouseEnter = () => {
    clearInterval(intervalId);
  };

  const handleMouseLeave = () => {
    const id = setInterval(() => {
      setTickingUnixTimestamp(getCurrent());
    }, 1000);
    
    
    setIntervalId(id);
  };

  const handleOnChangeInputTimestamp = (str: string) => {
    setInputCurrentTimestamp(str);
  };

  const convertTimeStamptoHumanDate = () => {
    if (!isNumber(inputCurrentTimestamp)) {
      Toast.error("Invalid timestamp");
      return;
    }
    setConvertTimestampVal(inputCurrentTimestamp);
  };

  const handleConvertHumanDateToTimestamp = () => {
    console.log(
      `${inputYear}-${inputMonth}-${inputDay} ${inputHour}:${inputMinute}:${inputSecond}`
    );
    if (
      !dayjs(
        `${inputYear}-${inputMonth}-${inputDay} ${inputHour}:${inputMinute}:${inputSecond}`
      ).isValid()
    ) {
      Toast.error("Invalid timestamp");
      return;
    }
    console.log(
      `${inputYear}-${inputMonth}-${inputDay} ${inputHour}:${inputMinute}:${inputSecond}`,
      locale
    );
    const unixTimestamp = createTimeUnix(
      `${inputYear}-${inputMonth}-${inputDay} ${inputHour}:${inputMinute}:${inputSecond}`,
      locale === "GMT"
    );
    setConvertDateUnixVal(unixTimestamp.toString());
  };

  const handleDateInput = (e: any, type: string) => {
    const val = e.target.value;
    if (type === "year") {
      setInputYear(val);
    } else if (type === "month") {
      setInputMonth(val);
    } else if (type === "day") {
      setInputDay(val);
    } else if (type === "hour") {
      setInputHour(val);
    } else if (type === "minute") {
      setInputMinute(val);
    } else if (type === "second") {
      setInputSecond(val);
    }
  };
  return (
    <>
      <Breadcrumb />
      <div>
        {/* The current Unix Timestamp is: */}
        <span
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => copyToClipboard(tickingUnixTimestamp.toString())}
          className="
                py-2
                m-1
                rounded
                text-stroke
                text-center
                font-bold
                inline-block
                bg-body
                text-3xl
                w-[195px]
              "
        >
          {tickingUnixTimestamp}
        </span>
      </div>
      <div className="2xl:flex">
        <div className="mt-10 2xl:w-1/2">
          <h3 className="text-graydark dark:text-bodydark2 font-semibold text-[20px]">
            Convert Timestamp To Human Readable Date
          </h3>
          <div className="mt-4">
            <input
              maxLength={20}
              type="text"
              className="w-50 rounded border border-bodydark px-2 py-[5px] outline-bodydark dark:outline-boxdark"
              value={inputCurrentTimestamp}
              onChange={(e) => handleOnChangeInputTimestamp(e.target.value)}
            />
            <button
              onClick={convertTimeStamptoHumanDate}
              type="button"
              className="m-1 rounded bg-bodydark1 dark:bg-boxdark px-2 py-[5px] font-medium text-[14px] text-graydark dark:text-bodydark2"
            >
              Convert
            </button>
            {/* <button
            type="button"
            className="m-1 rounded bg-bodydark1 dark:bg-boxdark py-2 px-4  font-medium text-graydark dark:text-bodydark2"
          >
            Reset
          </button> */}
          </div>
          <p>
            Supports Unix timestamps in seconds, milliseconds, microseconds and
            nanoseconds.
          </p>
          <div className={clsx("mt-10", !convertTimestampVal && "hidden")}>
            Assuming that this timestamp is in{" "}
            <span className="font-semibold">
              {getTimestampUnit(parseInt(convertTimestampVal))}:
            </span>
            <table>
              <tbody>
                <tr>
                  <td className="font-bold w-40">GMT</td>
                  <td>{dateFormat(parseInt(convertTimestampVal), true)}</td>
                </tr>
                <tr>
                  <td className="font-bold">Your Local Time</td>
                  <td>
                    {dateFormat(parseInt(convertTimestampVal))}{" "}
                    {getTimezoneOffsetFormat()}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold">Relative</td>
                  <td>{getRelativeTime(parseInt(convertTimestampVal))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-10 2xl:w-1/2">
          <h3 className="text-graydark dark:text-bodydark2 font-semibold text-[20px]">
            Convert Human Readable Date To Timestamp
          </h3>
          <div>
            <table>
              <thead>
                <tr>
                  <th className="font-normal">Yr</th>
                  <th className="font-normal">Mon</th>
                  <th className="font-normal">Day</th>
                  <th className="font-normal">Hr</th>
                  <th className="font-normal">Min</th>
                  <th className="font-normal">Sec</th>
                  <th></th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <input
                      maxLength={4}
                      className="w-13 rounded px-2 py-[5px] mx-0.5 border border-bodydark outline-bodydark dark:outline-boxdark text-[14px] "
                      value={inputYear}
                      onChange={(e) => handleDateInput(e, "year")}
                    />
                  </td>
                  <td>
                    <input
                      maxLength={2}
                      className="w-8.5 rounded px-2 py-[5px] mx-0.5 border border-bodydark outline-bodydark dark:outline-boxdark text-[14px]"
                      value={inputMonth}
                      onChange={(e) => handleDateInput(e, "month")}
                    />
                  </td>
                  <td>
                    <input
                      maxLength={2}
                      className="w-8.5 rounded px-2 py-[5px] mx-0.5 border border-bodydark outline-bodydark dark:outline-boxdark text-[14px]"
                      value={inputDay}
                      onChange={(e) => handleDateInput(e, "day")}
                    />
                  </td>
                  <td>
                    <input
                      maxLength={2}
                      className="w-8.5 rounded px-2 py-[5px] mx-0.5 border border-bodydark outline-bodydark dark:outline-boxdark text-[14px]"
                      value={inputHour}
                      onChange={(e) => handleDateInput(e, "hour")}
                    />
                  </td>
                  <td>
                    <input
                      maxLength={2}
                      className="w-8.5 rounded px-2 py-[5px] mx-0.5 border border-bodydark outline-bodydark dark:outline-boxdark text-[14px]"
                      value={inputMinute}
                      onChange={(e) => handleDateInput(e, "minute")}
                    />
                  </td>
                  <td>
                    <input
                      maxLength={2}
                      className="w-8.5 rounded px-2 py-[5px] mx-0.5 border border-bodydark outline-bodydark dark:outline-boxdark text-[14px]"
                      value={inputSecond}
                      onChange={(e) => handleDateInput(e, "second")}
                    />
                  </td>

                  <td>
                    <select
                      title="GMT/Local"
                      className="w-18 rounded p-2 mx-0.5 border border-bodydark outline-bodydark dark:outline-boxdark text-[14px]"
                      value={locale}
                      onChange={(e) => setLocale(e.target.value)}
                    >
                      <option value="GMT">GMT</option>
                      <option value="Local">Local</option>
                    </select>
                  </td>
                  <td>
                    <button
                      onClick={handleConvertHumanDateToTimestamp}
                      className="text-[14px] m-1 rounded bg-bodydark1 dark:bg-boxdark px-2 py-[5px] font-medium text-graydark dark:text-bodydark2"
                    >
                      Human Date to Timestamp
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className={clsx("mt-10", !convertDateUnixVal && "hidden")}>
              <table>
                <tbody>
                  <tr>
                    <td className="font-bold w-40">Unix Timestamp:</td>
                    <td>{convertDateUnixVal}</td>
                  </tr>
                  <tr>
                    <td className="font-bold w-40">GMT</td>
                    <td>{dateFormat(parseInt(convertDateUnixVal), true)}</td>
                  </tr>
                  <tr>
                    <td className="font-bold">Your Local Time</td>
                    <td>
                      {dateFormat(parseInt(convertDateUnixVal))}{" "}
                      {getTimezoneOffsetFormat()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-10">
        <table className="border-collapse border-black">
          <thead>
            <tr>
              <th className="border p-2 bg-bodydark1">Human-readable time</th>
              <th className="border p-2 bg-bodydark1">Seconds</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2">1 hour</td>
              <td className="border p-2">3600 seconds</td>
            </tr>
            <tr>
              <td className="border p-2">1 day</td>
              <td className="border p-2">86400 seconds</td>
            </tr>
            <tr>
              <td className="border p-2">1 week</td>
              <td className="border p-2">604800 seconds</td>
            </tr>
            <tr>
              <td className="border p-2">1 month (30.44 days)</td>
              <td className="border p-2">2629743 seconds</td>
            </tr>
            <tr>
              <td className="border p-2">1 year (365.24 days)</td>
              <td className="border p-2">31556926 seconds</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
