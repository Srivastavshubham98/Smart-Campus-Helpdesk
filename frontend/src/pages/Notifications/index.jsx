import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Bell } from "lucide-react";

import api from "../../api/axios";
import Loader from "../../components/Loader";

function Notifications() {
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [markAllLoading, setMarkAllLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/helpdesk/notifications/");
            const data = response.data.results ?? response.data;

            setNotifications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(
                "Notification fetch error:",
                error.response?.data || error
            );

            setError(
                error.response?.data?.detail ||
                "Unable to load notifications."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            setMarkAllLoading(true);

            await api.patch(
                "/helpdesk/notifications/mark-all-read/"
            );

            setNotifications((previousNotifications) =>
                previousNotifications.map((notification) => ({
                    ...notification,
                    is_read: true,
                }))
            );

            toast.success("All notifications marked as read.");
        } catch (error) {
            console.error(
                "Mark all notifications error:",
                error.response?.data || error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to mark all notifications as read."
            );
        } finally {
            setMarkAllLoading(false);
        }
    };

    const handleNotificationClick = async (notification) => {
        try {
            if (!notification.is_read) {
                await api.patch(
                    `/helpdesk/notifications/${notification.id}/read/`
                );

                setNotifications((previousNotifications) =>
                    previousNotifications.map((item) =>
                        item.id === notification.id
                            ? { ...item, is_read: true }
                            : item
                    )
                );
            }

            if (notification.ticket) {
                navigate(`/tickets/${notification.ticket}`);
            }
        } catch (error) {
            console.error(
                "Notification read error:",
                error.response?.data || error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to open notification."
            );
        }
    };

    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    if (loading) {
        return <Loader message="Loading notifications..." />;
    }

    if (error) {
        return (
            <div className="mx-auto max-w-5xl p-6">
                <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                    <p className="text-red-600">{error}</p>

                    <button
                        type="button"
                        onClick={fetchNotifications}
                        className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const hasUnreadNotifications = notifications.some(
        (notification) => !notification.is_read
    );

    return (
        <div className="mx-auto max-w-5xl p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Notifications
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        View ticket updates and recent activity.
                    </p>
                </div>

                {hasUnreadNotifications && (
                    <button
                        type="button"
                        onClick={handleMarkAllRead}
                        disabled={markAllLoading}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {markAllLoading
                            ? "Marking..."
                            : "Mark all as read"}
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
                    <div className="mx-auto mb-3 w-fit rounded-full bg-amber-100 p-3">
                        <Bell className="h-6 w-6 text-amber-500" />
                    </div>

                    <h2 className="text-lg font-semibold text-gray-800">
                        No notifications yet
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        New ticket updates will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <button
                            key={notification.id}
                            type="button"
                            onClick={() =>
                                handleNotificationClick(notification)
                            }
                            className={`w-full cursor-pointer rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                                notification.is_read
                                    ? "border-gray-200 bg-white"
                                    : "border-blue-200 bg-blue-50"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex gap-3">
                                    <div className="mt-1 rounded-full bg-amber-100 p-2">
                                        <Bell className="h-5 w-5 text-amber-500" />
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-slate-900">
                                            {notification.title ||
                                                "New notification"}
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-600">
                                            {notification.message ||
                                                "You have a new ticket update."}
                                        </p>

                                        {notification.ticket_title && (
                                            <p className="mt-2 text-xs text-slate-400">
                                                Ticket:{" "}
                                                <span className="font-medium text-slate-600">
                                                    {
                                                        notification.ticket_title
                                                    }
                                                </span>
                                            </p>
                                        )}

                                        <p className="mt-2 text-xs text-slate-500">
                                            {formatDate(
                                                notification.created_at
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {!notification.is_read && (
                                    <span className="mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-600" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Notifications;