import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";

export default function ResetPassword() {
  const router = useRouter();
  const { token, id } = router.query;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const canvasRef = useRef(null);

  // Password rules
  const rules = [
    { regex: /.{6,}/, message: "At least 6 characters" },
    { regex: /[A-Z]/, message: "At least one uppercase letter" },
    { regex: /[a-z]/, message: "At least one lowercase letter" },
    { regex: /[0-9]/, message: "At least one number" },
    { regex: /[^A-Za-z0-9]/, message: "At least one special character" },
  ];

  const checkRule = (regex) => regex.test(password);

  // Generate strong password
  const generatePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*()_+";

    let generated = "";
    generated += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    generated += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    generated += numbers.charAt(Math.floor(Math.random() * numbers.length));
    generated += special.charAt(Math.floor(Math.random() * special.length));

    const allChars = uppercase + lowercase + numbers + special;
    for (let i = generated.length; i < 12; i++) {
      generated += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Shuffle
    generated = generated.split("").sort(() => Math.random() - 0.5).join("");
    setPassword(generated);
    setConfirmPassword(generated);
  };

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      return setMessage("⚠️ Please fill in both fields.");
    }
    if (password !== confirmPassword) {
      return setMessage("❌ Passwords do not match.");
    }

    const allPassed = rules.every((rule) => checkRule(rule.regex));
    if (!allPassed) {
      return setMessage("❌ Password does not meet all requirements.");
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/forgot-password/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, id, password }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Password reset successful! Redirecting to login...");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error. Please try again later.");
    }
    setLoading(false);
  };

  // Submit on Enter
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") handleReset();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [password, confirmPassword, token, id]);

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
        <h1 className="text-3xl font-bold text-white text-center mb-6 tracking-wider">
          Reset Password
        </h1>

        {message && (
          <div className={`mb-4 text-center font-medium ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </div>
        )}

        {/* Password input with toggle */}
        <div className="relative mb-2">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-purple-500 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1 transition-transform transform hover:scale-105 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-300 hover:text-white"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <div className="relative mb-4">
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 border border-purple-500 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1 transition-transform transform hover:scale-105 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-3 text-gray-300 hover:text-white"
          >
            {showConfirm ? "🙈" : "👁️"}
          </button>
        </div>

        {/* Generate password */}
        <p
          onClick={generatePassword}
          className="text-sm text-indigo-400 cursor-pointer hover:underline mb-4 text-center"
        >
          🔑 Generate strong password
        </p>

        {/* Password rules */}
        <ul className="text-sm mb-4 space-y-1">
          {rules.map((rule, i) => (
            <li key={i} className={`flex items-center ${checkRule(rule.regex) ? "text-green-600" : "text-red-600"}`}>
              <span className="mr-2">{checkRule(rule.regex) ? "✅" : "❌"}</span>
              {rule.message}
            </li>
          ))}
        </ul>

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full py-3 rounded-lg font-semibold text-white transition-all shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-pink-600 hover:to-purple-600 relative overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            "Reset Password"
          )}
        </button>
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
        .animate-slideUp { animation: slideUp 0.8s ease-out; }
      `}</style>
    </div>
  );
}
