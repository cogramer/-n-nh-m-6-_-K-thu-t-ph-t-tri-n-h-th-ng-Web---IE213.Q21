import api from "./api";
import { API_URL } from "./apiConfig";

const AuthService = {
  // Register a new account
  register: (data) => api.post("/users/register", data),

  // Verify OTP after registration or password reset
  verifyOtp: (email, otp) => api.post("/users/verifyOtp", { email, otp }),

  // Log in
  login: async (email, password) => {
    const response = await api.post("/users/login", { email, password });

    const { token, refreshToken, user } = response.data;

    if (token) {
      localStorage.setItem("authToken", token);
      localStorage.setItem("token", token); 
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));

        if (user.username) {
          localStorage.setItem("authUsername", user.username);
        }

        if (user.email) {
          localStorage.setItem("authEmail", user.email);
        }
      }

      window.dispatchEvent(new Event("auth-change"));
    }

    return response;
  },

  // Log in with Google
  googleLogin: () => {
    window.location.href = `${API_URL}/api/users/auth/google`;
  },

  // Forgot password - send OTP by email
  forgotPassword: (email) => api.post("/users/forgot-password", { email }),

  // Reset password with OTP
  resetPassword: (data) => api.post("/users/reset-password", data),

  // Verify OTP cho reset password
  verifyResetOtp: (email, otp) => api.post("/users/verifyOtp", { email, otp }),

  // Refresh an expired access token
  refreshToken: async () => {
    const response = await api.post("/users/refresh-token");

    const { token, newToken } = response.data;
    const accessToken = token || newToken;

    if (accessToken) {
      localStorage.setItem("authToken", accessToken);
      localStorage.setItem("token", accessToken);

      window.dispatchEvent(new Event("auth-change"));
    }

    return response;
  },
};

export default AuthService;
