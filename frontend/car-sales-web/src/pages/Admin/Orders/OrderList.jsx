import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, LoaderCircle } from 'lucide-react';
import { orderService } from '../../../services/orderService';
import { getBlockchainErrorMessage } from '../../../utils/blockchainErrors';
import './OrderList.css';

const getErrorMessage = (error, fallback) =>
  getBlockchainErrorMessage(error, { fallback });

const isFullPaymentRecorded = (order) =>
  order.paymentType === 'full' &&
  (
    order.status === 'payment_paid' ||
    Boolean(order.fullTxHash) ||
    Number(order.paidAmount || 0) >= Number(order.totalAmount || 0)
  );

const getOrderStatusKey = (order) =>
  order.status === 'pending_payment' && isFullPaymentRecorded(order)
    ? 'payment_paid'
    : order.status?.toLowerCase();

const OrderList = ({ notifyRef }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);

  const showNotification = (message, type = "info") => {
    notifyRef?.current?.showNotification("System Message", message, type);
  };

  const getProcessingText = (action) => {
    if (action === 'confirm') return 'Đang xác nhận...';
    if (action === 'cancel') return 'Đang hủy...';
    return 'Đang xử lý...';
  };

  // Toggle handler
  const toggleExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await orderService.getAllOrders();
      const ordersData = res.data || res;
      console.log("Dữ liệu đơn hàng từ API:", ordersData);
      setOrders(ordersData);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đơn hàng:", error);
      // Mock data for three UI test cases
      setOrders([
        {
          _id: "69ec955f0d1a50a941398bc1", // Case 1: processing -> needs confirmation
          pickupInfo: { name: "Nguyen Van A", phone: "0900000000" },
          items: [{ name: "BMW i5", price: 68000, quantity: 1 }],
          totalAmount: 68000,
          paidAmount: 340,
          buyerWallet: "0x4B69B72efe5A93686bB07aCB8554F40EEF493005",
          paymentType: "deposit",
          depositTxHash: "0x0b0eb6c94529e90975b7489721e367a70f681ff08faad94cf778c8928a9ff889",
          fullTxHash: "",
          status: "processing",
          createdAt: "2026-04-25T10:20:15.923Z",
        },
        {
          _id: "69ec955f0d1a50a941398bc2", // Case 2: confirmed -> needs completion
          pickupInfo: { name: "Le Thi B", phone: "0911111111" },
          items: [{ name: "Mercedes S500", price: 120000, quantity: 1 }],
          totalAmount: 120000,
          paidAmount: 120000,
          buyerWallet: "0x1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T",
          paymentType: "full",
          depositTxHash: "",
          fullTxHash: "0xabc123...",
          status: "confirmed",
          createdAt: "2026-04-24T10:20:15.923Z",
        },
        {
          _id: "69ec955f0d1a50a941398bc3", // Case 3: completed -> hide actions
          pickupInfo: { name: "Tran Van C", phone: "0922222222" },
          items: [{ name: "Audi Q7", price: 85000, quantity: 1 }],
          totalAmount: 85000,
          paidAmount: 85000,
          buyerWallet: "0x9876543210abcdef9876543210abcdef98765432",
          paymentType: "full",
          depositTxHash: "",
          fullTxHash: "0xdef456...",
          status: "completed",
          createdAt: "2026-04-23T10:20:15.923Z",
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Confirm order handler
  const handleConfirmOrder = async (order) => {
    if (processingAction) return;

    if (!order.blockchainOrderId) {
      return showNotification("This order does not have a blockchain ID yet.", "error");
    }

    try {
      setProcessingAction({ orderId: order._id, action: 'confirm' });
      const result = await orderService.adminConfirm(order._id);
      showNotification("Order confirmed successfully.", "success");
      if (result?.txHash) {
        console.log("Admin confirm txHash:", result.txHash);
      }
      await fetchOrders();
    } catch (error) {
      console.error("Lỗi khi xác nhận đơn hàng:", error);
      showNotification(getErrorMessage(error, "Something went wrong while confirming the order."), "error");
    } finally {
      setProcessingAction(null);
    }
  };

  // Cancel order handler
  const handleCancelOrder = async (order) => {
    if (processingAction) return;

    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) return;

    if (!order.blockchainOrderId) {
      return showNotification("This order does not have a blockchain ID yet.", "error");
    }

    try {
      setProcessingAction({ orderId: order._id, action: 'cancel' });
      const result = await orderService.adminCancel(order._id);
      showNotification("Order cancelled successfully.", "success");
      if (result?.txHash) {
        console.log("Admin cancel txHash:", result.txHash);
      }
      await fetchOrders();
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
      showNotification(getErrorMessage(error, "Something went wrong while cancelling the order."), "error");
    } finally {
      setProcessingAction(null);
    }
  };

  const renderStatusBadge = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'pending_deposit':
        return <span className="badge badge-warning">Chờ thanh toán cọc</span>;
      case 'pending_payment':
        return <span className="badge badge-warning">Chờ thanh toán</span>;
      case 'deposit_paid':
        return <span className="badge badge-info">Đã trả cọc</span>;
      case 'processing':
        return <span className="badge badge-info">Đã trả cọc (Đang xử lý)</span>;
      case 'payment_paid':
        return <span className="badge badge-info">Đã trả thanh toán</span>;
      case 'confirmed':
        return <span className="badge badge-primary">Đã xác nhận</span>;
      case 'completed':
        return <span className="badge badge-success">Hoàn tất</span>;
      case 'cancelled':
        return <span className="badge badge-danger">Đã hủy</span>;
      default:
        return <span className="badge" style={{ textTransform: 'capitalize' }}>{status}</span>;
    }
  };

  const formatWallet = (wallet) => {
    if (!wallet) return "Không có";
    return `${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 4)}`;
  };

  return (
    <div className="order-list-container">
      <div className="page-header">
        <h2>Quản lý Đơn hàng</h2>
        <button className="refresh-btn" onClick={fetchOrders} disabled={!!processingAction}>
          {processingAction ? getProcessingText(processingAction.action) : 'Làm mới'}
        </button>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Ví Web3</th>
              <th>Sản phẩm</th>
              <th>Loại TT</th>
              <th>Tổng tiền</th>
              <th>Đã trả</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan="9" className="text-center">Đang tải dữ liệu...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="9" className="text-center">Chưa có đơn hàng nào.</td></tr>
            ) : (
              orders.map((order) => {
                const statusKey = getOrderStatusKey(order);
                const productName = order.items?.length > 0
                  ? `${order.items[0].name} ${order.items.length > 1 ? `(+${order.items.length - 1})` : ''}`
                  : 'Không rõ';

                // Condition: paid amount is greater than zero
                const isPaid = order.paidAmount > 0;
                const isExpanded = expandedOrderId === order._id;
                const canCancel = ['pending_deposit', 'pending_payment', 'deposit_paid', 'payment_paid'].includes(statusKey);
                const hasRunningAction = Boolean(processingAction);
                const isRowProcessing = processingAction?.orderId === order._id;
                const isConfirming = isRowProcessing && processingAction.action === 'confirm';
                const isCancelling = isRowProcessing && processingAction.action === 'cancel';
                return (
                  <React.Fragment key={order._id}>
                    <tr key={order._id} className={`${isExpanded ? 'row-expanded' : ''} ${isRowProcessing ? 'row-processing' : ''}`.trim()}>
                      <td><strong>#{order._id.substring(0, 8)}</strong></td>
                      <td>
                        <div><strong>{order.pickupInfo?.name || "Khách ẩn danh"}</strong></div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{order.pickupInfo?.phone || ""}</div>
                      </td>
                      <td>
                        <span title={order.buyerWallet} style={{ fontFamily: 'monospace', color: '#2563eb' }}>
                          {formatWallet(order.buyerWallet)}
                        </span>
                      </td>
                      <td>{productName}</td>
                      <td style={{ textTransform: 'capitalize' }}>{order.paymentType}</td>
                      <td>${order.totalAmount?.toLocaleString('en-US')}</td>
                      <td style={{ color: '#059669', fontWeight: 'bold' }}>
                        ${order.paidAmount?.toLocaleString('en-US') || 0}
                      </td>
                      <td>{renderStatusBadge(statusKey)}</td>
                      <td className="actions-cell">

                        {/* Confirm button */}
                        {/* Visible when the customer has paid and the order is not confirmed, completed, or cancelled */}
                        {isPaid && (statusKey === 'deposit_paid' || statusKey === 'payment_paid') && (
                          <button
                            className={`btn-action btn-confirm ${isConfirming ? 'is-loading' : ''}`}
                            onClick={() => handleConfirmOrder(order)}
                            disabled={hasRunningAction}
                            title="Xác nhận đã nhận tiền & chuẩn bị xe"
                          >
                            {isConfirming ? <LoaderCircle size={18} className="spin-icon" /> : <CheckCircle size={18} />}
                          </button>
                        )}

                        {/* Cancel button */}
                        {/* The smart contract only allows buyer or seller cancellation before seller confirmation. */}
                        {canCancel && (
                          <button
                            className={`btn-action btn-cancel ${isCancelling ? 'is-loading' : ''}`}
                            onClick={() => handleCancelOrder(order)}
                            disabled={hasRunningAction}
                            title="Hủy đơn & Hoàn tiền (nếu có)"
                          >
                            {isCancelling ? <LoaderCircle size={18} className="spin-icon" /> : <XCircle size={18} />}
                          </button>
                        )}

                        {isRowProcessing && (
                          <span className="action-status" role="status" aria-live="polite">
                            {getProcessingText(processingAction.action)}
                          </span>
                        )}

                        <button
                          className={`btn-action btn-view ${isExpanded ? 'active' : ''}`}
                          onClick={() => toggleExpand(order._id)}
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr className="detail-row">
                        <td colSpan="9">
                          <div className="order-detail-expanded">
                            <div className="detail-grid">
                              <div className="detail-section">
                                <h4>Thông tin giao dịch</h4>
                                <p><strong>Mã giao dịch (TxHash):</strong><br />
                                  <a
                                    href={`https://sepolia.etherscan.io/tx/${order.fullTxHash || order.depositTxHash}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {order.fullTxHash || order.depositTxHash || 'N/A'}
                                  </a>
                                </p>
                                <p><strong>Ngày tạo:</strong> {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                                <p><strong>Loại thanh toán:</strong> {order.paymentType === 'deposit' ? 'Đặt cọc' : 'Thanh toán toàn bộ'}</p>
                                <p><strong>Phương thức vẩn chuyển:</strong> {order.deliveryMethod === 'pickup' ? 'Nhận tại showroom' : 'Vận chuyển tận nhà'}</p>
                                <p>
                                  <strong>
                                    {order.deliveryMethod === 'pickup'
                                      ? `Ngày nhận: ${new Date(order.pickupInfo.pickupDate).toLocaleDateString('vi-VN')}`
                                      : `Địa chỉ: ${order.shippingAddress.address}`}
                                  </strong>
                                </p>
                              </div>

                              <div className="detail-section">
                                <h4>Danh sách sản phẩm</h4>
                                <ul className="detail-items-list">
                                  {order.items?.map((item, index) => (
                                    <li key={index}>
                                      {item.name} x {item.quantity} - <strong>${item.price?.toLocaleString()}</strong>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="detail-section">
                                <h4>Thông tin người nhận</h4>
                                <p><strong>Tên:</strong> {order.pickupInfo?.name}</p>
                                <p><strong>SĐT:</strong> {order.pickupInfo?.phone}</p>
                                <p><strong>Địa chỉ ví:</strong> {order.buyerWallet}</p>
                              </div>
                            </div>

                            {/* Status notes or logs can be added here */}
                            <div className="detail-footer">
                              <small>* Dữ liệu được xác thực trên Blockchain</small>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                    }
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div >
  );
};

export default OrderList;
