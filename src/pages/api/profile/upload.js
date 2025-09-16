import { createRouter } from "next-connect";
import multer from "multer";
import User from "../../../models/User";
import mongoose from "mongoose";
import clientPromise from "../../../lib/mongodb";

const upload = multer({ storage: multer.memoryStorage() });

const router = createRouter();

// Error handling middleware
router.use(async (req, res, next) => {
  try {
    await next();
  } catch (error) {
    console.error("API Route Error:", error);
    res.status(500).json({ message: `Upload error: ${error.message}` });
  }
});

// Multer middleware for file upload
router.use(upload.single("file"));

router.post(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await clientPromise;
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ message: "Missing user ID" });

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    // Update user in database
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.image = imageUrl; // Store the new image URL
    await user.save();

    res.status(200).json({ message: "Profile image updated", imageUrl });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed" });
  }
});

// Handle unsupported methods
router.all((req, res) => {
  res.status(405).json({ message: `Method '${req.method}' not allowed` });
});

// Export as default Next.js API route
export const config = { api: { bodyParser: false } };
export default router.handler();
