import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import TypingGame from "../components/TypingGame";
import { User as UserIcon } from "lucide-react";

export default function Dashboard() {
  const { data: session, update: updateSession, status } = useSession();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const canvasRef = useRef(null);

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingLogout, setIsLoadingLogout] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.replace("/login");
  }, [session, status, router]);

  // Floating particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = Array.from({ length: 60 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: 2 + Math.random() * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p1) => {
        particles.forEach((p2) => {
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

      particles.forEach((p) => {
        ctx.fillStyle = "rgba(255, 182, 193, 0.8)";
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

  if (status === "loading") {
    return <p className="text-center mt-10 text-gray-300">Loading session...</p>;
  }
  if (!session) {
    return <p className="text-center mt-10 text-gray-300">Redirecting to login...</p>;
  }

  const profileImage = session.user.image;

  const handleProfileClick = async () => {
    setIsLoadingProfile(true);
    await router.push("/profile");
    setIsLoadingProfile(false);
  };

  const handleStatsClick = async () => {
    setIsLoadingStats(true);
    await router.push("/stats");
    setIsLoadingStats(false);
  };

  const handleLogout = async () => {
    setIsLoadingLogout(true);
    await signOut();
    setIsLoadingLogout(false);
  };

  return (
    <div className="relative min-h-screen bg-gray-900 text-white overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0"></canvas>

      {/* Profile Dropdown */}
      <div
        className="absolute top-3 right-3 sm:top-6 sm:right-6 z-20"
        ref={dropdownRef}
      >
        <button
          type="button"
          aria-label="Profile menu"
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-white overflow-hidden shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400 hover:scale-105 transition-transform"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          {profileImage ? (
            <img
              src={profileImage}
              alt="Profile"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
              <UserIcon className="w-6 h-6 text-gray-300" />
            </div>
          )}
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-36 sm:w-40 bg-gray-800 shadow-2xl rounded-lg animate-slideDown">
            {/* Profile */}
            <button
              onClick={handleProfileClick}
              disabled={isLoadingProfile}
              className="w-full text-left px-4 py-2 text-purple-400 font-semibold hover:bg-purple-900 transition-colors rounded-t-lg relative"
            >
              {isLoadingProfile ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                "Profile"
              )}
            </button>

            {/* Stats */}
            <button
              onClick={handleStatsClick}
              disabled={isLoadingStats}
              className="w-full text-left px-4 py-2 text-green-400 font-semibold hover:bg-green-900 transition-colors relative"
            >
              {isLoadingStats ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                "Stats"
              )}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={isLoadingLogout}
              className="w-full text-left px-4 py-2 text-red-400 font-semibold hover:bg-red-900 transition-colors rounded-b-lg relative"
            >
              {isLoadingLogout ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                "Logout"
              )}
            </button>
          </div>
        )}
      </div>

      {/* Dashboard Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8">
          Welcome, {session?.user?.name || session?.user?.username}!
        </h1>

        {/* Typing Game */}
        <div className="bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
          <TypingGame
            onGameEnd={async () => {
              await updateSession();
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          0% {
            transform: translateY(-10px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
