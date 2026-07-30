import { useEffect, useMemo, useState } from "react";
import {
  FiEdit2,
  FiLoader,
  FiPlus,
  FiRefreshCw,
  FiUserCheck,
  FiUserX,
  FiX,
} from "react-icons/fi";
import toast from "react-hot-toast";
import Loader from "../../components/Loader";
import api from "../../api/axios";

const emptyForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  role: "STUDENT",
  is_active: true,
  password: "",
};

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const loggedInUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await api.get("/accounts/users/");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      setUsers(data);
    } catch (error) {
      console.error("Users error:", error.response?.data || error);
      toast.error(
        error.response?.data?.detail ||
          "Users could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);

    setFormData({
      username: user.username || "",
      email: user.email || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      role: user.role || "STUDENT",
      is_active: user.is_active,
      password: "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingUser(null);
    setFormData(emptyForm);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: type === "checkbox" ? checked : value,
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
      const firstValue = data[firstKey];

      if (Array.isArray(firstValue)) {
        return firstValue[0];
      }

      if (typeof firstValue === "string") {
        return firstValue;
      }
    }

    return data.detail || "Request failed.";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !formData.username.trim() ||
      !formData.first_name.trim() ||
      !formData.role
    ) {
      toast.error("Username, first name and role are required.");
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      toast.error("Password is required for a new user.");
      return;
    }

    const payload = {
      username: formData.username.trim(),
      email: formData.email.trim(),
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      role: formData.role,
      is_active: formData.is_active,
    };

    if (formData.password.trim()) {
      payload.password = formData.password;
    }

    try {
      setSaving(true);

      if (editingUser) {
        await api.patch(
          `/accounts/users/${editingUser.id}/`,
          payload
        );

        toast.success("User updated successfully.");
      } else {
        await api.post("/accounts/users/", payload);

        toast.success("User created successfully.");
      }

      closeModal();
      await fetchUsers();
    } catch (error) {
      console.error(
        "Save user error:",
        error.response?.data || error
      );

      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleUserStatus = async (user) => {
    if (loggedInUser?.id === user.id && user.is_active) {
      toast.error("You cannot deactivate your own account.");
      return;
    }

    try {
      await api.patch(`/accounts/users/${user.id}/`, {
        is_active: !user.is_active,
      });

      toast.success(
        user.is_active
          ? "User deactivated."
          : "User activated."
      );

      await fetchUsers();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loggedInUser?.role !== "ADMIN") {
    return (
      <main className="min-h-screen bg-slate-100 p-6 sm:p-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Access denied
          </h1>

          <p className="mt-2 text-slate-500">
            Only admin users can access user management.
          </p>
        </div>
      </main>
    );
  }
  if (loading) {
  return <Loader message="Loading users..." />;
}

  return (
    <main className="min-h-screen bg-slate-100 p-5 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-blue-600">
              Administration
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              User Management
            </h1>

            <p className="mt-2 text-slate-500">
              Create staff and admin accounts, assign roles and
              manage account status.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={fetchUsers}
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <FiRefreshCw />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              <FiPlus />
              Create User
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-80 items-center justify-center">
              <FiLoader className="animate-spin text-4xl text-blue-600" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-slate-50 text-sm text-slate-600">
                  <tr>
                    <th className="px-5 py-4">Username</th>
                    <th className="px-5 py-4">Name</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {user.username}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {[user.first_name, user.last_name]
                          .filter(Boolean)
                          .join(" ") || "—"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {user.email || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                          {user.role}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            user.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            <FiEdit2 />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleUserStatus(user)}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                              user.is_active
                                ? "bg-red-50 text-red-700 hover:bg-red-100"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {user.is_active ? (
                              <FiUserX />
                            ) : (
                              <FiUserCheck />
                            )}

                            {user.is_active
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingUser ? "Edit User" : "Create User"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingUser
                    ? "Update user details, role or account status."
                    : "Create a student, staff or admin account."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <FiX size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    First Name
                  </label>

                  <input
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Last Name
                  </label>

                  <input
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Username
                  </label>

                  <input
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    autoComplete="username"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email
                  </label>

                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Role
                  </label>

                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="STAFF">Staff</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Password
                  </label>

                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    placeholder={
                      editingUser
                        ? "Leave blank to keep current password"
                        : "Enter password"
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <input
                  name="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4"
                />

                <span className="font-medium text-slate-700">
                  Account is active
                </span>
              </label>

              <div className="mt-7 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingUser
                      ? "Save Changes"
                      : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default Users;