
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/authService";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await registerUser({
        name,
        email,
        password,
      });

      setSuccess(response.data.message);

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F8EE] px-4 py-8">

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-[#AEC3B0]/40">

        <h1 className="mb-2 text-center text-3xl font-bold text-[#0F2A1D]">
          Learning Journey
        </h1>

        <h2 className="mb-2 text-center text-2xl font-semibold text-[#375534]">
          Create Your Account
        </h2>

        <form onSubmit={handleRegister} className="space-y-5">

          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
              required
            />
          </div>

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
              placeholder="Create a password"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
              minLength={8}
              required
            />
          </div>

          {error && (
            <p className="text-center text-sm text-red-600">
              {error}
            </p>
          )}

          {success && (
            <p className="text-center text-sm text-green-600">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#375534] py-3 font-semibold text-white transition hover:bg-[#294226] shadow-sm disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

        </form>

        <p className="mt-6 text-center text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-[#375534] hover:underline">
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Register;
