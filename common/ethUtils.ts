import { getProvider } from "./provider";
import abiMulticall from "./abis/multicall";
import { Interface, Contract, JsonRpcProvider, formatUnits } from "ethers";
import chainConfig from "./chainConfig";
import abiBalances from "./abis/balances";

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
  const options = [_ethGetBalances(addresses, chainId)];
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

  return result[0]?.split(",");
};

export const parseBalance = (balance: string): string => {
  if (balance?.length === 0 || balance === "NaN") return "";
  const result = formatUnits(balance || 0);
  return result === "0.0" ? "0" : result;
};
