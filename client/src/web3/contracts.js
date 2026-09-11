// Base Sepolia Deployment Configuration for AVEN-ETH
export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const BASE_SEPOLIA_CHAIN_ID_HEX = "0x14a34";

export const BASE_SEPOLIA_NETWORK = {
  chainId: BASE_SEPOLIA_CHAIN_ID_HEX,
  chainName: "Base Sepolia Testnet",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: [
    "https://sepolia.base.org",
    "https://base-sepolia-rpc.publicnode.com",
    "https://base-sepolia.blockpi.network/v1/rpc/public",
  ],
  blockExplorerUrls: ["https://sepolia.basescan.org"],
};

export const CONTRACT_ADDRESSES = {
  AvenEscrowStream: "0x5Cfa2C922C1C1Fd42ba7570306a7D83e630dC6F9",
  MockUSDC: "0xf922026C1810BF93C5a31e35B87ee4dc9Bc8f651",
};

export const MOCK_USDC_ABI = [
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "mint",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
];

export const AVEN_ESCROW_STREAM_ABI = [
  {
    type: "function",
    name: "createAndFundStream",
    inputs: [
      { name: "freelancer", type: "address" },
      { name: "token", type: "address" },
      { name: "budget", type: "uint256" },
      { name: "durationSeconds", type: "uint256" },
      { name: "withdrawableCapPercent", type: "uint256" },
      { name: "externalAgreementId", type: "bytes32" },
    ],
    outputs: [{ name: "streamId", type: "bytes32" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimStream",
    inputs: [
      { name: "streamId", type: "bytes32" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "pauseStream",
    inputs: [{ name: "streamId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "resumeStream",
    inputs: [{ name: "streamId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "submitWork",
    inputs: [
      { name: "streamId", type: "bytes32" },
      { name: "reportHash", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "approveAndRelease",
    inputs: [{ name: "streamId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelStream",
    inputs: [{ name: "streamId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "computeEarned",
    inputs: [{ name: "streamId", type: "bytes32" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "computeAvailable",
    inputs: [{ name: "streamId", type: "bytes32" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalStreams",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "StreamCreated",
    inputs: [
      { name: "streamId", type: "bytes32", indexed: true },
      { name: "externalAgreementId", type: "bytes32", indexed: true },
      { name: "client", type: "address", indexed: true },
      { name: "freelancer", type: "address", indexed: false },
      { name: "token", type: "address", indexed: false },
      { name: "budget", type: "uint256", indexed: false },
      { name: "ratePerSecond", type: "uint256", indexed: false },
      { name: "durationSeconds", type: "uint256", indexed: false },
      { name: "withdrawableCapPercent", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "StreamClaimed",
    inputs: [
      { name: "streamId", type: "bytes32", indexed: true },
      { name: "freelancer", type: "address", indexed: true },
      { name: "amountClaimed", type: "uint256", indexed: false },
      { name: "totalWithdrawn", type: "uint256", indexed: false },
    ],
  },
];
