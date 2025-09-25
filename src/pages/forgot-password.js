import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [message, setMessage] = useState("");
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const canvasRef = useRef(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setMessage("");
    setUsers([]);
    setSearching(true);

    try {
      const res = await fetch("/api/forgot-password/find-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      const fetchedUsers = Array.isArray(data)
        ? data
        : Array.isArray(data.users)
        ? data.users
        : [];
      setUsers(fetchedUsers);

      if (fetchedUsers.length === 0) {
        setMessage("❌ No accounts found with this email.");
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to fetch accounts.");
    }
    setSearching(false);
  };

  const handleSendReset = async () => {
    if (!selectedUser) {
      setMessage("⚠️ Please select an account first.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/forgot-password/send-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser }),
      });
      if (res.ok) {
        setMessage("✅ Reset link has been sent to your email.");
      } else {
        setMessage("❌ Failed to send reset link.");
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ Request failed.");
    }
    setSending(false);
  };

  // Particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const particles = Array.from({ length: 60 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: 2 + Math.random() * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      particles.forEach(p1 => {
        particles.forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.strokeStyle = `rgba(255,182,193,${1 - dist / 100})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      particles.forEach(p => {
        ctx.fillStyle = "rgba(255,182,193,0.8)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      });

      requestAnimationFrame(draw);
    };

    draw();
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-900 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0"></canvas>

      <div className="relative z-10 bg-gray-800 shadow-2xl rounded-3xl p-10 w-full max-w-md border border-purple-600 animate-slideUp">
        <h1 className="text-2xl font-bold text-white text-center mb-6 tracking-wider">
          Forgot Password
        </h1>

        {/* Step 1: Enter Email */}
        <form onSubmit={handleSearch} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-purple-500 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1 transition-transform transform hover:scale-105"
          />
          <button
            type="submit"
            disabled={searching}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white transition-all ${
              searching ? "bg-purple-600 opacity-70 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-pink-600 hover:to-purple-600"
            }`}
          >
            {searching && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            )}
            {searching ? "Searching..." : "Find Accounts"}
          </button>
        </form>

        {/* Step 2: Show accounts if any */}
        {Array.isArray(users) && users.length > 0 && (
          <div className="mt-6">
            <p className="text-gray-300 mb-2 font-medium">Select your account:</p>
            <div className="grid gap-3">
              {users.map((user) => (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => setSelectedUser(user._id)}
                  className={`flex items-center justify-between w-full p-3 border rounded-lg transition-colors
                    ${
                      selectedUser === user._id
                        ? "bg-purple-700 border-purple-500 text-white"
                        : "bg-gray-900 border-gray-600 hover:bg-gray-800 text-gray-200"
                    }`}
                >
                  <span className="font-medium">{user.username}</span>
                  {selectedUser === user._id && (
                    <span className="text-pink-400 font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleSendReset}
              disabled={sending}
              className={`mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg font-semibold transition-all ${
                sending ? "bg-indigo-600 opacity-70 cursor-not-allowed" : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-purple-600 hover:to-indigo-600 text-white"
              }`}
            >
              {sending && (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
              )}
              {sending ? "Sending..." : "Send Reset Link"}
            </button>
          </div>
        )}

        {/* Message */}
        {message && <p className="mt-4 text-center text-sm text-gray-300">{message}</p>}

        <p className="mt-6 text-center text-gray-400">
          Remember your password?{" "}
          <Link href="/login" className="text-pink-400 font-semibold hover:underline">
            Back to Login
          </Link>
        </p>

        {/* Add copyright notice */}
        <div className="fixed bottom-4 right-4 text-right text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Typing Game</p>
          <p className="text-purple-600">Made by Pankaj Sharma</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          0% { transform: translateY(50px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp {
          animation: slideUp 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
