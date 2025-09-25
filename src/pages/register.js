import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const isGoogleEmail = (email) => email.endsWith("@gmail.com");

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

    setPassword(generated.split("").sort(() => Math.random() - 0.5).join(""));
  };

  const handleRegister = async () => {
    setError("");
    setIsLoading(true);

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    if (!isGoogleEmail(email)) {
      setError("Only @gmail.com email addresses are allowed.");
      setIsLoading(false);
      return;
    }

    const allPassed = rules.every((rule) => checkRule(rule.regex));
    if (!allPassed) {
      setError("Password does not meet all requirements.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (!res.ok) throw new Error("Registration failed");

      const login = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });

      if (login?.ok) router.push("/dashboard");
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
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
      radius: 2 + Math.random() * 2
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p1 => {
        particles.forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.strokeStyle = `rgba(255,182,193,${1 - dist/100})`;
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
        <h1 className="text-3xl font-bold text-white text-center mb-8 tracking-wider">
          Create Account
        </h1>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 mb-4 rounded-lg border border-purple-500 bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1 transition-transform transform hover:scale-105"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full px-4 py-3 mb-4 rounded-lg border border-purple-500 bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1 transition-transform transform hover:scale-105 ${
            email && !isGoogleEmail(email) ? "border-red-500" : ""
          }`}
        />
        {email && !isGoogleEmail(email) && (
          <p className="text-red-500 text-sm mb-4">Enter a valid @gmail.com email!</p>
        )}

        {/* Password input with show/hide */}
        <div className="relative mb-2">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
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

        <ul className="text-sm mb-4 space-y-1">
          {rules.map((rule, i) => (
            <li key={i} className={`flex items-center ${checkRule(rule.regex) ? "text-green-600" : "text-red-600"}`}>
              <span className="mr-2">{checkRule(rule.regex) ? "✅" : "❌"}</span>
              {rule.message}
            </li>
          ))}
        </ul>

        <p
          onClick={generatePassword}
          className="text-sm text-indigo-400 cursor-pointer hover:underline mb-4 text-center"
        >
          🔑 Generate strong password
        </p>

        <button
          onClick={handleRegister}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-all mb-4 shadow-lg relative overflow-hidden"
        >
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            "Register"
          )}
        </button>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <p className="text-center text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-pink-400 font-semibold hover:underline">
            Login
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
