import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiEye,
  FiEyeOff,
  FiLock,
  FiUser,
} from "react-icons/fi";
import toast from "react-hot-toast";

import api from "../../api/axios";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const getErrorMessage = (error) => {
    const responseData = error.response?.data;

    if (!responseData) {
      return error.message || "Unable to connect to the server.";
    }

    if (typeof responseData === "string") {
      return responseData;
    }

    if (responseData.detail) {
      return responseData.detail;
    }

    if (Array.isArray(responseData.non_field_errors)) {
      return responseData.non_field_errors[0];
    }

    if (Array.isArray(responseData.username)) {
      return responseData.username[0];
    }

    if (Array.isArray(responseData.password)) {
      return responseData.password[0];
    }

    return "Login failed. Please check your username and password.";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const username = formData.username.trim();
    const password = formData.password;

    if (!username) {
      toast.error("Username is required.");
      return;
    }

    if (!password) {
      toast.error("Password is required.");
      return;
    }

    try {
      setLoading(true);

      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("user");

      const response = await api.post("/accounts/login/", {
        username,
        password,
      });

      const { access, refresh, user } = response.data;

      if (!access || !refresh || !user) {
        throw new Error(
          "The server returned an incomplete login response."
        );
      }

      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);
      localStorage.setItem("user", JSON.stringify(user));

      toast.success("Login successful.");

      navigate("/dashboard", { replace: true });
    } catch (error) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("user");

      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
      <div
        aria-hidden="true"
        className="absolute left-[-100px] top-[-100px] h-72 w-72 rounded-full bg-blue-600/30 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute bottom-[-120px] right-[-80px] h-80 w-80 rounded-full bg-violet-600/30 blur-3xl"
      />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-blue-600 to-violet-700 p-10 text-white md:flex">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-100">
              Smart Campus
            </p>

            <h1 className="mt-5 text-4xl font-bold leading-tight">
              Campus support,
              <br />
              simplified.
            </h1>

            <p className="mt-5 max-w-sm text-blue-100">
              Raise tickets, track progress, receive notifications and
              communicate with the support team from one place.
            </p>
          </div>

          <p className="text-sm text-blue-100">
            Smart Campus Helpdesk System
          </p>
        </div>

        <div className="bg-white p-7 sm:p-10">
          <div className="mx-auto max-w-md">
            <div className="mb-8">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                <FiLock size={25} />
              </div>

              <h2 className="text-3xl font-bold text-slate-900">
                Welcome back
              </h2>

              <p className="mt-2 text-slate-500">
                Sign in to access your helpdesk account.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
              noValidate
            >
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Username
                </label>

                <div className="relative">
                  <FiUser
                    aria-hidden="true"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                    autoComplete="username"
                    autoFocus
                    disabled={loading}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <FiLock
                    aria-hidden="true"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((currentValue) => !currentValue)
                    }
                    disabled={loading}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <FiEyeOff aria-hidden="true" />
                    ) : (
                      <FiEye aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-500">
              New student?{" "}
              <button
                type="button"
                onClick={() => navigate("/register")}
                disabled={loading}
                className="rounded font-semibold text-blue-600 transition hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;