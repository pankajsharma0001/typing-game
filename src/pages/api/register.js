import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../../models/User";

async function connectMongo() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ message: "All fields are required" });

  try {
    await connectMongo(); // ✅ this will work

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({
        message: existingUser.username === username ? "Username already exists" : "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, email, password: hashedPassword });

    return res.status(201).json({
      message: "User created successfully",
      user: { id: newUser._id, username: newUser.username, email: newUser.email },
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
