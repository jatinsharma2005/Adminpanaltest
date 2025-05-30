const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Login = require("../models/User");
const verifyToken = require("../middleware/verifyToken");
const multer = require("multer");
const Employee = require("../models/Employee");

// --------------------------- REGISTER ---------------------------
router.post("/register", async (req, res) => {
  const { f_Sno, f_username, f_passward } = req.body;

  try {
    const existingUser = await Login.findOne({ f_username });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(f_passward, salt);

    const newUser = new Login({
      f_Sno,
      f_username,
      f_passward: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ msg: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// --------------------------- LOGIN ---------------------------
router.post("/login", async (req, res) => {
  const { f_username, f_passward } = req.body;

  try {
    const user = await Login.findOne({ f_username });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(f_passward, user.f_passward);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, f_username: user.f_username },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 2 * 24 * 60 * 60 * 1000,
    });

    res.json({ f_username: user.f_username });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// --------------------------- LOGOUT ---------------------------
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
  });
  res.json({ msg: "Logged out successfully" });
});

// --------------------------- GET CURRENT USER ---------------------------
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await Login.findById(req.user.id).select("f_username");
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json({ f_username: user.f_username });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// --------------------------- MULTER SETUP ---------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Only jpg and png files allowed"));
    }
  },
});

// --------------------------- CREATE EMPLOYEE ---------------------------
router.post(
  "/employee",
  verifyToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, email, mobile, designation, gender, course } = req.body;

      if (!name || !email || !mobile || !designation || !gender || !course) {
        return res.status(400).json({ msg: "All fields are required" });
      }

      const existing = await Employee.findOne({ email });
      if (existing)
        return res.status(400).json({ msg: "Email already exists" });

      const employee = new Employee({
        name,
        email,
        mobile,
        designation,
        gender,
        course: Array.isArray(course) ? course : [course],
        image: req.file ? req.file.filename : null,
      });

      await employee.save();
      res.status(201).json({ msg: "Employee created successfully" });
    } catch (err) {
      res.status(500).json({ msg: "Server error", error: err.message });
    }
  }
);

// Add this after your existing routes in the same router file:

// --------------------------- DELETE EMPLOYEE ---------------------------
router.delete("/employees/:id", verifyToken, async (req, res) => {
  try {
    const empId = req.params.id;
    const employee = await Employee.findById(empId);

    if (!employee) return res.status(404).json({ msg: "Employee not found" });

    await Employee.findByIdAndDelete(empId);

    res.json({ msg: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

router.get("/employees/:id", verifyToken, async (req, res) => {
  try {
    const empId = req.params.id;
    const employee = await Employee.findById(empId);

    if (!employee) return res.status(404).json({ msg: "Employee not found" });

    res.json(employee);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// --------------------------- UPDATE (EDIT) EMPLOYEE ---------------------------
router.put(
  "/employees/:id",
  verifyToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const empId = req.params.id;
      const { name, email, mobile, designation, gender, course } = req.body;

      const employee = await Employee.findById(empId);
      if (!employee) return res.status(404).json({ msg: "Employee not found" });

      // Update fields only if provided
      if (name) employee.name = name;
      if (email) employee.email = email;
      if (mobile) employee.mobile = mobile;
      if (designation) employee.designation = designation;
      if (gender) employee.gender = gender;
      if (course) employee.course = Array.isArray(course) ? course : [course];
      if (req.file) employee.image = req.file.filename;

      await employee.save();

      res.json({ msg: "Employee updated successfully", employee });
    } catch (err) {
      res.status(500).json({ msg: "Server error", error: err.message });
    }
  }
);

// --------------------------- GET EMPLOYEE BY ID ---------------------------
router.get("/employees/:id", verifyToken, async (req, res) => {
  try {
    const empId = req.params.id;
    const employee = await Employee.findById(empId);

    if (!employee) return res.status(404).json({ msg: "Employee not found" });

    res.json(employee);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;
