import { ethers } from "ethers";

const USD_PER_ETH = 2000000;   // 1 ETH = 2,000,000 USD (fake rate)
const DEPOSIT_PERCENT = 0.5; // 5% deposit

/**
 * Tính tiền đặt cọc từ giá xe USD
 */
export function calculateDepositUsd(carPriceUsd) {
  const price = Number(carPriceUsd);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("carPriceUsd phải là số > 0");
  }

  return (price * DEPOSIT_PERCENT) / 100;
}

/**
 * USD -> ETH
 */
export function convertUsdToEth(usdAmount) {
  const usd = Number(usdAmount);

  if (!Number.isFinite(usd) || usd <= 0) {
    throw new Error("usdAmount phải là số > 0");
  }

  const ethAmount = usd / USD_PER_ETH;

  // Keep six decimal places for display
  return ethAmount.toFixed(6);
}

/**
 * ETH -> wei
 */
export function convertEthToWei(ethAmount) {
  const eth = Number(ethAmount);

  if (!Number.isFinite(eth) || eth <= 0) {
    throw new Error("ethAmount phải là số > 0");
  }

  return ethers.parseEther(eth.toFixed(6));
}

/**
 * USD -> ETH (deposit)
 */
export function calculateDepositEth(carPriceUsd) {
  const depositUsd = calculateDepositUsd(carPriceUsd);
  return convertUsdToEth(depositUsd);
}

/**
 * USD -> wei (dùng để gọi smart contract)
 */
export function calculateDepositWei(carPriceUsd) {
  const depositEth = calculateDepositEth(carPriceUsd);
  return convertEthToWei(depositEth);
}