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

/**
 * Safely resolves the active MetaMask provider, handling:
 * 1. Multi-wallet environments (e.g. Phantom, Coinbase Wallet, Brave Wallet alongside MetaMask)
 * 2. EIP-6963 / window.ethereum.providers array
 * 3. Fallback to window.ethereum
 */
export function getEthereumProvider() {
  if (typeof window === "undefined") return null;

  // Case 1: Multiple wallets injected into window.ethereum.providers
  if (window.ethereum?.providers?.length) {
    const primaryMetaMask = window.ethereum.providers.find(
      (p) => p.isMetaMask && !p.isPhantom && !p.isBraveWallet && !p.isCoinbaseWallet
    );
    if (primaryMetaMask) return primaryMetaMask;

    const anyMetaMask = window.ethereum.providers.find((p) => p.isMetaMask);
    if (anyMetaMask) return anyMetaMask;

    return window.ethereum.providers[0];
  }

  // Case 2: Standard single injected window.ethereum
  if (window.ethereum) {
    return window.ethereum;
  }

  return null;
}

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [nativeBalance, setNativeBalance] = useState("0.00");
  const [usdcBalance, setUsdcBalance] = useState("0.00");
  const [isConnecting, setIsConnecting] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(() => Boolean(getEthereumProvider()));

  const isBaseSepolia = chainId === BASE_SEPOLIA_CHAIN_ID || chainId === BASE_SEPOLIA_CHAIN_ID_HEX;

  // Format short address: 0xd669...ad57
  const shortAddress = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : "";

  // 1. Fetch Balances from Base Sepolia
  const fetchBalances = useCallback(async (walletAddress) => {
    const provider = getEthereumProvider();
    if (!walletAddress || !provider) return;

    try {
      // 1. Fetch Native ETH Balance
      const balanceHex = await provider.request({
        method: "eth_getBalance",
        params: [walletAddress, "latest"],
      });
      const ethVal = parseInt(balanceHex, 16) / 1e18;
      setNativeBalance(ethVal.toFixed(4));

      // 2. Fetch MockUSDC Balance using balanceOf call
      // Function selector for balanceOf(address) = 0x70a08231
      const paddedAddress = walletAddress.toLowerCase().replace("0x", "").padStart(64, "0");
      const data = `0x70a08231${paddedAddress}`;

      const usdcHex = await provider.request({
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
  }, []);

  // 2. Auto-detect currently connected account and chain with polling & event listeners
  useEffect(() => {
    function initProvider() {
      const provider = getEthereumProvider();
      if (!provider) return;

      setHasMetaMask(true);

      // Check currently connected chain
      provider
        .request({ method: "eth_chainId" })
        .then((hexId) => {
          setChainId(parseInt(hexId, 16));
        })
        .catch(() => {});

      // Check if user is already connected
      provider
        .request({ method: "eth_accounts" })
        .then((accounts) => {
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
            fetchBalances(accounts[0]);
          }
        })
        .catch(() => {});
    }

    initProvider();

    if (typeof window !== "undefined") {
      window.addEventListener("ethereum#initialized", initProvider, { once: true });
    }

    const interval = setInterval(() => {
      if (getEthereumProvider()) {
        initProvider();
        clearInterval(interval);
      }
    }, 400);

    const timeout = setTimeout(() => clearInterval(interval), 3000);

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("ethereum#initialized", initProvider);
      }
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [fetchBalances]);

  // Listen to account and chain changes
  useEffect(() => {
    const provider = getEthereumProvider();
    if (!provider) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        fetchBalances(accounts[0]);
      } else {
        setAccount(null);
        setNativeBalance("0.00");
        setUsdcBalance("0.00");
      }
    };

    const handleChainChanged = (hexId) => {
      const newChainId = parseInt(hexId, 16);
      setChainId(newChainId);
      if (account) fetchBalances(account);
    };

    provider.on?.("accountsChanged", handleAccountsChanged);
    provider.on?.("chainChanged", handleChainChanged);

    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [account, fetchBalances, hasMetaMask]);

  // 3. Connect Wallet
  async function connectWallet() {
    const provider = getEthereumProvider();
    if (!provider) {
      if (typeof window !== "undefined") {
        const isSecure =
          window.location.protocol === "https:" ||
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";
        if (!isSecure) {
          throw new Error(
            `MetaMask disables extension injection on local network HTTP (${window.location.host}). Please open via localhost or use HTTPS.`
          );
        }
      }
      window.open("https://metamask.io/download/", "_blank");
      throw new Error(
        "MetaMask not detected! If installed, please click the MetaMask fox icon in your browser toolbar to activate it."
      );
    }

    setIsConnecting(true);
    try {
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setHasMetaMask(true);
        const hexId = await provider.request({ method: "eth_chainId" });
        setChainId(parseInt(hexId, 16));
        await fetchBalances(accounts[0]);
        return accounts[0];
      }
      throw new Error("No accounts received from MetaMask.");
    } catch (err) {
      if (err.code === -32002) {
        throw new Error(
          "MetaMask connection prompt is already open! Please click the MetaMask extension icon in your browser toolbar to approve."
        );
      }
      if (err.code === 4001) {
        throw new Error("Connection cancelled in MetaMask.");
      }
      throw err;
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
    const provider = getEthereumProvider();
    if (!provider) {
      throw new Error("MetaMask not detected. Please install or activate MetaMask.");
    }

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BASE_SEPOLIA_CHAIN_ID_HEX }],
      });
      setChainId(BASE_SEPOLIA_CHAIN_ID);
    } catch (switchError) {
      // Error code 4902: network not added to MetaMask yet
      if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
        try {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [BASE_SEPOLIA_NETWORK],
          });
          setChainId(BASE_SEPOLIA_CHAIN_ID);
        } catch (addError) {
          if (addError.code === 4001) {
            throw new Error("Adding Base Sepolia was cancelled in MetaMask.");
          }
          throw new Error(`Failed to add Base Sepolia: ${addError.message}`);
        }
      } else if (switchError.code === 4001) {
        throw new Error("Network switch cancelled in MetaMask.");
      } else if (switchError.code === -32002) {
        throw new Error("Network request is already pending in MetaMask. Please check the extension icon.");
      } else {
        throw switchError;
      }
    }
  }

  // 6. Free Faucet: Mint 500 mUSDC for testing
  async function mintFaucetUSDC(amount = 500) {
    const provider = getEthereumProvider();
    if (!account || !provider) throw new Error("Please connect your wallet first.");
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

      const txHash = await provider.request({
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
    } catch (err) {
      if (err.code === 4001) throw new Error("Faucet minting transaction was cancelled.");
      if (err.code === -32002) throw new Error("Transaction confirmation already pending in MetaMask.");
      throw err;
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
    const provider = getEthereumProvider();
    if (!account || !provider) throw new Error("Please connect your wallet first.");
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

      const approveTxHash = await provider.request({
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

      const fundTxHash = await provider.request({
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
    } catch (err) {
      if (err.code === 4001) throw new Error("Transaction was cancelled in MetaMask.");
      if (err.code === -32002) throw new Error("Transaction request already pending in MetaMask.");
      throw err;
    } finally {
      setTxPending(false);
    }
  }

  // Helper: Poll for transaction receipt
  async function waitForReceipt(txHash, maxAttempts = 30) {
    const provider = getEthereumProvider();
    if (!provider) throw new Error("Wallet provider disconnected.");

    for (let i = 0; i < maxAttempts; i++) {
      const receipt = await provider.request({
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
