import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import mongoose from "mongoose";
import clientPromise from "../../../lib/mongodb";
import User from "../../../models/User";
import bcrypt from "bcryptjs";

// MongoDB connection
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
      if (user) {
        token.sub = user.id || user._id?.toString();
      }

      // Google login
      if (account?.provider === "google" && profile) {
        await connectMongo();
        let existingUser = await User.findOne({ email: profile.email });

        if (!existingUser) {
          // Log the profile data for debugging
          console.log("Creating new user from Google profile:", {
            email: profile.email,
            picture: profile.picture,
          });

          existingUser = await User.create({
            username: profile.name.replace(/\s+/g, "").toLowerCase(),
            name: profile.name,
            email: profile.email,
            image: profile.picture,
            googleId: profile.sub,
          });
        }

        // Always update the token with the latest image
        token.picture = profile.picture || existingUser.image;
      }
      return token;
    },

    async session({ session, token }) {
      if (token?.sub) {
        await connectMongo();
        const user = await User.findById(token.sub).lean();
        if (user) {
          // Log the user data for debugging
          console.log("Session user data from DB:", {
            id: user._id,
            image: user.image,
          });

          session.user = {
            ...session.user,
            id: user._id.toString(),
            username: user.username,
            image: user.image || token.picture || null,
          };
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

export default NextAuth(authOptions);
