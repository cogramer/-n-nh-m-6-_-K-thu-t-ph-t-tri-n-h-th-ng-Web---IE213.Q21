import React from 'react';
import './Filter.css';

function Filter({ type, setType }) {
  // List of car categories
  const categories = [
    { label: "All", value: "All" },
    { label: "EVs", value: "EV" },
    { label: "SUVs", value: "SUV" },
    { label: "Sedans", value: "Sedan" },
    { label: "Coupes", value: "Coupe" },
    { label: "Convertibles", value: "Convertible" }
  ];

  return (
    <div className="popular-container">
      <h2>Popular Categories</h2>
      <div className="popular">
        <div className="reveal active">
          {categories.map((cat) => (
            <button
              key={cat.value}
              className={`category ${type === cat.value ? "active" : ""}`}
              onClick={() => setType(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Filter;
