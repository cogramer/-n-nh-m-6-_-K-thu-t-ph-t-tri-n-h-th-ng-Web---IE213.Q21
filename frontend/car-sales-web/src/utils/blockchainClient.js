import { BrowserProvider, Contract, formatEther, parseEther, toBigInt } from "ethers";
import contractArtifact from "../config/abi.json";

const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  "0xD0CF607f0bCD60B5ed02896e682450eA4dBf5BB0";
const SEPOLIA_CHAIN_ID = 11155111n;
const SEPOLIA_CHAIN_HEX = "0xaa36a7";
const USD_PER_ETH = Number(import.meta.env.VITE_USD_PER_ETH || 2000000);
const GAS_BUFFER_NUMERATOR = 120n;
const GAS_BUFFER_DENOMINATOR = 100n;

const shortenAddress = (address) => {
  if (!address) return "";
  return `${address.substring(0, 10)}...${address.slice(-4)}`;
};

export const getPositiveWeiValue = (amountWei) => {
  if (!amountWei) throw new Error("Payment amount is missing.");

  const value = toBigInt(amountWei);
  if (value <= 0n) throw new Error("Payment amount is invalid.");

  return value;
};

const getNonNegativeWeiValue = (amountWei = 0n) => {
  const value = toBigInt(amountWei);
  if (value < 0n) throw new Error("Payment amount is invalid.");
  return value;
};

const formatSepoliaEth = (amountWei) => {
  const [whole, fraction = ""] = formatEther(amountWei).split(".");
  const trimmedFraction = fraction.slice(0, 8).replace(/0+$/, "");
  return `${trimmedFraction ? `${whole}.${trimmedFraction}` : whole} SepoliaETH`;
};

export const getFullPaymentWei = (order) => {
  if (order.totalAmountWei) {
    return getPositiveWeiValue(order.totalAmountWei);
  }

  const ethAmount = (Number(order.totalAmount || 0) / USD_PER_ETH).toFixed(18);
  return parseEther(ethAmount);
};

export const ensureSepoliaNetwork = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed in this browser.");
  }

  const provider = new BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();

  if (network.chainId === SEPOLIA_CHAIN_ID) {
    await provider.send("eth_requestAccounts", []);
    return provider;
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_HEX }],
    });
  } catch (switchError) {
    if (switchError?.code !== 4902) throw switchError;
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: SEPOLIA_CHAIN_HEX,
          chainName: "Sepolia",
          nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
          rpcUrls: ["https://rpc.sepolia.org"],
          blockExplorerUrls: ["https://sepolia.etherscan.io"],
        },
      ],
    });
  }

  const switchedProvider = new BrowserProvider(window.ethereum);
  const switchedNetwork = await switchedProvider.getNetwork();

  if (switchedNetwork.chainId !== SEPOLIA_CHAIN_ID) {
    throw new Error("MetaMask is connected to the wrong network. Please switch to Sepolia.");
  }

  await switchedProvider.send("eth_requestAccounts", []);
  return switchedProvider;
};

const getVerifiedSigner = async (provider, expectedWallet) => {
  const signer = await provider.getSigner();

  if (!expectedWallet) return signer;

  const connectedWallet = await signer.getAddress();

  if (connectedWallet.toLowerCase() !== expectedWallet.toLowerCase()) {
    throw new Error(
      `Please switch MetaMask to the selected wallet ${shortenAddress(
        expectedWallet
      )} before continuing.`
    );
  }

  return signer;
};

export const ensureSelectedWalletReady = async (expectedWallet) => {
  const provider = await ensureSepoliaNetwork();
  const signer = await getVerifiedSigner(provider, expectedWallet);
  return signer.getAddress();
};

export const getMarketplaceContract = async (expectedWallet) => {
  const provider = await ensureSepoliaNetwork();
  const signer = await getVerifiedSigner(provider, expectedWallet);

  return new Contract(CONTRACT_ADDRESS, contractArtifact.abi, signer);
};

export const assertWalletCanSendTransaction = async ({
  contract,
  value = 0n,
  estimateGas,
}) => {
  if (!contract?.runner?.provider || !contract?.runner?.getAddress) {
    throw new Error("Could not read the connected MetaMask wallet.");
  }

  if (typeof estimateGas !== "function") {
    throw new Error("Gas estimation function is missing.");
  }

  const provider = contract.runner.provider;
  const signerAddress = await contract.runner.getAddress();
  const txValue = getNonNegativeWeiValue(value);
  const estimatedGas = toBigInt(await estimateGas());
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.maxFeePerGas ?? feeData.gasPrice ?? 0n;
  const bufferedGasCost =
    (estimatedGas * gasPrice * GAS_BUFFER_NUMERATOR) / GAS_BUFFER_DENOMINATOR;
  const requiredBalance = txValue + bufferedGasCost;
  const currentBalance = await provider.getBalance(signerAddress);

  if (currentBalance < requiredBalance) {
    const error = new Error(
      `Insufficient SepoliaETH balance. Available ${formatSepoliaEth(
        currentBalance
      )}, required at least ${formatSepoliaEth(
        requiredBalance
      )} including estimated gas.`
    );
    error.code = "INSUFFICIENT_FUNDS";
    throw error;
  }

  return {
    balance: currentBalance,
    estimatedGas,
    requiredBalance,
  };
};

export const getBuyerMarketplaceContract = async (order) => {
  const contract = await getMarketplaceContract(order?.buyerWallet);
  const connectedWallet = await contract.runner.getAddress();

  if (
    order.buyerWallet &&
    connectedWallet.toLowerCase() !== order.buyerWallet.toLowerCase()
  ) {
    throw new Error(
      "The connected MetaMask wallet is not the buyer wallet for this order."
    );
  }

  return contract;
};
