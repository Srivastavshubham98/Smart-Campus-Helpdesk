import { useEffect, useState } from "react";
import {
  FiEye,
  FiEyeOff,
  FiLoader,
  FiLock,
  FiSave,
  FiUser,
} from "react-icons/fi";
import toast from "react-hot-toast";
import Loader from "../../components/Loader";
import api from "../../api/axios";

const initialForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  role: "",
  current_password: "",
  new_password: "",
  new_password_confirm: "",
};

function Profile() {
  const [formData, setFormData] =
    useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] =
    useState(false);
  const [changingPassword, setChangingPassword] =
    useState(false);

  const [showPasswords, setShowPasswords] =
    useState(false);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/accounts/me/");

      setFormData((previous) => ({
        ...previous,
        ...response.data,
      }));
    } catch (error) {
      toast.error("Profile could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const getErrorMessage = (error) => {
    const data = error.response?.data;

    if (!data) {
      return "Something went wrong.";
    }

    if (typeof data === "string") {
      return data;
    }

    const firstKey = Object.keys(data)[0];

    if (firstKey) {
      const value = data[firstKey];

      if (Array.isArray(value)) {
        return value[0];
      }

      if (typeof value === "string") {
        return value;
      }
    }

    return data.detail || "Request failed.";
  };

  const updateStoredUser = (updatedUser) => {
    const storedUser = JSON.parse(
      localStorage.getItem("user") || "{}"
    );

    localStorage.setItem(
      "user",
      JSON.stringify({
        ...storedUser,
        ...updatedUser,
      })
    );
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    if (savingProfile) {
        return;
    }

    if (!formData.username.trim()) {
      toast.error("Username is required.");
      return;
    }
    if (!formData.email.trim()) {
    toast.error("Email is required.");
    return;
}

    try {
      setSavingProfile(true);

      const response = await api.patch(
        "/accounts/me/",
        {
          username: formData.username.trim(),
          email: formData.email.trim().toLowerCase(),
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
        }
      );

      setFormData((previous) => ({
        ...previous,
        ...response.data,
      }));

      updateStoredUser(response.data);

      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (changingPassword) return;
    

    if (
      !formData.current_password ||
      !formData.new_password ||
      !formData.new_password_confirm
    ) {
      toast.error("Please fill all password fields.");
      return;
    }
    if (formData.new_password.length < 8) {
        toast.error("Password must be at least 8 characters.");
        return;
    }

    if (
      formData.new_password !==
      formData.new_password_confirm
    ) {
      toast.error("New passwords do not match.");
      return;
    }

    try {
      setChangingPassword(true);

      await api.patch("/accounts/me/", {
        current_password:
          formData.current_password,
        new_password:
          formData.new_password,
        new_password_confirm:
          formData.new_password_confirm,
      });

      setFormData((previous) => ({
        ...previous,
        current_password: "",
        new_password: "",
        new_password_confirm: "",
      }));

      toast.success("Password changed successfully.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setChangingPassword(false);
    }
  };

if (loading) {
  return <Loader message="Loading profile..." />;
}

  return (
    <main className="min-h-screen bg-slate-100 p-5 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="font-semibold text-blue-600">
            Account Settings
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            My Profile
          </h1>

          <p className="mt-2 text-slate-500">
            Update your personal information and
            password.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-3xl text-blue-600">
              <FiUser />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              {[
                formData.first_name,
                formData.last_name,
              ]
                .filter(Boolean)
                .join(" ") || formData.username}
            </h2>

            <p className="mt-1 text-slate-500">
              @{formData.username}
            </p>

            <span className="mt-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
              {formData.role}
            </span>
          </aside>

          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Personal Information
              </h2>

              <form
                onSubmit={handleProfileSubmit}
                className="mt-6"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <ProfileInput
                    label="First Name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                  />

                  <ProfileInput
                    label="Last Name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                  />

                  <ProfileInput
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                  />

                  <ProfileInput
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Role
                    </label>

                    <input
                      value={formData.role}
                      disabled
                      className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {savingProfile ? (
                      <FiLoader className="animate-spin" />
                    ) : (
                      <FiSave />
                    )}

                    {savingProfile
                      ? "Saving..."
                      : "Save Profile"}
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <FiLock />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Change Password
                  </h2>

                  <p className="text-sm text-slate-500">
                    Use a strong and secure password.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handlePasswordSubmit}
                className="mt-6 space-y-5"
              >
                <PasswordInput
                  label="Current Password"
                  name="current_password"
                  value={formData.current_password}
                  onChange={handleChange}
                  show={showPasswords}
                />

                <PasswordInput
                  label="New Password"
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleChange}
                  show={showPasswords}
                />

                <PasswordInput
                  label="Confirm New Password"
                  name="new_password_confirm"
                  value={
                    formData.new_password_confirm
                  }
                  onChange={handleChange}
                  show={showPasswords}
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords(
                        (previous) => !previous
                      )
                    }
                    className="flex items-center gap-2 text-sm font-semibold text-slate-600"
                  >
                    {showPasswords ? (
                      <FiEyeOff />
                    ) : (
                      <FiEye />
                    )}

                    {showPasswords
                      ? "Hide passwords"
                      : "Show passwords"}
                  </button>

                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {changingPassword
                      ? "Changing..."
                      : "Change Password"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function ProfileInput({
  label,
  name,
  value,
  onChange,
  type = "text",
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}

function PasswordInput({
  label,
  name,
  value,
  onChange,
  show,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        name={name}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        autoComplete="new-password"
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}

export default Profile;