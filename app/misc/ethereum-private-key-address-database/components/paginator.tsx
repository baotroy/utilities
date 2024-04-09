import Link from "next/link";
import { TOTAL_PAGES } from ".";
import BigNumber from "bignumber.js";

interface PaginatorProps {
  currentPage: BigNumber;
  handleOnClick: (newPage: BigNumber | number) => void;
}
const Paginator: React.FC<PaginatorProps> = ({
  currentPage,
  handleOnClick,
}) => {
  return (
    <>
      <div className="flex">
        {currentPage.gt(1) && (
          <>
            {/* <Link
              onClick={() => handleOnClick(1)}
              href={{
                pathname: "/misc/ethereum-private-key-address-database",
                query: { p: currentPage.minus(1).toString(10) },
              }}
              replace
              className="flex items-center justify-center px-3 h-8 me-3 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <svg
                className="w-3.5 h-3.5 me-2 rtl:rotate-180"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 10"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 5H1m0 0 4 4M1 5l4-4"
                />
              </svg>
            </Link> */}
            <Link
              onClick={() => handleOnClick(currentPage.minus(1))}
              href={{
                pathname: "/misc/ethereum-private-key-address-database",
                query: { p: currentPage.minus(1).toString(10) },
              }}
              replace
              className="flex items-center justify-center px-3 h-8 me-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                  clip-rule="evenodd"
                />
              </svg>
            </Link>
          </>
        )}
        {BigNumber(currentPage).lt(TOTAL_PAGES) && (
          <>
            <Link
              replace
              onClick={() => handleOnClick(currentPage.plus(1))}
              href={{
                pathname: "/misc/ethereum-private-key-address-database",
                query: { p: currentPage.plus(1).toString(10) },
              }}
              className="flex items-center justify-center px-3 h-8 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clip-rule="evenodd"
                />
              </svg>
            </Link>

            {/* <Link
              replace
              onClick={() => handleOnClick(TOTAL_PAGES)}
              href={{
                pathname: "/misc/ethereum-private-key-address-database",
                query: { p: TOTAL_PAGES.toString(10) },
              }}
              className="flex items-center justify-center px-3 h-8 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <svg
                className="w-3.5 h-3.5 ms-2 rtl:rotate-180"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 10"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M1 5h12m0 0L9 1m4 4L9 9"
                />
              </svg>
            </Link> */}
          </>
        )}
      </div>
    </>
  );
};

export default Paginator;
