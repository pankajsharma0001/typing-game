import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Added
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const canvasRef = useRef(null);
  const sparklesRef = useRef([]);

  // Particle network setup
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
            ctx.strokeStyle = `rgba(255, 182, 193, ${1 - dist / 100})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      particles.forEach(p => {
        ctx.fillStyle = "rgba(255, 182, 193, 0.8)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      });

      sparklesRef.current.forEach((s, index) => {
        ctx.fillStyle = `rgba(255, 240, 255, ${s.opacity})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        s.y -= s.speed;
        s.opacity -= 0.02;
        if (s.opacity <= 0) sparklesRef.current.splice(index, 1);
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

  const createSparkles = (e) => {
    const rect = e.target.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
      sparklesRef.current.push({
        x: rect.left + Math.random() * rect.width,
        y: rect.top + Math.random() * rect.height,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 1 + 0.5,
        opacity: 1
      });
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    if (res?.ok) {
      router.push("/dashboard");
    } else {
      setIsLoading(false);
      alert("Invalid username or password");
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-900 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0"></canvas>

      <div className="relative z-10 bg-gray-800 shadow-2xl rounded-3xl p-10 w-full max-w-md border border-purple-600 animate-slideUp">
        <h1 className="text-3xl font-bold text-white text-center mb-8 tracking-wider">
          Typing Game
        </h1>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-3 mb-4 rounded-lg border border-purple-500 bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1 transition-transform transform hover:scale-105"
        />

        {/* Password field with eye toggle */}
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-lg border border-purple-500 bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1 transition-transform transform hover:scale-105 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-300 hover:text-white"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <button
          onClick={handleLogin}
          onMouseEnter={createSparkles}
          disabled={isLoading || isGoogleLoading}
          className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-pink-600 hover:to-purple-600 transition-all mb-2 shadow-lg relative overflow-hidden"
        >
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            "Login"
          )}
        </button>

        <div className="text-center mb-4">
          <Link href="/forgot-password" className="text-sm text-pink-400 hover:underline">
            Forgot Password?
          </Link>
        </div>

        <div className="flex items-center mb-4">
          <hr className="flex-grow border-gray-600" />
          <span className="mx-3 text-gray-400">or</span>
          <hr className="flex-grow border-gray-600" />
        </div>

        <button
          onClick={handleGoogleLogin}
          onMouseEnter={createSparkles}
          disabled={isLoading || isGoogleLoading}
          className="flex items-center justify-center w-full px-4 py-3 mb-4 rounded-lg border border-gray-500 text-gray-200 font-semibold hover:bg-gray-700 transition-transform transform hover:scale-105 relative overflow-hidden"
        >
          {isGoogleLoading ? (
            <div className="absolute inset-0 flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          ) : (
            <>
              <img src="/google-logo.svg" alt="Google Logo" className="w-6 h-6 mr-3" />
              Login with Google
            </>
          )}
        </button>

        <p className="text-center text-gray-400">
          Don’t have an account?{" "}
          <Link href="/register" className="text-pink-400 font-semibold hover:underline">
            Sign Up
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
