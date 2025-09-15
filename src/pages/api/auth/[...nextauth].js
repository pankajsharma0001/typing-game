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
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
}

// 🔹 Define authOptions so other files (like /api/games.js) can import it
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
        const user = await User.findOne({ username: credentials.username });
        if (user && bcrypt.compareSync(credentials.password, user.password)) {
          return {
            id: user._id.toString(),
            name: user.username,
            email: user.email,
          };
        }
        return null;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Credentials login
      if (user) token.sub = user.id || user._id?.toString();

      // Google login
      if (account?.provider === "google" && profile) {
        await connectMongo();
        let existingUser = await User.findOne({ email: profile.email });

        if (!existingUser) {
          existingUser = await User.create({
            username: profile.name,
            email: profile.email,
            image: profile.picture,
            googleId: profile.id,
          });
        } else {
          let updated = false;
          if (existingUser.username !== profile.name) {
            existingUser.username = profile.name;
            updated = true;
          }
          if (!existingUser.image || existingUser.image !== profile.picture) {
            existingUser.image = profile.picture;
            updated = true;
          }
          if (updated) await existingUser.save();
        }
        token.sub = existingUser._id.toString();
      }
      return token;
    },

    async session({ session, token }) {
      if (token?.sub) {
        await connectMongo();
        const user = await User.findById(token.sub).lean();
        if (user) {
          session.user.id = user._id.toString();
          session.user.name = user.username;
          session.user.email = user.email;
          session.user.image = user.image || null;
        }
      }
      return session;
    },
  },

  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
};

// 🔹 Export NextAuth handler
export default NextAuth(authOptions);
