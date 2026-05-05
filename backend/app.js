import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import passport from "./config/passport.js";
import connectDB from "./config/db.js";
import { getRequiredSecret } from "./config/secrets.js";

// Import Routes
import ProductRoutes from "./routes/Product.js";
import UserRoutes from "./routes/AuthRoute.js";
import AccountRoutes from "./routes/AccountRoute.js";
import ReviewRoutes from "./routes/ReviewRoute.js";
import ContactRoutes from "./routes/ContactRoute.js";
import CartRoutes from "./routes/CartRoute.js";
import OrderRoutes from "./routes/OrderRoutes.js";
import DashboardRoutes from "./routes/DashboardRoute.js";
import WalletRoutes from "./routes/WalletRoute.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
getRequiredSecret("JWT_SECRET");
getRequiredSecret("JWT_REFRESH_SECRET");
const sessionSecret = getRequiredSecret("SESSION_SECRET");

// Connect to the database
connectDB();

const deployedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  process.env.CORS_ORIGIN,
]
  .filter(Boolean)
  .flatMap((value) => value.split(","))
  .map((value) => value.trim().replace(/\/$/, ""))
  .filter(Boolean);

const isPrivateNetworkHost = (hostname) =>
  /^10\./.test(hostname) ||
  /^192\.168\./.test(hostname) ||
  /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);

const isAllowedDevOrigin = (origin) => {
  try {
    const url = new URL(origin);
    const devPorts = new Set(["5173", "5174", "5175", "5176", "4173"]);

    if (!["http:", "https:"].includes(url.protocol)) return false;
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return true;
    }

    return isPrivateNetworkHost(url.hostname) && devPorts.has(url.port);
  } catch {
    return false;
  }
};

// Base middleware
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = new Set([
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://192.168.0.4:5173",
      ]);

      deployedOrigins.forEach((allowedOrigin) => {
        allowedOrigins.add(allowedOrigin);
      });

      const normalizedOrigin = origin?.replace(/\/$/, "");

      if (!origin) return callback(null, true);
      if (
        allowedOrigins.has(normalizedOrigin) ||
        isAllowedDevOrigin(normalizedOrigin)
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static image files
app.use("/images", express.static(path.join(__dirname, "public/images")));

app.get("/", (req, res) => {
  res.json({
    message: "Car API is running",
    endpoints: [
      "/api/products",
      "/api/users",
      "/api/accounts",
      "/api/reviews",
      "/api/contacts",
      "/api/cart",
      "/api/orders",
      "/api/dashboard",
      "/api/wallets",
    ],
  });
});

app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// --- Routes ---
app.use("/api/products", ProductRoutes);
app.use("/api/users", UserRoutes);
app.use("/api/accounts", AccountRoutes);
app.use("/api/reviews", ReviewRoutes);
app.use("/api/contacts", ContactRoutes);
app.use("/api/cart", CartRoutes);
app.use("/api/orders", OrderRoutes);
app.use("/api/dashboard", DashboardRoutes);
app.use("/api/wallets", WalletRoutes);

// Centralized error handling middleware
app.use((err, req, res, next) => {
  res.status(err.status || err.statusCode || 500).json({
    message: err.message || "Lỗi Server nội bộ",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log(`API Server đang chạy tại: http://localhost:${PORT}`)
);
