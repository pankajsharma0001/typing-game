import clientPromise from "../../lib/mongodb"; // ensures DB connection
import Sentence from "../../models/Sentence";

export default async function handler(req, res) {
  try {
    // Ensure MongoDB connection is ready
    await clientPromise;

    if (req.method === "GET") {
      const { difficulty } = req.query;
      const filter = difficulty ? { difficulty } : {};
      const sentences = await Sentence.find(filter);
      res.status(200).json(sentences);
    } else if (req.method === "POST") {
      const { text, difficulty } = req.body;
      if (!text || !difficulty) {
        return res.status(400).json({ error: "Text and difficulty are required" });
      }
      const newSentence = new Sentence({ text, difficulty });
      await newSentence.save();
      res.status(201).json(newSentence);
    } else {
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    console.error("Sentence API error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
