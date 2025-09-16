import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import User from "../../../models/User";
import mongoose from "mongoose";
import clientPromise from "../../../lib/mongodb";

// Connect Mongo
async function connectMongo() {
  await clientPromise;
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    await connectMongo();

    const { name, bio, dateOfBirth, location, website, twitter, github } =
      req.body;

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        $set: {
          name,
          bio,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          location,
          website,
          twitter,
          github,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      id: updatedUser._id,
      username: updatedUser.username,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      bio: updatedUser.bio,
      dateOfBirth: updatedUser.dateOfBirth,
      location: updatedUser.location,
      website: updatedUser.website,
      twitter: updatedUser.twitter,
      github: updatedUser.github,
      createdAt: updatedUser.createdAt,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
}
