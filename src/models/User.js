// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  image: { type: String },
  googleId: { type: String },
  resetToken: { type: String },
  resetTokenExpire: { type: Date },
  bio: { type: String },
  dateOfBirth: { type: Date },
  location: { type: String },
  website: { type: String },
  twitter: { type: String },
  github: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
