"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { MdContentCopy } from "react-icons/md";
const EtherUnitConverter = () => {
  return (
    <>
      <Breadcrumb />
      <div>
        Unit Converter
        <p>
          Ether or ETH is often used in different denominations of its currency,
          such as Wei for interacting with smart contracts and Gwei for
          calculating gas prices. Use our Unit Converter to easily convert
          between them!
        </p>
        <div>Enter any value</div>
        <div>
          <div>
            <span className="bg-stroke inline-block rounded-tl-lg rounded-bl-lg">
              <MdContentCopy size={20} />
            </span>
            <input
              id="wei"
              type="text"
              className="w-100  p-1.5 outline-none"
              defaultValue=""
            />
            <label
              htmlFor="wei"
              className="p-2 bg-stroke rounded-tr-lg rounded-br-lg"
            >
              Wei (10<sup>-18</sup>)
            </label>
          </div>
        </div>
      </div>
    </>
  );
};

export default EtherUnitConverter;
