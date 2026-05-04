import { useRef, lazy, Suspense, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import CarDetail from "./pages/CarDetail";
import Cars from "./pages/Cars";
import { CartProvider } from "./context/CartContext";
import Notification from "./components/Notification/Notification";
import Auth from "./pages/Auth";
import AccountService from "./services/accountService";
import AdminLayout from "./pages/Admin/AdminLayout";
import ProductEdit from "./pages/Admin/ProductEdit/ProductEdit";
import { isAuthenticated, handleLogout } from "./utils/authUtils";

const AdminDashboard = lazy(() => import("./pages/Admin/Dashboard/Dashboard"));
const Checkout = lazy(() => import("./pages/Checkout/Checkout"));
const OrderList = lazy(() => import("./pages/Admin/Orders/OrderList"));
const ProductList = lazy(() => import("./pages/Admin/Products/ProductList"));
const MyOrders = lazy(() => import("./pages/MyOrders/MyOrders"));
const Profile = lazy(() => import("./pages/Profile/Profile"));
const Contact = lazy(() => import("./pages/Contact/Contact"));
const About = lazy(() => import("./pages/About/About"));
const Wishlist = lazy(() => import("./pages/Wishlist/Wishlist"));
const AdminContactList = lazy(() =>
  import("./pages/Admin/Contacts/ContactList")
);

// New public pages
const Services = lazy(() => import("./pages/Services/Services"));
const Support = lazy(() => import("./pages/Support/Support"));
const TermsConditions = lazy(() =>
  import("./pages/TermsConditions/TermsConditions")
);
const PrivacyPolicy = lazy(() =>
  import("./pages/PrivacyPolicy/PrivacyPolicy")
);

// Protected route for authenticated users
const PrivateRoute = ({ children }) => {
  const authenticated = isAuthenticated();

  useEffect(() => {
    if (!authenticated) {
      handleLogout();
    }
  }, [authenticated]);

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PageFallback = () => <div>Dang tai trang...</div>;

// Admin route with API role validation
const AdminRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!isAuthenticated()) {
        handleLogout();
        return;
      }

      try {
        const res = await AccountService.getProfile();
        const profile = res.data.data;

        if (profile && profile.isadmin === true) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Xác thực Admin thất bại:", error);

        /**
         * Nếu API profile lỗi do token hết hạn / không hợp lệ,
         * interceptor bên api.js thường sẽ tự refresh hoặc logout.
         * Ở đây fallback thêm để tránh bị kẹt màn hình loading.
         */
        setIsAdmin(false);
      }
    };

    verifyAdmin();
  }, []);

  if (isAdmin === null) {
    return <div>Đang kiểm tra quyền truy cập...</div>;
  }

  return isAdmin ? children : <Navigate to="/" replace />;
};

function App() {
  const notifyRef = useRef();

  useEffect(() => {
    const handleAuthExpired = () => {
      if (notifyRef.current) {
        notifyRef.current.showNotification(
          "Session expired",
          "Your session has expired. Please log in again.",
          "error"
        );
      }

      setTimeout(() => {
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }, 1500);
    };

    window.addEventListener("auth-expired", handleAuthExpired);

    return () => {
      window.removeEventListener("auth-expired", handleAuthExpired);
    };
  }, []);

  return (
    <CartProvider>
      <Notification ref={notifyRef} />

      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* PUBLIC */}
            <Route path="/login" element={<Auth initialMode="login" />} />
            <Route path="/signup" element={<Auth initialMode="signup" />} />
            <Route
              path="/reset-password"
              element={<Auth initialMode="reset" />}
            />

            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/cars" element={<Cars />} />
            <Route path="/product/:id" element={<CarDetail />} />
            <Route path="/contact" element={<Contact />} />

            {/* STATIC PUBLIC PAGES */}
            <Route path="/services" element={<Services />} />
            <Route path="/support" element={<Support />} />
            <Route
              path="/terms-and-conditions"
              element={<TermsConditions />}
            />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />

            {/* PRIVATE */}
            <Route
              path="/checkout"
              element={
                <PrivateRoute>
                  <Checkout notifyRef={notifyRef} />
                </PrivateRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <PrivateRoute>
                  <MyOrders />
                </PrivateRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <PrivateRoute>
                  <Wishlist />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />

            {/* ADMIN ONLY */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="orders" element={<OrderList />} />
              <Route path="contacts" element={<AdminContactList />} />
              <Route path="products" element={<ProductList />} />
              <Route path="productEdit/:id" element={<ProductEdit />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;