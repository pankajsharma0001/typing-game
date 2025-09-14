import mongoose from "mongoose";
import Sentence from "../../models/Sentence";
import clientPromise from "../../lib/mongodb"; // optional but keeps cluster alive

async function connectMongo() {
  await clientPromise; // ensures underlying connection
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

export default async function handler(req, res) {
  try {
    await connectMongo();

    if (req.method === "GET") {
      const { difficulty } = req.query;
      const filter = difficulty ? { difficulty } : {};
      const sentences = await Sentence.find(filter);
      return res.status(200).json(sentences);
    }

    if (req.method === "POST") {
      const { text, difficulty } = req.body;
      if (!text || !difficulty) {
        return res.status(400).json({ error: "Text and difficulty are required" });
      }
      const newSentence = new Sentence({ text, difficulty });
      await newSentence.save();
      return res.status(201).json(newSentence);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error("Sentence API error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
