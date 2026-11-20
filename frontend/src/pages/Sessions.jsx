import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useGoals } from "../context/GoalsContext";
import { useSubjects } from "../context/SubjectsContext";
import { useTasks } from "../context/TasksContext";
import { useSessions } from "../context/SessionsContext";
import { logoutUser } from "../api/authService";
import Modal from "../components/Modal";

function Sessions() {
  const navigate = useNavigate();
  const { goals } = useGoals();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };
  const { subjects } = useSubjects();
  const { tasks } = useTasks();

  const {
    sessions,
    loading,
    error,
    addSession,
    updateSession,
    deleteSession,
  } = useSessions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  const [formData, setFormData] = useState({
    goalId: "",
    subjectId: "",
    taskId: "",
    duration: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Get subjects belonging to selected goal
  const availableSubjects = subjects.filter(
    (subject) => subject.goalId === formData.goalId
  );

  // Get tasks belonging to selected subject
  const availableTasks = tasks.filter(
    (task) => task.subjectId === formData.subjectId
  );

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
      ...(name === "goalId" ? { subjectId: "", taskId: "" } : {}),
      ...(name === "subjectId" ? { taskId: "" } : {}),
    }));
  };

  const handleOpenAdd = () => {
    setFormData({
      goalId: "",
      subjectId: "",
      taskId: "",
      duration: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setEditingId(null);
    setActionError("");
    setIsModalOpen(true);
  };

  // Edit session
  const handleEdit = (session) => {
    setEditingId(session.id);
    setFormData({
      goalId: session.goalId,
      subjectId: session.subjectId,
      taskId: session.taskId || "",
      duration: session.duration.toString(),
      date: session.sessionDate || "",
      notes: session.description || "",
    });
    setActionError("");
    setIsModalOpen(true);
  };

  // Close modal and reset form
  const handleCloseModal = () => {
    setFormData({
      goalId: "",
      subjectId: "",
      taskId: "",
      duration: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setEditingId(null);
    setActionError("");
    setIsModalOpen(false);
  };

  // Add or update learning session
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.goalId || !formData.subjectId) {
      setActionError("Please select a goal and subject.");
      return;
    }

    const durationNum = Number(formData.duration);
    if (!Number.isFinite(durationNum) || durationNum <= 0) {
      setActionError("Please enter a valid positive duration.");
      return;
    }

    if (durationNum > 1440) {
      setActionError("Session duration cannot exceed 1440 minutes (24 hours).");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    if (formData.date > todayStr) {
      setActionError("Session date cannot be in the future.");
      return;
    }

    const sessionData = {
      goalId: formData.goalId,
      subjectId: formData.subjectId,
      taskId: formData.taskId || null,
      duration: durationNum,
      sessionDate: formData.date,
      description: formData.notes.trim(),
    };

    setSaving(true);
    setActionError("");

    try {
      if (editingId) {
        await updateSession(editingId, sessionData);
      } else {
        await addSession(sessionData);
      }

      handleCloseModal();
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          "Failed to save learning session"
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete session
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this learning session?"
    );

    if (!confirmDelete) return;

    setActionError("");

    try {
      await deleteSession(id);
      if (editingId === id) {
        handleCloseModal();
      }
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          "Failed to delete learning session"
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8EE] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="font-medium text-[#375534] hover:underline"
          >
            ← Back to Dashboard
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-[#AEC3B0]/60 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 hover:border-red-200 shadow-sm transition"
          >
            Log Out
          </button>
        </div>

        {/* Heading & Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0F2A1D]">
              Learning Sessions
            </h1>
            <p className="text-gray-600 mt-2">
              Log and review your focused study time.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="rounded-lg bg-[#375534] px-5 py-3 font-medium text-white shadow-sm hover:bg-[#294226] transition"
          >
            + Log New Session
          </button>
        </div>

        {error && (
          <p className="mb-6 rounded-lg bg-red-50 p-4 text-red-600">
            {error}
          </p>
        )}

        {actionError && !isModalOpen && (
          <p className="mb-6 rounded-lg bg-red-50 p-4 text-red-600">
            {actionError}
          </p>
        )}

        {/* Modal Submit Form */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingId ? "Edit Learning Session" : "Log Learning Session"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {actionError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {actionError}
              </p>
            )}

            {/* Select Goal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Goal *
              </label>
              <select
                name="goalId"
                value={formData.goalId}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
              >
                <option value="">Choose a goal</option>
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Subject *
              </label>
              <select
                name="subjectId"
                value={formData.subjectId}
                onChange={handleChange}
                required
                disabled={!formData.goalId}
                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534] disabled:bg-gray-100"
              >
                <option value="">Choose a subject</option>
                {availableSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Task Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link to Task (Optional)
              </label>
              <select
                name="taskId"
                value={formData.taskId}
                onChange={handleChange}
                disabled={!formData.subjectId}
                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534] disabled:bg-gray-100"
              >
                <option value="">No task linked</option>
                {availableTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title} ({task.status})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Linking a task will automatically move it from &ldquo;Not Started&rdquo; to &ldquo;In Progress&rdquo;.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Minutes) *
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="1"
                  max="1440"
                  placeholder="Example: 45"
                  required
                  className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
                />
              </div>

              {/* Learning Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  required
                  className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="What topics or problems did you work on?"
                rows="3"
                className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#375534] px-6 py-2.5 font-medium text-white shadow-sm hover:bg-[#294226] disabled:opacity-50 transition"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Session"
                    : "Save Session"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Learning Sessions List */}
        <div>
          <h2 className="text-xl font-semibold text-[#0F2A1D] mb-4">
            Your Recorded Sessions ({sessions.length})
          </h2>

          {loading ? (
            <div className="bg-white p-8 rounded-xl text-center shadow-sm border border-[#AEC3B0]/40">
              <p className="text-gray-500">
                Loading learning sessions...
              </p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white p-12 rounded-xl text-center shadow-sm border border-[#AEC3B0]/40">
              <p className="text-lg text-gray-500">
                No learning sessions recorded yet.
              </p>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="mt-4 rounded-lg bg-[#375534] px-5 py-2.5 font-medium text-white hover:bg-[#294226] transition shadow-sm"
              >
                Log your first session
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {sessions.map((session) => {
                const goal = goals.find(
                  (item) => item.id === session.goalId
                );

                const subject = subjects.find(
                  (item) => item.id === session.subjectId
                );

                const linkedTask = tasks.find(
                  (item) => item.id === session.taskId
                );

                return (
                  <div
                    key={session.id}
                    className="bg-white rounded-xl shadow-sm border border-[#AEC3B0]/40 hover:border-[#375534] p-6 flex flex-col justify-between hover:shadow-md transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-lg text-[#0F2A1D]">
                          {subject?.name || "Subject unavailable"}
                        </h3>
                        <span className="rounded-full bg-[#E3EED4] text-[#0F2A1D] px-3 py-1 text-xs font-semibold whitespace-nowrap">
                          {session.duration} mins
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mt-1">
                        Goal: <span className="font-medium text-gray-700">{goal?.title || "Goal unavailable"}</span>
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        Date: <span className="font-medium text-gray-700">{session.sessionDate || "No date"}</span>
                      </p>

                      {linkedTask && (
                        <p className="text-xs text-[#375534] mt-1 font-medium">
                          Linked Task: <span>{linkedTask.title}</span>
                        </p>
                      )}

                      {session.description && (
                        <p className="mt-3 text-sm text-gray-600 line-clamp-3 bg-[#F4F8EE] rounded-lg p-3 border border-[#AEC3B0]/30">
                          {session.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => handleEdit(session)}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 transition"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(session.id)}
                        className="rounded-lg border border-red-200 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sessions;
