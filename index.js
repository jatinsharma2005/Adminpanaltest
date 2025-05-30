const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Route Imports
const authRoutes = require("./routes/auth");
const employeeRoutes = require("./routes/Employee");
const verifyToken = require("./middleware/verifyToken");

const app = express(); // App instance

// Security Middleware
app.use(helmet());

// Rate Limiter Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});
app.use(limiter);

// Core Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000", // Adjust to your frontend URL in production
    credentials: true, // Allow cookies to be sent cross-origin
  })
);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);

// Protected Admin Endpoint
app.get("/api/admin", verifyToken, (req, res) => {
  try {
    res.json({
      msg: `Welcome Admin, user ID: ${req.user.id}`,
      username: req.user.f_username || "Admin",
    });
  } catch (err) {
    console.error("Admin route error:", err);
    res.status(500).json({ msg: "Internal server error" });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
