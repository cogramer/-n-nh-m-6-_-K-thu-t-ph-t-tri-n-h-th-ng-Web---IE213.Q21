import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProductService from "../../../services/ProductService"; // Import the product service
import "./ProductEdit.css";
function ProductEdit({ notifyRef }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null); // State for product data loaded from the API
  const [loading, setLoading] = useState(true);
  const [activeHeroImage, setActiveHeroImage] = useState("");
  // State for new image upload previews
  const [newFiles, setNewFiles] = useState({});
  const [displayGallery, setDisplayGallery] = useState([]);
  // State for actual files sent to the server
  const [newGalleryFiles, setNewGalleryFiles] = useState([]);

  const showNotification = (message, type = "info") => {
    notifyRef?.current?.showNotification("System Message", message, type);
  };

  // Load product data from the API
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await ProductService.getProductById(id);
        setCar(data);

        // Initialize the gallery here
        if (data?.galleryImages) {
          setDisplayGallery(data.galleryImages);
        }

        setActiveHeroImage(data?.heroImage || data?.thumbnailImage || "");
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);
  // Update local car state from form fields
  const handleUpdateLocal = (field, value) => {
    setCar(prev => ({ ...prev, [field]: value }));
  };
  const handleSaveChanges = async () => {
    try {
      const formData = new FormData();

      // Basic information
      formData.append("name", car.name);
      formData.append("price", car.price);
      formData.append("brand", car.brand || "unknown");
      formData.append("category", car.category || "unknown");
      // Send specifications
      // car.specifications contains the edited specification values
      formData.append("specifications", JSON.stringify(car.specifications || {}));

      // Persist safety and convenience lists when present
      formData.append("safety", JSON.stringify(car.safety || []));
      formData.append("convenience", JSON.stringify(car.convenience || []));
      // Persist stock quantity
      formData.append("stock", car.stock || 0);
      // Handle image uploads
      const existingImages = displayGallery.filter(src => !src.startsWith('blob'));
      formData.append("existingGallery", JSON.stringify(existingImages));
      newGalleryFiles.forEach((file) => {
        formData.append("galleryImages", file);
      });

      await ProductService.updateProduct(id, formData);
      showNotification("Product specifications and images updated successfully.", "success");
    } catch (err) {
      console.error("Lỗi khi lưu:", err);
      showNotification("Something went wrong. Please check the console.", "error");
    }
  };
  // Handle stock quantity changes
  const handleStockChange = (changeAmount) => {
    const currentStock = Number(car?.stock || 0);
    const newStock = currentStock + changeAmount;

    // Prevent negative stock values
    if (newStock < 0) {
      showNotification("Stock quantity cannot be below zero.", "error");
      return;
    }

    setCar(prev => ({ ...prev, stock: newStock }));
  };
  const handleDelete = async () => {
    if (window.confirm("Bạn có chắc muốn xóa xe này?")) {
      try {
        await ProductService.deleteProduct(id);
        showNotification("Vehicle deleted successfully.", "success");
        navigate("/admin/products");
      } catch (error) {
        console.error("Lỗi khi xóa xe:", error);
        showNotification(
          error?.response?.data?.message || "Unable to delete this vehicle.",
          "error"
        );
      }
    }
  };
  const handleRemoveImage = (indexToRemove) => {
    const updatedGallery = displayGallery.filter((_, index) => index !== indexToRemove);
    setDisplayGallery(updatedGallery);

    // Update car state before saving
    setCar(prev => ({ ...prev, galleryImages: updatedGallery }));
  };

  // Add new images to the gallery
  const handleAddImages = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = files.map(file => URL.createObjectURL(file));

    // Show new images in the UI
    // setDisplayGallery(prev => [...prev, ...newPreviews]);
    // Store the actual files for the API request
    // setNewGalleryFiles(prev => [...prev, ...files]);
    setDisplayGallery(prev => [...prev, ...newPreviews]);
    setNewGalleryFiles(prev => [...prev, ...files]);
  };
  const updateList = (listName, index, newValue) => {
    // Update the car state directly
    setCar(prev => {
      // listName is either safety or convenience
      const newList = [...(prev[listName] || [])];
      newList[index] = newValue;
      return { ...prev, [listName]: newList };
    });
  };
  // Map specifications returned by the API
  const specsEntries = car?.specifications
    ? Object.entries(car.specifications).filter(([key]) => key !== "_id")
    : [];

  const safetyList = Array.isArray(car?.safety) ? car.safety : [];
  const convenienceList = Array.isArray(car?.convenience) ? car.convenience : [];

  // Loading screen
  if (loading) {
    return (
      <>
        <main className="car-detail"><div className="car-detail-container"><h1>Loading...</h1></div></main>
      </>
    );
  }

  // Error/not-found screen
  if (!car) {
    return (
      <>
        <main className="car-detail">
          <div className="car-detail-container">
            <h1 className="car-detail-title">Không tìm thấy xe</h1>
            <Link className="car-detail-back" to="/admin/products">Xem danh sách xe</Link>
          </div>
        </main>
      </>
    );
  }

  // Price formatting logic
  const usdPerEth = Number(import.meta.env.VITE_USD_PER_ETH || 2000000);
  const usdPriceText = typeof car.price === "number"
    ? new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(car.price)
    : null;

  const coinPriceText = typeof car.price === "number" && Number.isFinite(usdPerEth) && usdPerEth > 0
    ? `${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    }).format(car.price / usdPerEth)} ETH`
    : null;

  const heroImage = car?.heroImage || car?.thumbnailImage || "";

  return (
    <>
      <main className="car-detail">
        {/* Main action buttons */}
        <div className="admin-controls">
          <button className="btn-save" onClick={handleSaveChanges}>Lưu thay đổi</button>
          <button className="btn-delete" onClick={handleDelete}>Xóa xe này</button>
        </div>
        <div className="car-detail-container">
          <div className="car-detail-top">
            <div className="car-detail-hero">
              <label onDoubleClick={() => document.getElementById('fileHero').click()}>
                <img src={activeHeroImage.startsWith('data') ? activeHeroImage : "/" + activeHeroImage} />
                <input
                  type="file"
                  id="fileHero"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setNewFiles({ ...newFiles, hero: file });
                    setActiveHeroImage(URL.createObjectURL(file)); // Preview the image immediately
                  }}
                />
              </label>
            </div>

            <div className="car-detail-summary">
              <div className="car-detail-breadcrumb">
                <Link to="/admin/products">admin<span> / </span>products</Link>
                <span>/</span>
                <span>{car.name}</span>
              </div>

              <h1 className="car-detail-title">
                <EditableText
                  value={car.name}
                  field="name"
                  onSave={handleUpdateLocal}
                />
              </h1>
              <div className="car-detail-meta" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <EditableText
                  value={car.brand}
                  field="brand"
                  onSave={handleUpdateLocal}
                />
                <span>•</span>
                <EditableText
                  value={car.category}
                  field="category"
                  onSave={handleUpdateLocal}
                />
              </div>
              {/* Start: stock management UI */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '8px', width: 'fit-content' }}>
                <span style={{ fontWeight: '600', color: '#555' }}>Tồn kho:</span>
                <button
                  onClick={() => handleStockChange(-1)}
                  style={{ width: '30px', height: '30px', border: 'none', background: '#ffcdd2', color: '#c62828', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  -
                </button>
                <span style={{ fontSize: '18px', minWidth: '40px', textAlign: 'center', fontWeight: 'bold' }}>
                  {car.stock || 0}
                </span>
                <button
                  onClick={() => handleStockChange(1)}
                  style={{ width: '30px', height: '30px', border: 'none', background: '#c8e6c9', color: '#2e7d32', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  +
                </button>
              </div>
              {/* End: stock management UI */}
              {usdPriceText ? <div className="car-detail-price">
                $<EditableText
                  value={car.price}
                  field="price"
                  onSave={handleUpdateLocal}
                />
              </div> : null}
              {coinPriceText ? (
                <div className="car-detail-price-coin">{coinPriceText}</div>
              ) : null}
            </div>
          </div>
          {displayGallery.length > 0 ? (
            <section className="car-detail-section">
              <h2 className="car-detail-section-title">Gallery</h2>
              <div
                className="car-detail-gallery"
                onMouseLeave={() => setActiveHeroImage(heroImage)}
              >
                {displayGallery.map((src, index) => (
                  <div key={index} className="gallery-item-wrapper">
                    <img
                      src={src.startsWith('blob') || src.startsWith('data') ? src : "/" + src}
                      alt="Gallery"
                      onMouseEnter={() => setActiveHeroImage(src)}
                    />
                    {/* Delete image button */}
                    <button
                      className="delete-img-btn"
                      onClick={() => handleRemoveImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <label className="add-gallery-item">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAddImages}
                  />
                  <div className="add-placeholder">
                    <span>ĐỔI ẢNH</span>
                  </div>
                </label>
              </div>
            </section>
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
                  <div className="car-detail-tech-table">
                    {specsEntries.map(([key, value]) => (
                      <div key={key} className="car-detail-tech-row">
                        <div className="car-detail-tech-key">{key}</div>
                        <div className="car-detail-tech-value">
                          <EditableText
                            value={typeof value === 'object' ? JSON.stringify(value).replace(/[{""}]/g, '') : String(value)}
                            field={key}
                            onSave={(field, newValue) => {
                              setCar(prev => ({
                                ...prev,
                                specifications: {          // Use specifications instead of specs
                                  ...prev.specifications,  // Keep this branch aligned with specifications
                                  [field]: newValue
                                }
                              }));
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="car-detail-tech-side">
                    {safetyList.length > 0 ? (
                      <div className="car-detail-tech-block">
                        <h3 className="car-detail-tech-heading">
                          Safety & Driving Assistance
                        </h3>
                        <ul className="car-detail-tech-bullets">
                          {safetyList.map((item, index) => (
                            <li key={index}>
                              <EditableText
                                value={item}
                                onSave={(field, val) => updateList('safety', index, val)}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {convenienceList.map((item, index) => (
                      <li key={index}>
                        <EditableText
                          value={item}
                          // Call updateList with convenience as listName
                          onSave={(field, val) => updateList('convenience', index, val)}
                        />
                      </li>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </>
  );
}
const EditableText = ({ value, field, onSave, className }) => {
  const [tempValue, setTempValue] = useState(value);
  const [editMode, setEditMode] = useState(false);
  useEffect(() => {
    setTempValue(value);
  }, [value]);
  if (editMode) {
    return (
      <input
        className={`inline-edit-input ${className}`}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={() => {
          setEditMode(false);
          onSave(field, tempValue);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setEditMode(false);
            onSave(field, tempValue);
          }
        }}
        autoFocus
      />
    );
  }

  return (
    <span onDoubleClick={() => setEditMode(true)} className="editable-text">
      {value || "(Trống)"}
    </span>
  );
};
export default ProductEdit;
