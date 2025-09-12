import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  // Add these for password reset
  resetToken: { type: String },
  resetTokenExpire: { type: Date },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
