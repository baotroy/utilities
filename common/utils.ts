import toast from "react-hot-toast";
import { getProvider } from "./provider";
import abiMulticall from "./abis/multicall";
import {
  Interface,
  Contract,
  JsonRpcProvider,
  formatUnits,
} from "ethers";
import chainConfig from "./chainConfig";
import abiBalances from "./abis/balances";

export const copyToClipboard = (content: string) => {
  if (content === "") return;
  navigator.clipboard
    .writeText(content)
    .then(() => {
      toast.success("Copied to clipboard");
    })
    .catch(() => {
      toast.error("Unable to copy");
    });
};

export function stringExplode(str: string): string[] {
  return str.split("\n");
}

export function isAlphabet(char: string): boolean {
  return /^[A-Za-z]$/.test(char);
}

export const isNumber = (str: string): boolean => /^\d+$/.test(str);

export function bytesToSize(bytes: number) {
  const BASE_UNIT = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes == 0) return "n/a";
  const i = parseInt(
    Math.floor(Math.log(bytes) / Math.log(BASE_UNIT)).toString()
  );
  if (i == 0) return bytes + " " + sizes[i];
  return (bytes / Math.pow(BASE_UNIT, i)).toFixed(1) + " " + sizes[i];
}

export const download = (
  content: string,
  filename: string,
  type = "text/plain"
) => {
  const element = document.createElement("a");
  const file = new Blob([content], { type });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element); // Required for this to work in FireFox
  element.click();
};

export const getSizeFileFromBase64 = (str: string) => {
  const numberEq = str.slice(str.length - 5).split("=").length - 1;
  return str.length * (3 / 4) - numberEq;
};

export const getPageTitle = (pathname: string): string => {
  const pathElements = pathname.split("/");
  return pathElements[pathElements.length - 1].split("-").join(" ");
};

export const getBalances = async (
  addresses: string[],
  chainId: number,
  customRpc?: string
): Promise<string[]> => {
  return multicall(addresses, chainId, customRpc);
};

const _ethGetBalances = (addresses: string[], chainId: number) => {
  const { balanceContract } = chainConfig[chainId];

  return {
    address: balanceContract,
    abi: abiBalances,
    functionName: "getBalances",
    args: [addresses],
  };
};

const _getMulticallRequests = (addresses: string[], chainId: number) => {
  // const { tokens: tokenAddresses } = chainConfig[chainId];
  const options = [_ethGetBalances(addresses, chainId)];
  // this code is used for getting balances of popular tokens which specified in chainConfig
  // disable temporarily
  // for (const tokenAddress of tokenAddresses) {
  //   for (const address of addresses) {
  //     options.push({
  //       address: tokenAddress,
  //       abi: abiErc20,
  //       functionName: "balanceOf",
  //       args: [address],
  //     });
  //   }
  // }
  return options;
};

const createMulticallContract = (
  multicallAddress: string,
  provider: JsonRpcProvider
) => {
  return new Contract(multicallAddress, abiMulticall, provider);
};

const multicall = async (
  addresses: string[],
  chainId: number,
  customProvider?: string
) => {
  const provider = getProvider(chainId, customProvider);
  const options = _getMulticallRequests(addresses, chainId);
  const { multicallAddress } = chainConfig[chainId];
  const contract = createMulticallContract(multicallAddress, provider);
  const callsData = options.map((currentContract) => {
    const iface = Interface.from(currentContract.abi);
    return {
      target: currentContract.address,
      callData: iface.encodeFunctionData(
        currentContract.functionName,
        currentContract.args || []
      ),
    };
  });
  const callResult = await contract.tryAggregate.staticCall(false, callsData);
  const result = callResult
    .map(
      (
        { success, returnData }: { success: any; returnData: any },
        i: number
      ) => {
        if (!success || returnData === "0x") return null;
        const currentContract = options[i];
        const iface = Interface.from(currentContract.abi);
        return iface
          .decodeFunctionResult(currentContract.functionName, returnData)
          .toString();
      }
    )
    .flat(2);
  return result[0].split(","); // ether balaces return array at index 0
};

export const parseBalance = (balance: string): string => {
  return formatUnits(balance || 0);
};
