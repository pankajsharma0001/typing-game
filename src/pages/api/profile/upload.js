import { createRouter } from "next-connect";
import multer from "multer";
import User from "../../../models/User";
import mongoose from "mongoose";
import clientPromise from "../../../lib/mongodb";

const upload = multer({ storage: multer.memoryStorage() });
const router = createRouter();

router.use(async (req, res, next) => {
  try { await next(); } 
  catch (error) { console.error(error); res.status(500).json({ message: error.message }); }
});

router.use(upload.single("file"));

router.post(async (req, res) => {
  await clientPromise;
  if (mongoose.connection.readyState !== 1) await mongoose.connect(process.env.MONGODB_URI);

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: "Missing user ID" });
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  // Store base64 in DB only
  user.image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  await user.save();

  res.status(200).json({ message: "Profile image updated" });
});

router.all((req, res) => res.status(405).json({ message: `Method '${req.method}' not allowed` }));

export const config = { api: { bodyParser: false } };
export default router.handler();
