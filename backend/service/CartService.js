import Cart from "../models/CartModel.js";
import Product from "../models/ProductModel.js";

// ================= HELPER =================
const calcTotals = (items) => {
  const totalPrice = items.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0
  );

  const totalItems = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return { totalPrice, totalItems };
};

// ================= GET =================
export const getCartService = async (userId) => {
  const cart = await Cart.findOne({ userId }).populate(
    "items.productId",
    "name price thumbnailImage specifications"
  );

  if (!cart) {
    return { userId, items: [], totalPrice: 0, totalItems: 0 };
  }

  // Remove deleted products
  cart.items = cart.items.filter((item) => item.productId);

  return cart;
};

// ================= ADD =================
export const addToCartService = async (userId, body) => {
  const { productId, quantity = 1 } = body;

  if (!productId) throw new Error("productId là bắt buộc");
  if (quantity < 1) throw new Error("Số lượng phải ít nhất là 1");

  const product = await Product.findById(productId).select("price stock");
  if (!product) throw new Error("Sản phẩm không tồn tại");

  if (product.stock === 0) {
    throw new Error("Sản phẩm đã hết hàng");
  }

  // FIX: use returnDocument instead of new
  let cart = await Cart.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, items: [] } },
    { returnDocument: "after", upsert: true }
  );

  const index = cart.items.findIndex(
    (item) => item.productId.toString() === productId
  );

  if (index >= 0) {
    const newQuantity = cart.items[index].quantity + quantity;
    cart.items[index].quantity = newQuantity;
  } else {
    cart.items.push({
      productId,
      quantity,
      price: product.price,
    });
  }

  const { totalPrice, totalItems } = calcTotals(cart.items);
  cart.totalPrice = totalPrice;
  cart.totalItems = totalItems;

  await cart.save();

  await cart.populate("items.productId", "name price thumbnailImage specifications");

  return cart;
};

// ================= UPDATE =================
export const updateCartItemService = async (userId, productId, body) => {
  const { quantity } = body;

  if (!quantity || quantity < 1) {
    throw new Error("Số lượng phải ít nhất là 1");
  }

  const cart = await Cart.findOne({ userId });
  if (!cart) throw new Error("Giỏ hàng không tồn tại");

  const product = await Product.findById(productId).select("stock");
  if (!product) throw new Error("Sản phẩm không tồn tại");

  if (product.stock === 0) {
    throw new Error("Sản phẩm đã hết hàng");
  }

  const index = cart.items.findIndex(
    (item) => item.productId.toString() === productId
  );

  if (index === -1) throw new Error("Sản phẩm không có trong giỏ");

  cart.items[index].quantity = quantity;

  const { totalPrice, totalItems } = calcTotals(cart.items);
  cart.totalPrice = totalPrice;
  cart.totalItems = totalItems;

  await cart.save();

  await cart.populate("items.productId", "name price thumbnailImage specifications");

  return cart;
};

// ================= REMOVE =================
export const removeCartItemService = async (userId, productId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new Error("Giỏ hàng không tồn tại");

  cart.items = cart.items.filter(
    (item) => item.productId.toString() !== productId
  );

  const { totalPrice, totalItems } = calcTotals(cart.items);
  cart.totalPrice = totalPrice;
  cart.totalItems = totalItems;

  await cart.save();

  await cart.populate("items.productId", "name price thumbnailImage specifications");

  return cart;
};

// ================= TOTAL =================
export const getCartTotalService = async (userId) => {
  const cart = await Cart.findOne({ userId }).select("totalItems totalPrice");

  if (!cart) {
    return { totalItems: 0, totalPrice: 0 };
  }

  return {
    totalItems: cart.totalItems,
    totalPrice: cart.totalPrice,
  };
};

// ================= CLEAR =================
export const clearCartService = async (userId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) throw new Error("Giỏ hàng không tồn tại");

  cart.items = [];
  cart.totalPrice = 0;
  cart.totalItems = 0;

  await cart.save();

  return { message: "Đã xóa toàn bộ giỏ hàng" };
};

// ================= ADMIN =================
export const getAllCartsService = async () => {
  return await Cart.find()
    .populate("userId", "username email")
    .populate("items.productId", "name price thumbnailImage specifications");
};
