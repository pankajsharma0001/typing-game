import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function Stats() {
  const router = useRouter();
  const { data: session } = useSession();
  const [games, setGames] = useState([]);

  useEffect(() => {
    if (!session) return;

    const fetchGames = async () => {
      try {
        const res = await axios.get("/api/games", { withCredentials: true });
        setGames(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchGames();
  }, [session]);

  if (!session) 
    return <p className="text-center mt-10 text-gray-800">Please login to see your stats.</p>;

  if (games.length === 0) 
    return <p className="text-center mt-10 text-gray-800">No game data yet. Play some games first!</p>;

  // Sort all games by timestamp ascending for chart
  const allGamesSorted = [...games].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  // Latest 15 games for table
  const recentGames = [...games]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 15);

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
        >
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900 text-center flex-1">
          Stats for {session.user.name}
        </h1>
        <button
          onClick={() => router.push("/login")}
          className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white shadow-2xl rounded-3xl p-6 mb-6 overflow-x-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 text-center">Recent Games</h2>
        <table className="min-w-full text-left">
          <thead>
            <tr className="text-gray-800 border-b-2 border-gray-200">
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Difficulty</th>
              <th className="px-4 py-2">Score</th>
              <th className="px-4 py-2">WPM</th>
              <th className="px-4 py-2">Accuracy (%)</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {recentGames.map((game, index) => (
              <tr key={game._id} className="border-b border-gray-200 hover:bg-purple-50 transition-colors">
                <td className="px-4 py-2 text-gray-900">{index + 1}</td>
                <td className="px-4 py-2 text-gray-900">{game.difficulty}</td>
                <td className="px-4 py-2 text-gray-900">{game.score}</td>
                <td className="px-4 py-2 text-gray-900">{game.wpm}</td>
                <td className="px-4 py-2 text-gray-900">{game.accuracy}</td>
                <td className="px-4 py-2 text-gray-900">{new Date(game.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chart Card */}
      <div className="bg-white shadow-2xl rounded-3xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 text-center">Performance Chart</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={allGamesSorted} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(timestamp) => new Date(timestamp).toLocaleDateString()}
              tick={{ fill: "#374151" }}
            />
            <YAxis tick={{ fill: "#374151" }} />
            <Tooltip labelFormatter={(label) => new Date(label).toLocaleString()} />
            <Legend />
            <Line type="monotone" dataKey="wpm" stroke="#7c3aed" strokeWidth={3} />
            <Line type="monotone" dataKey="accuracy" stroke="#ec4899" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}