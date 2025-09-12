import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    if (res?.ok) router.push("/dashboard");
    else alert("Invalid username or password");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
      <div className="bg-white shadow-2xl rounded-3xl p-10 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">Typing Game</h1>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-700 text-gray-800"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-700 text-gray-800"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors mb-4 shadow-md"
        >
          Login
        </button>

        <div className="flex items-center mb-4">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-3 text-gray-400">or</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="flex items-center justify-center w-full border border-gray-300 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors mb-4"
        >
          <img src="/google-logo.svg" alt="Google Logo" className="w-6 h-6 mr-3" />
          Login with Google
        </button>

        <p className="text-center text-gray-600">
          Don’t have an account?{" "}
          <a href="/register" className="text-purple-600 font-semibold hover:underline">Sign Up</a>
        </p>
      </div>
    </div>
  );
}
