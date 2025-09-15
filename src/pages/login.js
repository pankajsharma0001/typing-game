import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
      <div className="bg-white shadow-2xl rounded-3xl p-10 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">Typing Game</h1>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
          className="w-full px-4 py-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-700 text-gray-800 disabled:bg-gray-100"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="w-full px-4 py-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-700 text-gray-800 disabled:bg-gray-100"
        />

        <button
          onClick={handleLogin}
          disabled={isLoading || isGoogleLoading}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors mb-2 shadow-md disabled:bg-purple-400 relative"
        >
          {isLoading ? (
            <>
              <span className="opacity-0">Login</span>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            </>
          ) : (
            "Login"
          )}
        </button>

        {/* Forgot Password link below Login button */}
        <div className="text-center mb-4">
          <Link href="/forgot-password" className="text-sm text-purple-600 hover:underline">
            Forgot Password?
          </Link>
        </div>

        <div className="flex items-center mb-4">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-3 text-gray-400">or</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading || isGoogleLoading}
          className="flex items-center justify-center w-full border border-gray-500 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors mb-4 text-gray-700 font-semibold disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-500 relative"
        >
          {isGoogleLoading ? (
            <>
              <span className="opacity-0">Login with Google</span>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </>
          ) : (
            <>
              <img src="/google-logo.svg" alt="Google Logo" className="w-6 h-6 mr-3" />
              Login with Google
            </>
          )}
        </button>

        <p className="text-center text-gray-600">
          Don’t have an account?{" "}
          <Link href="/register" className="text-purple-600 font-semibold hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
