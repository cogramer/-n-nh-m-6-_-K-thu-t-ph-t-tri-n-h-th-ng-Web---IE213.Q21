import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  ExternalLink,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import { orderService } from "../../services/orderService";
import ReviewService from "../../services/reviewService";
import { getBlockchainErrorMessage } from "../../utils/blockchainErrors";
import {
  assertWalletCanSendTransaction,
  getBuyerMarketplaceContract,
  getFullPaymentWei,
  getPositiveWeiValue,
} from "../../utils/blockchainClient";
import "./MyOrders.css";

const STATUS_CONFIG = {
  pending_deposit: {
    label: "Awaiting deposit",
    tone: "warning",
    description: "Your order has been created. Please complete the deposit payment.",
  },
  pending_payment: {
    label: "Awaiting payment",
    tone: "warning",
    description: "Your order is waiting for full payment.",
  },
  deposit_paid: {
    label: "Deposit paid",
    tone: "info",
    description: "Your deposit has been verified. The order is waiting for showroom confirmation.",
  },
  payment_paid: {
    label: "Payment paid",
    tone: "info",
    description: "Your full payment has been verified. The order is waiting for showroom confirmation.",
  },
  processing: {
    label: "Processing",
    tone: "primary",
    description: "The showroom has confirmed your order. Complete the transaction after receiving the car.",
  },
  completed: {
    label: "Completed",
    tone: "success",
    description: "This transaction has been completed and recorded in the system.",
  },
  cancelled: {
    label: "Cancelled",
    tone: "danger",
    description: "This order has been cancelled.",
  },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const shortText = (value, start = 8, end = 6) => {
  if (!value) return "Not available";
  return `${String(value).slice(0, start)}...${String(value).slice(-end)}`;
};

const getErrorMessage = (error) =>
  getBlockchainErrorMessage(error, {
    fallback: "Something went wrong while processing the transaction.",
  });

const isFullPaymentRecorded = (order) =>
  order.paymentType === "full" &&
  (
    order.status === "payment_paid" ||
    Boolean(order.fullTxHash) ||
    Number(order.paidAmount || 0) >= Number(order.totalAmount || 0)
  );

const getOrderStatusKey = (order) =>
  order.status === "pending_payment" && isFullPaymentRecorded(order)
    ? "payment_paid"
    : order.status;

const getItemProductId = (item) => item.productId?._id || item.productId;

const getOrderReviewKey = (orderId, productId) => `${orderId}-${productId}`;

function MyOrders({ notifyRef }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [reviewSavingKey, setReviewSavingKey] = useState("");

  const showNotification = (message, type = "info") => {
    notifyRef?.current?.showNotification("System Message", message, type);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getMyOrders();
      const list = Array.isArray(response) ? response : response?.data || [];
      setOrders(list);
    } catch (error) {
      console.error("Failed to load orders:", error);
      showNotification(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      const orderStatusKey = getOrderStatusKey(order);
      const matchesStatus = statusFilter === "all" || orderStatusKey === statusFilter;
      const matchesKeyword =
        !keyword ||
        [
          order._id,
          order.blockchainOrderId,
          order.buyerWallet,
          order.sellerWallet,
          ...(order.items || []).map((item) => item.name),
        ].some((value) => String(value || "").toLowerCase().includes(keyword));

      return matchesStatus && matchesKeyword;
    });
  }, [orders, searchTerm, statusFilter]);

  const stats = useMemo(
    () => ({
      total: orders.length,
      waiting: orders.filter((order) =>
        ["pending_deposit", "pending_payment", "deposit_paid", "payment_paid"].includes(getOrderStatusKey(order))
      ).length,
      processing: orders.filter((order) => order.status === "processing").length,
      completed: orders.filter((order) => order.status === "completed").length,
    }),
    [orders]
  );

  const runOrderAction = async (order, action, handler) => {
    if (actionState) return;
    try {
      setActionState({ orderId: order._id, action });
      await handler();
      await fetchOrders();
    } catch (error) {
      console.error("Failed to process order:", error);
      showNotification(getErrorMessage(error), "error");
    } finally {
      setActionState(null);
    }
  };

  const handlePayDeposit = (order) => {
    runOrderAction(order, "payDeposit", async () => {
      const contract = await getBuyerMarketplaceContract(order);
      const value = getPositiveWeiValue(order.depositAmountWei);
      await assertWalletCanSendTransaction({
        contract,
        value,
        estimateGas: () =>
          contract.payDeposit.estimateGas(order.blockchainOrderId, { value }),
      });
      const tx = await contract.payDeposit(order.blockchainOrderId, {
        value,
      });
      await tx.wait();
      await orderService.verifyDeposit(order._id, tx.hash);
      showNotification("Deposit paid successfully. Your order is waiting for showroom confirmation.", "success");
    });
  };

  const handlePayFull = (order) => {
    runOrderAction(order, "payFull", async () => {
      const contract = await getBuyerMarketplaceContract(order);
      const value = getFullPaymentWei(order);
      await assertWalletCanSendTransaction({
        contract,
        value,
        estimateGas: () =>
          contract.payFull.estimateGas(order.blockchainOrderId, { value }),
      });
      const tx = await contract.payFull(order.blockchainOrderId, {
        value,
      });
      await tx.wait();
      await orderService.verifyFullPayment(order._id, tx.hash);
      showNotification("Payment completed successfully. Your order is waiting for showroom confirmation.", "success");
    });
  };

  const handleComplete = (order) => {
    if (!window.confirm("Have you received the car and want to complete this transaction?")) return;
    runOrderAction(order, "complete", async () => {
      const contract = await getBuyerMarketplaceContract(order);
      await assertWalletCanSendTransaction({
        contract,
        estimateGas: () =>
          contract.completeOrder.estimateGas(order.blockchainOrderId),
      });
      const tx = await contract.completeOrder(order.blockchainOrderId);
      await tx.wait();
      await orderService.verifyComplete(order._id, tx.hash);
      showNotification("The transaction has been completed successfully.", "success");
    });
  };

  const handleCancel = (order) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    runOrderAction(order, "cancel", async () => {
      const contract = await getBuyerMarketplaceContract(order);
      await assertWalletCanSendTransaction({
        contract,
        estimateGas: () =>
          contract.cancelOrder.estimateGas(order.blockchainOrderId),
      });
      const tx = await contract.cancelOrder(order.blockchainOrderId);
      await tx.wait();
      await orderService.verifyCancel(order._id, tx.hash);
      showNotification("Order cancelled successfully.", "success");
    });
  };

  const renderAction = (order) => {
    const isRunning = actionState?.orderId === order._id;
    const orderStatusKey = getOrderStatusKey(order);

    if (orderStatusKey === "pending_deposit") {
      return (
        <button className="order-action primary" onClick={() => handlePayDeposit(order)} disabled={Boolean(actionState)}>
          {isRunning && actionState.action === "payDeposit" ? <LoaderCircle className="spin-icon" size={17} /> : <Wallet size={17} />}
          Pay deposit
        </button>
      );
    }

    if (orderStatusKey === "pending_payment") {
      return (
        <button className="order-action primary" onClick={() => handlePayFull(order)} disabled={Boolean(actionState)}>
          {isRunning && actionState.action === "payFull" ? <LoaderCircle className="spin-icon" size={17} /> : <CreditCard size={17} />}
          Pay now
        </button>
      );
    }

    if (orderStatusKey === "processing") {
      return (
        <button className="order-action success" onClick={() => handleComplete(order)} disabled={Boolean(actionState)}>
          {isRunning && actionState.action === "complete" ? <LoaderCircle className="spin-icon" size={17} /> : <PackageCheck size={17} />}
          Received car
        </button>
      );
    }

    return null;
  };

  const canCancel = (order) =>
    ["pending_deposit", "pending_payment", "deposit_paid", "payment_paid"].includes(getOrderStatusKey(order));

  const updateReviewDraft = (orderId, productId, field, value) => {
    const key = getOrderReviewKey(orderId, productId);
    setReviewDrafts((previous) => ({
      ...previous,
      [key]: {
        rating: 5,
        comment: "",
        ...previous[key],
        [field]: value,
        saved: false,
      },
    }));
  };

  const handleSubmitReview = async (event, order, item) => {
    event.preventDefault();

    const productId = getItemProductId(item);
    if (!productId) {
      showNotification("This vehicle is no longer available for review.", "error");
      return;
    }

    const key = getOrderReviewKey(order._id, productId);
    const draft = reviewDrafts[key] || { rating: 5, comment: "" };
    const comment = String(draft.comment || "").trim();

    if (!comment) {
      showNotification("Please enter your review before saving.", "error");
      return;
    }

    try {
      setReviewSavingKey(key);
      await ReviewService.createReview({
        productId,
        orderId: order._id,
        rating: Number(draft.rating) || 5,
        comment,
      });
      setReviewDrafts((previous) => ({
        ...previous,
        [key]: {
          ...previous[key],
          rating: Number(draft.rating) || 5,
          comment,
          saved: true,
        },
      }));
      showNotification("Review saved successfully.", "success");
    } catch (error) {
      console.error("Failed to save review:", error);
      showNotification(getErrorMessage(error), "error");
    } finally {
      setReviewSavingKey("");
    }
  };

  return (
    <>
      <Navbar />
      <main className="my-orders-page">
        <header className="my-orders-header">
          <div>
            <p className="my-orders-eyebrow">Transaction history</p>
            <h1>My orders</h1>
            <p>Track order status, txHash, and complete your transaction after receiving the car.</p>
          </div>
          <button className="refresh-orders-btn" onClick={fetchOrders} disabled={loading || Boolean(actionState)}>
            <RefreshCw size={17} className={loading ? "spin-icon" : ""} />
            Refresh
          </button>
        </header>

        <section className="order-stats-grid">
          <StatCard icon={<Clock3 size={22} />} label="Total orders" value={stats.total} />
          <StatCard icon={<Wallet size={22} />} label="Waiting" value={stats.waiting} />
          <StatCard icon={<ShieldCheck size={22} />} label="Processing" value={stats.processing} />
          <StatCard icon={<CheckCircle2 size={22} />} label="Completed" value={stats.completed} />
        </section>

        <section className="my-orders-toolbar">
          <div className="order-search-box">
            <Search size={18} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by order ID, wallet, car name..."
            />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <option key={status} value={status}>
                {config.label}
              </option>
            ))}
          </select>
        </section>

        <section className="my-orders-list">
          {loading ? (
            <div className="orders-empty">
              <LoaderCircle className="spin-icon" size={24} />
              Loading orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="orders-empty">No matching orders found.</div>
          ) : (
            filteredOrders.map((order) => {
              const orderStatusKey = getOrderStatusKey(order);
              const config = STATUS_CONFIG[orderStatusKey] || STATUS_CONFIG.pending_deposit;
              const isExpanded = expandedOrderId === order._id;
              const isRunning = actionState?.orderId === order._id;
              const txHash = order.fullTxHash || order.depositTxHash;

              return (
                <article className={`my-order-card ${isRunning ? "is-processing" : ""}`} key={order._id}>
                  <div className="order-card-main">
                    <div className="order-card-left">
                      <div className="order-id-row">
                        <strong>#{order._id.slice(-8)}</strong>
                        <span className={`order-status-pill ${config.tone}`}>{config.label}</span>
                      </div>
                      <h2>{order.items?.[0]?.name || "Vehicle order"}</h2>
                      <p>{order.items?.length || 0} item(s) - Blockchain ID {order.blockchainOrderId}</p>
                    </div>

                    <div className="order-money-box">
                      <span>Total value</span>
                      <strong>{formatCurrency(order.totalAmount)}</strong>
                      <small>Paid: {formatCurrency(order.paidAmount)}</small>
                    </div>

                    <div className="order-card-actions">
                      {renderAction(order)}
                      {canCancel(order) && (
                        <button className="order-action danger" onClick={() => handleCancel(order)} disabled={Boolean(actionState)}>
                          {isRunning && actionState.action === "cancel" ? <LoaderCircle className="spin-icon" size={17} /> : <Ban size={17} />}
                          Cancel order
                        </button>
                      )}
                      <button className="order-action ghost" onClick={() => setExpandedOrderId(isExpanded ? "" : order._id)}>
                        <ChevronDown size={17} className={isExpanded ? "rotated" : ""} />
                        Details
                      </button>
                    </div>
                  </div>

                  <div className="order-progress">
                    <ProgressStep done label="Order created" />
                    <ProgressStep done={["deposit_paid", "payment_paid", "processing", "completed"].includes(orderStatusKey)} label="Payment" />
                    <ProgressStep done={["processing", "completed"].includes(orderStatusKey)} label="Showroom confirmed" />
                    <ProgressStep done={orderStatusKey === "completed"} label="Completed" />
                  </div>

                  <p className="order-status-note">{config.description}</p>

                  {isExpanded && (
                    <div className="order-detail-panel">
                      <div>
                        <h3>Products</h3>
                        <ul className="order-items">
                          {(order.items || []).map((item) => {
                            const productId = getItemProductId(item);

                            return (
                              <li key={`${productId}-${item.name}`}>
                                <span>
                                  {productId ? (
                                    <Link className="order-item-product-link" to={`/product/${productId}`}>
                                      {item.name}
                                    </Link>
                                  ) : (
                                    item.name
                                  )}{" "}
                                  x {item.quantity}
                                </span>
                                <strong>{formatCurrency(item.price)}</strong>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      <div>
                        <h3>Delivery</h3>
                        <p>{order.deliveryMethod === "pickup" ? "Pickup at showroom" : "Home delivery"}</p>
                        <p>{order.pickupInfo?.name || order.shippingAddress?.name}</p>
                        <p>{order.pickupInfo?.phone || order.shippingAddress?.phone}</p>
                        {order.shippingAddress?.address && <p>{order.shippingAddress.address}</p>}
                        {order.pickupInfo?.pickupDate && <p>Appointment: {new Date(order.pickupInfo.pickupDate).toLocaleDateString("en-US")}</p>}
                      </div>

                      <div>
                        <h3>Blockchain</h3>
                        <p>Buyer wallet: <span title={order.buyerWallet}>{shortText(order.buyerWallet, 6, 4)}</span></p>
                        <p>Showroom wallet: <span title={order.sellerWallet}>{shortText(order.sellerWallet, 6, 4)}</span></p>
                        <p>Payment type: {order.paymentType === "deposit" ? "Deposit" : "Full payment"}</p>
                        <p>Deposit amount: {formatCurrency(order.depositAmount)}</p>
                        {txHash ? (
                          <a className="tx-link" href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">
                            {shortText(txHash, 10, 8)}
                            <ExternalLink size={14} />
                          </a>
                        ) : (
                          <p>TxHash: Not available</p>
                        )}
                      </div>

                      {orderStatusKey === "completed" && (
                        <div className="order-review-panel">
                          <h3>Review your vehicle</h3>
                          <div className="order-review-list">
                            {(order.items || []).map((item) => {
                              const productId = getItemProductId(item);
                              const reviewKey = getOrderReviewKey(order._id, productId);
                              const draft = reviewDrafts[reviewKey] || { rating: 5, comment: "" };
                              const isSavingReview = reviewSavingKey === reviewKey;

                              return (
                                <form
                                  className="order-review-item"
                                  key={`review-${reviewKey}-${item.name}`}
                                  onSubmit={(event) => handleSubmitReview(event, order, item)}
                                >
                                  <div className="order-review-heading">
                                    <div>
                                      <strong>{item.name}</strong>
                                      <span>Verified purchase</span>
                                    </div>
                                    <label>
                                      Rating
                                      <select
                                        value={draft.rating}
                                        onChange={(event) =>
                                          updateReviewDraft(order._id, productId, "rating", event.target.value)
                                        }
                                      >
                                        {[5, 4, 3, 2, 1].map((value) => (
                                          <option key={value} value={value}>
                                            {value}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                  </div>
                                  <textarea
                                    value={draft.comment}
                                    onChange={(event) =>
                                      updateReviewDraft(order._id, productId, "comment", event.target.value)
                                    }
                                    placeholder="Share your experience with this vehicle..."
                                    rows={3}
                                  />
                                  <div className="order-review-footer">
                                    {draft.saved && <span>Review saved.</span>}
                                    <button type="submit" disabled={isSavingReview || !productId}>
                                      {isSavingReview ? <LoaderCircle className="spin-icon" size={16} /> : <Star size={16} />}
                                      Save review
                                    </button>
                                  </div>
                                </form>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      </main>
    </>
  );
}

const StatCard = ({ icon, label, value }) => (
  <article className="my-orders-stat-card">
    <div>{icon}</div>
    <span>{label}</span>
    <strong>{value}</strong>
  </article>
);

const ProgressStep = ({ label, done }) => (
  <div className={`progress-step ${done ? "done" : ""}`}>
    <span />
    <p>{label}</p>
  </div>
);

export default MyOrders;
