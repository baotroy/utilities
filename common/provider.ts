import { ethers, Network, JsonRpcProvider } from "ethers";
import config from "./chainConfig";
export const getProvider = (
  chainId: number,
  customRpc?: string
): JsonRpcProvider => {
  const rpc = customRpc || config[chainId].rpcs[0];
  const chainName = config[chainId].chainName;

  const network = new Network(chainName, chainId);

  return new ethers.JsonRpcProvider(rpc, network, {
    staticNetwork: network,
  });
};
