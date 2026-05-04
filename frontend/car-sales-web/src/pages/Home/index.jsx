import { useState, useEffect, useCallback, useRef } from "react";
import SlideShow from "./SlideShow/SlideShow";
import Filter from "./Filter/Filter";
import CarList from "../../components/CarList/CarList";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import Notification from "../../components/Notification/Notification";
import ProductService from "../../services/ProductService";
import AccountService from "../../services/accountService";

const getAuthToken = () => {
  return localStorage.getItem("authToken") || localStorage.getItem("token");
};

const getWishlistFromResponse = (response) => {
  const data = response?.data || response;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.wishlist)) {
    return data.wishlist;
  }

  if (Array.isArray(data.products)) {
    return data.products;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  return [];
};

const getProductIdFromWishlistItem = (item) => {
  return item?._id || item?.productId || item?.product?._id || item?.productId?._id;
};

function Home() {
  const notifyRef = useRef();

  const [type, setType] = useState("All");
  const [cars, setCars] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const showNotification = (title, message, type = "info") => {
    notifyRef.current?.showNotification(title, message, type);
  };

  const buildFilterParams = (selectedType) => {
    if (selectedType === "EV") {
      return { powertrainType: "electric" };
    }

    return { category: selectedType };
  };

  const getCarsFromResponse = (response) => {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response.products)) {
      return response.products;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  };

  const fetchWishlist = useCallback(async () => {
    const token = getAuthToken();

    if (!token) {
      setWishlistIds([]);
      return;
    }

    try {
      const response = await AccountService.getWishlist();
      const wishlist = getWishlistFromResponse(response);

      const ids = wishlist
        .map(getProductIdFromWishlistItem)
        .filter(Boolean)
        .map(String);

      setWishlistIds(ids);
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
      setWishlistIds([]);
    }
  }, []);

  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);

      try {
        let response;

        if (type === "All") {
          response = await ProductService.getAllProducts();
        } else {
          const params = buildFilterParams(type);
          response = await ProductService.filterProducts(params);
        }

        setCars(getCarsFromResponse(response));
      } catch (error) {
        console.error("Failed to fetch car list:", error);
        setCars([]);

        showNotification(
          "System Message",
          "Unable to load the car list. Please try again.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [type]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  useEffect(() => {
    const handleAuthChange = () => {
      const token = getAuthToken();

      if (!token) {
        setWishlistIds([]);
        return;
      }

      fetchWishlist();
    };

    window.addEventListener("auth-change", handleAuthChange);
    window.addEventListener("auth-expired", handleAuthChange);
    window.addEventListener("wishlist-change", handleAuthChange);

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
      window.removeEventListener("auth-expired", handleAuthChange);
      window.removeEventListener("wishlist-change", handleAuthChange);
    };
  }, [fetchWishlist]);

  const handleToggleWishlist = async (productId) => {
    const token = getAuthToken();

    if (!token) {
      showNotification(
        "System Message",
        "Please log in to add cars to your wishlist.",
        "warning"
      );

      setWishlistIds([]);
      return;
    }

    const id = String(productId);
    const isWishlisted = wishlistIds.includes(id);

    setWishlistIds((prev) =>
      isWishlisted ? prev.filter((item) => item !== id) : [...prev, id]
    );

    try {
      if (isWishlisted) {
        await AccountService.removeFromWishlist(productId);

        showNotification(
          "System Message",
          "Removed from your wishlist.",
          "success"
        );
      } else {
        await AccountService.addToWishlist(productId);

        showNotification(
          "System Message",
          "Added to your wishlist.",
          "success"
        );
      }

      window.dispatchEvent(new Event("wishlist-change"));
    } catch (error) {
      console.error("Failed to update wishlist:", error);

      setWishlistIds((prev) =>
        isWishlisted ? [...prev, id] : prev.filter((item) => item !== id)
      );

      showNotification(
        "System Message",
        "Unable to update your wishlist. Please try again.",
        "error"
      );
    }
  };

  const handleAddToCartSuccess = (car) => {
    showNotification(
      "System Message",
      `${car?.name || "Car"} has been added to your cart.`,
      "success"
    );
  };

  useEffect(() => {
    let timer;

    if (loading) {
      timer = setTimeout(() => setShowLoading(true), 200);
    } else {
      setShowLoading(false);
    }

    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <>
      <Notification ref={notifyRef} />

      <Navbar />
      <SlideShow />
      <Filter type={type} setType={setType} />

      <div style={{ minHeight: "520px", position: "relative" }}>
        <div
          style={{
            opacity: loading ? 0.45 : 1,
            transition: "opacity 0.2s ease",
            pointerEvents: loading ? "none" : "auto",
          }}
        >
          <CarList
            key={type}
            cars={cars}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onAddToCartSuccess={handleAddToCartSuccess}
          />
        </div>

        {showLoading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              paddingTop: "24px",
              background: "rgba(255, 255, 255, 0.4)",
              zIndex: 2,
            }}
          >
            <h3>Loading car list...</h3>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

export default Home;