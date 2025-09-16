import { useState } from "react";

export default function EditProfileModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    bio: user.bio || "",
    dateOfBirth: user.dateOfBirth
      ? new Date(user.dateOfBirth).toISOString().split("T")[0]
      : "",
    location: user.location || "",
    website: user.website || "",
    twitter: user.twitter || "",
    github: user.github || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // ✅ Normalize URLs
      let updatedData = { ...formData };

      if (updatedData.website && !updatedData.website.startsWith("http")) {
        updatedData.website = `https://${updatedData.website}`;
      }

      if (updatedData.twitter && !updatedData.twitter.startsWith("http")) {
        updatedData.twitter = `https://twitter.com/${updatedData.twitter.replace(
          "@",
          ""
        )}`;
      }

      if (updatedData.github && !updatedData.github.startsWith("http")) {
        updatedData.github = `https://github.com/${updatedData.github}`;
      }

      await onSave(updatedData);
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-gray-100 rounded-2xl shadow-2xl p-6 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4 text-purple-400">Edit Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Display Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-purple-500"
          />

          <textarea
            name="bio"
            placeholder="Bio"
            value={formData.bio}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-purple-500"
          />

          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-purple-500"
          />

          <input
            type="text"
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-purple-500"
          />

          <input
            type="text"
            name="website"
            placeholder="Website (example.com)"
            value={formData.website}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-purple-500"
          />

          <input
            type="text"
            name="twitter"
            placeholder="Twitter (username only)"
            value={formData.twitter}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-purple-500"
          />

          <input
            type="text"
            name="github"
            placeholder="GitHub (username only)"
            value={formData.github}
            onChange={handleChange}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)} // ✅ Enter submits
            className="w-full p-3 border rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-purple-500"
          />

          {/* Buttons */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-300 hover:text-gray-900 disabled:bg-gray-600 disabled:text-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-400 relative"
            >
              {isSaving ? (
                <>
                  <span className="opacity-0">Save Changes</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
