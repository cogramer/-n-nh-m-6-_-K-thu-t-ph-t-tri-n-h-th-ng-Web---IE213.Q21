import { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import cartService from '../services/cartService';
import Notification from '../components/Notification/Notification';

const CartContext = createContext();

const normalizeCartItems = (data) => {
  const items =
    data?.items ||
    data?.cart?.items ||
    data?.data?.items ||
    data?.data?.cart?.items ||
    [];

  if (!Array.isArray(items)) return [];

  return items.filter(item => item && item.productId);
};

const getProductId = (itemOrProductId) => {
  if (!itemOrProductId) return null;

  if (typeof itemOrProductId === 'string') {
    return itemOrProductId;
  }

  if (itemOrProductId.productId) {
    if (typeof itemOrProductId.productId === 'string') {
      return itemOrProductId.productId;
    }

    return itemOrProductId.productId._id || null;
  }

  return itemOrProductId._id || null;
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const notifyRef = useRef(null);

  const showNotification = (title, message, type = "info") => {
    notifyRef.current?.showNotification(title, message, type);
  };

  const fetchCart = useCallback(async () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      setCartItems([]);
      window.dispatchEvent(new Event("cart-change"));
      return [];
    }

    try {
      setLoading(true);

      const data = await cartService.getCart();
      const items = normalizeCartItems(data);

      setCartItems(items);
      window.dispatchEvent(new Event("cart-change"));

      return items;
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setCartItems([]);
        window.dispatchEvent(new Event("cart-change"));
        return [];
      }

      console.error("Không thể lấy giỏ hàng từ server:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();

    const onAuthChange = () => fetchCart();
    const onCartRefresh = () => fetchCart();

    window.addEventListener("auth-change", onAuthChange);
    window.addEventListener("cart-refresh", onCartRefresh);

    return () => {
      window.removeEventListener("auth-change", onAuthChange);
      window.removeEventListener("cart-refresh", onCartRefresh);
    };
  }, [fetchCart]);

  const addToCart = async (car, quantity = 1) => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        showNotification("System Message", "Please log in to add items to your cart.", "error");
        return;
      }

      const productId = getProductId(car);
      const stock = Number(car?.stock ?? car?.productId?.stock);

      if (!productId) {
        throw new Error("Cannot determine product ID for cart item.");
      }

      if (Number.isFinite(stock) && stock <= 0) {
        //alert("Sản phẩm đã hết hàng, không thể thêm vào giỏ. tesst");
        showNotification("System Message", "This product is out of stock.", "error");
        return;
      }

      if (Number.isFinite(stock) && Number(quantity) > stock) {
        //alert(`Chỉ còn ${stock} xe trong kho.`);
        showNotification("System Message", `Only ${stock} units available.`, "error");
        return;
      }

      setLoading(true);

      const data = await cartService.addToCart(productId, quantity);
      const items = normalizeCartItems(data);

      setCartItems(items);
      window.dispatchEvent(new Event("cart-change"));

      console.log("Đã đồng bộ Add to Cart lên Backend");
    } catch (error) {
      showNotification(
        "System Message",
        "Failed to add item to cart. Please try again.",
        "error"
      );
      console.error("Lỗi khi thêm vào giỏ: " + getErrorMessage(error, "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token || !productId) return;

      const oldItems = cartItems;

      setCartItems(prev =>
        prev.filter(item => getProductId(item) !== productId)
      );

      try {
        const data = await cartService.removeCartItem(productId);
        const items = normalizeCartItems(data);

        setCartItems(items);
        window.dispatchEvent(new Event("cart-change"));
      } catch (error) {
        setCartItems(oldItems);
        throw error;
      }
    } catch (error) {
      console.error("Lỗi khi xóa:", error);
      await fetchCart();
    }
  };

  // quantity is the next absolute quantity, for example 1, 2, or 3.
  // It is not a +1 or -1 delta.
  const updateQuantity = async (productId, quantity) => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token || !productId) return;

      const newQty = Number(quantity);

      if (!Number.isFinite(newQty) || newQty < 1) {
        return;
      }

      const oldItems = cartItems;

      setCartItems(prev =>
        prev.map(item =>
          getProductId(item) === productId
            ? { ...item, quantity: newQty }
            : item
        )
      );

      try {
        const data = await cartService.updateCartItem(productId, newQty);
        const items = normalizeCartItems(data);

        setCartItems(items);
        window.dispatchEvent(new Event("cart-change"));
      } catch (error) {
        setCartItems(oldItems);
        throw error;
      }
    } catch (error) {
      console.error("Lỗi cập nhật số lượng:", error);
      await fetchCart();
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) return;

      const oldItems = cartItems;
      setCartItems([]);

      try {
        await cartService.clearCart();
        window.dispatchEvent(new Event("cart-change"));
      } catch (error) {
        setCartItems(oldItems);
        throw error;
      }
    } catch (error) {
      console.error("Lỗi khi xóa toàn bộ giỏ:", error);
      await fetchCart();
    }
  };

  const removePurchasedItems = (ids = []) => {
    const purchasedIds = new Set(
      (Array.isArray(ids) ? ids : [ids]).filter(Boolean)
    );

    if (purchasedIds.size === 0) return;

    setCartItems(prev =>
      prev.filter(item => !purchasedIds.has(item._id))
    );

    window.dispatchEvent(new Event("cart-change"));
  };

  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      return sum + Number(item.quantity || 1);
    }, 0);
  }, [cartItems]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const price = Number(item.price || item.productId?.price || 0);
      const quantity = Number(item.quantity || 1);

      return sum + price * quantity;
    }, 0);
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        loading,
        fetchCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        removePurchasedItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
