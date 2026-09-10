import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  BASE_SEPOLIA_CHAIN_ID,
  BASE_SEPOLIA_CHAIN_ID_HEX,
  BASE_SEPOLIA_NETWORK,
  CONTRACT_ADDRESSES,
  MOCK_USDC_ABI,
  AVEN_ESCROW_STREAM_ABI,
} from "../web3/contracts.js";

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [nativeBalance, setNativeBalance] = useState("0.00");
  const [usdcBalance, setUsdcBalance] = useState("0.00");
  const [isConnecting, setIsConnecting] = useState(false);
  const [txPending, setTxPending] = useState(false);

  const hasMetaMask = typeof window !== "undefined" && Boolean(window.ethereum);
  const isBaseSepolia = chainId === BASE_SEPOLIA_CHAIN_ID || chainId === BASE_SEPOLIA_CHAIN_ID_HEX;

  // Format short address: 0xd669...ad57
  const shortAddress = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : "";

  // 1. Fetch Balances from Base Sepolia
  const fetchBalances = useCallback(async (walletAddress) => {
    if (!walletAddress || !hasMetaMask) return;

    try {
      // 1. Fetch Native ETH Balance
      const balanceHex = await window.ethereum.request({
        method: "eth_getBalance",
        params: [walletAddress, "latest"],
      });
      const ethVal = parseInt(balanceHex, 16) / 1e18;
      setNativeBalance(ethVal.toFixed(4));

      // 2. Fetch MockUSDC Balance using balanceOf call
      // Function selector for balanceOf(address) = 0x70a08231
      const paddedAddress = walletAddress.toLowerCase().replace("0x", "").padStart(64, "0");
      const data = `0x70a08231${paddedAddress}`;

      const usdcHex = await window.ethereum.request({
        method: "eth_call",
        params: [
          {
            to: CONTRACT_ADDRESSES.MockUSDC,
            data: data,
          },
          "latest",
        ],
      });

      if (usdcHex && usdcHex !== "0x") {
        const usdcVal = parseInt(usdcHex, 16) / 1e6; // 6 decimals
        setUsdcBalance(usdcVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      }
    } catch (err) {
      console.warn("Could not fetch on-chain balances:", err.message);
    }
  }, [hasMetaMask]);

  // 2. Auto-detect currently connected account and chain
  useEffect(() => {
    if (!hasMetaMask) return;

    // Check currently connected chain
    window.ethereum
      .request({ method: "eth_chainId" })
      .then((hexId) => {
        setChainId(parseInt(hexId, 16));
      })
      .catch(() => {});

    // Check if user is already connected
    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          fetchBalances(accounts[0]);
        }
      })
      .catch(() => {});

    // Listen to account changes
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        fetchBalances(accounts[0]);
      } else {
        setAccount(null);
        setNativeBalance("0.00");
        setUsdcBalance("0.00");
      }
    };

    // Listen to chain changes
    const handleChainChanged = (hexId) => {
      const newChainId = parseInt(hexId, 16);
      setChainId(newChainId);
      if (account) fetchBalances(account);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [hasMetaMask, account, fetchBalances]);

  // 3. Connect Wallet
  async function connectWallet() {
    if (!hasMetaMask) {
      window.open("https://metamask.io/download/", "_blank");
      throw new Error("MetaMask not detected! Please install MetaMask to continue.");
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        const hexId = await window.ethereum.request({ method: "eth_chainId" });
        setChainId(parseInt(hexId, 16));
        await fetchBalances(accounts[0]);
        return accounts[0];
      }
    } finally {
      setIsConnecting(false);
    }
  }

  // 4. Disconnect Wallet
  function disconnectWallet() {
    setAccount(null);
    setNativeBalance("0.00");
    setUsdcBalance("0.00");
  }

  // 5. Switch to Base Sepolia Network (1-Click)
  async function switchToBaseSepolia() {
    if (!hasMetaMask) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BASE_SEPOLIA_CHAIN_ID_HEX }],
      });
      setChainId(BASE_SEPOLIA_CHAIN_ID);
    } catch (switchError) {
      // Error code 4902: network not added to MetaMask yet
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [BASE_SEPOLIA_NETWORK],
          });
          setChainId(BASE_SEPOLIA_CHAIN_ID);
        } catch (addError) {
          throw new Error(`Failed to add Base Sepolia: ${addError.message}`);
        }
      } else {
        throw switchError;
      }
    }
  }

  // 6. Free Faucet: Mint 500 mUSDC for testing
  async function mintFaucetUSDC(amount = 500) {
    if (!account) throw new Error("Please connect your wallet first.");
    if (!isBaseSepolia) {
      await switchToBaseSepolia();
    }

    setTxPending(true);
    try {
      const amountUnits = BigInt(Math.floor(amount * 1e6));
      // Function selector for mint(address,uint256) = 0x40c10f19
      const paddedTo = account.toLowerCase().replace("0x", "").padStart(64, "0");
      const paddedAmount = amountUnits.toString(16).padStart(64, "0");
      const data = `0x40c10f19${paddedTo}${paddedAmount}`;

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: account,
            to: CONTRACT_ADDRESSES.MockUSDC,
            data: data,
          },
        ],
      });

      // Poll for receipt
      await waitForReceipt(txHash);
      await fetchBalances(account);
      return txHash;
    } finally {
      setTxPending(false);
    }
  }

  // 7. On-Chain Funding: approve USDC + createAndFundStream
  async function fundStreamOnChain({
    freelancerAddress,
    budget,
    durationSeconds,
    withdrawableCapPercent = 75,
    externalAgreementId,
  }) {
    if (!account) throw new Error("Please connect your wallet first.");
    if (!isBaseSepolia) {
      await switchToBaseSepolia();
    }

    setTxPending(true);
    try {
      const budgetUnits = BigInt(Math.floor(budget * 1e6)); // 6 decimals
      const escrowAddr = CONTRACT_ADDRESSES.AvenEscrowStream;
      const usdcAddr = CONTRACT_ADDRESSES.MockUSDC;

      // STEP 1: Approve MockUSDC to Escrow Contract
      // approve(address spender, uint256 amount) selector: 0x095ea7b3
      const paddedSpender = escrowAddr.toLowerCase().replace("0x", "").padStart(64, "0");
      const paddedBudget = budgetUnits.toString(16).padStart(64, "0");
      const approveData = `0x095ea7b3${paddedSpender}${paddedBudget}`;

      const approveTxHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: account,
            to: usdcAddr,
            data: approveData,
          },
        ],
      });

      // Wait for approval confirmation
      await waitForReceipt(approveTxHash);

      // STEP 2: Call createAndFundStream on AvenEscrowStream
      // createAndFundStream(address,address,uint256,uint256,uint256,bytes32)
      // selector: 0xb8f1eb80
      const paddedFreelancer = freelancerAddress.toLowerCase().replace("0x", "").padStart(64, "0");
      const paddedToken = usdcAddr.toLowerCase().replace("0x", "").padStart(64, "0");
      const paddedDuration = BigInt(durationSeconds).toString(16).padStart(64, "0");
      const paddedCap = BigInt(withdrawableCapPercent).toString(16).padStart(64, "0");
      
      // External agreement ID as valid bytes32 hex
      let cleanAgrId = "";
      const rawAgrId = String(externalAgreementId || "agreement");
      if (rawAgrId.startsWith("0x") && rawAgrId.length === 66) {
        cleanAgrId = rawAgrId.slice(2);
      } else {
        for (let i = 0; i < rawAgrId.length && i < 32; i++) {
          cleanAgrId += rawAgrId.charCodeAt(i).toString(16).padStart(2, "0");
        }
        cleanAgrId = cleanAgrId.padEnd(64, "0");
      }

      const streamData = `0xb8f1eb80${paddedFreelancer}${paddedToken}${paddedBudget}${paddedDuration}${paddedCap}${cleanAgrId}`;

      const fundTxHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: account,
            to: escrowAddr,
            data: streamData,
          },
        ],
      });

      const receipt = await waitForReceipt(fundTxHash);
      await fetchBalances(account);

      return {
        txHash: fundTxHash,
        receipt,
        basescanUrl: `https://sepolia.basescan.org/tx/${fundTxHash}`,
      };
    } finally {
      setTxPending(false);
    }
  }

  // Helper: Poll for transaction receipt
  async function waitForReceipt(txHash, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      const receipt = await window.ethereum.request({
        method: "eth_getTransactionReceipt",
        params: [txHash],
      });
      if (receipt && receipt.blockNumber) {
        return receipt;
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    throw new Error("Transaction timed out waiting for confirmation.");
  }

  return (
    <Web3Context.Provider
      value={{
        account,
        shortAddress,
        chainId,
        isBaseSepolia,
        hasMetaMask,
        nativeBalance,
        usdcBalance,
        isConnecting,
        txPending,
        connectWallet,
        disconnectWallet,
        switchToBaseSepolia,
        fetchBalances,
        mintFaucetUSDC,
        fundStreamOnChain,
        CONTRACT_ADDRESSES,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
