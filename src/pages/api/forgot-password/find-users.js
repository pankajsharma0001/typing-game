import clientPromise from "../../../lib/mongodb";
import User from "../../../models/User"; // if you're using mongoose models

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db(); // defaults to the DB in your connection string

    if (req.method === "POST") {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email required" });

      // If using native driver
      const users = await db.collection("users").find({ email }).toArray();

      return res.status(200).json(users);
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
