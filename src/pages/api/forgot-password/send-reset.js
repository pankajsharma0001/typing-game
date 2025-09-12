import mongoose from "mongoose";
import User from "../../../models/User";
import nodemailer from "nodemailer";
import crypto from "crypto";

async function connectMongo() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { userId } = req.body;

  try {
    await connectMongo();

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Generate a unique token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpire = Date.now() + 1000 * 60 * 30; // 30 minutes

    // 2. Save token & expiry in user document
    user.resetToken = resetToken;
    user.resetTokenExpire = resetTokenExpire;
    await user.save();

    // ✅ Debug logs for env vars (won’t print full password)
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

    // 3. Create a transporter with explicit Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER, // must match .env.local
        pass: process.env.EMAIL_PASS, // App password (16 chars)
      },
    });

    // 4. Email content with better UI
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}&id=${user._id}`;
    const mailOptions = {
      from: `"Typing Game Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "🔑 Reset your Typing Game password",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
          <h2 style="color: #4f46e5;">Hello ${user.username},</h2>
          <p>You requested a password reset for your <b>Typing Game</b> account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" 
             style="display:inline-block; padding: 10px 20px; margin: 10px 0; background-color:#4f46e5; color:white; text-decoration:none; border-radius:6px; font-weight:bold;">
            Reset Password
          </a>
          <p>This link will expire in <b>30 minutes</b>.</p>
          <p>If you didn’t request this, you can safely ignore this email.</p>
          <hr/>
          <p style="font-size:12px; color:gray;">Typing Game Team</p>
        </div>
      `,
    };

    // 5. Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "✅ Reset link sent to your email." });
  } catch (error) {
    console.error("Send reset error:", error);
    res.status(500).json({ message: "Server error" });
  }
}
