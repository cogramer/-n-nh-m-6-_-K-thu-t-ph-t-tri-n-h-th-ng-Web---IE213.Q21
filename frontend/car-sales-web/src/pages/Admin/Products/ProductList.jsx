import { useEffect, useMemo, useState } from "react";
import {
  Battery,
  Car,
  Fuel,
  Gauge,
  Image,
  LoaderCircle,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  X,
} from "lucide-react";
import ProductService from "../../../services/ProductService";
import { orderService } from "../../../services/orderService";
import "./ProductList.css";

const resolveApiOrigin = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;

  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:3000";
  }

  return import.meta.env.PROD ? "https://car-api-x622.onrender.com" : "http://localhost:3000";
};

const API_ORIGIN = resolveApiOrigin().replace(/\/$/, "");
const PLACEHOLDER_IMAGE = "/images/car.webp";
const PAGE_SIZE = 8;
const DELETE_BLOCKING_ORDER_STATUSES = new Set([
  "pending_deposit",
  "pending_payment",
  "deposit_paid",
  "payment_paid",
  "processing",
  "confirmed",
]);

const initialForm = {
  name: "",
  brand: "",
  category: "SUV",
  price: "",
  stock: "0",
  description: "",
  model: "",
  engine: "",
  power: "",
  torque: "",
  gear: "",
  topSpeed: "",
  weight: "",
  length: "",
  width: "",
  height: "",
  powertrainType: "electric",
  fuelConsumptionValue: "",
  batteryCapacityValue: "",
  safetyText: "",
  convenienceText: "",
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const toCleanNumber = (value) => {
  if (value === "" || value === undefined || value === null) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

const normalizeImagePath = (path) => {
  if (!path) return PLACEHOLDER_IMAGE;
  if (path.startsWith("blob:") || path.startsWith("data:") || path.startsWith("http")) return path;
  return path.startsWith("/") ? path : `/${path}`;
};

const getApiImagePath = (path) => {
  if (!path) return PLACEHOLDER_IMAGE;
  if (path.startsWith("blob:") || path.startsWith("data:") || path.startsWith("http")) return path;
  return `${API_ORIGIN}/${path.replace(/^\/+/, "")}`;
};

const getStockState = (stock) => {
  const value = Number(stock) || 0;
  if (value <= 0) return { label: "Hết hàng", className: "out" };
  if (value <= 3) return { label: "Sắp hết", className: "low" };
  return { label: "Còn hàng", className: "in" };
};

const productToForm = (product) => {
  const specs = product?.specifications || {};

  return {
    name: product?.name || "",
    brand: product?.brand || "",
    category: product?.category || "SUV",
    price: product?.price ?? "",
    stock: product?.stock ?? "0",
    description: product?.description || "",
    model: specs.model || product?.name || "",
    engine: specs.engine || "",
    power: specs.power ?? "",
    torque: specs.torque ?? "",
    gear: specs.gear ?? "",
    topSpeed: specs.topSpeed ?? "",
    weight: specs.weight ?? "",
    length: specs.dimensions?.length ?? "",
    width: specs.dimensions?.width ?? "",
    height: specs.dimensions?.height ?? "",
    powertrainType: specs.powertrainType || "electric",
    fuelConsumptionValue: specs.fuelConsumption?.value ?? "",
    batteryCapacityValue: specs.batteryCapacity?.value ?? "",
    safetyText: Array.isArray(product?.safety) ? product.safety.join("\n") : "",
    convenienceText: Array.isArray(product?.convenience) ? product.convenience.join("\n") : "",
  };
};

const splitLines = (value) =>
  String(value || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const getOrderItemProductId = (item) => item?.productId?._id || item?.productId;

const getDeleteBlockedProductIds = (orders) => {
  const ids = new Set();

  (orders || []).forEach((order) => {
    if (!DELETE_BLOCKING_ORDER_STATUSES.has(order?.status)) return;

    (order.items || []).forEach((item) => {
      const productId = getOrderItemProductId(item);
      if (productId) ids.add(String(productId));
    });
  });

  return ids;
};

const ProductImage = ({ src, alt }) => {
  const [currentSrc, setCurrentSrc] = useState(normalizeImagePath(src));
  const [fallbackUsed, setFallbackUsed] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      setCurrentSrc(normalizeImagePath(src));
      setFallbackUsed(false);
    }, 0);

    return () => clearTimeout(id);
  }, [src]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={() => {
        if (!fallbackUsed && src) {
          setFallbackUsed(true);
          setCurrentSrc(getApiImagePath(src));
        } else {
          setCurrentSrc(PLACEHOLDER_IMAGE);
        }
      }}
    />
  );
};

function ProductList({ notifyRef }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState({ thumbnailImage: null, heroImage: null, galleryImages: [] });
  const [previews, setPreviews] = useState({ thumbnailImage: "", heroImage: "", galleryImages: [] });
  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [powertrainFilter, setPowertrainFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteBlockedProductIds, setDeleteBlockedProductIds] = useState(() => new Set());

  const showNotification = (message, type = "info") => {
    notifyRef?.current?.showNotification("System Message", message, type);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [data, ordersResponse] = await Promise.all([
        ProductService.getAllProducts(),
        orderService.getAllOrders().catch((error) => {
          console.error("Failed to load active order locks:", error);
          return null;
        }),
      ]);
      const orders = Array.isArray(ordersResponse)
        ? ordersResponse
        : ordersResponse?.data || [];

      setProducts(Array.isArray(data) ? data : data?.products || []);
      setDeleteBlockedProductIds(getDeleteBlockedProductIds(orders));
    } catch (error) {
      console.error("Lỗi khi tải danh sách xe:", error);
      showNotification("Unable to load the vehicle list. Please check the backend.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const brandOptions = useMemo(
    () => Array.from(new Set(products.map((item) => item.brand).filter(Boolean))).sort(),
    [products]
  );

  const categories = useMemo(
    () => Array.from(new Set(["SUV", "Sedan", "Sport", "Hatchback", "Pickup", ...products.map((item) => item.category).filter(Boolean)])).sort(),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const specs = product.specifications || {};
      const matchesKeyword = !keyword || [
        product.name,
        product.brand,
        product.category,
        specs.model,
        specs.engine,
      ].some((value) => String(value || "").toLowerCase().includes(keyword));

      const matchesBrand = brandFilter === "all" || product.brand === brandFilter;
      const matchesPowertrain = powertrainFilter === "all" || specs.powertrainType === powertrainFilter;
      const stockValue = Number(product.stock) || 0;
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in" && stockValue > 3) ||
        (stockFilter === "low" && stockValue > 0 && stockValue <= 3) ||
        (stockFilter === "out" && stockValue <= 0);

      return matchesKeyword && matchesBrand && matchesPowertrain && matchesStock;
    });
  }, [products, searchTerm, brandFilter, powertrainFilter, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleProducts = filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, brandFilter, powertrainFilter, stockFilter]);

  const stats = useMemo(() => {
    const totalStock = products.reduce((sum, item) => sum + (Number(item.stock) || 0), 0);
    const outOfStock = products.filter((item) => (Number(item.stock) || 0) <= 0).length;
    const electricCount = products.filter((item) => item.specifications?.powertrainType === "electric").length;
    const totalValue = products.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

    return {
      total: products.length,
      totalStock,
      outOfStock,
      electricCount,
      averagePrice: products.length ? totalValue / products.length : 0,
    };
  }, [products]);

  const openCreateModal = () => {
    setSelectedProduct(null);
    setForm(initialForm);
    setFiles({ thumbnailImage: null, heroImage: null, galleryImages: [] });
    setPreviews({ thumbnailImage: "", heroImage: "", galleryImages: [] });
    setModalMode("create");
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setForm(productToForm(product));
    setFiles({ thumbnailImage: null, heroImage: null, galleryImages: [] });
    setPreviews({
      thumbnailImage: normalizeImagePath(product.thumbnailImage),
      heroImage: normalizeImagePath(product.heroImage),
      galleryImages: Array.isArray(product.galleryImages) ? product.galleryImages.map(normalizeImagePath) : [],
    });
    setModalMode("edit");
  };

  const closeModal = () => {
    if (saving) return;
    setModalMode(null);
    setSelectedProduct(null);
  };

  const updateField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "name" && !prev.model) next.model = value;
      if (field === "powertrainType") {
        next.fuelConsumptionValue = prev.fuelConsumptionValue;
        if (value === "gasoline") next.batteryCapacityValue = "";
      }
      return next;
    });
  };

  const handleFileChange = (field, event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (field === "galleryImages") {
      setFiles((prev) => ({ ...prev, galleryImages: selectedFiles }));
      setPreviews((prev) => ({ ...prev, galleryImages: selectedFiles.map((file) => URL.createObjectURL(file)) }));
      return;
    }

    const file = selectedFiles[0] || null;
    setFiles((prev) => ({ ...prev, [field]: file }));
    setPreviews((prev) => ({ ...prev, [field]: file ? URL.createObjectURL(file) : "" }));
  };

  const buildProductFormData = () => {
    const specs = {
      model: form.model || form.name,
      engine: form.engine,
      power: toCleanNumber(form.power),
      torque: toCleanNumber(form.torque),
      gear: toCleanNumber(form.gear),
      topSpeed: toCleanNumber(form.topSpeed),
      weight: toCleanNumber(form.weight),
      dimensions: {
        length: toCleanNumber(form.length),
        width: toCleanNumber(form.width),
        height: toCleanNumber(form.height),
      },
      powertrainType: form.powertrainType,
      fuelConsumption: {
        value: toCleanNumber(form.fuelConsumptionValue) ?? 0,
        unit: form.powertrainType === "electric" ? "kWh/100km" : "L/100km",
      },
    };

    if (form.powertrainType === "electric") {
      specs.batteryCapacity = {
        value: toCleanNumber(form.batteryCapacityValue) ?? 0,
        unit: "kWh",
      };
    }

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("brand", form.brand.trim());
    formData.append("category", form.category.trim());
    formData.append("price", form.price);
    formData.append("stock", form.stock);
    formData.append("description", form.description || "");
    formData.append("specifications", JSON.stringify(specs));
    formData.append("safety", JSON.stringify(splitLines(form.safetyText)));
    formData.append("convenience", JSON.stringify(splitLines(form.convenienceText)));

    if (files.thumbnailImage) formData.append("thumbnailImage", files.thumbnailImage);
    if (files.heroImage) formData.append("heroImage", files.heroImage);
    files.galleryImages.forEach((file) => formData.append("galleryImages", file));

    return formData;
  };

  const validateForm = () => {
    if (!form.name.trim() || !form.brand.trim() || !form.category.trim()) {
      showNotification("Please enter the vehicle name, brand, and category.", "error");
      return false;
    }

    if (form.price === "" || Number(form.price) < 0 || form.stock === "" || Number(form.stock) < 0) {
      showNotification("Price and stock must be non-negative numbers.", "error");
      return false;
    }

    if (!form.model.trim() || !form.engine.trim()) {
      showNotification("Please enter the model and engine in the technical specifications.", "error");
      return false;
    }

    if (!form.fuelConsumptionValue) {
      showNotification("Please enter the fuel or energy consumption value.", "error");
      return false;
    }

    if (form.powertrainType === "electric" && !form.batteryCapacityValue) {
      showNotification("Electric vehicles require a battery capacity.", "error");
      return false;
    }

    if (modalMode === "create" && (!files.thumbnailImage || !files.heroImage)) {
      showNotification("New vehicles require both thumbnail and hero images.", "error");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      const formData = buildProductFormData();

      if (modalMode === "create") {
        await ProductService.createProduct(formData);
        showNotification("Vehicle created successfully.", "success");
      } else {
        await ProductService.updateProduct(selectedProduct._id, formData);
        showNotification("Vehicle updated successfully.", "success");
      }

      setModalMode(null);
      setSelectedProduct(null);
      await fetchProducts();
    } catch (error) {
      console.error("Lỗi khi lưu xe:", error);
      showNotification("Unable to save vehicle information. Please check the form data.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (deleteBlockedProductIds.has(String(product._id))) {
      showNotification("This vehicle has active deposit or payment orders and cannot be deleted.", "error");
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa xe "${product.name}"?`)) return;

    try {
      setDeletingId(product._id);
      await ProductService.deleteProduct(product._id);
      setProducts((prev) => prev.filter((item) => item._id !== product._id));
      showNotification("Vehicle deleted successfully.", "success");
    } catch (error) {
      console.error("Lỗi khi xóa xe:", error);
      showNotification(
        error?.response?.data?.message || "Unable to delete this vehicle.",
        "error"
      );
    } finally {
      setDeletingId("");
    }
  };

  return (
    <main className="product-admin-page">
      <header className="product-admin-header">
        <div>
          <p className="product-admin-eyebrow">Kho xe showroom</p>
          <h1>Quản lý sản phẩm</h1>
          <p>Theo dõi danh mục xe, tồn kho, thông số kỹ thuật và thao tác CRUD.</p>
        </div>
        <div className="product-admin-actions">
          <button type="button" className="secondary-btn" onClick={fetchProducts} disabled={loading}>
            <RefreshCw size={17} className={loading ? "spin-icon" : ""} />
            Làm mới
          </button>
          <button type="button" className="primary-btn" onClick={openCreateModal}>
            <Plus size={18} />
            Tạo xe mới
          </button>
        </div>
      </header>

      <section className="product-stat-grid">
        <StatCard icon={<Car size={22} />} label="Tổng mẫu xe" value={stats.total} note="Đang quản lý" tone="blue" />
        <StatCard icon={<Package size={22} />} label="Tổng tồn kho" value={stats.totalStock} note="Xe còn trong hệ thống" tone="green" />
        <StatCard icon={<Battery size={22} />} label="Xe điện" value={stats.electricCount} note="Theo powertrain" tone="violet" />
        <StatCard icon={<Gauge size={22} />} label="Giá trung bình" value={formatCurrency(stats.averagePrice)} note={`${stats.outOfStock} xe hết hàng`} tone="amber" />
      </section>

      <section className="product-toolbar">
        <div className="product-search">
          <Search size={18} />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo tên xe, hãng, động cơ..."
          />
        </div>

        <div className="product-filters">
          <div className="filter-label">
            <SlidersHorizontal size={16} />
            Bộ lọc
          </div>
          <select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}>
            <option value="all">Tất cả hãng</option>
            {brandOptions.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
          <select value={powertrainFilter} onChange={(event) => setPowertrainFilter(event.target.value)}>
            <option value="all">Tất cả hệ truyền động</option>
            <option value="electric">Xe điện</option>
            <option value="gasoline">Xe xăng</option>
          </select>
          <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}>
            <option value="all">Tất cả tồn kho</option>
            <option value="in">Còn hàng</option>
            <option value="low">Sắp hết</option>
            <option value="out">Hết hàng</option>
          </select>
        </div>
      </section>

      <section className="product-table-panel">
        <div className="product-table-header">
          <div>
            <h2>Danh sách xe</h2>
            <p>{filteredProducts.length} xe phù hợp bộ lọc</p>
          </div>
          <div className="table-page-info">
            Trang {safePage}/{totalPages}
          </div>
        </div>

        <div className="product-table-wrap">
          <table className="product-admin-table">
            <thead>
              <tr>
                <th>Xe</th>
                <th>Phân loại</th>
                <th>Thông số chính</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Đánh giá</th>
                <th>Cập nhật</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="table-empty">
                    <LoaderCircle className="spin-icon" size={22} />
                    Đang tải danh sách xe...
                  </td>
                </tr>
              ) : visibleProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="table-empty">Không có xe phù hợp bộ lọc.</td>
                </tr>
              ) : (
                visibleProducts.map((product) => {
                  const specs = product.specifications || {};
                  const stockState = getStockState(product.stock);
                  const isDeleteBlocked = deleteBlockedProductIds.has(String(product._id));

                  return (
                    <tr key={product._id}>
                      <td>
                        <div className="product-cell">
                          <div className="product-thumb">
                            <ProductImage src={product.thumbnailImage} alt={product.name} />
                          </div>
                          <div>
                            <strong>{product.name}</strong>
                            <span>{specs.model || product.brand}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="stacked-cell">
                          <strong>{product.brand}</strong>
                          <span>{product.category}</span>
                        </div>
                      </td>
                      <td>
                        <div className="spec-mini-list">
                          <span><Fuel size={14} /> {specs.powertrainType === "electric" ? "Electric" : "Gasoline"}</span>
                          <span><Gauge size={14} /> {specs.power || 0} HP</span>
                        </div>
                      </td>
                      <td className="price-cell">{formatCurrency(product.price)}</td>
                      <td>
                        <span className={`stock-pill ${stockState.className}`}>
                          {stockState.label} · {product.stock || 0}
                        </span>
                      </td>
                      <td>
                        <div className="rating-cell">
                          <Star size={14} />
                          {(product.averageRating || 0).toFixed(1)}
                          <span>({product.reviewCount || 0})</span>
                        </div>
                      </td>
                      <td>{new Date(product.updatedAt || product.createdAt).toLocaleDateString("vi-VN")}</td>
                      <td>
                        <div className="row-actions">
                          <button type="button" className="icon-btn edit" onClick={() => openEditModal(product)} title="Chỉnh sửa xe">
                            <Pencil size={17} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn delete"
                            onClick={() => handleDelete(product)}
                            disabled={deletingId === product._id || isDeleteBlocked}
                            title={
                              isDeleteBlocked
                                ? "This vehicle has active deposit or payment orders"
                                : "Xóa xe"
                            }
                          >
                            {deletingId === product._id ? <LoaderCircle size={17} className="spin-icon" /> : <Trash2 size={17} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="product-pagination">
          <button type="button" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
            Trước
          </button>
          <span>{safePage} / {totalPages}</span>
          <button type="button" disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
            Sau
          </button>
        </div>
      </section>

      {modalMode && (
        <div className="product-modal-backdrop" role="dialog" aria-modal="true">
          <form className="product-modal" onSubmit={handleSubmit}>
            <div className="modal-header">
              <div>
                <p>{modalMode === "create" ? "Tạo mới" : "Chỉnh sửa"}</p>
                <h2>{modalMode === "create" ? "Thêm xe vào kho" : selectedProduct?.name}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={closeModal} aria-label="Đóng">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <section className="form-section">
                <h3>Thông tin cơ bản</h3>
                <div className="form-grid">
                  <Field label="Tên xe" value={form.name} onChange={(value) => updateField("name", value)} required />
                  <Field label="Hãng xe" value={form.brand} onChange={(value) => updateField("brand", value)} required list="brand-options" />
                  <label className="form-field">
                    <span>Phân khúc</span>
                    <select value={form.category} onChange={(event) => updateField("category", event.target.value)}>
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                  <Field label="Giá bán (USD)" type="number" value={form.price} onChange={(value) => updateField("price", value)} required />
                  <Field label="Tồn kho" type="number" value={form.stock} onChange={(value) => updateField("stock", value)} required />
                  <label className="form-field full">
                    <span>Mô tả</span>
                    <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={3} />
                  </label>
                </div>
              </section>

              <section className="form-section">
                <h3>Thông số kỹ thuật</h3>
                <div className="form-grid">
                  <Field label="Model" value={form.model} onChange={(value) => updateField("model", value)} required />
                  <Field label="Động cơ" value={form.engine} onChange={(value) => updateField("engine", value)} required />
                  <label className="form-field">
                    <span>Hệ truyền động</span>
                    <select value={form.powertrainType} onChange={(event) => updateField("powertrainType", event.target.value)}>
                      <option value="electric">Electric</option>
                      <option value="gasoline">Gasoline</option>
                    </select>
                  </label>
                  <Field label="Công suất (HP)" type="number" value={form.power} onChange={(value) => updateField("power", value)} />
                  <Field label="Mô-men xoắn" type="number" value={form.torque} onChange={(value) => updateField("torque", value)} />
                  <Field label="Số cấp số" type="number" value={form.gear} onChange={(value) => updateField("gear", value)} />
                  <Field label="Tốc độ tối đa" type="number" value={form.topSpeed} onChange={(value) => updateField("topSpeed", value)} />
                  <Field label="Trọng lượng" type="number" value={form.weight} onChange={(value) => updateField("weight", value)} />
                  <Field label="Dài (mm)" type="number" value={form.length} onChange={(value) => updateField("length", value)} />
                  <Field label="Rộng (mm)" type="number" value={form.width} onChange={(value) => updateField("width", value)} />
                  <Field label="Cao (mm)" type="number" value={form.height} onChange={(value) => updateField("height", value)} />
                  <Field
                    label={form.powertrainType === "electric" ? "Tiêu thụ điện (kWh/100km)" : "Tiêu thụ xăng (L/100km)"}
                    type="number"
                    value={form.fuelConsumptionValue}
                    onChange={(value) => updateField("fuelConsumptionValue", value)}
                    required
                  />
                  {form.powertrainType === "electric" && (
                    <Field label="Dung lượng pin (kWh)" type="number" value={form.batteryCapacityValue} onChange={(value) => updateField("batteryCapacityValue", value)} required />
                  )}
                </div>
              </section>

              <section className="form-section">
                <h3>Trang bị</h3>
                <div className="form-grid">
                  <label className="form-field full">
                    <span>An toàn (mỗi dòng một mục)</span>
                    <textarea value={form.safetyText} onChange={(event) => updateField("safetyText", event.target.value)} rows={4} />
                  </label>
                  <label className="form-field full">
                    <span>Tiện nghi (mỗi dòng một mục)</span>
                    <textarea value={form.convenienceText} onChange={(event) => updateField("convenienceText", event.target.value)} rows={4} />
                  </label>
                </div>
              </section>

              <section className="form-section">
                <h3>Hình ảnh</h3>
                <div className="image-upload-grid">
                  <ImageInput
                    label="Ảnh thumbnail"
                    required={modalMode === "create"}
                    preview={previews.thumbnailImage}
                    onChange={(event) => handleFileChange("thumbnailImage", event)}
                  />
                  <ImageInput
                    label="Ảnh hero"
                    required={modalMode === "create"}
                    preview={previews.heroImage}
                    onChange={(event) => handleFileChange("heroImage", event)}
                  />
                  <label className="gallery-input">
                    <span>Gallery (tối đa 10 ảnh)</span>
                    <input type="file" accept="image/*" multiple onChange={(event) => handleFileChange("galleryImages", event)} />
                    <div className="gallery-preview-row">
                      {(previews.galleryImages || []).slice(0, 5).map((src, index) => (
                        <ProductImage key={`${src}-${index}`} src={src} alt={`Gallery ${index + 1}`} />
                      ))}
                      {previews.galleryImages?.length > 5 && <span>+{previews.galleryImages.length - 5}</span>}
                    </div>
                  </label>
                </div>
              </section>
            </div>

            <div className="modal-footer">
              <button type="button" className="secondary-btn" onClick={closeModal}>Hủy</button>
              <button type="submit" className="primary-btn" disabled={saving}>
                {saving ? <LoaderCircle size={18} className="spin-icon" /> : <Save size={18} />}
                {modalMode === "create" ? "Tạo xe" : "Lưu thay đổi"}
              </button>
            </div>
          </form>
          <datalist id="brand-options">
            {brandOptions.map((brand) => (
              <option key={brand} value={brand} />
            ))}
          </datalist>
        </div>
      )}
    </main>
  );
}

const StatCard = ({ icon, label, value, note, tone }) => (
  <article className={`product-stat-card tone-${tone}`}>
    <div className="stat-icon">{icon}</div>
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  </article>
);

const Field = ({ label, value, onChange, type = "text", required = false, list }) => (
  <label className="form-field">
    <span>{label}{required ? " *" : ""}</span>
    <input
      type={type}
      value={value}
      list={list}
      min={type === "number" ? "0" : undefined}
      step={type === "number" ? "any" : undefined}
      onChange={(event) => onChange(event.target.value)}
      required={required}
    />
  </label>
);

const ImageInput = ({ label, preview, onChange, required }) => (
  <label className="image-input">
    <span>{label}{required ? " *" : ""}</span>
    <input type="file" accept="image/*" onChange={onChange} />
    <div className="image-preview">
      {preview ? <ProductImage src={preview} alt={label} /> : <Image size={26} />}
    </div>
  </label>
);

export default ProductList;
