import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/auth.js";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await loginUser(formData);

      console.log("Login successful:", response.data);

      navigate("/dashboard");
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 relative overflow-hidden">

        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500 rounded-full opacity-50" />

        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] bg-indigo-700 rounded-full opacity-50" />

        <div className="relative z-10 flex flex-col justify-center px-20 text-white">

          <div className="flex items-center gap-3 mb-10">

            <div className="w-12 h-12 rounded-xl bg-white text-indigo-600 flex items-center justify-center text-2xl font-bold">
              W
            </div>

            <h1 className="text-2xl font-bold">
              Whiteboard
            </h1>

          </div>

          <h2 className="text-5xl font-bold leading-tight mb-6">
            Turn your ideas
            <br />
            into reality.
          </h2>

          <p className="text-indigo-100 text-lg max-w-lg leading-relaxed">
            Create beautiful whiteboards, organize your ideas,
            and bring your projects to life with a powerful
            collaborative workspace.
          </p>

          <div className="mt-10 flex gap-4">

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-4">
              <p className="text-2xl font-bold">
                100%
              </p>

              <p className="text-indigo-200 text-sm">
                Creative
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-4">
              <p className="text-2xl font-bold">
                Easy
              </p>

              <p className="text-indigo-200 text-sm">
                To use
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-4">
              <p className="text-2xl font-bold">
                Fast
              </p>

              <p className="text-indigo-200 text-sm">
                Workflow
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">

        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">

            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold">
              W
            </div>

            <h1 className="text-xl font-bold text-slate-900">
              Whiteboard
            </h1>

          </div>

          {/* Heading */}
          <div className="mb-8">

            <h2 className="text-3xl font-bold text-slate-900">
              Welcome back
            </h2>

            <p className="mt-2 text-slate-500">
              Sign in to continue to your workspace.
            </p>

          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* EMAIL */}
            <div>

              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />

            </div>

            {/* PASSWORD */}
            <div>

              <div className="flex items-center justify-between mb-2">

                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <button
                  type="button"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Forgot password?
                </button>

              </div>

              <div className="relative">

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-slate-300 bg-white outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

            </div>

            {/* REMEMBER */}
            <div className="flex items-center gap-2">

              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />

              <label
                htmlFor="remember"
                className="text-sm text-slate-600"
              >
                Remember me
              </label>

            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-indigo-600 text-white font-semibold transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >

              {loading ? (
                <span className="flex items-center justify-center gap-2">

                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />

                  Signing in...

                </span>
              ) : (
                "Sign in"
              )}

            </button>

          </form>

          {/* REGISTER */}
          <div className="mt-8 text-center">

            <p className="text-sm text-slate-500">

              Don't have an account?{" "}

              <Link
                to="/register"
                className="font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Create account
              </Link>

            </p>

          </div>

          {/* FOOTER */}
          <p className="mt-10 text-center text-xs text-slate-400">
            By continuing, you agree to our Terms of Service
            and Privacy Policy.
          </p>

        </div>

      </div>

    </div>
  );
}

export default Login;