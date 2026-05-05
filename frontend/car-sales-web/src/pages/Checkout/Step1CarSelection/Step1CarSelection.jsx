import React from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle,
  Gauge,
  Info,
  Minus,
  Plus,
  Scale,
  Trash2,
  Zap,
} from "lucide-react";
import "./Step1CarSelection.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

function Step1CarSelection({
  cartItems = [],
  removeFromCart,
  updateQuantity,
  selectedIds = [],
  toggleSelectCar,
  actionLoading = {},
}) {
  return (
    <div className="vehicle-selection">
      <div className="checkout-section-heading">
        <span>Step 1</span>
        <h2>Choose the vehicle to reserve</h2>
        <p>
          Select the car you want to move forward with. You can adjust quantity
          or remove models before scheduling handover.
        </p>
      </div>

      {cartItems.length > 0 ? (
        <div className="vehicle-list">
          {cartItems.map((item) => {
            const product = item.productId;
            const cartItemId = item._id;
            const productId = product?._id;
            const quantity = Number(item.quantity || 1);
            const price = Number(item.price || product?.price || 0);
            const stock = Number(product?.stock);
            const hasStockLimit = Number.isFinite(stock);
            const isAtStockLimit = hasStockLimit && quantity >= stock;
            const specs = product?.specifications || {};
            const isSelected = selectedIds.includes(cartItemId);
            const isLoading = Boolean(actionLoading[cartItemId]);

            const specificationItems = [
              {
                icon: <Scale size={15} />,
                label: "Weight",
                value: specs.weight ? `${specs.weight} kg` : "N/A",
              },
              {
                icon: <Zap size={15} />,
                label: "Power",
                value: specs.power ? `${specs.power} HP` : "N/A",
              },
              {
                icon: <Gauge size={15} />,
                label: "Top speed",
                value: specs.topSpeed ? `${specs.topSpeed} km/h` : "N/A",
              },
            ];

            return (
              <article
                className={`vehicle-card ${isSelected ? "is-selected" : ""}`}
                key={cartItemId || productId}
                onClick={() => {
                  if (!isLoading && cartItemId) toggleSelectCar(cartItemId);
                }}
              >
                <button
                  type="button"
                  className="vehicle-select-indicator"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    if (!isLoading && cartItemId) toggleSelectCar(cartItemId);
                  }}
                  disabled={isLoading || !cartItemId}
                  aria-label={isSelected ? "Unselect vehicle" : "Select vehicle"}
                >
                  {isSelected ? <CheckCircle size={18} /> : <span />}
                </button>

                <div className="vehicle-media">
                  <img
                    src={product?.thumbnailImage || ""}
                    alt={product?.name || "Vehicle"}
                  />
                </div>

                <div className="vehicle-content">
                  <div className="vehicle-title-row">
                    <div>
                      <span>Selected model</span>
                      <h3>{product?.name || "Unnamed vehicle"}</h3>
                    </div>

                    <div className="vehicle-actions">
                      <Link
                        to={productId ? `/product/${productId}` : "/cars"}
                        className="vehicle-detail-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
                        aria-label="View vehicle details"
                        title="View vehicle details"
                      >
                        <Info size={17} />
                      </Link>

                      <button
                        type="button"
                        className="vehicle-remove-btn"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();

                          if (isLoading || !productId) return;

                          removeFromCart({
                            cartItemId,
                            productId,
                          });
                        }}
                        disabled={isLoading || !productId}
                        aria-label="Remove vehicle from cart"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>

                  <div className="vehicle-spec-grid">
                    {specificationItems.map((spec) => (
                      <div className="vehicle-spec" key={spec.label}>
                        {spec.icon}
                        <span>{spec.label}</span>
                        <strong>{spec.value}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="vehicle-card-footer">
                    <div className="vehicle-quantity" aria-label="Quantity">
                      <button
                        type="button"
                        disabled={quantity <= 1 || isLoading || !productId}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();

                          if (quantity <= 1 || isLoading || !productId) return;

                          updateQuantity({
                            cartItemId,
                            productId,
                            quantity: quantity - 1,
                          });
                        }}
                      >
                        <Minus size={15} />
                      </button>

                      <span>{quantity}</span>

                      <button
                        type="button"
                        disabled={isLoading || !productId || isAtStockLimit}
                        title={isAtStockLimit ? "Only available stock can be reserved" : "Increase quantity"}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();

                          if (isLoading || !productId || isAtStockLimit) return;

                          updateQuantity({
                            cartItemId,
                            productId,
                            quantity: quantity + 1,
                          });
                        }}
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    <div className="vehicle-price">
                      <span>Vehicle total</span>
                      <strong>{formatCurrency(price * quantity)}</strong>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="vehicle-empty-state">
          <h3>Your garage is empty</h3>
          <p>Add a vehicle before starting checkout.</p>
          <Link to="/cars">
            <Plus size={17} />
            Browse vehicles
          </Link>
        </div>
      )}

      {cartItems.length > 0 && (
        <Link to="/cars" className="vehicle-add-link">
          <Plus size={17} />
          Add another vehicle
        </Link>
      )}
    </div>
  );
}

export default Step1CarSelection;
