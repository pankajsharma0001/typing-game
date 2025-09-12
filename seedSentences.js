// seedSentences.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/typinggame";

const client = new MongoClient(uri);

const sentences = [
  { text: "The quick brown fox jumps over the lazy dog.", difficulty: "easy" },
  { text: "Learning Next.js with MongoDB is fun and practical.", difficulty: "medium" },
  { text: "Asynchronous JavaScript patterns can be tricky but powerful.", difficulty: "hard" },
  { text: "Typing games improve speed and accuracy over time.", difficulty: "easy" },
  { text: "React hooks make functional components more powerful.", difficulty: "medium" },
  { text: "Advanced algorithm design can optimize performance significantly.", difficulty: "hard" },
  { text: "Practice makes perfect in all areas of life.", difficulty: "easy" },
  { text: "State management is crucial for large React applications.", difficulty: "medium" },
  { text: "Understanding closures and scopes is important in JS.", difficulty: "hard" },
  { text: "Consistency in coding style helps team collaboration.", difficulty: "easy" },
  { text: "Middleware in Next.js allows customizing requests easily.", difficulty: "medium" },
  { text: "Debouncing and throttling improve front-end performance.", difficulty: "hard" }
];

async function seed() {
  try {
    await client.connect();
    const db = client.db(); // defaults to database in URI
    const collection = db.collection("sentences");

    // Optional: clear existing sentences
    await collection.deleteMany({});

    // Insert new sentences
    const result = await collection.insertMany(sentences);

    console.log(`Inserted ${result.insertedCount} sentences.`);
  } catch (err) {
    console.error("Error seeding sentences:", err);
  } finally {
    await client.close();
  }
}

seed();
