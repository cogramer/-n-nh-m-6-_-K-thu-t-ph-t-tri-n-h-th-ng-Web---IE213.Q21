import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import Notification from "../../components/Notification/Notification";
import ProductService from "../../services/ProductService";
import AccountService from "../../services/accountService";
import "./Cars.css";
import add from "../../assets/icon/add.png";
import bmwLogo from "../../assets/icon/bmw.png";
import hondaLogo from "../../assets/icon/honda.png";
import mercedesLogo from "../../assets/icon/mec.png";
import porscheLogo from "../../assets/icon/porsche.png";
import toyotaLogo from "../../assets/icon/toyota.png";
import vinfastLogo from "../../assets/icon/vinfast.png";
import { useCart } from "../../context/CartContext";
import {
  getProductHeroImagePath,
  PLACEHOLDER_IMAGE_URL,
  resolveImageUrl,
} from "../../utils/imageUrl";

const BRAND_LOGOS = {
  BMW: bmwLogo,
  Honda: hondaLogo,
  Mercedes: mercedesLogo,
  "Mercedes-Benz": mercedesLogo,
  Porsche: porscheLogo,
  Toyota: toyotaLogo,
  Vinfast: vinfastLogo,
  VinFast: vinfastLogo,
};

const CARS_PAGE_SIZE = 5;

const getPageFromSearchParams = (searchParams) => {
  const pageValue = Number(searchParams.get("page"));
  return Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
};

const withPageSearchParam = (searchParams, page) => {
  const nextSearchParams = new URLSearchParams(searchParams);

  if (page <= 1) {
    nextSearchParams.delete("page");
  } else {
    nextSearchParams.set("page", String(page));
  }

  return nextSearchParams;
};

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

function DualRange({
  min,
  max,
  step,
  valueMin,
  valueMax,
  disabled,
  onChangeMin,
  onChangeMax,
}) {
  const range = max - min;
  const left = range > 0 ? ((valueMin - min) / range) * 100 : 0;
  const right = range > 0 ? ((valueMax - min) / range) * 100 : 100;

  return (
    <div
      className="cars-dual-range"
      style={{ "--left": `${left}%`, "--right": `${right}%` }}
    >
      <input
        className="cars-dual-range-input"
        style={{ zIndex: valueMin > valueMax - step * 2 ? 5 : 3 }}
        type="range"
        min={min}
        max={max}
        step={step}
        value={valueMin}
        disabled={disabled}
        onChange={(e) => {
          const next = Number(e.target.value);
          onChangeMin(Math.min(next, valueMax - step));
        }}
      />
      <input
        className="cars-dual-range-input"
        style={{ zIndex: 4 }}
        type="range"
        min={min}
        max={max}
        step={step}
        value={valueMax}
        disabled={disabled}
        onChange={(e) => {
          const next = Number(e.target.value);
          onChangeMax(Math.max(next, valueMin + step));
        }}
      />
    </div>
  );
}

function CarSpecItem({ icon, text }) {
  return (
    <div className="cars-item-spec">
      <span className="cars-item-spec-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="cars-item-spec-text">{text}</span>
    </div>
  );
}

function IconMileage() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M4.5 15a7.5 7.5 0 1 1 15 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 9v4l3 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconYear() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3v3M17 3v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4 8h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTransmission() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3v12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 6h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 21h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 15l-3 3M12 15l3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconFuel() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M6 3h9a1 1 0 0 1 1 1v17H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8 7h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 8l2 2v8a2 2 0 0 1-2 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconDrive() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M7 14h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M5.5 16.5a2 2 0 1 0 0.01 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M18.5 16.5a2 2 0 1 0 0.01 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 7h8l2 5H6l2-5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPower() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3v7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7.5 5.5a8 8 0 1 0 9 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M12 22s7-5.2 7-12a7 7 0 0 0-14 0c0 6.8 7 12 7 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 11.5a2 2 0 1 0 0.01 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Cars() {
  const notifyRef = useRef();
  const [searchParams, setSearchParams] = useSearchParams();

  const [carsList, setCarsList] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [selectedMakes, setSelectedMakes] = useState([]);
  const [isMakeOpen, setIsMakeOpen] = useState(false);
  const [makeQuery, setMakeQuery] = useState("");
  const [expandedTagsById, setExpandedTagsById] = useState({});
  const [priceMin, setPriceMin] = useState(10000);
  const [priceMax, setPriceMax] = useState(200000);
  const [mileageMin, setMileageMin] = useState(0);
  const [mileageMax, setMileageMax] = useState(200000);
  const [transmission, setTransmission] = useState("All");
  const [fuel, setFuel] = useState("All");
  const [powerMin, setPowerMin] = useState(20);
  const [powerMax, setPowerMax] = useState(1000);
  const [vehicleType, setVehicleType] = useState("All");
  const [featureQuery, setFeatureQuery] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [page, setPage] = useState(() => getPageFromSearchParams(searchParams));
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const showNotification = (title, message, type = "info") => {
    notifyRef.current?.showNotification(title, message, type);
  };

  const handleImageError = useCallback((event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = PLACEHOLDER_IMAGE_URL;
  }, []);

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

  const handleAddToCart = (car) => {
    const stock = Number(car?.stock) || 0;

    addToCart(car);

    if (stock <= 0) {
      return;
    }

    showNotification(
      "System Message",
      `${car?.name || "Car"} has been added to your cart.`,
      "success"
    );
  };

  // Fetch data from API when component mounts
  useEffect(() => {
    const fetchCars = async () => {
      try {
        const data = await ProductService.getAllProducts();
        setCarsList(data);
      } catch (error) {
        console.error("Error fetching cars:", error);

        showNotification(
          "System Message",
          "Unable to load cars. Please try again.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  useEffect(() => {
    const pageFromUrl = getPageFromSearchParams(searchParams);

    setPage((currentPage) =>
      currentPage === pageFromUrl ? currentPage : pageFromUrl
    );
  }, [searchParams]);

  useEffect(() => {
    const handleWishlistChange = () => {
      const token = getAuthToken();

      if (!token) {
        setWishlistIds([]);
        return;
      }

      fetchWishlist();
    };

    window.addEventListener("auth-change", handleWishlistChange);
    window.addEventListener("auth-expired", handleWishlistChange);
    window.addEventListener("wishlist-change", handleWishlistChange);

    return () => {
      window.removeEventListener("auth-change", handleWishlistChange);
      window.removeEventListener("auth-expired", handleWishlistChange);
      window.removeEventListener("wishlist-change", handleWishlistChange);
    };
  }, [fetchWishlist]);

  const brandList = useMemo(() => {
    const values = Array.from(
      new Set(carsList.map((c) => c.brand).filter(Boolean))
    );
    values.sort((a, b) => a.localeCompare(b));
    return values;
  }, [carsList]);

  const filteredBrands = useMemo(() => {
    const q = makeQuery.trim().toLowerCase();
    if (!q) return brandList;
    return brandList.filter((b) => b.toLowerCase().includes(q));
  }, [brandList, makeQuery]);

  const mostSearchedBrands = useMemo(() => {
    const preferred = [
      "BMW",
      "Honda",
      "Mercedes",
      "Porsche",
      "Toyota",
      "Vinfast",
    ];
    const set = new Set(brandList);
    const picks = preferred.filter((b) => set.has(b)).slice(0, 6);
    if (picks.length >= 6) return picks;
    const remainder = brandList.filter((b) => !picks.includes(b));
    return [...picks, ...remainder].slice(0, 6);
  }, [brandList]);

  const brandLogo = (brand) => {
    const brandName = String(brand || "").trim();

    if (BRAND_LOGOS[brandName]) {
      return BRAND_LOGOS[brandName];
    }

    const normalizedBrand = brandName
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/-/g, "");

    const matchedKey = Object.keys(BRAND_LOGOS).find((key) => {
      const normalizedKey = key
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/-/g, "");

      return normalizedKey === normalizedBrand;
    });

    return matchedKey ? BRAND_LOGOS[matchedKey] : null;
  };

  const toggleMake = (brand) => {
    setSelectedMakes((prev) => {
      const next = Array.isArray(prev) ? prev : [];
      if (next.includes(brand)) return next.filter((x) => x !== brand);
      return [...next, brand];
    });
    setPage(1);
  };

  const removeMake = (brand) => {
    setSelectedMakes((prev) => {
      const next = Array.isArray(prev) ? prev : [];
      return next.filter((x) => x !== brand);
    });
    setPage(1);
  };

  const typeCategories = useMemo(() => {
    const values = Array.from(
      new Set(carsList.map((c) => c.category).filter(Boolean))
    );
    values.sort((a, b) => a.localeCompare(b));
    return values;
  }, [carsList]);

  const allFeatures = useMemo(() => {
    const set = new Set();
    carsList.forEach((c) => {
      (Array.isArray(c.safety) ? c.safety : []).forEach((x) => set.add(x));
      (Array.isArray(c.convenience) ? c.convenience : []).forEach((x) =>
        set.add(x)
      );
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [carsList]);

  const visibleFeatures = useMemo(() => {
    const q = featureQuery.trim().toLowerCase();
    const list = q
      ? allFeatures.filter((f) => f.toLowerCase().includes(q))
      : allFeatures;
    return showAllFeatures ? list : list.slice(0, 8);
  }, [allFeatures, featureQuery, showAllFeatures]);

  const canShowMoreFeatures = useMemo(() => {
    const q = featureQuery.trim().toLowerCase();
    const list = q
      ? allFeatures.filter((f) => f.toLowerCase().includes(q))
      : allFeatures;
    return !showAllFeatures && list.length > 8;
  }, [allFeatures, featureQuery, showAllFeatures]);

  // Helper functions for the current product JSON structure
  const getPowerHP = (car) => {
    const value = car?.specifications?.power;
    return typeof value === "number" ? value : 0;
  };

  const getTransmission = (car) => {
    const gear = car?.specifications?.gear;
    if (gear === 1 || car?.specifications?.powertrainType === "electric") {
      return "Automatic";
    }
    return "Manual";
  };

  const getFuel = (car) => {
    const type = car?.specifications?.powertrainType;
    if (type === "electric") return "Electric";
    if (type === "hybrid") return "Hybrid";
    return "Gasoline";
  };

  const getDrive = (car) => {
    const engine = car?.specifications?.engine?.toLowerCase() || "";
    if (
      engine.includes("awd") ||
      engine.includes("all electric") ||
      engine.includes("dual")
    ) {
      return "AWD";
    }
    return null;
  };

  const filteredCars = useMemo(() => {
    return carsList.filter((c) => {
      const matchMake =
        selectedMakes.length === 0 ? true : selectedMakes.includes(c.brand);

      const matchPrice =
        typeof c.price === "number"
          ? c.price >= priceMin && c.price <= priceMax
          : true;

      // Current API does not provide mileageKM yet
      const matchMileage = true;

      const matchTransmission =
        transmission === "All" ? true : getTransmission(c) === transmission;

      const matchFuel = fuel === "All" ? true : getFuel(c) === fuel;

      const power = getPowerHP(c);
      const matchPower = power >= powerMin && power <= powerMax;

      const matchType =
        vehicleType === "All" ? true : c.category === vehicleType;

      const matchFeatures =
        selectedFeatures.length === 0
          ? true
          : selectedFeatures.every((f) => {
              const list = [
                ...(Array.isArray(c.safety) ? c.safety : []),
                ...(Array.isArray(c.convenience) ? c.convenience : []),
              ];
              return list.includes(f);
            });

      return (
        matchMake &&
        matchPrice &&
        matchMileage &&
        matchTransmission &&
        matchFuel &&
        matchPower &&
        matchType &&
        matchFeatures
      );
    });
  }, [
    carsList,
    selectedMakes,
    priceMin,
    priceMax,
    transmission,
    fuel,
    powerMin,
    powerMax,
    vehicleType,
    selectedFeatures,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCars.length / CARS_PAGE_SIZE)
  );
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * CARS_PAGE_SIZE;
  const visibleCars = filteredCars.slice(
    startIndex,
    startIndex + CARS_PAGE_SIZE
  );

  const heroCar = visibleCars[0] || filteredCars[0] || carsList[0];
  const heroImage = resolveImageUrl(getProductHeroImagePath(heroCar));

  useEffect(() => {
    if (loading) return;

    const pageFromUrl = getPageFromSearchParams(searchParams);

    // Keep the page in the URL so returning from a detail page restores the same result page.
    if (pageFromUrl !== safePage) {
      setSearchParams(withPageSearchParam(searchParams, safePage), {
        replace: true,
      });
    }
  }, [loading, safePage, searchParams, setSearchParams]);

  const priceText = (value) => {
    if (typeof value !== "number") return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const toggleFeature = (feature) => {
    setSelectedFeatures((prev) => {
      if (prev.includes(feature)) return prev.filter((x) => x !== feature);
      return [...prev, feature];
    });
    setPage(1);
  };

  return (
    <>
      <Notification ref={notifyRef} />

      <Navbar />

      <main className="cars-page">
        <section className="cars-hero">
          <div className="cars-hero-inner">
            <div className="cars-hero-text">
              <h1>
                Find your
                <br />
                favorite car
              </h1>
            </div>

            <div className="cars-hero-media">
              <img
                src={heroImage}
                alt={heroCar?.name || "Hero car"}
                loading="eager"
                decoding="async"
                onError={handleImageError}
              />
            </div>
          </div>
        </section>

        <div className="cars-layout">
          <aside className="cars-sidebar">
            <div className="cars-filter-card">
              <div className="cars-filter-title">Filter</div>

              <div className="cars-filter-group">
                <div className="cars-filter-label">Car model</div>

                {selectedMakes.length > 0 ? (
                  <div className="cars-selected-makes">
                    {selectedMakes.map((brand) => {
                      const logo = brandLogo(brand);

                      return (
                        <div key={brand} className="cars-selected-make">
                          {logo ? (
                            <img
                              className="cars-selected-make-logo"
                              src={logo}
                              alt={brand}
                            />
                          ) : (
                            <span className="cars-selected-make-logo cars-selected-make-fallback">
                              {brand.slice(0, 1).toUpperCase()}
                            </span>
                          )}

                          <div className="cars-selected-make-name">{brand}</div>

                          <button
                            type="button"
                            className="cars-selected-make-remove"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeMake(brand);
                            }}
                            aria-label={`Remove ${brand}`}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                <button
                  type="button"
                  className="cars-model-row cars-model-trigger"
                  onClick={() => setIsMakeOpen(true)}
                >
                  <span className="cars-model-select">
                    <span className="cars-model-plus">+</span>
                    <span className="cars-model-value">Add a car</span>
                  </span>
                  <span className="cars-model-go" aria-hidden="true">
                    ›
                  </span>
                </button>
              </div>

              <div className="cars-filter-group">
                <div className="cars-filter-label">Price</div>
                <div className="cars-filter-range-meta cars-filter-range-meta-top">
                  <span>{priceText(priceMin)}</span>
                  <span>{priceText(priceMax)}</span>
                </div>

                <DualRange
                  min={10000}
                  max={200000}
                  step={500}
                  valueMin={priceMin}
                  valueMax={priceMax}
                  onChangeMin={(v) => {
                    setPriceMin(v);
                    setPage(1);
                  }}
                  onChangeMax={(v) => {
                    setPriceMax(v);
                    setPage(1);
                  }}
                />
              </div>

              <div className="cars-filter-group">
                <div className="cars-filter-label">Mileage (km)</div>
                <div className="cars-filter-range-meta cars-filter-range-meta-top">
                  <span>{mileageMin.toLocaleString("en-US")} km</span>
                  <span>{mileageMax.toLocaleString("en-US")} km</span>
                </div>

                <DualRange
                  min={0}
                  max={200000}
                  step={500}
                  valueMin={mileageMin}
                  valueMax={mileageMax}
                  onChangeMin={(v) => {
                    setMileageMin(v);
                    setPage(1);
                  }}
                  onChangeMax={(v) => {
                    setMileageMax(v);
                    setPage(1);
                  }}
                />
              </div>

              <div className="cars-filter-group">
                <div className="cars-filter-label">Transmission</div>
                <select
                  className="cars-filter-select"
                  value={transmission}
                  onChange={(e) => {
                    setTransmission(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="All">All</option>
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>

              <div className="cars-filter-group">
                <div className="cars-filter-label">Fuel</div>
                <select
                  className="cars-filter-select"
                  value={fuel}
                  onChange={(e) => {
                    setFuel(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="All">All</option>
                  <option value="Gasoline">Gasoline</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>

              <div className="cars-filter-group">
                <div className="cars-filter-label">Power (HP)</div>
                <div className="cars-filter-range-meta cars-filter-range-meta-top">
                  <span>{powerMin} HP</span>
                  <span>{powerMax} HP</span>
                </div>

                <DualRange
                  min={20}
                  max={1000}
                  step={10}
                  valueMin={powerMin}
                  valueMax={powerMax}
                  onChangeMin={(v) => {
                    setPowerMin(v);
                    setPage(1);
                  }}
                  onChangeMax={(v) => {
                    setPowerMax(v);
                    setPage(1);
                  }}
                />
              </div>

              <div className="cars-filter-group">
                <div className="cars-filter-label">Vehicle type</div>
                <select
                  className="cars-filter-select"
                  value={vehicleType}
                  onChange={(e) => {
                    setVehicleType(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="All">All</option>
                  {typeCategories.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="cars-filter-group">
                <div className="cars-filter-label">Feature</div>
                <input
                  className="cars-filter-input"
                  value={featureQuery}
                  onChange={(e) => {
                    setFeatureQuery(e.target.value);
                    setShowAllFeatures(false);
                  }}
                  placeholder="Search for feature"
                />

                <div className="cars-feature-list">
                  {visibleFeatures.map((feature) => {
                    const checked = selectedFeatures.includes(feature);

                    return (
                      <label key={feature} className="cars-feature-item">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFeature(feature)}
                        />
                        <span>{feature}</span>
                      </label>
                    );
                  })}
                </div>

                {canShowMoreFeatures ? (
                  <button
                    type="button"
                    className="cars-feature-more"
                    onClick={() => setShowAllFeatures(true)}
                  >
                    More feature
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                className="cars-filter-submit"
                onClick={() => {
                  setPage(1);
                  const el = document.getElementById("cars-results");
                  if (el) {
                    el.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
              >
                Detail search
              </button>
            </div>
          </aside>

          <section className="cars-results" id="cars-results">
            <div className="cars-results-header">
              <div className="cars-results-title">Available Car</div>

              <div className="cars-results-pager">
                <button
                  type="button"
                  className="cars-pager-btn"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>

                <div className="cars-pager-pages">
                  {Array.from({ length: totalPages })
                    .slice(0, 7)
                    .map((_, i) => {
                      const p = i + 1;

                      return (
                        <button
                          key={p}
                          type="button"
                          className={`cars-page-btn ${
                            p === safePage ? "active" : ""
                          }`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      );
                    })}
                </div>

                <button
                  type="button"
                  className="cars-pager-btn"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>

            <div className="cars-results-subtitle">
              {loading ? "Preparing inventory..." : `${filteredCars.length} cars`}
            </div>

            <div className="cars-list">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={`cars-skeleton-${index}`}
                    className="cars-item cars-skeleton-card"
                    aria-hidden="true"
                  >
                    <div className="cars-skeleton-media" />
                    <div className="cars-skeleton-body">
                      <div className="cars-skeleton-line cars-skeleton-line-lg" />
                      <div className="cars-skeleton-line cars-skeleton-line-sm" />
                      <div className="cars-skeleton-specs">
                        <span />
                        <span />
                        <span />
                        <span />
                      </div>
                      <div className="cars-skeleton-chips">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                    <div className="cars-skeleton-price" />
                  </div>
                ))
              ) : visibleCars.length > 0 ? (
                visibleCars.map((car) => {
                  const chipItems = [
                    ...(Array.isArray(car.safety) ? car.safety : []),
                    ...(Array.isArray(car.convenience) ? car.convenience : []),
                  ];
                  const isExpanded = Boolean(expandedTagsById[car._id]);
                  const visibleChips = isExpanded
                    ? chipItems
                    : chipItems.slice(0, 4);
                  const remaining = Math.max(0, chipItems.length - 4);
                  const cardImage = resolveImageUrl(car.thumbnailImage);
                  const isWishlisted = wishlistIds.includes(String(car._id));
                  const stock = Number(car?.stock) || 0;
                  const stockText =
                    stock <= 0 ? "Out of stock" : `${stock} left`;

                  return (
                    <div key={car._id} className="cars-item">
                      <button
                        type="button"
                        className={`cars-wishlist-btn ${
                          isWishlisted ? "active" : ""
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleWishlist(car._id);
                        }}
                        aria-label={
                          isWishlisted
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                        }
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="cars-wishlist-icon"
                          aria-hidden="true"
                        >
                          <path d="M20.84 4.61C20.33 4.1 19.72 3.7 19.05 3.43C18.38 3.15 17.66 3.01 16.94 3.01C16.22 3.01 15.5 3.15 14.83 3.43C14.16 3.7 13.55 4.1 13.04 4.61L12 5.65L10.96 4.61C9.93 3.58 8.54 3 7.08 3C5.62 3 4.23 3.58 3.2 4.61C2.17 5.64 1.59 7.03 1.59 8.49C1.59 9.95 2.17 11.34 3.2 12.37L12 21.17L20.84 12.37C21.35 11.86 21.75 11.25 22.03 10.58C22.3 9.91 22.45 9.19 22.45 8.47C22.45 7.75 22.3 7.03 22.03 6.36C21.75 5.69 21.35 5.12 20.84 4.61Z" />
                        </svg>
                      </button>

                      <Link to={`/product/${car._id}`}>
                        <div className="cars-item-media">
                          <img
                            src={cardImage}
                            alt={car.name}
                            loading="lazy"
                            decoding="async"
                            onError={handleImageError}
                          />
                        </div>
                      </Link>

                      <Link to={`/product/${car._id}`}>
                        <div className="cars-item-body">
                          <div className="cars-item-top">
                            <div className="cars-item-name">{car.name}</div>
                            <div className="cars-item-brand">
                              <span
                                className="cars-item-brand-icon"
                                aria-hidden="true"
                              >
                                <IconPin />
                              </span>
                              <span>{car.brand}</span>
                            </div>
                          </div>

                          <div className="cars-item-stock">{stockText}</div>

                          <div className="cars-item-specs">
                            <CarSpecItem
                              icon={<IconYear />}
                              text={`${new Date(
                                car.createdAt
                              ).getFullYear()}`}
                            />
                            <CarSpecItem
                              icon={<IconTransmission />}
                              text={getTransmission(car)}
                            />
                            <CarSpecItem
                              icon={<IconFuel />}
                              text={getFuel(car)}
                            />
                            {getDrive(car) ? (
                              <CarSpecItem
                                icon={<IconDrive />}
                                text={getDrive(car)}
                              />
                            ) : null}
                            <CarSpecItem
                              icon={<IconPower />}
                              text={`${getPowerHP(car)} HP`}
                            />
                          </div>

                          <div className="cars-item-meta">
                            {visibleChips.map((text) => (
                              <span key={text} className="cars-chip">
                                {text}
                              </span>
                            ))}

                            {remaining > 0 ? (
                              <button
                                type="button"
                                className="cars-chip cars-chip-more cars-chip-button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setExpandedTagsById((prev) => ({
                                    ...prev,
                                    [car._id]: !isExpanded,
                                  }));
                                }}
                              >
                                {isExpanded ? "Less" : `${remaining} more`}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </Link>

                      <div className="cars-item-price">
                        <button
                          type="button"
                          className={`add-to-cart ${stock <= 0 ? "is-disabled" : ""}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddToCart(car);
                          }}
                          aria-disabled={stock <= 0}
                          title={stock <= 0 ? "Out of stock" : "Add to cart"}
                          aria-label={
                            stock <= 0 ? "Out of stock" : "Add to cart"
                          }
                        >
                          <img src={add} alt="Add to cart icon" />
                        </button>

                        {priceText(car.price)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="cars-empty-state">
                  No cars match the current filters.
                </div>
              )}
            </div>
          </section>
        </div>

        {isMakeOpen ? (
          <div
            className="cars-make-overlay"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setIsMakeOpen(false);
              }
            }}
          >
            <div className="cars-make-modal">
              <div className="cars-make-header">
                <div className="cars-make-title">Select make</div>

                <div className="cars-make-actions">
                  <button
                    type="button"
                    className="cars-make-done"
                    onClick={() => setIsMakeOpen(false)}
                  >
                    Done
                  </button>

                  <button
                    type="button"
                    className="cars-make-close"
                    onClick={() => setIsMakeOpen(false)}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="cars-make-search">
                <span className="cars-make-search-icon" aria-hidden="true">
                  ⌕
                </span>
                <input
                  value={makeQuery}
                  onChange={(e) => setMakeQuery(e.target.value)}
                  placeholder="Make or model"
                />
              </div>

              <div className="cars-make-section">
                <div className="cars-make-section-title">
                  MOST SEARCHED TAGS
                </div>

                <div className="cars-make-tags">
                  {mostSearchedBrands.map((brand) => {
                    const logo = brandLogo(brand);
                    const active = selectedMakes.includes(brand);

                    return (
                      <button
                        key={brand}
                        type="button"
                        className={`cars-make-tag ${active ? "active" : ""}`}
                        onClick={() => toggleMake(brand)}
                      >
                        {logo ? (
                          <img src={logo} alt={brand} />
                        ) : (
                          <span className="cars-make-tag-fallback">
                            {brand.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="cars-make-section cars-make-list-wrap">
                <div className="cars-make-section-title">ALL BRANDS</div>

                <div className="cars-make-list">
                  <button
                    type="button"
                    className={`cars-make-row ${
                      selectedMakes.length === 0 ? "active" : ""
                    }`}
                    onClick={() => {
                      setSelectedMakes([]);
                      setPage(1);
                    }}
                  >
                    <span className="cars-make-row-logo cars-make-row-fallback">
                      A
                    </span>
                    <span className="cars-make-row-name">All</span>
                  </button>

                  {filteredBrands.map((brand) => {
                    const logo = brandLogo(brand);
                    const active = selectedMakes.includes(brand);

                    return (
                      <button
                        key={brand}
                        type="button"
                        className={`cars-make-row ${active ? "active" : ""}`}
                        onClick={() => toggleMake(brand)}
                      >
                        {logo ? (
                          <img
                            className="cars-make-row-logo"
                            src={logo}
                            alt={brand}
                          />
                        ) : (
                          <span className="cars-make-row-logo cars-make-row-fallback">
                            {brand.slice(0, 1).toUpperCase()}
                          </span>
                        )}

                        <span className="cars-make-row-name">{brand}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <Footer />
    </>
  );
}

export default Cars;
