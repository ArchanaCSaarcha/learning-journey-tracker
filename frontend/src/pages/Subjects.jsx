import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import { useGoals } from "../context/GoalsContext";
import { useSubjects } from "../context/SubjectsContext";
import { useTasks } from "../context/TasksContext";
import { useSessions } from "../context/SessionsContext";
import { useNotes } from "../context/NotesContext";
import { logoutUser } from "../api/authService";
import Modal from "../components/Modal";

function Subjects() {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  const { goals } = useGoals();
  const { tasks } = useTasks();
  const { sessions } = useSessions();
  const { notes } = useNotes();

  const {
    subjects,
    addSubject,
    updateSubject,
    deleteSubject,
    loading,
    error,
  } = useSubjects();

  // If accessed via /goals/:id/subjects, id is present. Otherwise, null for all subjects.
  const routeGoal = goals.find((goal) => goal.id === id);

  const [filterGoalId, setFilterGoalId] = useState(id || "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(id || "");
  const [subjectName, setSubjectName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formError, setFormError] = useState("");

  // Visible subjects based on filter or route param
  const visibleSubjects = subjects.filter((subject) => {
    if (id) return subject.goalId === id;
    if (filterGoalId) return subject.goalId === filterGoalId;
    return true;
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setSelectedGoalId(id || (goals[0]?.id || ""));
    setSubjectName("");
    setDescription("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleEdit = (subject) => {
    setEditingId(subject.id);
    setSelectedGoalId(subject.goalId);
    setSubjectName(subject.name);
    setDescription(subject.description || "");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setSelectedGoalId(id || "");
    setSubjectName("");
    setDescription("");
    setFormError("");
  };

  // Add or update subject
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!subjectName.trim()) {
      setFormError("Please enter a subject name");
      return;
    }

    const targetGoalId = id || selectedGoalId;
    if (!targetGoalId) {
      setFormError("Please select a goal for this subject");
      return;
    }

    const subjectData = {
      name: subjectName.trim(),
      description: description.trim(),
    };

    setSaving(true);
    setFormError("");

    try {
      if (editingId) {
        await updateSubject(editingId, subjectData);
      } else {
        await addSubject(targetGoalId, subjectData);
      }

      handleCloseModal();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
        "Failed to save subject. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete subject with cascade count warning
  const handleDelete = async (subject) => {
    const subTasks = tasks.filter((t) => t.subjectId === subject.id);
    const subSessions = sessions.filter((s) => s.subjectId === subject.id);
    const subNotes = notes.filter((n) => n.subjectId === subject.id);

    const confirmMsg = `Are you sure you want to delete "${subject.name}"?\n\nThis will permanently delete:\n• ${subTasks.length} task(s)\n• ${subSessions.length} study session(s)\n• ${subNotes.length} note(s)\n\nThis action cannot be undone.`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setDeletingId(subject.id);
    setFormError("");

    try {
      await deleteSubject(subject.id);
      if (editingId === subject.id) {
        handleCloseModal();
      }
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
        "Failed to delete subject. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Calculate stats for a given subject
  const getSubjectStats = (subjectId) => {
    const subTasks = tasks.filter((t) => t.subjectId === subjectId);
    const completedTasks = subTasks.filter((t) => t.status === "Completed").length;
    const progress = subTasks.length === 0 ? 0 : Math.round((completedTasks / subTasks.length) * 100);

    const subSessions = sessions.filter((s) => s.subjectId === subjectId);
    const totalMinutes = subSessions.reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const remainingMins = totalMinutes % 60;
    const timeDisplay = hours > 0 ? `${hours}h ${remainingMins}m` : `${remainingMins}m`;

    return {
      totalTasks: subTasks.length,
      completedTasks,
      progress,
      totalMinutes,
      timeDisplay,
    };
  };

  return (
    <div className="min-h-screen bg-[#F4F8EE] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="font-medium text-[#375534] hover:underline"
          >
            ← Back to Dashboard
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-[#AEC3B0]/60 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 hover:border-red-200 shadow-sm transition"
          >
            Log Out
          </button>
        </div>

        {/* Heading & Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0F2A1D]">
              {routeGoal ? `Subjects for "${routeGoal.title}"` : "All Subjects"}
            </h1>
            <p className="mt-1 text-gray-600 text-sm">
              {routeGoal
                ? "Manage topics and track study progress for this goal."
                : "Browse all learning subjects across your goals."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="rounded-lg bg-[#375534] px-5 py-3 font-medium text-white shadow-sm hover:bg-[#294226] transition"
          >
            + Add New Subject
          </button>
        </div>

        {/* Goal Filter toolbar (when viewing /subjects without route param) */}
        {!id && goals.length > 0 && (
          <div className="mb-8 rounded-xl bg-white p-4 shadow-sm border border-[#AEC3B0]/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Filter by Goal:</label>
              <select
                value={filterGoalId}
                onChange={(e) => setFilterGoalId(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#375534]"
              >
                <option value="">All Goals ({goals.length})</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>

            {filterGoalId && (
              <button
                type="button"
                onClick={() => setFilterGoalId("")}
                className="text-xs font-semibold text-[#375534] hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        )}

        {error && (
          <p className="mb-6 rounded-lg bg-red-50 p-4 text-red-600">
            {error}
          </p>
        )}

        {/* Modal Submit Form */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingId ? "Edit Subject" : "Add New Subject"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* If creating without route param, allow choosing Goal */}
            {!id && !editingId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Goal *
                </label>
                <select
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:border-[#375534]"
                  required
                >
                  <option value="">Choose a goal</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Name *
              </label>
              <input
                type="text"
                placeholder="Enter subject name (e.g., State Management, Algorithms)"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
                disabled={saving}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                placeholder="Enter subject syllabus or topics..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
                rows="3"
                disabled={saving}
              />
            </div>

            {formError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {formError}
              </p>
            )}

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
                    ? "Update Subject"
                    : "Add Subject"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Subject List Grid */}
        <div>
          <h2 className="text-xl font-semibold text-[#0F2A1D] mb-4">
            Subjects ({visibleSubjects.length})
          </h2>

          {loading ? (
            <div className="bg-white p-8 rounded-xl text-center shadow-sm border border-[#AEC3B0]/40">
              <p className="text-gray-500">
                Loading subjects...
              </p>
            </div>
          ) : visibleSubjects.length === 0 ? (
            <div className="bg-white p-12 rounded-xl text-center shadow-sm border border-[#AEC3B0]/40">
              <p className="text-lg text-gray-500">
                No subjects found.
              </p>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="mt-4 rounded-lg bg-[#375534] px-5 py-2.5 font-medium text-white hover:bg-[#294226] transition shadow-sm"
              >
                Add your first subject
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleSubjects.map((subject) => {
                const parentGoal = goals.find((g) => g.id === subject.goalId);
                const stats = getSubjectStats(subject.id);

                return (
                  <div
                    key={subject.id}
                    className="bg-white p-6 rounded-xl shadow-sm border border-[#AEC3B0]/40 hover:border-[#375534] flex flex-col justify-between hover:shadow-md transition"
                  >
                    <div>
                      {parentGoal && (
                        <span className="inline-block rounded-full bg-[#E3EED4] text-[#0F2A1D] px-2.5 py-0.5 text-xs font-semibold mb-2">
                          {parentGoal.title}
                        </span>
                      )}

                      <h3 className="text-lg font-bold text-[#0F2A1D]">
                        {subject.name}
                      </h3>

                      <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                        {subject.description || "No description added."}
                      </p>

                      {/* Progress and Study Time Metrics */}
                      <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Task Progress</span>
                          <span className="font-semibold text-[#375534]">
                            {stats.completedTasks}/{stats.totalTasks} ({stats.progress}%)
                          </span>
                        </div>

                        <div className="h-1.5 w-full rounded-full bg-[#E3EED4] overflow-hidden">
                          <div
                            className="h-full bg-[#375534] rounded-full transition-all duration-300"
                            style={{ width: `${stats.progress}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-xs text-gray-600 pt-1">
                          <span>Study Time Logged:</span>
                          <span className="font-semibold text-[#0F2A1D]">
                            {stats.timeDisplay}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-6 pt-4 border-t border-gray-100">
                      <Link
                        to={`/tasks`}
                        className="text-xs font-semibold text-[#375534] hover:text-[#0F2A1D]"
                      >
                        Tasks →
                      </Link>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(subject)}
                          disabled={Boolean(deletingId)}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(subject)}
                          disabled={Boolean(deletingId)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                        >
                          {deletingId === subject.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
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

export default Subjects;
