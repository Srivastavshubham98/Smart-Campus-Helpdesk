import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

function CreateTicketModal({
  isOpen,
  onClose,
  onTicketCreated,
}) {
  const [departments, setDepartments] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    department: "",
    priority: "LOW",
    attachment: null,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchDepartments = async () => {
      try {
        const response = await api.get("/helpdesk/departments/");
        setDepartments(response.data.results || response.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchDepartments();
  }, [isOpen]);

  const handleCreateTicket = async () => {
    try {
      if (
        !formData.title ||
        !formData.description ||
        !formData.department
      ) {
        toast.error("Please fill all required fields.");
        return;
      }

      setLoading(true);

      const data = new FormData();

      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("department", formData.department);
      data.append("priority", formData.priority);

      if (formData.attachment) {
        data.append("attachment", formData.attachment);
      }

      await api.post("/helpdesk/tickets/", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      onTicketCreated();

      setFormData({
        title: "",
        description: "",
        department: "",
        priority: "LOW",
        attachment: null,
      });

      onClose();

      toast.success("Ticket created successfully!");

    } catch (error) {
      console.error(error);
      toast.error("Unable to create ticket.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
      <div className="mx-auto my-6 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="max-h-[85vh] overflow-y-auto pr-2">
        <h2 className="text-2xl font-bold">
          Create New Ticket
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Fill the details below.
        </p>

        <div className="mt-6 space-y-5">

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Department
            </label>

            <select
              value={formData.department}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  department: e.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="">Select Department</option>

              {departments.map((department) => (
                <option
                  key={department.id}
                  value={department.id}
                >
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Title
            </label>

            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  title: e.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Enter ticket title"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Priority
            </label>

            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priority: e.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Description
            </label>

            <textarea
              rows="5"
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              placeholder="Describe your issue..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Attachment
            </label>

            <input
              type="file"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  attachment: e.target.files[0],
                })
              }
              className="w-full"
            />
            <div className="sticky bottom-0 mt-6 flex justify-end gap-3 border-t bg-white pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateTicket}
                disabled={loading}
                className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Ticket"}
              </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default CreateTicketModal;