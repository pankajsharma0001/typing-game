// pages/api/sentences.js
import mongoose from "mongoose";
import Sentence from "../../models/Sentence";
import clientPromise from "../../lib/mongodb";

async function connectMongo() {
  await clientPromise;
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

// In-memory session store
const userSessions = {}; // { userId: Set of used sentence _id }

export default async function handler(req, res) {
  const { difficulty, count = 10, userId } = req.query;

  try {
    await connectMongo();

    if (req.method === "GET") {
      const allSentences = await Sentence.find({ difficulty }).select("_id text");

      if (!allSentences.length) return res.status(200).json([]);

      let pool = allSentences;

      if (userId) {
        if (!userSessions[userId]) userSessions[userId] = new Set();

        // Filter unused sentences
        let unused = allSentences.filter(s => !userSessions[userId].has(s._id.toString()));

        // If all sentences used, reset the session
        if (unused.length === 0) {
          userSessions[userId].clear();
          unused = allSentences;
        }

        pool = unused;
      }

      // Pick random sentences
      const limit = Math.min(count, pool.length);
      const selected = [];
      const usedIndexes = new Set();

      while (selected.length < limit) {
        const rand = Math.floor(Math.random() * pool.length);
        if (!usedIndexes.has(rand)) {
          usedIndexes.add(rand);
          selected.push(pool[rand]);
          if (userId) userSessions[userId].add(pool[rand]._id.toString());
        }
      }

      // Return sentences even after reset
      return res.status(200).json(selected);
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
