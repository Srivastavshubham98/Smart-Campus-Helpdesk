import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FiArrowLeft,
    FiCalendar,
    FiUser,
    FiTag,
    FiClock,
} from "react-icons/fi";
import Loader from "../../components/Loader";
import api from "../../api/axios";
import toast from "react-hot-toast";

function TicketDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [ticket, setTicket] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [staffUsers, setStaffUsers] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState("");
    const [assignLoading, setAssignLoading] = useState(false);
    const storedUser = localStorage.getItem("user");
    const [comments, setComments] = useState([]);
    const [commentMessage, setCommentMessage] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);

    let user = null;

    try {
        user =
            storedUser && storedUser !== "undefined"
                ? JSON.parse(storedUser)
                : null;
    } catch {
        user = null;
    }
    const [selectedStatus, setSelectedStatus] = useState("");
    const [statusLoading, setStatusLoading] = useState(false);

    useEffect(() => {
        const fetchTicketDetails = async () => {
            try {
                setLoading(true);
                setError("");

                const requests = [
                    api.get(`/helpdesk/tickets/${id}/`),
                    api.get(`/helpdesk/tickets/${id}/activity/`),
                ];

                if (user?.role === "ADMIN") {
                    requests.push(api.get("/accounts/staff/"));
                }

                const responses = await Promise.all(requests);

                const ticketResponse = responses[0];
                const activityResponse = responses[1];
                const staffResponse = responses[2];

                setTicket(ticketResponse.data);

                setActivities(
                    activityResponse.data.results ??
                    activityResponse.data
                );

                if (staffResponse) {
                    setStaffUsers(
                        staffResponse.data.results ??
                        staffResponse.data
                    );
                }

                setSelectedStatus(ticketResponse.data.status);
                setSelectedStaff(
                    ticketResponse.data.assigned_to
                        ? String(ticketResponse.data.assigned_to)
                        : ""
                );
            } catch (err) {
                console.error("Ticket details error:", err);

                setError(
                    err.response?.data?.detail ||
                    "Ticket details could not be loaded."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchTicketDetails();
    }, [id, user?.role]);

    const getStatusStyle = (status) => {
        switch (status) {
            case "OPEN":
                return "bg-blue-100 text-blue-700";

            case "IN_PROGRESS":
                return "bg-yellow-100 text-yellow-700";

            case "RESOLVED":
                return "bg-green-100 text-green-700";

            case "CLOSED":
                return "bg-slate-200 text-slate-700";

            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const getPriorityStyle = (priority) => {
        switch (priority) {
            case "HIGH":
                return "bg-red-100 text-red-700";

            case "MEDIUM":
                return "bg-orange-100 text-orange-700";

            case "LOW":
                return "bg-green-100 text-green-700";

            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "Not available";
        }

        return new Date(dateValue).toLocaleString();
    };
    const handleAssignTicket = async () => {
        if (!selectedStaff) {
            toast.error("Please select a staff member.");
            return;
        }

        try {
            setAssignLoading(true);

            const response = await api.patch(
                `/helpdesk/tickets/${id}/`,
                {
                    assigned_to: Number(selectedStaff),
                }
            );

            setTicket(response.data);

            const activityResponse = await api.get(
                `/helpdesk/tickets/${id}/activity/`
            );

            setActivities(
                activityResponse.data.results ??
                activityResponse.data
            );

            toast.success("Ticket assigned successfully.");
        } catch (err) {
            console.error("Assign ticket error:", err);
            toast.error(
                err.response?.data?.detail || "Unable to assign ticket."
            );
        } finally {
            setAssignLoading(false);
        }
    };


    const handleStatusUpdate = async () => {
        if (!selectedStatus || selectedStatus === ticket.status) {
            return;
        }

        try {
            setStatusLoading(true);

            const response = await api.patch(
                `/helpdesk/tickets/${ticket.id}/`,
                {
                    status: selectedStatus,
                }
            );

            setTicket(response.data);
            setSelectedStatus(response.data.status);

            const activityResponse = await api.get(
                `/helpdesk/tickets/${ticket.id}/activity/`
            );

            setActivities(
                activityResponse.data.results ??
                activityResponse.data
            );

            toast.success("Ticket status updated successfully.");
        } catch (error) {
            console.error(
                "Status update error:",
                error.response?.data || error
            );

            toast.error(
                error.response?.data?.detail ||
                "Failed to update ticket status."
            );
        } finally {
            setStatusLoading(false);
        }
    };
    const fetchComments = async () => {
        try {
            const response = await api.get(
                `/helpdesk/comments/?ticket=${id}`
            );

            const data = response.data.results ?? response.data;
            setComments(data);
        } catch (error) {
            console.error("Failed to load comments:", error);
        }
    };
    useEffect(() => {
        fetchComments();
    }, [id]);


    const handleAddComment = async () => {
        const trimmedMessage = commentMessage.trim();

        if (!trimmedMessage) {
            toast.error("Please write a comment.");
            return;
        }

        try {
            setCommentLoading(true);

            await api.post("/helpdesk/comments/", {
                ticket: Number(id),
                message: trimmedMessage,
            });

            setCommentMessage("");
            toast.success("Comment posted successfully.");

            await fetchComments();
        } catch (error) {
            console.error("Comment error:", error);

            toast.error(
                error.response?.data?.detail ||
                "Unable to post comment."
            );
        } finally {
            setCommentLoading(false);
        }
    };

    if (loading) {
        return <Loader message="Loading ticket details..." />;
    }

    if (error || !ticket) {
        return (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <p className="text-red-600">
                    {error || "Ticket not found."}
                </p>

                <button
                    onClick={() => navigate("/tickets")}
                    className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
                >
                    Back to Tickets
                </button>
            </div>
        );
    }

    const handleDeleteComment = async (commentId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this comment?"
        );

        if (!confirmed) return;

        try {
            await api.delete(`/helpdesk/comments/${commentId}/`);

            setComments((previousComments) =>
                previousComments.filter(
                    (comment) => comment.id !== commentId
                )
            );

            toast.success("Comment deleted successfully.");
        } catch (error) {
            console.error(
                "Delete comment error:",
                error.response?.data || error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to delete comment."
            );
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="flex items-start gap-4">
                    <button
                        onClick={() => navigate("/tickets")}
                        className="mt-1 rounded-xl bg-white p-3 text-slate-600 shadow-sm transition hover:bg-slate-200"
                    >
                        <FiArrowLeft />
                    </button>

                    <div>
                        <p className="text-sm font-semibold text-blue-600">
                            Ticket #{ticket.id}
                        </p>

                        <h1 className="mt-1 text-3xl font-bold text-slate-800">
                            {ticket.title}
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Complete ticket information and activity history
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <span
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${getPriorityStyle(
                            ticket.priority
                        )}`}
                    >
                        {ticket.priority} Priority
                    </span>

                    <span
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${getStatusStyle(
                            ticket.status
                        )}`}
                    >
                        {ticket.status?.replace("_", " ")}
                    </span>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <section className="rounded-2xl bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-800">
                            Ticket Description
                        </h2>

                        <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-600">
                            {ticket.description}
                        </p>
                    </section>
                    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-5">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Comments
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Communicate with the student, staff and administrator.
                            </p>
                        </div>

                        <div className="mb-6 max-h-96 space-y-4 overflow-y-auto">
                            {comments.length === 0 ? (
                                <div className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500">
                                    No comments yet.
                                </div>
                            ) : (
                                comments.map((comment) => (
                                    <div
                                        key={comment.id}
                                        className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                                    >
                                        <div className="mb-2 flex items-center justify-between gap-4">
                                            <div>
                                                <span className="font-semibold text-gray-900">
                                                    {comment.author_username ||
                                                        (typeof comment.author === "string"
                                                            ? comment.author
                                                            : comment.author?.username) ||
                                                        "User"}
                                                </span>

                                                {(comment.author_role ||
                                                    comment.author?.role) && (
                                                        <span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                                                            {comment.author_role ||
                                                                comment.author?.role}
                                                        </span>
                                                    )}
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-gray-500">
                                                    {comment.created_at
                                                        ? new Date(comment.created_at).toLocaleString()
                                                        : ""}
                                                </span>

                                                {(user?.role === "ADMIN" ||
                                                    Number(comment.author_id) === Number(user?.id)) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="text-xs font-semibold text-red-600 hover:text-red-800"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                            </div>
                                        </div>

                                        <p className="whitespace-pre-wrap text-sm text-gray-700">
                                            {comment.message}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="space-y-3">
                            <textarea
                                value={commentMessage}
                                onChange={(event) =>
                                    setCommentMessage(event.target.value)
                                }
                                placeholder="Write a comment, for example: I will check this issue."
                                rows={4}
                                maxLength={1000}
                                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />

                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400">
                                    {commentMessage.length}/1000
                                </span>

                                <button
                                    type="button"
                                    onClick={handleAddComment}
                                    disabled={
                                        commentLoading || !commentMessage.trim()
                                    }
                                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {commentLoading
                                        ? "Posting..."
                                        : "Post Comment"}
                                </button>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-800">
                            Activity Timeline
                        </h2>

                        {activities.length === 0 ? (
                            <p className="mt-5 text-sm text-slate-500">
                                No activity found.
                            </p>
                        ) : (
                            <div className="mt-6 space-y-5">
                                {activities.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="relative border-l-2 border-blue-200 pl-6"
                                    >
                                        <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-blue-600" />

                                        <p className="font-semibold text-slate-800">
                                            {activity.action?.replaceAll("_", " ")}
                                        </p>

                                        {(activity.old_value || activity.new_value) && (
                                            <p className="mt-1 text-sm text-slate-600">
                                                {activity.old_value || "Empty"}
                                                {" → "}
                                                {activity.new_value || "Empty"}
                                            </p>
                                        )}

                                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                                            <span>
                                                By:{" "}
                                                {activity.username ||
                                                    activity.user_username ||
                                                    "System"}
                                            </span>

                                            <span>
                                                {formatDate(
                                                    activity.created_at ||
                                                    activity.timestamp
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <div className="space-y-6">
                    <section className="rounded-2xl bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-800">
                            Ticket Information
                        </h2>

                        <div className="mt-6 space-y-5">
                            <div className="flex gap-3">
                                <FiTag className="mt-1 text-blue-600" />

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Department
                                    </p>

                                    <p className="mt-1 font-medium text-slate-700">
                                        {ticket.department_name || "Not assigned"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <FiUser className="mt-1 text-blue-600" />

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Created By
                                    </p>

                                    <p className="mt-1 font-medium text-slate-700">
                                        {ticket.created_by_username ||
                                            ticket.created_by ||
                                            "Unknown"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <FiUser className="mt-1 text-blue-600" />

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Assigned To
                                    </p>

                                    <p className="mt-1 font-medium text-slate-700">
                                        {ticket.assigned_to_username || "Unassigned"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <FiCalendar className="mt-1 text-blue-600" />

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Created At
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-slate-700">
                                        {formatDate(ticket.created_at)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <FiClock className="mt-1 text-blue-600" />

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                        Last Updated
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-slate-700">
                                        {formatDate(ticket.updated_at)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                    {user?.role === "ADMIN" && (
                        <section className="rounded-2xl bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-800">
                                Assign Staff
                            </h2>

                            <select
                                value={selectedStaff}
                                onChange={(e) => setSelectedStaff(e.target.value)}
                                className="mt-4 w-full rounded-xl border p-3"
                            >
                                <option value="">Select Staff</option>

                                {staffUsers.map((staff) => (
                                    <option key={staff.id} value={staff.id}>
                                        {staff.username}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={handleAssignTicket}
                                disabled={assignLoading || !selectedStaff}
                                className="mt-4 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {assignLoading ? "Assigning..." : "Assign Ticket"}
                            </button>
                        </section>
                    )}

                    {(user?.role === "STAFF" || user?.role === "ADMIN") && (
                        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h2 className="text-2xl font-semibold text-slate-900 mb-5">
                                Update Status
                            </h2>

                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="OPEN">Open</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="RESOLVED">Resolved</option>

                                {user?.role === "ADMIN" && (
                                    <option value="CLOSED">Closed</option>
                                )}
                            </select>

                            <button
                                onClick={handleStatusUpdate}
                                disabled={statusLoading || selectedStatus === ticket?.status}
                                className="w-full mt-4 rounded-xl bg-blue-600 px-5 py-3
                 font-semibold text-white hover:bg-blue-700
                 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {statusLoading ? "Updating..." : "Update Status"}
                            </button>
                        </section>
                    )}


                    {ticket.attachment && (
                        <section className="rounded-2xl bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-800">
                                Attachment
                            </h2>

                            <a
                                href={ticket.attachment}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-4 block rounded-xl bg-blue-50 px-4 py-3 text-center font-medium text-blue-700 hover:bg-blue-100"
                            >
                                View Attachment
                            </a>
                        </section>
                    )}

                </div>
            </div>
        </div>
    );
}

export default TicketDetails;