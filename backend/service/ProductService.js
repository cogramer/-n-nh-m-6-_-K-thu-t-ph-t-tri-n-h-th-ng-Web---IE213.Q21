import Product from "../models/ProductModel.js";
import Order from "../models/OrderModel.js";

const PRODUCT_DELETE_BLOCKING_ORDER_STATUSES = [
  "pending_deposit",
  "pending_payment",
  "deposit_paid",
  "payment_paid",
  "processing",
  "confirmed",
];

/*
  =========================
  HELPER FUNCTIONS
  =========================
*/

const parseJSON = (field, name) => {
  try {
    return typeof field === "string" ? JSON.parse(field) : field;
  } catch {
    throw new Error(`${name} JSON không hợp lệ`);
  }
};

const toNumber = (value, fieldName) => {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`${fieldName} phải là số`);
  }
  return num;
};

const normalizeImagePath = (filePath) => {
  return filePath
    .split("public")[1]
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
};

const validateSpecifications = (specs) => {
  if (!specs || typeof specs !== "object") {
    throw new Error("Specifications không hợp lệ");
  }

  if (!specs.model || !specs.engine) {
    throw new Error("Specifications thiếu model hoặc engine");
  }

  if (!specs.powertrainType) {
    throw new Error("Specifications thiếu powertrainType");
  }

  if (!["gasoline", "electric"].includes(specs.powertrainType)) {
    throw new Error('powertrainType chỉ được là "gasoline" hoặc "electric"');
  }

  if (!specs.fuelConsumption || typeof specs.fuelConsumption !== "object") {
    throw new Error("Specifications thiếu fuelConsumption");
  }

  if (
    specs.fuelConsumption.value === undefined ||
    specs.fuelConsumption.value === null ||
    isNaN(Number(specs.fuelConsumption.value))
  ) {
    throw new Error("fuelConsumption.value phải là số");
  }

  specs.fuelConsumption.value = Number(specs.fuelConsumption.value);

  if (specs.power !== undefined) {
    specs.power = toNumber(specs.power, "Specifications.power");
  }

  if (specs.torque !== undefined) {
    specs.torque = toNumber(specs.torque, "Specifications.torque");
  }

  if (specs.gear !== undefined) {
    specs.gear = toNumber(specs.gear, "Specifications.gear");
  }

  if (specs.topSpeed !== undefined) {
    specs.topSpeed = toNumber(specs.topSpeed, "Specifications.topSpeed");
  }

  if (specs.weight !== undefined) {
    specs.weight = toNumber(specs.weight, "Specifications.weight");
  }

  if (specs.dimensions) {
    if (specs.dimensions.length !== undefined) {
      specs.dimensions.length = toNumber(
        specs.dimensions.length,
        "Specifications.dimensions.length"
      );
    }

    if (specs.dimensions.width !== undefined) {
      specs.dimensions.width = toNumber(
        specs.dimensions.width,
        "Specifications.dimensions.width"
      );
    }

    if (specs.dimensions.height !== undefined) {
      specs.dimensions.height = toNumber(
        specs.dimensions.height,
        "Specifications.dimensions.height"
      );
    }
  }

  if (specs.powertrainType === "gasoline") {
    if (specs.fuelConsumption.unit !== "L/100km") {
      throw new Error('Xe xăng phải có fuelConsumption.unit là "L/100km"');
    }

    if (
      specs.batteryCapacity !== undefined &&
      specs.batteryCapacity !== null &&
      (
        typeof specs.batteryCapacity !== "object" ||
        specs.batteryCapacity.value !== undefined ||
        specs.batteryCapacity.unit !== undefined
      )
    ) {
      throw new Error("Xe xăng không được có batteryCapacity");
    }

    delete specs.batteryCapacity;
  }

  if (specs.powertrainType === "electric") {
    if (specs.fuelConsumption.unit !== "kWh/100km") {
      throw new Error('Xe điện phải có fuelConsumption.unit là "kWh/100km"');
    }

    if (!specs.batteryCapacity || typeof specs.batteryCapacity !== "object") {
      throw new Error("Xe điện bắt buộc phải có batteryCapacity");
    }

    if (
      specs.batteryCapacity.value === undefined ||
      specs.batteryCapacity.value === null ||
      isNaN(Number(specs.batteryCapacity.value))
    ) {
      throw new Error("batteryCapacity.value phải là số");
    }

    specs.batteryCapacity.value = Number(specs.batteryCapacity.value);

    if (
      !specs.batteryCapacity.unit ||
      specs.batteryCapacity.unit !== "kWh"
    ) {
      specs.batteryCapacity.unit = "kWh";
    }
  }

  return specs;
};

/*
  =========================
  GET ALL PRODUCTS
  =========================
*/
export const getAllProductsService = async () => {
  return await Product.find().sort({ createdAt: -1 });
};

/*
  =========================
  GET PRODUCT BY ID
  =========================
*/
export const getProductByIdService = async (id) => {
  const product = await Product.findById(id);
  if (!product) {
    throw new Error("NOT_FOUND");
  }
  return product;
};

/*
  =========================
  CREATE PRODUCT
  =========================
*/
export const createProductService = async ({ body, files }) => {
  let {
    name,
    brand,
    price,
    category,
    stock,
    description,
    specifications,
    safety,
    convenience,
  } = body;

  if (!name || !brand || price === undefined || !category || stock === undefined) {
    throw new Error("Vui lòng điền đầy đủ thông tin sản phẩm");
  }

  price = toNumber(price, "Price");
  stock = toNumber(stock, "Stock");

  const parsedSpecs = validateSpecifications(
    parseJSON(specifications, "Specifications")
  );

  const parsedSafety = safety ? parseJSON(safety, "Safety") : [];
  const parsedConvenience = convenience
    ? parseJSON(convenience, "Convenience")
    : [];

  if (!files?.thumbnailImage?.[0] || !files?.heroImage?.[0]) {
    throw new Error("Thiếu hình ảnh bắt buộc");
  }

  const thumbnailImage = normalizeImagePath(files.thumbnailImage[0].path);
  const heroImage = normalizeImagePath(files.heroImage[0].path);

  const galleryImages = files?.galleryImages
    ? files.galleryImages.map((file) => normalizeImagePath(file.path))
    : [];

  const product = new Product({
    name,
    brand,
    price,
    category,
    stock,
    description,
    thumbnailImage,
    heroImage,
    galleryImages,
    specifications: parsedSpecs,
    safety: parsedSafety,
    convenience: parsedConvenience,
  });

  return await product.save();
};

/*
  =========================
  UPDATE PRODUCT
  =========================
*/
export const updateProductService = async (id, { body, files }) => {
  const product = await Product.findById(id);

  if (!product) {
    throw new Error("NOT_FOUND");
  }

  const { specifications, safety, convenience, ...rest } = body;

  if (rest.price !== undefined) {
    rest.price = toNumber(rest.price, "Price");
  }

  if (rest.stock !== undefined) {
    rest.stock = toNumber(rest.stock, "Stock");
  }

  Object.assign(product, rest);

  if (specifications !== undefined) {
    const parsedSpecs = validateSpecifications(
      parseJSON(specifications, "Specifications")
    );

    product.specifications = parsedSpecs;
    product.markModified("specifications");
  }

  if (safety !== undefined) {
    product.safety = parseJSON(safety, "Safety");
  }

  if (convenience !== undefined) {
    product.convenience = parseJSON(convenience, "Convenience");
  }

  if (files?.thumbnailImage?.[0]) {
    product.thumbnailImage = normalizeImagePath(files.thumbnailImage[0].path);
  }

  if (files?.heroImage?.[0]) {
    product.heroImage = normalizeImagePath(files.heroImage[0].path);
  }

  if (files?.galleryImages) {
    product.galleryImages = files.galleryImages.map((file) =>
      normalizeImagePath(file.path)
    );
  }

  return await product.save();
};

/*
  =========================
  DELETE PRODUCT
  =========================
*/
export const deleteProductService = async (id) => {
  const product = await Product.findById(id);

  if (!product) {
    throw new Error("NOT_FOUND");
  }

  const activeOrder = await Order.findOne({
    "items.productId": id,
    status: { $in: PRODUCT_DELETE_BLOCKING_ORDER_STATUSES },
  })
    .select("_id status blockchainOrderId")
    .lean();

  if (activeOrder) {
    const error = new Error(
      "This vehicle cannot be deleted because it has active deposit or payment orders."
    );
    error.code = "PRODUCT_HAS_ACTIVE_ORDERS";
    error.details = {
      orderId: activeOrder._id,
      status: activeOrder.status,
      blockchainOrderId: activeOrder.blockchainOrderId,
    };
    throw error;
  }

  return await Product.findByIdAndDelete(id);
};

/*
  =========================
  FILTER PRODUCTS
  =========================
*/
export const filterProductsService = async (queryParams) => {
  const {
    brand,
    category,
    minPrice,
    maxPrice,
    minPower,
    maxPower,
    minGear,
    maxGear,
    powertrainType,
    safety,
    page = 1,
    limit = 10,
  } = queryParams;

  const filter = {};

  if (brand) {
    filter.brand = { $regex: brand, $options: "i" };
  }

  if (category) {
    filter.category = { $regex: category, $options: "i" };
  }

  if (powertrainType) {
    filter["specifications.powertrainType"] = powertrainType;
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (minPower || maxPower) {
    filter["specifications.power"] = {};
    if (minPower) filter["specifications.power"].$gte = Number(minPower);
    if (maxPower) filter["specifications.power"].$lte = Number(maxPower);
  }

  if (minGear || maxGear) {
    filter["specifications.gear"] = {};
    if (minGear) filter["specifications.gear"].$gte = Number(minGear);
    if (maxGear) filter["specifications.gear"].$lte = Number(maxGear);
  }

  if (safety) {
    filter.safety = {
      $in: Array.isArray(safety) ? safety : [safety],
    };
  }

  const currentPage = Number(page) || 1;
  const perPage = Number(limit) || 10;
  const skip = (currentPage - 1) * perPage;

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(perPage),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      total,
      page: currentPage,
      limit: perPage,
      totalPages: Math.ceil(total / perPage),
    },
  };
};
