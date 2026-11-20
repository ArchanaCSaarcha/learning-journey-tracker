
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/authService";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await loginUser({ email, password });

      // Login successful
      navigate("/dashboard");
    } catch (error) {
      setError(
        error.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F8EE] px-4">

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-[#AEC3B0]/40">

        <h1 className="mb-2 text-center text-3xl font-bold text-[#0F2A1D]">
          Learning Journey
        </h1>

        <h2 className="mb-2 text-center text-2xl font-semibold text-[#375534]">
          Welcome Back!
        </h2>

        <p className="mb-8 text-center text-gray-500">
          Continue your learning journey.
        </p>

        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
              required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
              required
            />
          </div>

          {error && (
            <p className="text-center text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#375534] py-3 font-semibold text-white transition hover:bg-[#294226] shadow-sm disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        <p className="mt-6 text-center text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-[#375534] hover:underline">
            Register
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;
