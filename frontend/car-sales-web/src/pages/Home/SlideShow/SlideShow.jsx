import React, { useState, useEffect } from "react";
import "./SlideShow.css";

function SlideShow() {
  const [index, setIndex] = useState(0);

  const slides = [
    {
      avif: "../images/S680-img3",
      alt: "Mercedes Maybach S680",
    },
    {
      avif: "../images/cayenne-img2",
      alt: "Porsche Cayenne",
    },
    {
      avif: "../images/test",
      alt: "Featured car",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 3000);

    return () => clearInterval(timer); // Clean up memory when the component unmounts
  }, [slides.length]);

  return (
    <section className="hero-container">
      {/* Background slideshow block */}
      <div className="slideshow">
        {slides.map((slide, i) => (
          <picture key={i}>
            <source
              type="image/avif"
              srcSet={`${slide.avif}-640.avif 640w, ${slide.avif}-1024.avif 1024w, ${slide.avif}-1600.avif 1600w`}
              sizes="(max-width: 768px) 100vw, 1200px"
            />
            <img
              src={`${slide.avif}-640.avif`}
              className={`slide ${i === index ? "active" : ""}`}
              alt={slide.alt}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={i === 0 ? "high" : "low"}
            />
          </picture>
        ))}
      </div>

      {/* Content block */}
      <div className="hero-overlay">
        <div className="hero-content">
          <h1>UNLEASH THE PERFORMANCE WITHIN</h1>
          <p>
            Every detail is a testament to the combination of technology, art
            and the desire to conquer.
          </p>
          <div className="hero-buttons">
            <a href="/about" className="btn-about">About Us</a>
            <a href="/cars" className="btn-explore">Explore</a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SlideShow;
