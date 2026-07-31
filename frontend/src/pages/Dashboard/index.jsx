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
    let isMounted = true;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/helpdesk/tickets/dashboard/"
        );

        if (isMounted) {
          setDashboard(response.data);
        }
      } catch (err) {
        console.error("Dashboard error:", err);

        if (isMounted) {
          setError(
            err.response?.data?.detail ||
              "Dashboard data could not be loaded."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <Loader message="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <p className="font-medium text-red-600">
            {error}
          </p>
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
      value: dashboard.total ?? 0,
      icon: FiInbox,
      iconClass: "bg-blue-100 text-blue-600",
    },
    {
      title: "Open",
      value: dashboard.open ?? 0,
      icon: FiAlertCircle,
      iconClass: "bg-red-100 text-red-600",
    },
    {
      title: "In Progress",
      value: dashboard.in_progress ?? 0,
      icon: FiClock,
      iconClass: "bg-amber-100 text-amber-600",
    },
    {
      title: "Resolved",
      value: dashboard.resolved ?? 0,
      icon: FiCheckCircle,
      iconClass: "bg-emerald-100 text-emerald-600",
    },
    {
      title: "Closed",
      value: dashboard.closed ?? 0,
      icon: FiCheckCircle,
      iconClass: "bg-slate-200 text-slate-700",
    },
  ];

  const priorityData = Array.isArray(dashboard.priority)
    ? dashboard.priority
    : [];

  const departmentData = Array.isArray(
    dashboard.department
  )
    ? dashboard.department
    : [];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8">
      <section>
        <p className="text-sm font-semibold text-blue-600 sm:text-base">
          Smart Campus Helpdesk
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Dashboard
        </h1>

        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Overview of your campus support tickets.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition sm:p-5 lg:hover:-translate-y-1 lg:hover:shadow-lg"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {card.value}
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl sm:h-12 sm:w-12 ${card.iconClass}`}
                >
                  <Icon />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Tickets by Priority
          </h2>

          <div className="mt-5 space-y-3">
            {priorityData.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                No priority data available.
              </div>
            ) : (
              priorityData.map((item) => (
                <div
                  key={item.priority}
                  className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3"
                >
                  <span className="min-w-0 truncate font-medium text-slate-700">
                    {item.priority}
                  </span>

                  <span className="flex-shrink-0 rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
                    {item.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">
            Tickets by Department
          </h2>

          <div className="mt-5 max-h-96 space-y-3 overflow-y-auto pr-1">
            {departmentData.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                No department data available.
              </div>
            ) : (
              departmentData.map((item, index) => (
                <div
                  key={
                    item.department__name ||
                    `no-department-${index}`
                  }
                  className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3"
                >
                  <span className="min-w-0 break-words font-medium text-slate-700">
                    {item.department__name ||
                      "No Department"}
                  </span>

                  <span className="flex-shrink-0 rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700">
                    {item.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

export default Dashboard;