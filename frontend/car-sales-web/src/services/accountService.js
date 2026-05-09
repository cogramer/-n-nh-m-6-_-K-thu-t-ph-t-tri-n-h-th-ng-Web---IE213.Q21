import api from "./api"; // Axios instance with token interceptor

const AccountService = {
  /**
   * Lấy thông tin cá nhân của người dùng hiện tại
   * BE: router.get('/getProfile', ...)
   */
  getProfile: async () => {
    const response = await api.get("/accounts/getProfile");
    return response;
  },

  /**
   * Chỉnh sửa thông tin cá nhân (username, phoneNumber, address)
   * BE: router.put('/editProfile', ...)
   */
  editProfile: async (profileData) => {
    const response = await api.put("/accounts/editProfile", profileData);
    return response;
  },

  /**
   * Đổi mật khẩu
   * @param {Object} passwordData - { email, oldPassword, newPassword, resNewPassword }
   * BE: router.post("/changePassword", ...)
   */
  changePassword: async (passwordData) => {
    const response = await api.post("/accounts/changePassword", passwordData);
    return response;
  },

  /**
   * Xóa tài khoản chính mình
   * BE: router.delete("/me", ...)
   */
  deleteMyAccount: async () => {
    const response = await api.delete("/accounts/me");
    return response;
  },

  /**
   * Đăng xuất (xóa Refresh Token ở BE)
   * BE: router.post("/logout", ...)
   */
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await api.post("/accounts/logout", { refreshToken });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear all auth data regardless of API success/failure
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("authUsername");
      localStorage.removeItem("authEmail");

      // Dispatch event for components to listen to
      window.dispatchEvent(new Event("auth-change"));
      window.dispatchEvent(new Event("auth-expired"));
    }
  },

  /* Wishlist section */

  /**
   * Lấy danh sách wishlist của user
   * BE: router.get("/wishlist", ...)
   */
  getWishlist: async () => {
    const response = await api.get("/accounts/wishlist");
    return response;
  },

  /**
   * Thêm sản phẩm vào wishlist
   * BE: router.post("/wishlist/add", ...)
   */
  addToWishlist: async (productId) => {
    const response = await api.post("/accounts/wishlist/add", { productId });
    return response;
  },

  /**
   * Xóa sản phẩm khỏi wishlist
   * BE: router.delete("/wishlist/remove", ...)
   */
  removeFromWishlist: async (productId) => {
    const response = await api.delete("/accounts/wishlist/remove", {
      data: { productId },
    });
    return response;
  }
};

export default AccountService;
