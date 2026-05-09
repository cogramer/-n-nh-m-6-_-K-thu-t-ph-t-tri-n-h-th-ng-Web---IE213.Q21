import multer from "multer";
import path from "path";
import fs from "fs";

// Remove accents, spaces, and unsafe characters from folder/file names
const slugify = (text = "") => {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove Vietnamese accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Get the original file extension
const getExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

// Keep the original name after sanitizing it
const sanitizeFileName = (filename) => {
  const ext = getExtension(filename);
  const baseName = path.basename(filename, ext);

  const safeBaseName = baseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeBaseName}${ext}`;
};

// Avoid duplicate file names
const generateUniqueFileName = (dir, filename) => {
  let finalName = filename;
  let count = 1;

  while (fs.existsSync(path.join(dir, finalName))) {
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    finalName = `${base}-${count}${ext}`;
    count++;
  }

  return finalName;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // Note: form-data should send brand and name before files
      const brand = slugify(req.body.brand || "unknown-brand");
      const productName = slugify(req.body.name || "unknown-car");

      let imageType = "others";
      if (file.fieldname === "thumbnailImage") imageType = "thumbnail";
      if (file.fieldname === "heroImage") imageType = "hero";
      if (file.fieldname === "galleryImages") imageType = "gallery";

      const uploadPath = path.join(
        process.cwd(),
        "public",
        "images",
        brand,
        productName,
        imageType
      );

      fs.mkdirSync(uploadPath, { recursive: true });

      // Reuse the generated filename below
      req.uploadInfo = req.uploadInfo || {};
      req.uploadInfo[file.fieldname] = {
        brand,
        productName,
        imageType,
        uploadPath
      };

      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },

  filename: (req, file, cb) => {
    try {
      const info = req.uploadInfo?.[file.fieldname];
      const dir = info?.uploadPath || path.join(process.cwd(), "public", "images");

      const cleanedName = sanitizeFileName(file.originalname);
      const uniqueName = generateUniqueFileName(dir, cleanedName);

      cb(null, uniqueName); // Keep the name close to the original, only sanitize and deduplicate
    } catch (error) {
      cb(error);
    }
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file ảnh (jpg, png, gif, webp)!"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});