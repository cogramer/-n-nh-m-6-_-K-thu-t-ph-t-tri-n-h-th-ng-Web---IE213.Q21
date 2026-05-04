import api from './api';

const cartService = {
  // Fetch cart products
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  // Add a product to the cart
  addToCart: async (productId, quantity = 1) => {
    const response = await api.post('/cart/add', { productId, quantity });
    return response.data;
  },

  // Update quantity
  updateCartItem: async (productId, quantity) => {
    const response = await api.put(`/cart/update/${productId}`, { quantity });
    return response.data;
  },

  // Remove one product from the cart
  removeCartItem: async (productId) => {
    const response = await api.delete(`/cart/remove/${productId}`);
    return response.data;
  },

  // Clear the cart
  clearCart: async () => {
    const response = await api.delete('/cart/clear');
    return response.data;
  },

  // Fetch total quantity for the header cart badge
  getCartTotal: async () => {
    const response = await api.get('/cart/total');
    return response.data;
  }
};

export default cartService;