"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useEffect, useState } from "react";
import { getCurrent } from "../utils";
const EpochConverter = () => {
  const [currentUnixTimestamp, setCurrentUnixTimestamp] =
    useState(getCurrent());
  setInterval(() => setCurrentUnixTimestamp(getCurrent()), 1000);
  return (
    <>
      <Breadcrumb />
      <div>
        The current Unix Timestamp is:
        <span
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
          {currentUnixTimestamp}
        </span>
      </div>

      <div className="mt-4">
        <label htmlFor="epoch" className=" text-graydark dark:text-bodydark2">
          Convert Timestamp To Human Readable Date
        </label>
        <div className="mt-4">
          <input id="epoch" type="text" />
          <button
            type="button"
            className="m-1 rounded bg-bodydark1 dark:bg-boxdark py-2 px-4 font-medium text-graydark dark:text-bodydark2"
          >
            Convert
          </button>
          <button
            type="button"
            className="m-1 rounded bg-bodydark1 dark:bg-boxdark py-2 px-4  font-medium text-graydark dark:text-bodydark2"
          >
            Reset
          </button>
        </div>
        <div className="mt-10">
          GMT: {new Date().toUTCString()} <br />
          Your Local Time: {new Date().toLocaleString()}
        </div>
      </div>

      <p className="text-sm mt-20 italic">
        Functions depend on https://www.epochconvert.com/
      </p>
    </>
  );
};

export default EpochConverter;
