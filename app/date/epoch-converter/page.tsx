"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useEffect, useState } from "react";
import {
  getCurrent,
  getRelativeTime,
  getTimestampUnit,
  dateFormat,
} from "../utils";
const EpochConverter = () => {
  const [tickingUnixTimestamp, setTickingUnixTimestamp] =
    useState(getCurrent());
  const [intervalId, setIntervalId] = useState();
  const [meridiem, setMeridiem] = useState("AM");
  const [locale, setLocale] = useState("GMT");

  const [currentTimestamp, setCurrentTimestamp] = useState(getCurrent());

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

  return (
    <>
      <Breadcrumb />
      <div>
        The current Unix Timestamp is:
        <span
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="
                p-2
                m-1
                rounded
                text-stroke
                font-bold
                inline-block
                bg-body
              "
        >
          {tickingUnixTimestamp}
        </span>
      </div>

      <div className="mt-10">
        <label htmlFor="epoch" className=" text-graydark dark:text-bodydark2">
          Convert Timestamp To Human Readable Date
        </label>
        <div className="mt-4">
          <input
            id="epoch"
            maxLength={20}
            type="text"
            className="w-50 rounded p-1.5 mx-1"
            defaultValue={currentTimestamp}
          />
          <button
            type="button"
            className="m-1 rounded bg-bodydark1 dark:bg-boxdark py-2 px-4 font-medium text-graydark dark:text-bodydark2"
          >
            Convert To Human Date
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
        <div className="mt-10">
          Assuming that this timestamp is in{" "}
          <span className="font-semibold">
            {getTimestampUnit(currentTimestamp)}:
          </span>
          <table>
            <tbody>
              <tr>
                <td className="font-bold w-40">GMT</td>
                <td>{dateFormat(currentTimestamp, true)}</td>
              </tr>
              <tr>
                <td className="font-bold">Your Local Time</td>
                <td>{dateFormat(currentTimestamp)}</td>
              </tr>
              <tr>
                <td className="font-bold">Relative</td>
                <td>{getRelativeTime(currentTimestamp)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-10">
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
                    className="w-15 rounded p-1.5 mx-1"
                    defaultValue=""
                  />
                  -
                </td>
                <td>
                  <input
                    maxLength={4}
                    className="w-15 rounded p-1.5 mx-1"
                    defaultValue=""
                  />
                  -
                </td>
                <td>
                  <input
                    maxLength={4}
                    className="w-15 rounded p-1.5 mx-1"
                    defaultValue=""
                  />
                </td>
                <td>
                  <input
                    maxLength={4}
                    className="w-15 rounded p-1.5 mx-1"
                    defaultValue=""
                  />
                  :
                </td>
                <td>
                  <input
                    maxLength={4}
                    className="w-15 rounded p-1.5 mx-1"
                    defaultValue=""
                  />
                  :
                </td>
                <td>
                  <input
                    maxLength={4}
                    className="w-15 rounded p-1.5 mx-1"
                    defaultValue=""
                  />
                </td>
                <td>
                  <select
                    className="w-15 rounded p-1.5 mx-1"
                    value={meridiem}
                    onChange={(e) => setMeridiem(e.target.value)}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </td>
                <td>
                  <select
                    className="w-15 rounded p-1.5 mx-1"
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
