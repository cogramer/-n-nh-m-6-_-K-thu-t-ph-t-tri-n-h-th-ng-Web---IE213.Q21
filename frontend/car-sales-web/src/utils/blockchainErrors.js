const MESSAGE_BY_LOCALE = {
  en: {
    fallback: "The blockchain transaction could not be completed. Please try again.",
    noProvider: "MetaMask is not installed in this browser. Please install MetaMask and try again.",
    rejected: "You rejected the transaction in MetaMask.",
    pendingRequest: "MetaMask already has a pending request. Open MetaMask, finish or cancel it, then try again.",
    insufficientFunds: "Your wallet does not have enough SepoliaETH to cover the payment and gas fee. Add SepoliaETH from a faucet, then try again.",
    wrongNetwork: "MetaMask is connected to the wrong network. Please switch to Sepolia and try again.",
    rpc: "The Sepolia RPC connection failed or timed out. Please check your network/RPC endpoint and try again.",
    wrongBuyer: "The connected MetaMask wallet is not the buyer wallet for this order.",
    wrongSeller: "The connected wallet is not the seller wallet for this order.",
    orderNotPaid: "This order has not been paid on the smart contract yet.",
    orderNotConfirmed: "This order has not been confirmed by the showroom yet.",
    invalidStatus: "This blockchain order is not in a valid status for this action.",
    orderNotFound: "This order was not found on the smart contract. Please refresh and try again.",
    cannotCancel: "This order can no longer be cancelled.",
    amountMismatch: "The payment amount does not match the amount stored in the smart contract. Please refresh checkout and create the order again.",
    planMismatch: "The selected payment plan does not match this blockchain order. Please go back and try checkout again.",
    estimateGas: "MetaMask could not estimate gas because the smart contract would reject this transaction. Please check wallet, amount, network, and order status.",
    onChainFailed: "The transaction was sent but failed on-chain.",
    metamask: "MetaMask could not complete the transaction. Please check the wallet popup and try again.",
  },
  vi: {
    fallback: "Không thể hoàn tất giao dịch blockchain. Vui lòng thử lại.",
    noProvider: "Trình duyệt chưa cài MetaMask. Vui lòng cài MetaMask rồi thử lại.",
    rejected: "Bạn đã từ chối giao dịch trên MetaMask.",
    pendingRequest: "MetaMask đang có một yêu cầu chờ xử lý. Hãy mở MetaMask để xác nhận hoặc hủy yêu cầu đó rồi thử lại.",
    insufficientFunds: "Ví không đủ SepoliaETH để thanh toán và trả phí gas. Hãy nạp SepoliaETH từ faucet rồi thử lại.",
    wrongNetwork: "MetaMask đang kết nối sai mạng. Vui lòng chuyển sang Sepolia rồi thử lại.",
    rpc: "Kết nối Sepolia RPC bị lỗi hoặc quá thời gian chờ. Vui lòng kiểm tra mạng/RPC endpoint rồi thử lại.",
    wrongBuyer: "Ví MetaMask đang kết nối không phải ví người mua của đơn hàng này.",
    wrongSeller: "Ví đang kết nối không phải ví người bán của đơn hàng này.",
    orderNotPaid: "Đơn hàng chưa được thanh toán trên smart contract.",
    orderNotConfirmed: "Đơn hàng chưa được showroom xác nhận.",
    invalidStatus: "Trạng thái đơn hàng trên smart contract chưa phù hợp để thực hiện thao tác này.",
    orderNotFound: "Không tìm thấy đơn hàng trên smart contract. Vui lòng làm mới và thử lại.",
    cannotCancel: "Không thể hủy đơn hàng ở trạng thái hiện tại.",
    amountMismatch: "Số tiền thanh toán không khớp với số tiền lưu trên smart contract. Vui lòng làm mới checkout và tạo lại đơn.",
    planMismatch: "Gói thanh toán đang chọn không khớp với đơn hàng blockchain này. Vui lòng quay lại và thử checkout lại.",
    estimateGas: "MetaMask không thể ước tính gas vì smart contract sẽ từ chối giao dịch này. Vui lòng kiểm tra ví, số tiền, mạng và trạng thái đơn hàng.",
    onChainFailed: "Giao dịch đã gửi nhưng thất bại on-chain.",
    metamask: "MetaMask không thể hoàn tất giao dịch. Vui lòng kiểm tra popup ví rồi thử lại.",
  },
};

const STRING_FIELDS = [
  "message",
  "shortMessage",
  "reason",
  "details",
  "body",
];

const NESTED_FIELDS = [
  "response",
  "data",
  "info",
  "error",
  "cause",
  "originalError",
];

const collectErrorStrings = (value, output = [], visited = new Set()) => {
  if (!value || visited.has(value)) return output;

  if (typeof value === "string") {
    output.push(value);
    return output;
  }

  if (typeof value !== "object") return output;
  visited.add(value);

  for (const field of STRING_FIELDS) {
    if (typeof value[field] === "string") {
      output.push(value[field]);
    }
  }

  for (const field of NESTED_FIELDS) {
    collectErrorStrings(value[field], output, visited);
  }

  return output;
};

const collectErrorCodes = (value, output = [], visited = new Set()) => {
  if (!value || typeof value !== "object" || visited.has(value)) return output;
  visited.add(value);

  if (value.code !== undefined && value.code !== null) {
    output.push(String(value.code));
  }

  for (const field of NESTED_FIELDS) {
    collectErrorCodes(value[field], output, visited);
  }

  return output;
};

const includesAny = (text, patterns) =>
  patterns.some((pattern) => text.includes(pattern));

const hasCode = (codes, expectedCodes) =>
  codes.some((code) => expectedCodes.includes(code));

const selectMessages = (locale) =>
  MESSAGE_BY_LOCALE[locale] || MESSAGE_BY_LOCALE.en;

export const getBlockchainErrorMessage = (
  error,
  { fallback, locale = "en" } = {}
) => {
  const messages = selectMessages(locale);
  const raw = collectErrorStrings(error)
    .filter(Boolean)
    .join(" | ")
    .trim();
  const normalized = raw.toLowerCase();
  const codes = collectErrorCodes(error);

  if (!raw && codes.length === 0) return fallback || messages.fallback;

  if (hasCode(codes, ["ACTION_REJECTED", "4001"]) ||
      includesAny(normalized, [
        "user rejected",
        "user denied",
        "rejected the request",
        "rejected transaction",
        "denied transaction",
        "denied account authorization",
      ])) {
    return messages.rejected;
  }

  if (hasCode(codes, ["-32002"]) ||
      includesAny(normalized, ["already pending", "request already pending"])) {
    return messages.pendingRequest;
  }

  if (includesAny(normalized, [
    "metamask is not installed",
    "please install metamask",
    "ethereum provider is missing",
  ])) {
    return messages.noProvider;
  }

  if (hasCode(codes, ["INSUFFICIENT_FUNDS"]) ||
      includesAny(normalized, [
        "insufficient funds",
        "not enough funds",
        "insufficient balance",
        "exceeds balance",
        "intrinsic transaction cost",
        "funds for gas",
        "gas * price + value",
      ])) {
    return messages.insufficientFunds;
  }

  if (includesAny(normalized, ["not buyer", "buyer wallet", "selected buyer wallet"])) {
    return messages.wrongBuyer;
  }

  if (includesAny(normalized, ["not seller", "seller wallet"])) {
    return messages.wrongSeller;
  }

  if (includesAny(normalized, [
    "wallet_switchethereumchain",
    "switch to sepolia",
    "wrong network",
    "unsupported chain",
    "chain id",
    "chainid",
    "network changed",
    "underlying network changed",
    "connected to the wrong network",
  ])) {
    return messages.wrongNetwork;
  }

  if (hasCode(codes, ["NETWORK_ERROR", "SERVER_ERROR", "TIMEOUT", "UNKNOWN_ERROR"]) ||
      includesAny(normalized, [
        "rpc",
        "json-rpc",
        "failed to fetch",
        "timeout",
        "timed out",
        "network error",
        "could not coalesce error",
        "missing response",
        "bad response",
        "rate limit",
        "too many requests",
        "gateway",
        "503",
        "502",
        "504",
      ])) {
    return messages.rpc;
  }

  if (includesAny(normalized, ["order not paid", "chua duoc thanh toan", "chưa được thanh toán"])) {
    return messages.orderNotPaid;
  }

  if (includesAny(normalized, ["order not confirmed", "has not been confirmed", "chưa được showroom xác nhận"])) {
    return messages.orderNotConfirmed;
  }

  if (includesAny(normalized, ["cannot cancel now", "khong the huy", "không thể hủy"])) {
    return messages.cannotCancel;
  }

  if (includesAny(normalized, ["invalid status", "not waiting for payment", "not in a valid status"])) {
    return messages.invalidStatus;
  }

  if (includesAny(normalized, ["order not found", "order does not exist", "khong tim thay", "không tìm thấy"])) {
    return messages.orderNotFound;
  }

  if (includesAny(normalized, [
    "incorrect full amount",
    "incorrect deposit amount",
    "amount does not match",
    "payment amount",
    "tong tien",
    "tổng tiền",
    "so tien",
    "số tiền",
  ])) {
    return messages.amountMismatch;
  }

  if (includesAny(normalized, [
    "not full payment order",
    "not deposit order",
    "payment plan",
    "payment type",
    "loai full",
    "loại full",
    "loai deposit",
    "loại deposit",
  ])) {
    return messages.planMismatch;
  }

  if (hasCode(codes, ["CALL_EXCEPTION", "UNPREDICTABLE_GAS_LIMIT"]) ||
      includesAny(normalized, [
        "estimategas",
        "estimate gas",
        "cannot estimate gas",
        "gas required exceeds allowance",
        "intrinsic gas too low",
        "execution reverted",
        "missing revert data",
        "call exception",
      ])) {
    return messages.estimateGas;
  }

  if (includesAny(normalized, ["failed on-chain", "that bai", "thất bại"])) {
    return messages.onChainFailed;
  }

  if (normalized.includes("metamask")) {
    return messages.metamask;
  }

  if (raw.length > 180) return fallback || messages.fallback;
  return raw || fallback || messages.fallback;
};
