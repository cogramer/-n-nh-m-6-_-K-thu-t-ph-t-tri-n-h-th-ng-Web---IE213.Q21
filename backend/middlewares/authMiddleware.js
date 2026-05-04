import jwt from "jsonwebtoken";

const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Bearer <token>

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const secretKey = process.env.JWT_SECRET || "default_secret_key";
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded; // { id, username, isadmin }
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Optional admin authorization middleware
export const requireAdmin = (req, res, next) => {
  if (!req.user?.isadmin) {
    return res.status(403).json({ message: "Admin permission required" });
  }
  next();
};

export default authenticateToken;