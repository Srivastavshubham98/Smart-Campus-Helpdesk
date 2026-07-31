import { useEffect, useState } from "react";
import api from "../../api/axios";
import { FiSearch, FiPlus, FiEye } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import CreateTicketModal from "../../components/CreateTicketModal";
import Loader from "../../components/Loader";

function Tickets() {
    const [tickets, setTickets] = useState([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [priority, setPriority] = useState("");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [department, setDepartment] = useState("");
    const [departments, setDepartments] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalTickets, setTotalTickets] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [previousPage, setPreviousPage] = useState(null);
    

    const fetchTickets = async () => {
        try {
            setLoading(true);

            const response = await api.get("/helpdesk/tickets/", {
                params: {
                    search: search || undefined,
                    status: status || undefined,
                    priority: priority || undefined,
                    department: department || undefined,
                    page: currentPage,
                },
            });

            const data = response.data.results || response.data;
            setTickets(data);
            setTotalTickets(response.data.count ?? data.length);
            setNextPage(response.data.next || null);
            setPreviousPage(response.data.previous || null);
        } catch (error) {
            console.error("Tickets fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
    try {
        let allDepartments = [];
        let nextUrl = "/helpdesk/departments/";

        while (nextUrl) {
            const response = await api.get(nextUrl);

            const pageDepartments =
                response.data.results || response.data;

            allDepartments = [
                ...allDepartments,
                ...pageDepartments,
            ];

            if (response.data.next) {
                nextUrl = response.data.next.replace(
                    "https://smart-campus-helpdesk-backend.onrender.com/api",
                    ""
                );
            } else {
                nextUrl = null;
            }
        }

        setDepartments(allDepartments);
    } catch (error) {
        console.error("Departments fetch error:", error);
    }
};
    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTickets();
        }, 500);

        return () => clearTimeout(timer);
    }, [search, status, priority, department, currentPage]);

    const getStatusStyle = (ticketStatus) => {
        switch (ticketStatus) {
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

    const getPriorityStyle = (ticketPriority) => {
        switch (ticketPriority) {
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
    if (loading) {
    return <Loader message="Loading tickets..." />;
}

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">
                        Tickets
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        View and manage campus helpdesk tickets
                    </p>
                </div>

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
                >
                    <FiPlus />
                    Create Ticket
                </button>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <div className="relative">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

                        <input
                            type="text"
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Search tickets..."
                            className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none transition focus:border-blue-500"
                        />
                    </div>

                    <select
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value);
                            setCurrentPage(1);
                        }}
                        className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                    </select>

                    <select
                        value={priority}
                        onChange={(event) => {
                            setPriority(event.target.value);
                            setCurrentPage(1);
                        }}
                        className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    >
                        <option value="">All Priority</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                    </select>
                    <select
                        value={department}
                        onChange={(event) => {
                            setDepartment(event.target.value);
                            setCurrentPage(1);
                        }}
                        className="rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                    >
                        <option value="">All Departments</option>

                        {departments.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={() => {
                            setSearch("");
                            setStatus("");
                            setPriority("");
                            setDepartment("");
                            setCurrentPage(1);
                        }}
                        disabled={!search && !status && !priority && !department}
                        className="rounded-xl border border-slate-200 px-4 py-3 font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>
            <p className="text-sm text-slate-500">
                {loading
                    ? "Searching tickets..."
                    : `${totalTickets} ticket${totalTickets === 1 ? "" : "s"} found`}
            </p>

            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
               {tickets.length === 0 ? (
                    <div className="p-10 text-center text-slate-500">
                        No tickets found
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr className="text-left text-sm text-slate-500">
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4">Department</th>
                                    <th className="px-6 py-4">Priority</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Assigned To</th>
                                    <th className="px-6 py-4">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {tickets.map((ticket) => (
                                    <tr
                                        key={ticket.id}
                                        className="text-sm transition hover:bg-slate-50"
                                    >
                                        <td className="px-6 py-4 font-medium text-slate-700">
                                            #{ticket.id}
                                        </td>

                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-slate-800">
                                                {ticket.title}
                                            </p>

                                            <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                                                {ticket.description}
                                            </p>
                                        </td>

                                        <td className="px-6 py-4 text-slate-600">
                                            {ticket.department_name || "Not assigned"}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                                                    ticket.priority
                                                )}`}
                                            >
                                                {ticket.priority}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                                                    ticket.status
                                                )}`}
                                            >
                                                {ticket.status?.replace("_", " ")}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-slate-600">
                                            {ticket.assigned_to_username || "Unassigned"}
                                        </td>

                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => navigate(`/tickets/${ticket.id}`)}
                                                className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-slate-700 transition hover:bg-blue-100 hover:text-blue-700"
                                            >
                                                <FiEye />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-slate-500">
                                Page {currentPage} · {totalTickets} total tickets
                            </p>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage((page) => Math.max(page - 1, 1))
                                    }
                                    disabled={!previousPage || loading}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Previous
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage((page) => page + 1)
                                    }
                                    disabled={!nextPage || loading}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <CreateTicketModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onTicketCreated={fetchTickets}
            />
        </div>

    );
}

export default Tickets;