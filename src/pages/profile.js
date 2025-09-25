import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState, useRef, useEffect } from "react";
import { Edit as EditIcon } from "lucide-react";
import EditProfileModal from "../components/EditProfileModal";

export default function Profile() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (session) console.log("Session user data:", session.user);
  }, [session]);

  if (!session)
    return <p className="text-center mt-10 text-gray-300">Loading...</p>;

  // Upload profile image
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", session.user.id);

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/profile/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Profile image updated!");
        if (updateSession) await updateSession(); // refresh session from DB
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Upload failed");
    } finally {
      setLoading(false);
    }
  };

  // Save profile edits
  const handleSaveProfile = async (formData) => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, ...formData }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Profile updated successfully!");
        if (updateSession) await updateSession(); // refresh session from DB
        setIsEditing(false);
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Update failed");
    } finally {
      setLoading(false);
    }
  };

  // Fallback for broken images
  const handleImageError = (e) => {
    console.error("Image load error. URL:", session?.user?.image);
    e.target.src = "/default-avatar.png";
  };

  const profileImage = session.user.image || "/default-avatar.png";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-6">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md text-gray-200">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-400 hover:underline"
          >
            ← Back
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center text-purple-400 hover:text-purple-500"
          >
            <EditIcon className="w-4 h-4 mr-1" />
            Edit Profile
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-6 text-gray-100">Profile</h1>

        {/* Profile Image */}
        <div className="relative w-24 h-24 mx-auto mb-4">
          <img
            src={profileImage}
            alt="Profile"
            className="w-24 h-24 rounded-full mx-auto cursor-pointer border border-gray-600"
            onClick={() => fileInputRef.current.click()}
            onError={handleImageError}
            referrerPolicy="no-referrer"
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleUpload}
          />
        </div>

        {/* User Info */}
        <div className="space-y-4 mt-6">
          <div className="bg-gray-700 p-3 rounded-lg">
            <p className="text-gray-200">
              <strong>Username:</strong>{" "}
              <span className="ml-2 text-gray-400">{session.user.username}</span>
            </p>
          </div>

          <p><strong>Display Name:</strong> {session.user.name || "Not set"}</p>
          <p><strong>Email:</strong> {session.user.email}</p>
          <p><strong>Bio:</strong> {session.user.bio || "No bio added yet"}</p>
          <p><strong>Date of Birth:</strong>{" "}
            {session.user.dateOfBirth
              ? new Date(session.user.dateOfBirth).toLocaleDateString()
              : "Not set"}
          </p>
          <p><strong>Location:</strong> {session.user.location || "Not set"}</p>
          <p><strong>Website:</strong>{" "}
            {session.user.website ? (
              <a
                href={session.user.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {session.user.website.replace(/^https?:\/\//, "")}
              </a>
            ) : "Not set"}
          </p>
          <p><strong>Twitter:</strong>{" "}
            {session.user.twitter ? (
              <a
                href={session.user.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {session.user.twitter.replace("https://twitter.com/", "@")}
              </a>
            ) : "Not set"}
          </p>
          <p><strong>GitHub:</strong>{" "}
            {session.user.github ? (
              <a
                href={session.user.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline"
              >
                {session.user.github.replace("https://github.com/", "")}
              </a>
            ) : "Not set"}
          </p>
          <p><strong>Created At:</strong>{" "}
            {new Date(session.user.createdAt).toLocaleDateString()}
          </p>
        </div>

        {message && (
          <p
            className={`mt-4 text-center font-medium ${
              message.startsWith("✅") ? "text-green-500" : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}

        {isEditing && (
          <EditProfileModal
            user={session.user}
            onClose={() => setIsEditing(false)}
            onSave={handleSaveProfile}
          />
        )}
      </div>
      {/* Add copyright notice */}
      <div className="fixed bottom-4 right-4 text-right text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Typing Game</p>
        <p className="text-purple-600">Made by Pankaj Sharma</p>
      </div>
    </div>
  );
}
