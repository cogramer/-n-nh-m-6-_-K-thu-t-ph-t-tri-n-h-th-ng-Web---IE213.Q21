import React from "react";
import { Link } from "react-router-dom";
import "./CarCard.css";
import add from "../../../assets/icon/add.png";
import { useCart } from "../../../context/CartContext";

function CarCard({
  car,
  delay,
  isWishlisted = false,
  onToggleWishlist,
  onAddToCartSuccess,
}) {
  const { addToCart } = useCart();
  const stock = Number(car?.stock) || 0;

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (onToggleWishlist) {
      onToggleWishlist(car._id);
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (stock <= 0) {
      return;
    }

    addToCart(car);

    if (onAddToCartSuccess) {
      onAddToCartSuccess(car);
    }
  };

  return (
    <div
      className="car-card reveal-up active"
      style={{ "--reveal-delay": `${delay}s` }}
    >
      <button
        type="button"
        className={`wishlist-btn ${isWishlisted ? "active" : ""}`}
        onClick={handleWishlistClick}
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        <svg viewBox="0 0 24 24" className="wishlist-icon" aria-hidden="true">
          <path d="M20.84 4.61C20.33 4.1 19.72 3.7 19.05 3.43C18.38 3.15 17.66 3.01 16.94 3.01C16.22 3.01 15.5 3.15 14.83 3.43C14.16 3.7 13.55 4.1 13.04 4.61L12 5.65L10.96 4.61C9.93 3.58 8.54 3 7.08 3C5.62 3 4.23 3.58 3.2 4.61C2.17 5.64 1.59 7.03 1.59 8.49C1.59 9.95 2.17 11.34 3.2 12.37L12 21.17L20.84 12.37C21.35 11.86 21.75 11.25 22.03 10.58C22.3 9.91 22.45 9.19 22.45 8.47C22.45 7.75 22.3 7.03 22.03 6.36C21.75 5.69 21.35 5.12 20.84 4.61Z" />
        </svg>
      </button>

      <div
        className={`stock-badge ${
          stock <= 0 ? "out" : stock <= 3 ? "low" : ""
        }`}
      >
        {stock <= 0 ? "Out of stock" : `${stock} left`}
      </div>

      <Link to={`/product/${car._id}`}>
        <img
          className="thumb-img"
          src={car.thumbnailImage}
          alt={car.name}
          loading="lazy"
          decoding="async"
          width="400"
          height="230"
        />
      </Link>

      <div className="body">
        <div className="title">
          <h3>{car.name}</h3>

          <p className="id" style={{ display: "none" }}>
            {car._id}
          </p>

          <Link className="cta" to={`/product/${car._id}`}>
            Shop now
          </Link>
        </div>

        <button
          type="button"
          className="add-to-cart"
          onClick={handleAddToCart}
          disabled={stock <= 0}
          title={stock <= 0 ? "Out of stock" : "Add to cart"}
          aria-label={stock <= 0 ? "Out of stock" : "Add to cart"}
        >
          <img src={add} alt="Add to cart icon" />
        </button>
      </div>
    </div>
  );
}

export default CarCard;