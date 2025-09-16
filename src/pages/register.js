import { useState } from "react";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function Register() {
  // Add loading state
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Password rules
  const rules = [
    { regex: /.{6,}/, message: "At least 6 characters" },
    { regex: /[A-Z]/, message: "At least one uppercase letter" },
    { regex: /[a-z]/, message: "At least one lowercase letter" },
    { regex: /[0-9]/, message: "At least one number" },
    { regex: /[^A-Za-z0-9]/, message: "At least one special character" },
  ];

  const checkRule = (regex) => regex.test(password);

  // Updated password generator that ensures all rules are met
  const generatePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*()_+";

    // Ensure at least one character from each category
    let generated = "";
    generated += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    generated += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    generated += numbers.charAt(Math.floor(Math.random() * numbers.length));
    generated += special.charAt(Math.floor(Math.random() * special.length));

    // Fill remaining length with random characters from all categories
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = generated.length; i < 12; i++) {
      generated += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Shuffle the password
    generated = generated
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    setPassword(generated);
  };

  // Add this validation function after the rules array
  const isGoogleEmail = (email) => {
    return email.endsWith('@gmail.com');
  };

  // Update the handleRegister function
  const handleRegister = async () => {
    setError("");
    setIsLoading(true);

    // Validate email format
    if (!email || !email.includes('@')) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    // Check if it's a Google email
    if (!isGoogleEmail(email)) {
      setError("Only @gmail.com email addresses are allowed.");
      setIsLoading(false);
      return;
    }

    // Validate all password rules
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

      // Auto login after registration
      const login = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });

      if (login?.ok) router.push("/dashboard");
    } catch (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
      <div className="bg-white shadow-2xl rounded-3xl p-10 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Create Account
        </h1>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-700 text-gray-800"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-700 text-gray-800 ${
            email && !isGoogleEmail(email) ? 'border-red-500' : ''
          }`}
        />
        {email && !isGoogleEmail(email) && (
          <p className="text-red-500 text-sm mb-4">Only @google.com email addresses are allowed</p>
        )}

        <input
          type="text"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-700 text-gray-800"
        />

        {/* Password rules checklist */}
        <ul className="text-sm mb-4 space-y-1">
          {rules.map((rule, i) => (
            <li
              key={i}
              className={`flex items-center ${
                checkRule(rule.regex) ? "text-green-600" : "text-red-600"
              }`}
            >
              <span className="mr-2">
                {checkRule(rule.regex) ? "✅" : "❌"}
              </span>
              {rule.message}
            </li>
          ))}
        </ul>

        {/* Generate password link */}
        <p
          onClick={generatePassword}
          className="text-sm text-indigo-600 cursor-pointer hover:underline mb-4"
        >
          🔑 Generate strong password
        </p>

        <button
          onClick={handleRegister}
          disabled={isLoading}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors mb-4 shadow-md disabled:bg-purple-400 relative"
        >
          {isLoading ? (
            <>
              <span className="opacity-0">Register</span>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            </>
          ) : (
            "Register"
          )}
        </button>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <p className="text-center text-gray-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-purple-600 font-semibold hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
