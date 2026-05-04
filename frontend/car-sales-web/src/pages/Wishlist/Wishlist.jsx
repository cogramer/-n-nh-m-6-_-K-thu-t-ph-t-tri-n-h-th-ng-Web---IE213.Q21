import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import Notification from "../../components/Notification/Notification";
import AccountService from "../../services/accountService";
import add from "../../assets/icon/add.png";
import { useCart } from "../../context/CartContext";
import "./Wishlist.css";

const getWishlistFromResponse = (response) => {
  const data = response?.data || response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.wishlist)) return data.wishlist;
  if (Array.isArray(data.products)) return data.products;
  if (Array.isArray(data.data)) return data.data;

  return [];
};

const getProductFromItem = (item) => {
  if (item?.product && typeof item.product === "object") {
    return item.product;
  }

  if (item?.productId && typeof item.productId === "object") {
    return item.productId;
  }

  return item;
};

const getProductIdFromItem = (item) => {
  return (
    item?._id ||
    item?.id ||
    item?.productId ||
    item?.product?._id ||
    item?.productId?._id
  );
};

function Wishlist() {
  const notifyRef = useRef();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const showNotification = (title, message, type = "info") => {
    notifyRef.current?.showNotification(title, message, type);
  };

  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);

      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");

      if (!token) {
        setWishlist([]);
        return;
      }

      const response = await AccountService.getWishlist();
      const list = getWishlistFromResponse(response);

      const cars = list
        .map((item) => {
          const product = getProductFromItem(item);
          const productId = getProductIdFromItem(item);

          return {
            ...product,
            _id: product?._id || productId,
          };
        })
        .filter((car) => car && car._id);

      setWishlist(cars);
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
      setWishlist([]);

      showNotification(
        "System Message",
        "Unable to load your wishlist. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRemove = async (productId) => {
    try {
      await AccountService.removeFromWishlist(productId);

      setWishlist((prev) =>
        prev.filter((car) => String(car._id) !== String(productId))
      );

      showNotification(
        "System Message",
        "Removed from your wishlist.",
        "success"
      );

      window.dispatchEvent(new Event("wishlist-change"));
    } catch (error) {
      console.error("Failed to remove wishlist item:", error);

      showNotification(
        "System Message",
        "Unable to remove this car from your wishlist. Please try again.",
        "error"
      );
    }
  };

  const handleAddToCart = (car) => {
    const stock = Number(car?.stock) || 0;

    if (stock <= 0) {
      return;
    }

    addToCart(car);

    showNotification(
      "System Message",
      `${car?.name || "Car"} has been added to your cart.`,
      "success"
    );
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchWishlist();
  }, [fetchWishlist]);

  return (
    <>
      <Notification ref={notifyRef} />

      <Navbar />

      <main className="wishlist-page">
        <div className="wishlist-header">
          <div>
            <p>Saved cars</p>
            <h1>My Wishlist</h1>
            <span>{wishlist.length} saved cars</span>
          </div>

          <Link to="/" className="wishlist-browse-link">
            Browse cars
          </Link>
        </div>

        {loading ? (
          <div className="wishlist-state">Loading wishlist...</div>
        ) : wishlist.length === 0 ? (
          <div className="wishlist-empty">
            <h2>Your wishlist is empty</h2>
            <p>Save the cars you like so you can view them again later.</p>

            <Link to="/" className="wishlist-shop-link">
              Browse cars
            </Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.map((car) => {
              const stock = Number(car?.stock) || 0;
              const stockText = stock <= 0 ? "Out of stock" : `${stock} left`;

              return (
                <article className="wishlist-card" key={car._id}>
                  <button
                    type="button"
                    className="wishlist-remove-heart"
                    onClick={() => handleRemove(car._id)}
                    aria-label="Remove from wishlist"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="wishlist-remove-icon"
                      aria-hidden="true"
                    >
                      <path d="M20.84 4.61C20.33 4.1 19.72 3.7 19.05 3.43C18.38 3.15 17.66 3.01 16.94 3.01C16.22 3.01 15.5 3.15 14.83 3.43C14.16 3.7 13.55 4.1 13.04 4.61L12 5.65L10.96 4.61C9.93 3.58 8.54 3 7.08 3C5.62 3 4.23 3.58 3.2 4.61C2.17 5.64 1.59 7.03 1.59 8.49C1.59 9.95 2.17 11.34 3.2 12.37L12 21.17L20.84 12.37C21.35 11.86 21.75 11.25 22.03 10.58C22.3 9.91 22.45 9.19 22.45 8.47C22.45 7.75 22.3 7.03 22.03 6.36C21.75 5.69 21.35 5.12 20.84 4.61Z" />
                    </svg>
                  </button>

                  <Link
                    to={`/product/${car._id}`}
                    className="wishlist-image-wrap"
                  >
                    <img
                      src={car.thumbnailImage}
                      alt={car.name}
                      loading="lazy"
                      decoding="async"
                    />
                  </Link>

                  <div className="wishlist-card-body">
                    <div>
                      <h3>{car.name}</h3>

                      <div className="wishlist-stock">{stockText}</div>

                      <div className="wishlist-card-meta">
                        <span>{car.brand || "Unknown brand"}</span>
                        <span>•</span>
                        <span>{car.category || "Car"}</span>
                      </div>

                      {car.price && <p>{car.price.toLocaleString()} USD</p>}
                    </div>

                    <div className="wishlist-actions">
                      <Link to={`/product/${car._id}`}>View details</Link>

                      <button
                        type="button"
                        className="add-to-cart"
                        onClick={() => handleAddToCart(car)}
                        disabled={stock <= 0}
                        title={stock <= 0 ? "Out of stock" : "Add to cart"}
                        aria-label={stock <= 0 ? "Out of stock" : "Add to cart"}
                      >
                        <img src={add} alt="Add to cart icon" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}

export default Wishlist;