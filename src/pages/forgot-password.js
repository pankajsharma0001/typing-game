import { useState } from "react";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [message, setMessage] = useState("");

    const handleSearch = async (e) => {
        e.preventDefault();
        setMessage("");
        setUsers([]); // reset previous results

        try {
            const res = await fetch("/api/forgot-password/find-users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            // handle both direct array and { users: [...] }
            const fetchedUsers = Array.isArray(data) ? data : Array.isArray(data.users) ? data.users : [];
            setUsers(fetchedUsers);

            if (fetchedUsers.length === 0) {
                setMessage("❌ No accounts found with this email.");
            } else {
                setMessage(""); // clear previous message
            }
        } catch (error) {
            console.error(error);
            setMessage("❌ Failed to fetch accounts.");
            setUsers([]); // fallback to empty array
        }
    };

    const handleSendReset = async () => {
        if (!selectedUser) {
            setMessage("⚠️ Please select an account first.");
            return;
        }

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
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            <div className="bg-white shadow-2xl rounded-3xl p-10 w-full max-w-md">
                <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
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
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-700 text-gray-800"
                    />

                    <button
                        type="submit"
                        className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                    >
                        Find Accounts
                    </button>
                </form>

                {/* Step 2: Show accounts if any */}
                {Array.isArray(users) && users.length > 0 && (
                    <div className="mt-6">
                        <p className="text-gray-700 mb-2 font-medium">Select your account:</p>
                        <div className="grid gap-3">
                            {users.map((user) => (
                                <button
                                    key={user._id}
                                    type="button"
                                    onClick={() => setSelectedUser(user._id)}
                                    className={`flex items-center justify-between w-full p-3 border rounded-lg transition-colors
            ${selectedUser === user._id ? "bg-purple-100 border-purple-500" : "bg-white border-gray-300 hover:bg-gray-100"}`}
                                >
                                    <span className="text-gray-800 font-medium">{user.username}</span>
                                    {selectedUser === user._id && (
                                        <span className="text-purple-600 font-bold">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleSendReset}
                            className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                        >
                            Send Reset Link
                        </button>
                    </div>
                )}

                {/* Message */}
                {message && (
                    <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
                )}

                <p className="mt-6 text-center text-gray-600">
                    Remember your password?{" "}
                    <a href="/login" className="text-purple-600 font-semibold hover:underline">
                        Back to Login
                    </a>
                </p>
            </div>
        </div>
    );
}
