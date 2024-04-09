"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Button from "@/components/Input/Button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { getKeysListFromPage, getAddressFromPrivateKey, TOTAL_PAGES } from ".";
import Paginator from "./paginator";
import { useEffect, useState } from "react";
import TextBox from "@/components/Input/TextBox";
import BigNumber from "bignumber.js";
BigNumber.config({ ROUNDING_MODE: 2 }); // ROUND CEIL

import { getBalances, parseBalance } from "@/common/utils";
import { MdOutlineStar } from "react-icons/md";

const EthereumPrivateKeyAddressComponent = () => {
  const getValidPage = (page: BigNumber | number | string): BigNumber => {
    const t =
      typeof page === "number" || typeof page === "string"
        ? BigNumber(page)
        : page;
    if (t.lt(1)) {
      return BigNumber(1);
    }
    if (t.gt(TOTAL_PAGES)) {
      return BigNumber(TOTAL_PAGES);
    }
    return t;
  };
  const { push } = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const p = searchParams.get("p");
  const [page, setPage] = useState<BigNumber>(getValidPage(p || 1));
  const [tempPage, setTempPage] = useState<BigNumber>(page);
  const [keys, setKeys] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [balances, setBalances] = useState<string[]>([]);

  useEffect(() => {
    setKeys(getKeysListFromPage(page));
    setAddresses(
      getKeysListFromPage(page).map((key) => getAddressFromPrivateKey(key))
    );
    setTempPage(page);
  }, [page]);

  useEffect(() => {
    getBalances(addresses, 1).then((bals) => {
      setBalances(bals);
    });
  }, [addresses]);

  const handlePageChange = (newPage: BigNumber | number) => {
    setPage(getValidPage(newPage));
  };

  const goToPage = () => {
    setPage(getValidPage(tempPage));
    push(`${pathname}?p=${tempPage.toString(10)}`);
  };

  const handleInputPage = (value: string): void => {
    if (!BigNumber(value).isNaN()) {
      setTempPage(BigNumber(value));
    }
  };

  const randomPage = () => {
    const newPage = BigNumber.random().multipliedBy(TOTAL_PAGES).integerValue();
    setPage(newPage);
    push(`${pathname}?p=${newPage.toString(10)}`);
  };

  return (
    <>
      <Breadcrumb pageName="" />
      <div>
        <div className="float-right mb-5 flex">
          <Paginator currentPage={page} handleOnClick={handlePageChange} />
          <TextBox
            value={tempPage.toString(10)}
            additionalClass="mx-2 flex h-8 text-sm"
            handleOnChange={(e) => handleInputPage(e.target.value)}
          />
          <Button
            label="Go to"
            handleOnClick={goToPage}
            additionalClass="mr-2 flex h-8 text-sm"
          />
          <Button
            label="Feel luck"
            handleOnClick={randomPage}
            type="warning"
            additionalClass="flex h-8 text-sm"
            icon={{
              icon: MdOutlineStar,
              position: "left",
              size: 20,
            }}
          />
        </div>
        <div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Private Key</th>
                <th className="text-left">Address</th>
                <th>Balance (ETH)</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key, index) => (
                <tr key={index}>
                  <td className="text-left">{key}</td>
                  <td className="text-left">{addresses[index]}</td>
                  <td className="text-right">
                    {parseBalance(balances[index])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 float-right flex">
          <Paginator currentPage={page} handleOnClick={handlePageChange} />
          <TextBox
            value={tempPage.toString(10)}
            additionalClass="mx-2 flex h-8 text-sm"
            handleOnChange={(e) => handleInputPage(e.target.value)}
          />
          <Button
            label="Go to"
            handleOnClick={goToPage}
            additionalClass="mr-2 flex h-8 text-sm"
          />
          <Button
            label="Feel luck"
            handleOnClick={randomPage}
            type="warning"
            additionalClass="flex h-8 text-sm"
            icon={{
              icon: MdOutlineStar,
              position: "left",
              size: 20,
            }}
          />
        </div>
        <div className="clear-both"></div>
      </div>
    </>
  );
};

export default EthereumPrivateKeyAddressComponent;
