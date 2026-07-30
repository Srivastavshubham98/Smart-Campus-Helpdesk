import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../api/axios";

function Navbar() {
    const location = useLocation();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchUser = async () => {
            try {
                const response = await api.get("/accounts/me/");

                if (isMounted) {
                    setUser(response.data);
                }
            } catch (error) {
                // Navbar ko crash ya error toast nahi dikhana chahiye.
                if (isMounted) {
                    setUser(null);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchUser();

        return () => {
            isMounted = false;
        };
    }, []);

    const pageDetails = useMemo(() => {
        const pathname = location.pathname;

        if (pathname === "/dashboard") {
            return {
                title: "Dashboard",
                subtitle: "Welcome back 👋",
            };
        }

        if (pathname === "/tickets") {
            return {
                title: "Tickets",
                subtitle: "View and manage support tickets.",
            };
        }

        if (pathname === "/tickets/create") {
            return {
                title: "Create Ticket",
                subtitle: "Submit a new campus support request.",
            };
        }

        if (/^\/tickets\/\d+$/.test(pathname)) {
            return {
                title: "Ticket Details",
                subtitle: "View ticket information and activity.",
            };
        }

        if (pathname === "/notifications") {
            return {
                title: "Notifications",
                subtitle: "View your latest ticket updates.",
            };
        }

        if (pathname === "/users") {
            return {
                title: "Users",
                subtitle: "Manage students, staff and administrators.",
            };
        }

        if (pathname === "/departments") {
            return {
                title: "Departments",
                subtitle: "Manage campus support departments.",
            };
        }

        if (pathname === "/profile") {
            return {
                title: "Profile",
                subtitle: "View and manage your account.",
            };
        }

        return {
            title: "Smart Campus Helpdesk",
            subtitle: "Campus support management system.",
        };
    }, [location.pathname]);

    const displayName =
        user?.full_name ||
        [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
        user?.username ||
        "User";

    const initial = displayName.charAt(0).toUpperCase();

    const formattedRole = user?.role
        ? user.role
              .toLowerCase()
              .replaceAll("_", " ")
              .replace(/\b\w/g, (letter) => letter.toUpperCase())
        : "Member";

    return (
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
            <div className="min-w-0">
                <h2 className="truncate text-xl font-bold text-slate-800 sm:text-2xl">
                    {pageDetails.title}
                </h2>

                <p className="mt-0.5 hidden truncate text-sm text-slate-500 sm:block">
                    {pageDetails.subtitle}
                </p>
            </div>

            <div className="flex flex-shrink-0 items-center gap-3">
                {loading ? (
                    <>
                        <div className="h-11 w-11 animate-pulse rounded-full bg-slate-200" />

                        <div className="hidden sm:block">
                            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                            <div className="mt-2 h-3 w-16 animate-pulse rounded bg-slate-200" />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white shadow-sm">
                            {initial}
                        </div>

                        <div className="hidden sm:block">
                            <p className="max-w-40 truncate font-semibold text-slate-800">
                                {displayName}
                            </p>

                            <p className="text-sm text-slate-500">
                                {formattedRole}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}

export default Navbar;