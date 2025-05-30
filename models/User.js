const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  f_Sno: { type: Number, required: true, unique: true },
  f_username: { type: String, required: true, unique: true },
  f_passward: { type: String, required: true },
});

module.exports = mongoose.model("Login", UserSchema);
