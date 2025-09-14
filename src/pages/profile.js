import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState, useRef } from "react";
import { User as UserIcon } from "lucide-react";

export default function Profile() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!session) return <p className="text-center mt-10 text-gray-700">Loading...</p>;

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
        if (updateSession) await updateSession(); // refresh session
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <button onClick={() => router.back()} className="mb-4 text-blue-600 hover:underline">
          ← Back
        </button>

        <h1 className="text-2xl font-bold mb-4 text-gray-900">Profile</h1>

        {/* Profile Image */}
        <div className="relative w-24 h-24 mx-auto mb-4">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt="Profile"
              className="w-24 h-24 rounded-full mx-auto cursor-pointer border"
              onClick={() => fileInputRef.current.click()}
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer"
              onClick={() => fileInputRef.current.click()}
            >
              <UserIcon className="w-12 h-12 text-gray-600" />
            </div>
          )}
          <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleUpload} />
        </div>

        {/* User Info */}
        <p className="text-gray-800"><strong>Name:</strong> {session.user.name}</p>
        <p className="text-gray-800"><strong>Email:</strong> {session.user.email}</p>

        {message && (
          <p className={`mt-4 text-center font-medium ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
