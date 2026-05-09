import { API_URL } from "../services/apiConfig";

const API_ORIGIN = API_URL.replace(/\/api\/?$/i, "").replace(/\/+$/, "");
const PLACEHOLDER_IMAGE_PATH = "images/car.webp";
const VINFAST_VF8_HERO_IMAGE_PATH =
  "images/vinfast/vinfast-vf8/hero/vf8-hero.webp";

export const PLACEHOLDER_IMAGE_URL = `${API_ORIGIN}/${PLACEHOLDER_IMAGE_PATH}`;

export const normalizeImagePath = (src) => {
  if (!src) return "";

  const rawValue = String(src).trim();

  if (/^(https?:|data:|blob:)/i.test(rawValue)) return rawValue;

  let normalized = rawValue.replace(/\\/g, "/");
  const publicIndex = normalized.toLowerCase().lastIndexOf("/public/");

  // Uploaded image paths may contain an absolute server path; keep only the public-relative part.
  if (publicIndex >= 0) {
    normalized = normalized.slice(publicIndex + "/public/".length);
  }

  return normalized.replace(/^\/+/, "").replace(/^public\//i, "");
};

export const resolveImageUrl = (src, fallback = PLACEHOLDER_IMAGE_URL) => {
  const normalized = normalizeImagePath(src);

  if (!normalized) return fallback;
  if (/^(https?:|data:|blob:)/i.test(normalized)) return normalized;

  return `${API_ORIGIN}/${normalized}`;
};

export const getProductHeroImagePath = (product) => {
  if (!product) return "";

  const productIdentity = [
    product.name,
    product.brand,
    product.specifications?.model,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // The VF8 hero must use the front-facing hero asset, even if API data was edited incorrectly.
  if (productIdentity.includes("vinfast") && productIdentity.includes("vf8")) {
    return VINFAST_VF8_HERO_IMAGE_PATH;
  }

  const firstGalleryImage = Array.isArray(product.galleryImages)
    ? product.galleryImages[0]
    : "";

  return product.heroImage || product.thumbnailImage || firstGalleryImage || "";
};
