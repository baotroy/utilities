"use client";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import TextBox from "@/components/Input/TextBox";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  getKeysListFromPage,
  getAddressFromPrivateKey,
  TOTAL_PAGES,
  PAGE_SIZE,
} from ".";
import { useEffect, useState } from "react";
import BigNumber from "bignumber.js";
BigNumber.config({ ROUNDING_MODE: 2 }); // ROUND CEIL

import { getBalances, parseBalance } from "@/common/utils";
import clsx from "clsx";
import PaginatorBox from "./paginatorBox";

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
  const rpc = searchParams.get("rpc");
  const [page, setPage] = useState<BigNumber>(getValidPage(p || 1)); // must use BigNumber cuz of large amount of keys
  const [tempPage, setTempPage] = useState(page.toString(10));
  const [keys, setKeys] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [balances, setBalances] = useState<string[]>([]);
  const [customRpc, setCustomRpc] = useState<string>(rpc || "");

  useEffect(() => {
    setKeys(getKeysListFromPage(page));
    setBalances([]);
    setAddresses(
      getKeysListFromPage(page).map((key) => getAddressFromPrivateKey(key))
    );
    setTempPage(page.toString(10));

    // push router
    pushRouter();
  }, [page]);

  const pushRouter = () => {
    const query = {
      p: page.toString(10),
      rpc: customRpc.trim(),
    };
    const searchParams = new URLSearchParams(query);
    push(`${pathname}?${searchParams.toString()}`);
  };

  useEffect(() => {
    getBalances(addresses, 1, customRpc.trim()).then((bals) => {
      setBalances(bals.map((b) => parseBalance(b)));
    });
  }, [addresses]);

  const handlePageChange = (newPage: BigNumber | number) => {
    setPage(getValidPage(newPage));
  };

  const goToPage = () => {
    if (tempPage !== "") {
      setPage(getValidPage(tempPage));
      pushRouter();
    } else {
      setTempPage(page.toString(10));
    }
  };

  const handleInputPage = (value: string): void => {
    if (!BigNumber(value).isNaN() || value === "") {
      setTempPage(value);
    }
  };

  const handlePageKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      goToPage();
    }
  };

  const randomPage = () => {
    const newPage = BigNumber.random().multipliedBy(TOTAL_PAGES).integerValue();
    setPage(newPage);
  };

  return (
    <>
      <Breadcrumb pageName="" />
      <div>
        <div className="float-right mb-5">
          <i className="text-sm">Use your RPC</i>
          <TextBox
            value={customRpc}
            additionalClass="mx-2 w-[300px]"
            onChange={(e) => setCustomRpc(e.target.value)}
            placeholder="https://mainnet.infura.io/v3/your-api-key"
          />
        </div>
        <div className="clear-both"></div>
        <div className="float-right mb-5 flex">
          <PaginatorBox
            page={page}
            handlePageChange={handlePageChange}
            handleInputPage={handleInputPage}
            tempPage={tempPage}
            handlePageKeyDown={handlePageKeyDown}
            goToPage={goToPage}
            randomPage={randomPage}
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
                  <td
                    className={clsx(
                      "text-right",
                      balances[index] === "0" || !balances[index]
                        ? ""
                        : "text-danger",
                      balances[index]
                    )}
                  >
                    {balances[index] ? balances[index] : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 float-right flex">
          <PaginatorBox
            page={page}
            handlePageChange={handlePageChange}
            handleInputPage={handleInputPage}
            tempPage={tempPage}
            handlePageKeyDown={handlePageKeyDown}
            goToPage={goToPage}
            randomPage={randomPage}
          />
        </div>
        <div className="clear-both"></div>
        <div>
          <p className="text-body text-xs mt-4">
            <i>
              {" "}
              You are viewing page {page.toString(10)} (
              {page.toString(10).length > 10 ? (
                <strong>{page.toString(10).length} digits</strong>
              ) : (
                <></>
              )}
              )
              <br />
              There are {PAGE_SIZE} records per page
              <br /> To have a better experience, please use your own RPC, this
              site will not store your RPC
            </i>
          </p>
        </div>
      </div>
    </>
  );
};

export default EthereumPrivateKeyAddressComponent;
