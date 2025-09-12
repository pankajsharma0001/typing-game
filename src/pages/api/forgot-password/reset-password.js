import bcrypt from "bcryptjs";
import User from "../../../models/User";
import mongoose from "mongoose";
import clientPromise from "../../../lib/mongodb";

async function connectMongo() {
  await clientPromise;
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token, id, password } = req.body;

  if (!token || !id || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    await connectMongo();

    // ✅ Find user with valid token and expiry
    const user = await User.findOne({
      _id: id,
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    // 🔒 Hash new password
    const hashedPassword = bcrypt.hashSync(password, 10);
    user.password = hashedPassword;

    // Clear reset token fields
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;

    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
