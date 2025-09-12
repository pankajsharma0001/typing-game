import clientPromise from "../../lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]"; // adjust path if needed

export default async function handler(req, res) {
  // Get session securely on server
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ message: "Not authenticated" });

  const client = await clientPromise;
  const db = client.db();

  if (req.method === "POST") {
    const { score, wpm, accuracy, difficulty } = req.body;

    // Save the game linked to the authenticated user
    const result = await db.collection("games").insertOne({
      userId: session.user.id || session.user.email, // use id for Google, email for Credentials
      score,
      wpm,
      accuracy,
      difficulty,
      timestamp: new Date(),
    });

    return res.status(200).json(result);
  } else if (req.method === "GET") {
    // Fetch all games for the logged-in user
    const games = await db
      .collection("games")
      .find({ userId: session.user.id || session.user.email })
      .sort({ timestamp: -1 })
      .toArray();

    return res.status(200).json(games);
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }
}
