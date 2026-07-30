import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiInbox,
} from "react-icons/fi";
import Loader from "../../components/Loader";
import api from "../../api/axios";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    const fetchDashboard = async () => {
      try {

        const response = await api.get(
          "/helpdesk/tickets/dashboard/"
        );

        setDashboard(response.data);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError("Dashboard data could not be loaded.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <Loader message="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-xl bg-white p-6 text-red-600 shadow">
          {error}
        </div>
      </div>
    );
  }

  if (!dashboard) {
  return null;
}

  const cards = [
    {
      title: "Total Tickets",
      value: dashboard.total,
      icon: <FiInbox />,
      iconClass: "bg-blue-100 text-blue-600",
    },
    {
      title: "Open",
      value: dashboard.open,
      icon: <FiAlertCircle />,
      iconClass: "bg-red-100 text-red-600",
    },
    {
      title: "In Progress",
      value: dashboard.in_progress,
      icon: <FiClock />,
      iconClass: "bg-amber-100 text-amber-600",
    },
    {
      title: "Resolved",
      value: dashboard.resolved,
      icon: <FiCheckCircle />,
      iconClass: "bg-emerald-100 text-emerald-600",
    },
    {
      title: "Closed",
      value: dashboard.closed,
      icon: <FiCheckCircle />,
      iconClass: "bg-slate-200 text-slate-700",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100 p-5 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="font-semibold text-blue-600">
            Smart Campus Helpdesk
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            Overview of your campus support tickets.
          </p>
        </div>

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${card.iconClass}`}
              >
                {card.icon}
              </div>

              <p className="mt-5 text-sm font-medium text-slate-500">
                {card.title}
              </p>

              <p className="mt-1 text-3xl font-bold text-slate-900">
                {card.value}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Tickets by Priority
            </h2>

            <div className="mt-5 space-y-4">
              {dashboard.priority.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No priority data available.
                </p>
              ) : (
                dashboard.priority.map((item) => (
                  <div
                    key={item.priority}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                  >
                    <span className="font-medium text-slate-700">
                      {item.priority}
                    </span>

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
                      {item.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Tickets by Department
            </h2>

            <div className="mt-5 space-y-4">
              {dashboard.department.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No department data available.
                </p>
              ) : (
                dashboard.department.map((item) => (
                  <div
                    key={item.department__name || "no-department"}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                  >
                    <span className="font-medium text-slate-700">
                      {item.department__name || "No Department"}
                    </span>

                    <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700">
                      {item.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Dashboard;