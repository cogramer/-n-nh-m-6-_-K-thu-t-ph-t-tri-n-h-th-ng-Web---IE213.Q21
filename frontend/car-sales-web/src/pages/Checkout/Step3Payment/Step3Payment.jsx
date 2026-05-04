import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle, LockKeyhole, Plus, Wallet } from "lucide-react";
import "./Step3Payment.css";
import metamaskIcon from "../../../assets/icon/metamask.png";
import { getMyWallets, addWallet } from "../../../services/walletService";
import { getBlockchainErrorMessage } from "../../../utils/blockchainErrors";
import { requestMetaMaskAccounts } from "../../../utils/metamaskWallets";

function Step3Payment({
  paymentType,
  setPaymentType,
  paymentDetails,
  setPaymentDetails,
  showNotify,
}) {
  const [wallets, setWallets] = useState([]);
  const [loadingWallets, setLoadingWallets] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(false);

  const notify = useCallback(
    (message) => {
      showNotify?.(message);
    },
    [showNotify]
  );

  const shortenAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 10)}...${address.slice(-4)}`;
  };

  const normalizeWalletResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.wallets)) return response.wallets;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  };

  const selectedWallet = wallets.find(
    (walletItem) =>
      walletItem.address?.toLowerCase() ===
      paymentDetails.walletAddress?.toLowerCase()
  );

  const loadWallets = useCallback(
    async ({ autoSelect = false } = {}) => {
      try {
        setLoadingWallets(true);

        const response = await getMyWallets();
        const walletList = normalizeWalletResponse(response);

        setWallets(walletList);

        if (autoSelect && walletList.length > 0) {
          const defaultWallet =
            walletList.find((walletItem) => walletItem.isDefault) ||
            walletList[0];

          setPaymentDetails((prev) => ({
            ...prev,
            walletAddress: prev.walletAddress || defaultWallet.address,
          }));
        }

        return walletList;
      } catch (error) {
        notify(
          error.response?.data?.message || "Could not load your saved wallets."
        );
        return [];
      } finally {
        setLoadingWallets(false);
      }
    },
    [notify, setPaymentDetails]
  );

  useEffect(() => {
    loadWallets({ autoSelect: true });
  }, [loadWallets]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setPaymentDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectWallet = (walletAddress) => {
    setPaymentDetails((prev) => ({
      ...prev,
      walletAddress,
    }));
  };

  const connectWallet = async () => {
    try {
      setConnectingWallet(true);

      const accounts = await requestMetaMaskAccounts();

      if (!accounts.length) {
        notify("Could not get any wallet address from MetaMask.");
        return;
      }

      const existingAddresses = new Set(
        wallets
          .map((walletItem) => walletItem.address?.toLowerCase())
          .filter(Boolean)
      );
      let savedCount = 0;
      let duplicateCount = 0;

      for (const [index, walletAddress] of accounts.entries()) {
        const normalizedAddress = walletAddress.toLowerCase();

        try {
          await addWallet({
            name: "MetaMask",
            address: walletAddress,
            network: "sepolia",
            isDefault:
              wallets.length === 0 &&
              savedCount === 0 &&
              index === 0 &&
              !existingAddresses.size,
          });
          savedCount += 1;
          existingAddresses.add(normalizedAddress);
        } catch (error) {
          if (error.response?.status === 409) {
            duplicateCount += 1;
          } else {
            throw error;
          }
        }
      }

      setPaymentDetails((prev) => ({
        ...prev,
        walletAddress: accounts[0],
      }));

      await loadWallets();

      if (savedCount > 0) {
        notify(
          `${savedCount} MetaMask ${
            savedCount === 1 ? "wallet" : "wallets"
          } connected successfully.`
        );
      } else if (duplicateCount > 0) {
        notify("Selected MetaMask wallet is already saved.");
      }
    } catch (error) {
      notify(
        getBlockchainErrorMessage(error, {
          fallback: "Could not connect MetaMask.",
        })
      );
    } finally {
      setConnectingWallet(false);
    }
  };

  return (
    <div className="escrow-payment">
      <div className="checkout-section-heading">
        <span>Step 3</span>
        <h2>Secure the order with MetaMask</h2>
        <p>
          Your payment is recorded on Sepolia through the showroom escrow
          contract. The selected wallet must be active in MetaMask when you
          confirm.
        </p>
      </div>

      <div className="payment-safety-panel">
        <strong>Payment safety checks</strong>
        <ul>
          <li>MetaMask must be on Sepolia and unlocked.</li>
          <li>The selected wallet must match the active MetaMask account.</li>
          <li>The wallet must have enough SepoliaETH for payment and gas.</li>
          <li>RPC, gas estimation, and smart contract rejection errors are shown as readable messages.</li>
        </ul>
      </div>

      <div className="payment-plan-grid">
        <label
          className={`payment-plan-card ${
            paymentType === "deposit" ? "selected" : ""
          }`}
        >
          <input
            type="radio"
            name="paymentType"
            value="deposit"
            checked={paymentType === "deposit"}
            onChange={() => setPaymentType("deposit")}
          />
          <div>
            <span>Recommended</span>
            <strong>Deposit reservation</strong>
            <p>
              Pay the deposit now, then complete the remaining balance after
              you receive the vehicle.
            </p>
          </div>
          {paymentType === "deposit" && <CheckCircle size={20} />}
        </label>

        <label
          className={`payment-plan-card ${
            paymentType === "full" ? "selected" : ""
          }`}
        >
          <input
            type="radio"
            name="paymentType"
            value="full"
            checked={paymentType === "full"}
            onChange={() => setPaymentType("full")}
          />
          <div>
            <span>Optional</span>
            <strong>Full blockchain payment</strong>
            <p>
              Pay the full purchase amount immediately through the same escrow
              contract.
            </p>
          </div>
          {paymentType === "full" && <CheckCircle size={20} />}
        </label>
      </div>

      <div className="payment-contact-panel">
        <div className="panel-title-row">
          <div>
            <span>Buyer information</span>
            <h3>Contact details</h3>
          </div>
          <LockKeyhole size={22} />
        </div>

        <div className="payment-input-grid">
          <input
            type="text"
            name="fullName"
            placeholder="Full name"
            value={paymentDetails.fullName}
            onChange={handleInputChange}
          />

          <input
            type="text"
            name="phoneNumber"
            placeholder="Phone number"
            value={paymentDetails.phoneNumber}
            onChange={handleInputChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={paymentDetails.email}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="payment-wallet-panel">
        <div className="panel-title-row">
          <div>
            <span>Payment wallet</span>
            <h3>Choose a connected wallet</h3>
          </div>

          <button
            type="button"
            className="metamask-connect-btn"
            onClick={connectWallet}
            disabled={connectingWallet}
          >
            <img src={metamaskIcon} alt="" aria-hidden="true" />
            {connectingWallet ? "Connecting..." : "Connect MetaMask"}
            {!connectingWallet && <Plus size={15} />}
          </button>
        </div>

        {loadingWallets ? (
          <p className="wallet-loading-text">Loading your wallets...</p>
        ) : wallets.length > 0 ? (
          <div className="checkout-wallet-grid">
            {wallets.map((walletItem) => {
              const isSelected =
                walletItem.address?.toLowerCase() ===
                paymentDetails.walletAddress?.toLowerCase();

              return (
                <button
                  key={walletItem._id || walletItem.address}
                  type="button"
                  className={`checkout-wallet-card ${
                    isSelected ? "selected" : ""
                  }`}
                  onClick={() => handleSelectWallet(walletItem.address)}
                >
                  <div className="checkout-wallet-card-main">
                    <div className="checkout-wallet-avatar">
                      <img src={metamaskIcon} alt="MetaMask" />
                    </div>

                    <div className="checkout-wallet-main">
                      <span>{walletItem.name || "MetaMask"}</span>
                      <code title={walletItem.address}>
                        {shortenAddress(walletItem.address)}
                      </code>
                    </div>
                  </div>

                  <div className="checkout-wallet-meta">
                    <span>{walletItem.network || "sepolia"}</span>

                    {walletItem.isDefault && (
                      <span className="checkout-wallet-default">Default</span>
                    )}

                    {isSelected && (
                      <span className="checkout-wallet-selected">
                        <CheckCircle size={12} />
                        Selected
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="wallet-empty-box">
            <Wallet size={28} />
            <div>
              <strong>No wallets connected</strong>
              <p>Connect MetaMask to add a payment wallet.</p>
            </div>
          </div>
        )}

        {selectedWallet && (
          <p className="wallet-selected-note">
            Selected wallet: {shortenAddress(selectedWallet.address)}. The
            checkout will ask MetaMask to sign with this exact address.
          </p>
        )}
      </div>
    </div>
  );
}

export default Step3Payment;
