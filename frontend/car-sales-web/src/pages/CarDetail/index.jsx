import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import ProductService from "../../services/ProductService";
import AccountService from "../../services/accountService";
import ReviewService from "../../services/reviewService";
import "./CarDetail.css";
import { useCart } from "../../context/CartContext";
import add from "../../assets/icon/add.png";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  getProductHeroImagePath,
  PLACEHOLDER_IMAGE_URL,
  resolveImageUrl,
} from "../../utils/imageUrl";

const getAuthToken = () => {
  return localStorage.getItem("authToken") || localStorage.getItem("token");
};

const getWishlistFromResponse = (response) => {
  const data = response?.data || response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.wishlist)) return data.wishlist;
  if (Array.isArray(data.products)) return data.products;
  if (Array.isArray(data.data)) return data.data;

  return [];
};

const getProductIdFromWishlistItem = (item) => {
  return (
    item?._id ||
    item?.productId ||
    item?.product?._id ||
    item?.productId?._id
  );
};

function CarDetail() {
  const { id } = useParams();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeHeroImage, setActiveHeroImage] = useState("");
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addToCart } = useCart();

  const handleImageError = useCallback((event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = PLACEHOLDER_IMAGE_URL;
  }, []);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState("");
  const [reviewSubmitMessage, setReviewSubmitMessage] = useState("");

  const fetchWishlistStatus = useCallback(async () => {
    const token = getAuthToken();

    if (!token || !id) {
      setIsWishlisted(false);
      return;
    }

    try {
      const response = await AccountService.getWishlist();
      const wishlist = getWishlistFromResponse(response);

      const ids = wishlist
        .map(getProductIdFromWishlistItem)
        .filter(Boolean)
        .map(String);

      setIsWishlisted(ids.includes(String(id)));
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
      setIsWishlisted(false);
    }
  }, [id]);

  const handleToggleWishlist = async () => {
    const token = getAuthToken();

    if (!token) {
      alert("Please log in to add this car to your wishlist.");
      return;
    }

    const nextState = !isWishlisted;
    setIsWishlisted(nextState);

    try {
      if (isWishlisted) {
        await AccountService.removeFromWishlist(id);
      } else {
        await AccountService.addToWishlist(id);
      }

      window.dispatchEvent(new Event("wishlist-change"));
    } catch (error) {
      console.error("Failed to update wishlist:", error);
      setIsWishlisted(!nextState);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await ProductService.getProductById(id);
        // Use gallery as a final fallback so every detail page has a visible hero image.
        setCar(data);
        setActiveHeroImage(getProductHeroImagePath(data));
      } catch (error) {
        console.error("Failed to fetch product details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  useEffect(() => {
    fetchWishlistStatus();
  }, [fetchWishlistStatus]);

  useEffect(() => {
    const handleWishlistChange = () => {
      fetchWishlistStatus();
    };

    window.addEventListener("auth-change", handleWishlistChange);
    window.addEventListener("auth-expired", handleWishlistChange);
    window.addEventListener("wishlist-change", handleWishlistChange);

    return () => {
      window.removeEventListener("auth-change", handleWishlistChange);
      window.removeEventListener("auth-expired", handleWishlistChange);
      window.removeEventListener("wishlist-change", handleWishlistChange);
    };
  }, [fetchWishlistStatus]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;

      setReviewsLoading(true);
      setReviewsError("");

      try {
        const res = await ReviewService.getReviewsByProductId(id);
        setReviews(Array.isArray(res?.data) ? res.data : []);
      } catch (error) {
        setReviewsError(error?.response?.data?.message || "Unable to load reviews");
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [id]);

  const gallery = Array.isArray(car?.galleryImages) ? car.galleryImages : [];
  const activeGalleryImage =
    activeGalleryIndex !== null ? gallery[activeGalleryIndex] : "";

  const closeGalleryLightbox = () => {
    setActiveGalleryIndex(null);
  };

  const showPreviousGalleryImage = () => {
    setActiveGalleryIndex((current) => {
      if (!gallery.length) return null;
      const safeCurrent = current ?? 0;
      return (safeCurrent - 1 + gallery.length) % gallery.length;
    });
  };

  const showNextGalleryImage = () => {
    setActiveGalleryIndex((current) => {
      if (!gallery.length) return null;
      const safeCurrent = current ?? 0;
      return (safeCurrent + 1) % gallery.length;
    });
  };

  useEffect(() => {
    setActiveGalleryIndex(null);
  }, [id]);

  useEffect(() => {
    if (activeGalleryIndex === null) return;

    if (activeGalleryIndex < 0 || activeGalleryIndex >= gallery.length) {
      setActiveGalleryIndex(null);
    }
  }, [activeGalleryIndex, gallery.length]);

  useEffect(() => {
    if (activeGalleryIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveGalleryIndex(null);
      }

      if (event.key === "ArrowLeft") {
        setActiveGalleryIndex((current) => {
          if (!gallery.length) return null;
          const safeCurrent = current ?? 0;
          return (safeCurrent - 1 + gallery.length) % gallery.length;
        });
      }

      if (event.key === "ArrowRight") {
        setActiveGalleryIndex((current) => {
          if (!gallery.length) return null;
          const safeCurrent = current ?? 0;
          return (safeCurrent + 1) % gallery.length;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeGalleryIndex, gallery.length]);

  const formatSpecKey = (key) => {
    const labels = {
      dimensions: "Dimensions",
      fuelConsumption: "Fuel consumption",
      batteryCapacity: "Battery capacity",
      model: "Model",
      engine: "Engine",
      power: "Power",
      torque: "Torque",
      gear: "Gear",
      topSpeed: "Top speed",
      weight: "Weight",
      powertrainType: "Powertrain type",
    };

    return labels[key] || key;
  };

  const formatSpecValue = (key, value) => {
    if (value === undefined || value === null || value === "") return "";

    if (key === "dimensions" && typeof value === "object") {
      const { length, width, height } = value;

      if (
        length !== undefined &&
        width !== undefined &&
        height !== undefined &&
        length !== null &&
        width !== null &&
        height !== null
      ) {
        return `${length} x ${width} x ${height} mm`;
      }

      return "";
    }

    if (key === "fuelConsumption" && typeof value === "object") {
      if (value.value !== undefined && value.value !== null && value.unit) {
        return `${value.value} ${value.unit}`;
      }

      return "";
    }

    if (key === "batteryCapacity" && typeof value === "object") {
      if (value.value !== undefined && value.value !== null && value.unit) {
        return `${value.value} ${value.unit}`;
      }

      return "";
    }

    if (key === "power") return `${value} hp`;
    if (key === "torque") return `${value} Nm`;
    if (key === "topSpeed") return `${value} km/h`;
    if (key === "weight") return `${value} kg`;
    if (key === "gear") return `${value} speeds`;

    if (key === "powertrainType") {
      if (value === "gasoline") return "Gasoline";
      if (value === "electric") return "Electric";
      return String(value);
    }

    return String(value);
  };

  const specsEntries = car?.specifications
    ? Object.entries(car.specifications).filter(([key, value]) => {
        if (key === "_id") return false;

        if (
          key === "batteryCapacity" &&
          car.specifications?.powertrainType === "gasoline"
        ) {
          return false;
        }

        const formattedValue = formatSpecValue(key, value);
        return formattedValue !== "";
      })
    : [];

  const safetyList = Array.isArray(car?.safety) ? car.safety : [];
  const convenienceList = Array.isArray(car?.convenience) ? car.convenience : [];

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="car-detail">
          <div className="car-detail-container">
            <h1>Loading...</h1>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!car) {
    return (
      <>
        <Navbar />
        <main className="car-detail">
          <div className="car-detail-container">
            <h1 className="car-detail-title">Car not found</h1>
            <Link className="car-detail-back" to="/cars">
              View car list
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const usdPerEth = Number(import.meta.env.VITE_USD_PER_ETH || 2000000);

  const usdPriceText =
    typeof car.price === "number"
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(car.price)
      : null;

  const coinPriceText =
    typeof car.price === "number" &&
    Number.isFinite(usdPerEth) &&
    usdPerEth > 0
      ? `${new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 6,
        }).format(car.price / usdPerEth)} ETH`
      : null;

  const stock = Number(car?.stock) || 0;
  const stockText = stock <= 0 ? "Out of stock" : `${stock} left`;

  const authToken = localStorage.getItem("authToken");
  const authUsername = localStorage.getItem("authUsername") || "You";

  const ratingValue = Number.isFinite(Number(car?.averageRating))
    ? Number(car.averageRating)
    : reviews.length
      ? reviews.reduce((sum, item) => sum + Number(item?.rating || 0), 0) /
        reviews.length
      : 0;

  const reviewCountValue = Number.isFinite(Number(car?.reviewCount))
    ? Number(car.reviewCount)
    : reviews.length;

  const ratingText = reviewCountValue
    ? `${ratingValue.toFixed(1)} / 5 (${reviewCountValue})`
    : "No reviews";

  const renderStars = (value) => {
    const normalized = Math.max(0, Math.min(5, Number(value) || 0));
    const full = Math.round(normalized);
    return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
  };

  const submitReview = async (e) => {
    e.preventDefault();

    setReviewSubmitError("");
    setReviewSubmitMessage("");

    if (!authToken) {
      setReviewSubmitError("Please sign in to leave a review");
      return;
    }

    const numericRating = Number(reviewRating);

    if (
      !Number.isFinite(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      setReviewSubmitError("Rating must be between 1 and 5");
      return;
    }

    try {
      setReviewSubmitting(true);

      await ReviewService.createReview({
        productId: id,
        rating: numericRating,
        comment: reviewComment?.trim() || "",
      });

      setReviewSubmitMessage("Review submitted successfully");
      setReviewComment("");

      const [product, reviewsRes] = await Promise.all([
        ProductService.getProductById(id),
        ReviewService.getReviewsByProductId(id),
      ]);

      setCar(product);
      setReviews(Array.isArray(reviewsRes?.data) ? reviewsRes.data : []);
    } catch (error) {
      setReviewSubmitError(
        error?.response?.data?.message || "Failed to submit review"
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="car-detail">
        <div className="car-detail-container">
          <div className="car-detail-top">
            <div className="car-detail-hero">
              <img
                src={resolveImageUrl(activeHeroImage)}
                alt={car.name}
                loading="eager"
                decoding="async"
                onError={handleImageError}
              />
            </div>

            <div className="car-detail-summary">
              <div className="car-detail-breadcrumb">
                <Link to="/">Home</Link>
                <span>/</span>
                <span>{car.name}</span>
              </div>

              <div className="car-detail-title-row">
                <h1 className="car-detail-title">{car.name}</h1>

                <button
                  type="button"
                  className={`car-detail-wishlist-btn ${
                    isWishlisted ? "active" : ""
                  }`}
                  onClick={handleToggleWishlist}
                  aria-label={
                    isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="car-detail-wishlist-icon"
                    aria-hidden="true"
                  >
                    <path d="M20.84 4.61C20.33 4.1 19.72 3.7 19.05 3.43C18.38 3.15 17.66 3.01 16.94 3.01C16.22 3.01 15.5 3.15 14.83 3.43C14.16 3.7 13.55 4.1 13.04 4.61L12 5.65L10.96 4.61C9.93 3.58 8.54 3 7.08 3C5.62 3 4.23 3.58 3.2 4.61C2.17 5.64 1.59 7.03 1.59 8.49C1.59 9.95 2.17 11.34 3.2 12.37L12 21.17L20.84 12.37C21.35 11.86 21.75 11.25 22.03 10.58C22.3 9.91 22.45 9.19 22.45 8.47C22.45 7.75 22.3 7.03 22.03 6.36C21.75 5.69 21.35 5.12 20.84 4.61Z" />
                  </svg>
                </button>
              </div>

              <div className="car-detail-meta">
                <span>{car.brand}</span>
                <span>•</span>
                <span>{car.category}</span>
              </div>

              <div className="car-detail-rating">
                <span className="car-detail-stars" aria-label={ratingText}>
                  {renderStars(ratingValue)}
                </span>
                <span className="car-detail-rating-text">{ratingText}</span>
              </div>

              <div className="car-detail-stock">{stockText}</div>

              {usdPriceText ? (
                <div className="car-detail-price">{usdPriceText}</div>
              ) : null}

              {coinPriceText ? (
                <div className="car-detail-price-coin">{coinPriceText}</div>
              ) : null}

              <button
                className="add-to-cart"
                onClick={() => addToCart(car)}
                disabled={stock <= 0}
                title={stock <= 0 ? "Out of stock" : "Add to cart"}
              >
                <img src={add} alt="Add to cart icon" />
              </button>
            </div>
          </div>

          {gallery.length > 0 ? (
            <section className="car-detail-section">
              <h2 className="car-detail-section-title car-detail-gallery-title">
                Gallery
              </h2>

              <div className="car-detail-gallery">
                {gallery.map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    className="car-detail-gallery-item"
                    onClick={() => setActiveGalleryIndex(index)}
                    aria-label={`View ${car.name} gallery image ${index + 1}`}
                  >
                    <img
                      src={resolveImageUrl(src)}
                      alt={`${car.name} gallery ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                      onError={handleImageError}
                    />
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {activeGalleryImage ? (
            <div
              className="car-detail-lightbox"
              role="dialog"
              aria-modal="true"
              aria-label={`${car.name} gallery`}
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  closeGalleryLightbox();
                }
              }}
            >
              <div className="car-detail-lightbox-panel">
                <button
                  type="button"
                  className="car-detail-lightbox-close"
                  onClick={closeGalleryLightbox}
                  aria-label="Close gallery"
                >
                  <X size={24} strokeWidth={2.4} />
                </button>

                {gallery.length > 1 ? (
                  <>
                    <button
                      type="button"
                      className="car-detail-lightbox-nav car-detail-lightbox-prev"
                      onClick={showPreviousGalleryImage}
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={30} strokeWidth={2.5} />
                    </button>

                    <button
                      type="button"
                      className="car-detail-lightbox-nav car-detail-lightbox-next"
                      onClick={showNextGalleryImage}
                      aria-label="Next image"
                    >
                      <ChevronRight size={30} strokeWidth={2.5} />
                    </button>
                  </>
                ) : null}

                <div className="car-detail-lightbox-image-wrap">
                  <img
                    className="car-detail-lightbox-image"
                    src={resolveImageUrl(activeGalleryImage)}
                    alt={`${car.name} gallery ${activeGalleryIndex + 1}`}
                    onError={handleImageError}
                  />
                </div>

                <div className="car-detail-lightbox-count">
                  {activeGalleryIndex + 1} / {gallery.length}
                </div>

                {gallery.length > 1 ? (
                  <div className="car-detail-lightbox-strip">
                    {gallery.map((src, index) => (
                      <button
                        key={`${src}-${index}`}
                        type="button"
                        className={`car-detail-lightbox-thumb ${
                          index === activeGalleryIndex ? "active" : ""
                        }`}
                        onClick={() => setActiveGalleryIndex(index)}
                        aria-label={`Open gallery image ${index + 1}`}
                      >
                        <img
                          src={resolveImageUrl(src)}
                          alt=""
                          onError={handleImageError}
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {specsEntries.length > 0 ||
          safetyList.length > 0 ||
          convenienceList.length > 0 ? (
            <section className="car-detail-section">
              <h2 className="car-detail-section-title car-detail-technical-title">
                Technical detail
              </h2>

              <div className="car-detail-technical-card">
                <div className="car-detail-technical-grid">
                  {specsEntries.length > 0 ? (
                    <div className="car-detail-tech-table">
                      {specsEntries.map(([key, value]) => (
                        <div key={key} className="car-detail-tech-row">
                          <div className="car-detail-tech-key">
                            {formatSpecKey(key)}
                          </div>

                          <div className="car-detail-tech-value">
                            {formatSpecValue(key, value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="car-detail-tech-side">
                    {safetyList.length > 0 ? (
                      <div className="car-detail-tech-block">
                        <h3 className="car-detail-tech-heading">
                          Safety & Driving Assistance
                        </h3>

                        <ul className="car-detail-tech-bullets">
                          {safetyList.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {convenienceList.length > 0 ? (
                      <div className="car-detail-tech-block">
                        <h3 className="car-detail-tech-heading">
                          Convenience
                        </h3>

                        <ul className="car-detail-tech-bullets">
                          {convenienceList.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          <section className="car-detail-section">
            <h2 className="car-detail-section-title">Reviews</h2>

            <div className="car-detail-review-card">
              {!authToken ? (
                <div className="car-detail-review-auth">
                  <span>Please sign in to write a review.</span>
                  <Link to="/login">Sign in</Link>
                </div>
              ) : (
                <form className="car-detail-review-form" onSubmit={submitReview}>
                  <div className="car-detail-review-form-top">
                    <div className="car-detail-review-author">
                      {authUsername}
                    </div>

                    <label className="car-detail-review-rating">
                      <span>Rating</span>

                      <select
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                        disabled={reviewSubmitting}
                      >
                        <option value={5}>5</option>
                        <option value={4}>4</option>
                        <option value={3}>3</option>
                        <option value={2}>2</option>
                        <option value={1}>1</option>
                      </select>
                    </label>
                  </div>

                  <textarea
                    className="car-detail-review-textarea"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Write your comment (optional)"
                    rows={4}
                    disabled={reviewSubmitting}
                  />

                  {reviewSubmitError ? (
                    <div className="car-detail-review-error">
                      {reviewSubmitError}
                    </div>
                  ) : null}

                  {reviewSubmitMessage ? (
                    <div className="car-detail-review-success">
                      {reviewSubmitMessage}
                    </div>
                  ) : null}

                  <button
                    className="car-detail-review-submit"
                    type="submit"
                    disabled={reviewSubmitting}
                  >
                    {reviewSubmitting ? "Submitting..." : "Submit review"}
                  </button>
                </form>
              )}
            </div>

            {reviewsLoading ? (
              <div className="car-detail-review-state">
                Loading reviews...
              </div>
            ) : reviewsError ? (
              <div className="car-detail-review-state car-detail-review-error">
                {reviewsError}
              </div>
            ) : reviews.length === 0 ? (
              <div className="car-detail-review-state">No reviews yet.</div>
            ) : (
              <div className="car-detail-review-list">
                {reviews
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(b?.createdAt || 0) -
                      new Date(a?.createdAt || 0)
                  )
                  .map((review) => (
                    <div key={review?._id} className="car-detail-review-item">
                      <div className="car-detail-review-item-top">
                        <div className="car-detail-review-item-user">
                          {review?.userId?.username || "User"}
                        </div>

                        <div className="car-detail-review-item-stars">
                          {renderStars(review?.rating)}
                        </div>
                      </div>

                      {review?.comment ? (
                        <div className="car-detail-review-item-comment">
                          {review.comment}
                        </div>
                      ) : (
                        <div className="car-detail-review-item-comment car-detail-review-item-muted">
                          (No comment)
                        </div>
                      )}

                      <div className="car-detail-review-item-date">
                        {review?.createdAt
                          ? new Date(review.createdAt).toLocaleString("en-US")
                          : ""}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default CarDetail;
