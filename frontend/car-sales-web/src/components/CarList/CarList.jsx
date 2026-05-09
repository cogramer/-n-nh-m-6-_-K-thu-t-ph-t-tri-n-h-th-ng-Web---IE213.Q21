import React, { useState } from "react";
import CarCard from "./CarCard/CarCard";
import "./CarList.css";

function CarList({
  cars,
  wishlistIds = [],
  onToggleWishlist,
  onAddToCartSuccess,
}) {
  // Manage the start position of the 8 visible cars
  const [startIndex, setStartIndex] = useState(0);
  const itemsPerPage = 8;

  // Slice the array to show only 8 cars based on startIndex
  const visibleCars = cars.slice(startIndex, startIndex + itemsPerPage);

  const handleNext = () => {
    // Move to the next page only if there are more cars
    if (startIndex + itemsPerPage < cars.length) {
      setStartIndex(startIndex + itemsPerPage);
    }
  };

  const handlePrev = () => {
    // Move back only if the current page is not the first page
    if (startIndex - itemsPerPage >= 0) {
      setStartIndex(startIndex - itemsPerPage);
    }
  };

  const totalPages = Math.ceil(cars.length / itemsPerPage) || 1;
  const currentPage = Math.floor(startIndex / itemsPerPage) + 1;

  return (
    <div className="car-list-wrapper">
      <div className="car-list-container">
        <div className="car-list grid-4">
          {visibleCars.map((car, index) => (
            <CarCard
              key={car._id}
              car={car}
              delay={index * 0.05}
              isWishlisted={wishlistIds.includes(String(car._id))}
              onToggleWishlist={onToggleWishlist}
              onAddToCartSuccess={onAddToCartSuccess}
            />
          ))}
        </div>
      </div>

      <div className="pagination-controls">
        <button
          onClick={handlePrev}
          disabled={startIndex === 0}
          className="nav-btn"
        >
          &lt;
        </button>

        <span className="page-info">
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={handleNext}
          disabled={startIndex + itemsPerPage >= cars.length}
          className="nav-btn"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}

export default CarList;