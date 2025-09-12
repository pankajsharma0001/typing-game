import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import TypingGame from "../components/TypingGame";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Force login if not authenticated
  useEffect(() => {
    if (status === "loading") return; // Wait for session to load
    if (!session) router.replace("/login"); // Redirect if not logged in
  }, [session, status]);

  if (status === "loading") {
    return <p className="text-center mt-10 text-gray-700">Loading session...</p>;
  }

  if (!session) {
    return <p className="text-center mt-10 text-gray-700">Redirecting to login...</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">
          Hello, {session.user.name}
        </h1>
        <div className="flex gap-4">
          <Link
            href="/stats"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            View Stats
          </Link>
          <button
            onClick={() => signOut()}
            className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Typing Game */}
      <div className="mt-6">
        <TypingGame />
      </div>
    </div>
  );
}
