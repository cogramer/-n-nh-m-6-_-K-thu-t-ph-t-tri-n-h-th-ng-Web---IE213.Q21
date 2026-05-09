import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import "./WalletManagement.css";
import metamaskIcon from "../../../assets/icon/metamask.png";
import {
  getMyWallets,
  addWallet,
  updateWallet,
  deleteWallet,
} from "../../../services/walletService";
import { getBlockchainErrorMessage } from "../../../utils/blockchainErrors";
import { requestMetaMaskAccounts } from "../../../utils/metamaskWallets";

function WalletManagement() {
  const [wallets, setWallets] = useState([]);
  const [loadingWallets, setLoadingWallets] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [updatingWalletId, setUpdatingWalletId] = useState(null);
  const [deletingWalletId, setDeletingWalletId] = useState(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const defaultWallet = useMemo(
    () => wallets.find((wallet) => wallet.isDefault),
    [wallets]
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

  const getWalletId = (wallet) => wallet._id || wallet.id;

  const loadWallets = useCallback(async () => {
    try {
      setLoadingWallets(true);
      setErrorMessage("");

      const response = await getMyWallets();
      const walletList = normalizeWalletResponse(response);

      setWallets(walletList);
      return walletList;
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Could not load your saved wallets."
      );
      return [];
    } finally {
      setLoadingWallets(false);
    }
  }, []);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  const connectWallet = async () => {
    try {
      setConnectingWallet(true);
      setErrorMessage("");
      setMessage("");

      const accounts = await requestMetaMaskAccounts();

      if (!accounts.length) {
        setErrorMessage("Could not get any wallet address from MetaMask.");
        return;
      }

      const existingAddresses = new Set(
        wallets.map((wallet) => wallet.address?.toLowerCase()).filter(Boolean)
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

      if (savedCount > 0) {
        setMessage(
          `${savedCount} MetaMask ${
            savedCount === 1 ? "wallet" : "wallets"
          } connected successfully.`
        );
      } else if (duplicateCount > 0) {
        setMessage("Selected MetaMask wallet is already saved.");
      }

      await loadWallets();
    } catch (error) {
      setErrorMessage(
        getBlockchainErrorMessage(error, {
          fallback: "Could not connect MetaMask.",
        })
      );
    } finally {
      setConnectingWallet(false);
    }
  };

  const setDefaultWallet = async (wallet) => {
    const walletId = getWalletId(wallet);

    if (!walletId) {
      setErrorMessage("Wallet id is missing.");
      return;
    }

    try {
      setUpdatingWalletId(walletId);
      setErrorMessage("");
      setMessage("");

      await updateWallet(walletId, {
        isDefault: true,
      });

      setMessage("Default wallet updated.");
      await loadWallets();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Could not set the default wallet."
      );
    } finally {
      setUpdatingWalletId(null);
    }
  };

  const removeWallet = async (walletId) => {
    if (!walletId) {
      setErrorMessage("Wallet id is missing.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove this wallet?"
    );
    if (!confirmed) return;

    try {
      setDeletingWalletId(walletId);
      setErrorMessage("");
      setMessage("");

      await deleteWallet(walletId);

      setMessage("Wallet removed successfully.");
      await loadWallets();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Could not remove this wallet."
      );
    } finally {
      setDeletingWalletId(null);
    }
  };

  return (
    <div className="wallet-management">
      <div className="wallet-management-header">
        <div>
          <span>Connected wallets</span>
          <h3>Wallet Management</h3>
          <p>
            Save multiple MetaMask wallets and choose one of them when you pay
            at checkout.
          </p>
        </div>

        <button
          type="button"
          className="wallet-connect-btn"
          onClick={connectWallet}
          disabled={connectingWallet}
        >
          <img
            className="wallet-metamask-icon"
            src={metamaskIcon}
            alt=""
            aria-hidden="true"
          />
          {connectingWallet ? "Connecting..." : "Connect MetaMask"}
        </button>
      </div>

      <div className="wallet-management-summary">
        <div>
          <span>Total wallets</span>
          <strong>{wallets.length}</strong>
        </div>
        <div>
          <span>Default wallet</span>
          <strong>
            {defaultWallet ? shortenAddress(defaultWallet.address) : "Not set"}
          </strong>
        </div>
      </div>

      {message && <p className="wallet-success-text">{message}</p>}
      {errorMessage && <p className="wallet-error-text">{errorMessage}</p>}

      {loadingWallets ? (
        <p className="wallet-loading-text">Loading your wallets...</p>
      ) : wallets.length > 0 ? (
        <div className="wallet-list">
          {wallets.map((wallet) => {
            const walletId = getWalletId(wallet);
            const isUpdating = updatingWalletId === walletId;
            const isDeleting = deletingWalletId === walletId;

            return (
              <article
                key={walletId || wallet.address}
                className={`wallet-item ${wallet.isDefault ? "is-default" : ""}`}
              >
                <div className="wallet-item-main">
                  <div className="wallet-avatar">
                    <img src={metamaskIcon} alt="MetaMask" />
                  </div>

                  <div className="wallet-details">
                    <div className="wallet-title-row">
                      <h4>{wallet.name || "MetaMask"}</h4>
                      {wallet.isDefault && (
                        <span className="wallet-default-badge">Default</span>
                      )}
                    </div>

                    <code title={wallet.address}>
                      {shortenAddress(wallet.address)}
                    </code>
                  </div>
                </div>

                <div className="wallet-item-footer">
                  <span className="wallet-network-badge">
                    {wallet.network || "sepolia"}
                  </span>

                  <div className="wallet-actions">
                    <button
                      type="button"
                      className={`wallet-action-btn ${
                        wallet.isDefault
                          ? "wallet-action-current"
                          : "wallet-action-soft"
                      }`}
                      onClick={() => setDefaultWallet(wallet)}
                      disabled={wallet.isDefault || isUpdating || isDeleting}
                    >
                      <Star size={15} />
                      {wallet.isDefault
                        ? "Current default"
                        : isUpdating
                          ? "Saving..."
                          : "Make default"}
                    </button>

                    <button
                      type="button"
                      className="wallet-action-btn wallet-action-danger"
                      onClick={() => removeWallet(walletId)}
                      disabled={isDeleting || isUpdating}
                    >
                      <Trash2 size={15} />
                      {isDeleting ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="wallet-empty-box">
          <div className="wallet-avatar">
            <img src={metamaskIcon} alt="MetaMask" />
          </div>

          <div>
            <strong>No wallets connected</strong>
            <p>Connect MetaMask to save your first payment wallet.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default WalletManagement;
