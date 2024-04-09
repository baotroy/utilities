const abiBalances = [
  {
    inputs: [
      { internalType: "address[]", name: "_addresses", type: "address[]" },
    ],
    name: "getBalances",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
];
export default abiBalances;
