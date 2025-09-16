import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import TypingGame from "../components/TypingGame";
import { User as UserIcon } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { data: session, update: updateSession, status } = useSession();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [userStats, setUserStats] = useState({
    highestWPM: 0,
    highestAccuracy: 0,
    totalGames: 0,
  });

  // Add loading states
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingLogout, setIsLoadingLogout] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [router]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.replace("/login");
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user) {
      setUserStats({
        highestWPM: session.user.highestWPM || 0,
        highestAccuracy: session.user.highestAccuracy || 0,
        totalGames: session.user.totalGames || 0,
      });
    }
  }, [session, router]);

  if (status === "loading") {
    return <p className="text-center mt-10 text-gray-700">Loading session...</p>;
  }
  if (!session) {
    return <p className="text-center mt-10 text-gray-700">Redirecting to login...</p>;
  }

  const profileImage = session.user.image;

  // Handle profile click
  const handleProfileClick = async () => {
    setIsLoadingProfile(true);
    await router.push("/profile");
    setIsLoadingProfile(false);
  };

  // Handle stats click
  const handleStatsClick = async () => {
    setIsLoadingStats(true);
    await router.push("/stats");
    setIsLoadingStats(false);
  };

  // Handle logout click
  const handleLogout = async () => {
    setIsLoadingLogout(true);
    await signOut();
    setIsLoadingLogout(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        {/* Spacer pushes avatar to the right */}
        <div className="flex-1" />

        <div className="relative" ref={dropdownRef}>
          <div
            className="w-12 h-12 rounded-full cursor-pointer border-2 border-purple-600 overflow-hidden"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <UserIcon className="w-6 h-6 text-gray-600" />
              </div>
            )}
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg z-50">
              <button
                onClick={handleProfileClick}
                disabled={isLoadingProfile}
                className="w-full text-left px-4 py-2 text-purple-700 font-semibold hover:bg-purple-100 transition-colors rounded-t-lg relative"
              >
                {isLoadingProfile ? (
                  <>
                    <span className="opacity-0">Profile</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </>
                ) : (
                  "Profile"
                )}
              </button>

              <button
                onClick={handleStatsClick}
                disabled={isLoadingStats}
                className="w-full text-left px-4 py-2 text-green-700 font-semibold hover:bg-green-100 transition-colors relative"
              >
                {isLoadingStats ? (
                  <>
                    <span className="opacity-0">Stats</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </>
                ) : (
                  "Stats"
                )}
              </button>

              <button
                onClick={handleLogout}
                disabled={isLoadingLogout}
                className="w-full text-left px-4 py-2 text-red-600 font-semibold hover:bg-red-100 transition-colors rounded-b-lg relative"
              >
                {isLoadingLogout ? (
                  <>
                    <span className="opacity-0">Logout</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </>
                ) : (
                  "Logout"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Welcome Message */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome, {session?.user?.name || session?.user?.username}!
          </h1>

          <div className="mt-6">
            <TypingGame
              onGameEnd={async () => {
                await updateSession();
                setUserStats({
                  highestWPM: session.user.highestWPM || 0,
                  highestAccuracy: session.user.highestAccuracy || 0,
                  totalGames: session.user.totalGames || 0,
                });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
