const configs: Record<number, any> = {
  1: {
    rpcs: ["https://1rpc.io/eth"],
    chainName: "mainnet",
    balanceContract: "0xaa31dc9c878a4D6Ec59146c6f53e5b02Cee30296",
    multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
    active: true,
  },
  56: {
    rpcs: ["https://bsc-dataseed1.binance.org/"],
    chainName: "bsc",
    balanceContract: "0x2d8643672b5aab1872422c10fa242bc22cd88555",
    multicallAddress: "0xca11bde05977b3631167028862be2a173976ca11",
    active: true,
  },
  137: {
    rpcs: ["https://polygon-rpc.com"],
    balanceContract: "0x488D87a9eD26C6955ab99B9c1faD1d38754904Cb",
    chainName: "matic",
    multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
    active: true,
  },
  // avalanche
  43114: {
    rpcs: ["https://1rpc.io/avax/c"],
    balanceContract: "0x204595EA57CAD0aaf2110D5abB8e6c49Fd1e0d4F",
    chainName: "avalanche",
    multicallAddress: "0xca11bde05977b3631167028862be2a173976ca11",
    active: true,
  },
  // arbitrum
  42161: {
    rpcs: ["https://arbitrum.llamarpc.com"],
  },
  // op
  10: {
    rpcs: ["https://op-pokt.nodies.app"],
  },
  // base
  8453: {
    rpcs: ["https://base.llamarpc.com	"],
  },
};

export default configs;
