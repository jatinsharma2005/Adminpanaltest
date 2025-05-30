// models/Employee.js

const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    mobile: String,
    designation: String,
    gender: String,
    course: [String],
    image: String,
  },
  { timestamps: true } // adds createdAt and updatedAt
);

module.exports = mongoose.model("Employee", employeeSchema);
