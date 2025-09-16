import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import mongoose from "mongoose";
import clientPromise from "../../../lib/mongodb";
import User from "../../../models/User";
import bcrypt from "bcryptjs";

// Connect to MongoDB
async function connectMongo() {
  await clientPromise;
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectMongo();
        const user = await User.findOne({ username: credentials.username }).lean();
        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        // JWT-safe: no base64 images
        return {
          id: user._id.toString(),
          username: user.username,
          name: user.name,
          email: user.email,
          image: user.image ? "placeholder" : null, // small placeholder
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) token.sub = user.id;

      if (account?.provider === "google" && profile) {
        await connectMongo();
        let existingUser = await User.findOne({ email: profile.email });

        if (!existingUser) {
          existingUser = await User.create({
            username: profile.name.replace(/\s+/g, "").toLowerCase(),
            name: profile.name,
            email: profile.email,
            image: profile.picture, // URL only
            googleId: profile.id,
          });
        } else if (profile.picture && profile.picture !== existingUser.image) {
          existingUser.image = profile.picture;
          await existingUser.save();
        }

        token.sub = existingUser._id.toString();
        token.picture = existingUser.image;
      }

      return token;
    },

    async session({ session, token }) {
      if (token?.sub) {
        await connectMongo();
        const user = await User.findById(token.sub).lean();
        if (user) {
          // Use DB image directly, do not store base64 in JWT
          session.user = {
            id: user._id.toString(),
            username: user.username,
            name: user.name,
            email: user.email,
            image: user.image,
            bio: user.bio || "",
            dateOfBirth: user.dateOfBirth || null,
            location: user.location || "",
            website: user.website || "",
            twitter: user.twitter || "",
            github: user.github || "",
            createdAt: user.createdAt,
          };
        }
      }
      return session;
    },
  },

  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
