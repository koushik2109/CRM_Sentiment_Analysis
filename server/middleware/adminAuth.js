import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

/**
 * Middleware to check if user is an admin
 * Must be used after userAuth middleware
 */
const adminAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not Authorized. Login Again" });
    }

    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

    if (!tokenDecode.id) {
      return res
        .status(401)
        .json({ success: false, message: "Not Authorized. Login Again" });
    }

    // Get user and check role
    const user = await userModel.findById(tokenDecode.id).lean();

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Access denied. Admin only." });
    }

    req.userId = tokenDecode.id;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message });
  }
};

export default adminAuth;
