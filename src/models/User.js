// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // ✅ not required now
  image: { type: String },
  googleId: { type: String },
  resetToken: { type: String },
  resetTokenExpire: { type: Date },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
