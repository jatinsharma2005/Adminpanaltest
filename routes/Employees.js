const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const Employee = require("../models/Employee");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "employee-images",
    allowed_formats: ["jpg", "png", "jpeg"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

const upload = multer({ storage });

// Create Employee
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { name, email, mobile, designation, gender, course } = req.body;

    if (!name || !email || !mobile || !designation || !gender || !course) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const existing = await Employee.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const imageUrl = req.file?.path || null;

    if (!imageUrl) {
      return res.status(400).json({ msg: "Image upload failed or missing" });
    }

    const newEmployee = new Employee({
      name,
      email,
      mobile,
      designation,
      gender,
      course: Array.isArray(course) ? course : [course],
      image: imageUrl,
    });

    await newEmployee.save();
    res
      .status(201)
      .json({ msg: "Employee created successfully", employee: newEmployee });
  } catch (err) {
    console.error("Error creating employee:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// Get all Employees
router.get("/", verifyToken, async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ msg: "Error fetching employees" });
  }
});

// Get Employee by ID (needed for Edit page)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const empId = req.params.id;
    const employee = await Employee.findById(empId);

    if (!employee) return res.status(404).json({ msg: "Employee not found" });

    res.json(employee);
  } catch (err) {
    console.error("Error fetching employee by ID:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// Delete Employee by ID
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const empId = req.params.id;
    const employee = await Employee.findById(empId);

    if (!employee) return res.status(404).json({ msg: "Employee not found" });

    await Employee.findByIdAndDelete(empId);

    res.json({ msg: "Employee deleted successfully" });
  } catch (err) {
    console.error("Error deleting employee:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// Update Employee by ID
router.put("/:id", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const empId = req.params.id;
    const { name, email, mobile, designation, gender, course } = req.body;

    const employee = await Employee.findById(empId);
    if (!employee) return res.status(404).json({ msg: "Employee not found" });

    // Update fields if provided
    if (name) employee.name = name;
    if (email) employee.email = email;
    if (mobile) employee.mobile = mobile;
    if (designation) employee.designation = designation;
    if (gender) employee.gender = gender;
    if (course) employee.course = Array.isArray(course) ? course : [course];

    if (req.file?.path) {
      employee.image = req.file.path;
    }

    await employee.save();

    res.json({ msg: "Employee updated successfully", employee });
  } catch (err) {
    console.error("Error updating employee:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;
