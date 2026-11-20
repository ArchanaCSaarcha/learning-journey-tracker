import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useGoals } from "../context/GoalsContext";
import { useSubjects } from "../context/SubjectsContext";
import { useTasks } from "../context/TasksContext";
import { logoutUser } from "../api/authService";
import Modal from "../components/Modal";

function Tasks() {
  const navigate = useNavigate();
  const { goals } = useGoals();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };
  const { subjects } = useSubjects();

  const {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
  } = useTasks();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalId, setGoalId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("Not Started");
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  // Get subjects belonging to selected goal
  const availableSubjects = subjects.filter(
    (subject) => subject.goalId === goalId
  );

  // Handle goal selection
  const handleGoalChange = (e) => {
    setGoalId(e.target.value);
    setSubjectId("");
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setGoalId("");
    setSubjectId("");
    setTitle("");
    setDescription("");
    setDueDate("");
    setStatus("Not Started");
    setActionError("");
    setIsModalOpen(true);
  };

  // Edit task
  const handleEdit = (task) => {
    setGoalId(task.goalId);
    setSubjectId(task.subjectId);
    setTitle(task.title);
    setDescription(task.description || "");
    setDueDate(task.dueDate || "");
    setStatus(task.status || "Not Started");
    setEditingId(task.id);
    setActionError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setGoalId("");
    setSubjectId("");
    setTitle("");
    setDescription("");
    setDueDate("");
    setStatus("Not Started");
    setActionError("");
  };

  // Add or update task
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!goalId || !subjectId || !title.trim()) {
      setActionError("Please select a goal, subject, and enter a title.");
      return;
    }

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      dueDate,
      status,
    };

    setSaving(true);
    setActionError("");

    try {
      if (editingId) {
        await updateTask(editingId, {
          ...taskData,
          goalId,
          subjectId,
        });
      } else {
        await addTask(goalId, subjectId, taskData);
      }

      handleCloseModal();
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Failed to save task"
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete task
  const handleDelete = async (taskId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmDelete) return;

    setActionError("");

    try {
      await deleteTask(taskId);
      if (editingId === taskId) {
        handleCloseModal();
      }
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Failed to delete task"
      );
    }
  };

  // Update task status directly from card
  const handleStatusChange = async (taskId, newStatus) => {
    setActionError("");

    try {
      await updateTask(taskId, {
        status: newStatus,
      });
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Failed to update task status"
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
              My Tasks
            </h1>
            <p className="text-gray-600 mt-2">
              Organize and track your learning activities.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="rounded-lg bg-[#375534] px-5 py-3 font-medium text-white shadow-sm hover:bg-[#294226] transition"
          >
            + Add New Task
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
          title={editingId ? "Edit Task" : "Add New Task"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {actionError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {actionError}
              </p>
            )}

            {/* Select Goal */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Select Goal *
              </label>
              <select
                value={goalId}
                onChange={handleGoalChange}
                className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
                required
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
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Select Subject *
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534] disabled:bg-gray-100"
                disabled={!goalId}
                required
              >
                <option value="">Choose a subject</option>
                {availableSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Task Title */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Task Title *
              </label>
              <input
                type="text"
                placeholder="Enter task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                placeholder="Describe what needs to be done..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Due Date */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
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
                    ? "Update Task"
                    : "Add Task"}
              </button>
            </div>
          </form>
        </Modal>

        {/* All Tasks */}
        <div>
          <h2 className="text-xl font-semibold text-[#0F2A1D] mb-4">
            All Tasks ({tasks.length})
          </h2>

          {loading ? (
            <div className="bg-white p-8 rounded-xl text-center shadow-sm border border-[#AEC3B0]/40">
              <p className="text-gray-500">
                Loading tasks...
              </p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white p-12 rounded-xl text-center shadow-sm border border-[#AEC3B0]/40">
              <p className="text-lg text-gray-500">
                No tasks added yet.
              </p>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="mt-4 rounded-lg bg-[#375534] px-5 py-2.5 font-medium text-white hover:bg-[#294226] transition shadow-sm"
              >
                Add your first task
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tasks.map((task) => {
                const taskGoal = goals.find(
                  (goal) => goal.id === task.goalId
                );

                const taskSubject = subjects.find(
                  (subject) => subject.id === task.subjectId
                );

                return (
                  <div
                    key={task.id}
                    className="bg-white p-5 rounded-xl shadow-sm border border-[#AEC3B0]/40 hover:border-[#375534] flex flex-col justify-between hover:shadow-md transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-bold text-[#0F2A1D]">
                          {task.title}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${
                            task.status === "Completed"
                              ? "bg-[#E3EED4] text-[#0F2A1D]"
                              : task.status === "In Progress"
                              ? "bg-[#AEC3B0]/50 text-[#0F2A1D]"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>

                      <p className="text-gray-600 mt-2 text-sm line-clamp-3">
                        {task.description || "No description added."}
                      </p>

                      <div className="mt-4 space-y-1.5 text-xs text-gray-500 border-t border-gray-100 pt-3">
                        <p>
                          <span className="font-medium text-gray-700">Goal:</span> {taskGoal?.title || "Goal unavailable"}
                        </p>
                        <p>
                          <span className="font-medium text-gray-700">Subject:</span> {taskSubject?.name || "Subject unavailable"}
                        </p>
                        <p>
                          <span className="font-medium text-gray-700">Due Date:</span> {task.dueDate || "Not set"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-gray-100 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Update Status
                        </label>
                        <select
                          value={task.status}
                          onChange={(e) =>
                            handleStatusChange(task.id, e.target.value)
                          }
                          className="w-full border border-gray-200 p-2 text-sm rounded-lg outline-none focus:border-[#375534]"
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(task)}
                          className="flex-1 rounded-lg border border-gray-300 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(task.id)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition"
                        >
                          Delete
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

export default Tasks;
