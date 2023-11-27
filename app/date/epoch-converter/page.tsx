"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useEffect, useState } from "react";
import {
  getCurrent,
  getRelativeTime,
  getTimestampUnit,
  dateFormat,
} from "../utils";
import { copyToClipboard, isNumber } from "@/common/utils";
import clsx from "clsx";
import Toast from "react-hot-toast";
const EpochConverter = () => {
  const [tickingUnixTimestamp, setTickingUnixTimestamp] =
    useState(getCurrent());
  const [intervalId, setIntervalId] = useState();
  const [meridiem, setMeridiem] = useState("AM");
  const [locale, setLocale] = useState("GMT");
  const [convertTimestampVal, setConvertTimestampVal] = useState("");

  const [inputCurrentTimestamp, setInputCurrentTimestamp] = useState("");

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

      <div className="mt-10">
        <h3 className="text-graydark dark:text-bodydark2 font-semibold text-[20px]">
          Convert Timestamp To Human Readable Date
        </h3>
        <div className="mt-4">
          <input
            maxLength={20}
            type="text"
            className="w-50 rounded border border-bodydark p-2 mx-1 outline-bodydark dark:outline-boxdark"
            value={inputCurrentTimestamp}
            onChange={(e) => handleOnChangeInputTimestamp(e.target.value)}
          />
          <button
            onClick={convertTimeStamptoHumanDate}
            type="button"
            className="m-1 rounded bg-bodydark1 dark:bg-boxdark py-2 px-4 font-medium text-graydark dark:text-bodydark2"
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
                <td>{dateFormat(parseInt(convertTimestampVal))}</td>
              </tr>
              <tr>
                <td className="font-bold">Relative</td>
                <td>{getRelativeTime(parseInt(convertTimestampVal))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-10">
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
                    className="w-15 rounded p-2 mx-1 border border-bodydark outline-bodydark dark:outline-boxdark"
                    defaultValue=""
                  />
                  -
                </td>
                <td>
                  <input
                    maxLength={4}
                    className="w-15 rounded p-2 mx-1 border border-bodydark outline-bodydark dark:outline-boxdark"
                    defaultValue=""
                  />
                  -
                </td>
                <td>
                  <input
                    maxLength={4}
                    className="w-15 rounded p-2 mx-1 border border-bodydark outline-bodydark dark:outline-boxdark"
                    defaultValue=""
                  />
                </td>
                <td>
                  <input
                    maxLength={4}
                    className="w-15 rounded p-2 mx-1 border border-bodydark outline-bodydark dark:outline-boxdark"
                    defaultValue=""
                  />
                  :
                </td>
                <td>
                  <input
                    maxLength={4}
                    className="w-15 rounded p-2 mx-1 border border-bodydark outline-bodydark dark:outline-boxdark"
                    defaultValue=""
                  />
                  :
                </td>
                <td>
                  <input
                    maxLength={4}
                    className="w-15 rounded p-2 mx-1 border border-bodydark outline-bodydark dark:outline-boxdark"
                    defaultValue=""
                  />
                </td>
                <td>
                  <select
                    className="w-16 rounded p-2 mx-1 border border-bodydark outline-bodydark dark:outline-boxdark"
                    value={meridiem}
                    onChange={(e) => setMeridiem(e.target.value)}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </td>
                <td>
                  <select
                    className="w-20 rounded p-2 mx-1 border border-bodydark outline-bodydark dark:outline-boxdark"
                    value={locale}
                    onChange={(e) => setLocale(e.target.value)}
                  >
                    <option value="AM">GMT</option>
                    <option value="PM">Local</option>
                  </select>
                </td>
                <td>
                  <button className="m-1 rounded bg-bodydark1 dark:bg-boxdark py-2 px-4 font-medium text-graydark dark:text-bodydark2">
                    Human Date to Timestamp
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
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
};

export default EpochConverter;
