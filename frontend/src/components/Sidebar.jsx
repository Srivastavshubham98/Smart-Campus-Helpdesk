import { useCallback, useEffect, useMemo, useState } from "react";
import {
    NavLink,
    useLocation,
    useNavigate,
} from "react-router-dom";
import {
    FiBell,
    FiFileText,
    FiGrid,
    FiLogOut,
    FiUser,
    FiUsers,
} from "react-icons/fi";

import api from "../api/axios";

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const [unreadCount, setUnreadCount] = useState(0);

    const currentUser = useMemo(() => {
        try {
            const storedUser = localStorage.getItem("user");

            return storedUser ? JSON.parse(storedUser) : null;
        } catch {
            return null;
        }
    }, [location.pathname]);

    const formattedRole = currentUser?.role
        ? currentUser.role
              .toLowerCase()
              .replaceAll("_", " ")
              .replace(/\b\w/g, (letter) => letter.toUpperCase())
        : "";

    const displayName =
        currentUser?.full_name ||
        [currentUser?.first_name, currentUser?.last_name]
            .filter(Boolean)
            .join(" ") ||
        currentUser?.username ||
        "User";

    const menuItems = useMemo(
        () => [
            {
                name: "Dashboard",
                path: "/dashboard",
                icon: FiGrid,
                end: true,
            },
            {
                name: "Tickets",
                path: "/tickets",
                icon: FiFileText,
                end: false,
            },
            {
                name: "Notifications",
                path: "/notifications",
                icon: FiBell,
                end: false,
            },
            ...(currentUser?.role === "ADMIN"
                ? [
                      {
                          name: "Users",
                          path: "/users",
                          icon: FiUsers,
                          end: false,
                      },
                  ]
                : []),
            {
                name: "Profile",
                path: "/profile",
                icon: FiUser,
                end: false,
            },
        ],
        [currentUser?.role]
    );

    const fetchUnreadCount = useCallback(async () => {
        try {
            const response = await api.get(
                "/helpdesk/notifications/unread-count/"
            );

            const count = Number(response.data?.unread_count);

            setUnreadCount(
                Number.isFinite(count) && count > 0 ? count : 0
            );
        } catch (error) {
            setUnreadCount(0);

            console.error(
                "Unread notification count error:",
                error.response?.data || error
            );
        }
    }, []);

    useEffect(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount, location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("user");

        navigate("/", {
            replace: true,
        });
    };

    return (
        <aside className="flex min-h-screen w-64 flex-shrink-0 flex-col bg-slate-950 text-white">
            <div className="border-b border-slate-800 px-6 py-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
                    Smart Campus
                </p>

                <h1 className="mt-2 text-xl font-bold">
                    Helpdesk System
                </h1>

                {currentUser && (
                    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 px-3 py-3">
                        <p className="truncate text-sm font-semibold text-white">
                            {displayName}
                        </p>

                        <p className="mt-1 text-xs font-medium text-blue-400">
                            {formattedRole}
                        </p>
                    </div>
                )}
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
                {menuItems.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                                    isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                }`
                            }
                        >
                            <Icon className="flex-shrink-0 text-lg" />

                            <span className="flex-1">
                                {item.name}
                            </span>

                            {item.name === "Notifications" &&
                                unreadCount > 0 && (
                                    <span className="flex min-w-6 items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                                        {unreadCount > 99
                                            ? "99+"
                                            : unreadCount}
                                    </span>
                                )}
                        </NavLink>
                    );
                })}
            </nav>

            <div className="border-t border-slate-800 p-4">
                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
                >
                    <FiLogOut className="text-lg" />
                    Logout
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;