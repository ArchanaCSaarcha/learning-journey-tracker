import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useGoals } from '../context/GoalsContext';
import { useSubjects } from '../context/SubjectsContext';
import { useTasks } from '../context/TasksContext';
import { useSessions } from '../context/SessionsContext';
import { logoutUser } from '../api/authService';
import Modal from '../components/Modal';

function Dashboard() {
  const navigate = useNavigate();
  const { goals, addGoal, updateGoal, deleteGoal, loading: goalsLoading, error: goalsError } = useGoals();
  const { subjects, loading: subjectsLoading, error: subjectsError } = useSubjects();
  const { tasks, loading: tasksLoading, error: tasksError } = useTasks();
  const { sessions, loading: sessionsLoading, error: sessionsError } = useSessions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Dashboard statistics
  const dataLoading = goalsLoading || subjectsLoading || tasksLoading || sessionsLoading;
  const dataError = goalsError || subjectsError || tasksError || sessionsError;
  const totalGoals = goals.length;
  const totalSubjects = subjects.length;
  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === 'Completed'
  ).length;

  const pendingTasks = totalTasks - completedTasks;
  const learningProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const totalSessions = sessions.length;

  // Calculate total learning time
  const totalMinutes = sessions.reduce(
    (total, session) =>
      total + Number(session.duration || 0),
    0
  );

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  const handleOpenAdd = () => {
    setEditingGoalId(null);
    setTitle('');
    setDescription('');
    setStartDate('');
    setTargetDate('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal) => {
    setEditingGoalId(goal.id);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setStartDate(goal.startDate || '');
    setTargetDate(goal.targetDate || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGoalId(null);
    setTitle('');
    setDescription('');
    setStartDate('');
    setTargetDate('');
    setFormError('');
  };

  const handleSubmitGoal = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    const goalData = {
      title,
      description,
      startDate,
      targetDate,
    };

    try {
      if (editingGoalId) {
        await updateGoal(editingGoalId, goalData);
      } else {
        await addGoal(goalData);
      }
      handleCloseModal();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
        'Failed to save goal. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const getGoalStatus = (goal, goalTasks, goalSubjects) => {
    const today = new Date().toISOString().split('T')[0];
    if (goalSubjects.length === 0) {
      return { label: 'Add subjects to start', color: 'bg-gray-100 text-gray-600' };
    }
    if (goalTasks.length === 0) {
      return { label: 'Add tasks to start', color: 'bg-amber-100 text-amber-700' };
    }
    const allCompleted = goalTasks.length > 0 && goalTasks.every((t) => t.status === 'Completed');
    if (allCompleted) {
      return { label: 'Completed', color: 'bg-green-100 text-green-700' };
    }
    if (goal.targetDate && goal.targetDate < today) {
      return { label: 'Overdue', color: 'bg-red-100 text-red-700' };
    }
    return { label: 'Active', color: 'bg-blue-100 text-blue-700' };
  };

  // The backend deletes the goal and its related records in one request.
  const handleDeleteGoal = async (goal) => {
    const goalSubjects = subjects.filter((s) => s.goalId === goal.id);
    const goalTasks = tasks.filter((t) => t.goalId === goal.id);
    const confirmMsg = `Are you sure you want to delete "${goal.title}"?\n\nThis will permanently delete:\n• ${goalSubjects.length} subject(s)\n• ${goalTasks.length} task(s)\nand all related sessions and notes.`;
    if (!window.confirm(confirmMsg)) return;
    try {
      await deleteGoal(goal.id);
    } catch {
      window.alert("Failed to delete goal. Please try again.");
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    currentUser = null;
  }

  return (
    <div className="min-h-screen bg-[#F4F8EE]">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 bg-[#0F2A1D] p-6 text-white md:flex flex-col justify-between border-r border-[#375534]/40 z-20">

        <div>
          <h1 className="mb-8 text-2xl font-bold text-[#E3EED4] flex items-center gap-2">
            <span>🌿</span> Learning Tracker
          </h1>

          <nav className="space-y-2.5">

            <Link
              to="/dashboard"
              className="block rounded-lg bg-[#375534] text-[#E3EED4] px-4 py-2.5 font-medium shadow-sm"
            >
              Dashboard
            </Link>

            <Link
              to="/goals"
              className="block rounded-lg px-4 py-2.5 text-[#AEC3B0] hover:bg-[#1C3626] hover:text-white transition"
            >
              My Goals
            </Link>

            <Link
              to="/subjects"
              className="block rounded-lg px-4 py-2.5 text-[#AEC3B0] hover:bg-[#1C3626] hover:text-white transition"
            >
              My Subjects
            </Link>

            <Link
              to="/tasks"
              className="block rounded-lg px-4 py-2.5 text-[#AEC3B0] hover:bg-[#1C3626] hover:text-white transition"
            >
              My Tasks
            </Link>

            <Link
              to="/sessions"
              className="block rounded-lg px-4 py-2.5 text-[#AEC3B0] hover:bg-[#1C3626] hover:text-white transition"
            >
              Learning Sessions
            </Link>

            <Link
              to="/notes"
              className="block rounded-lg px-4 py-2.5 text-[#AEC3B0] hover:bg-[#1C3626] hover:text-white transition"
            >
              My Notes
            </Link>

            <Link
              to="/calendar"
              className="block rounded-lg px-4 py-2.5 text-[#AEC3B0] hover:bg-[#1C3626] hover:text-white transition"
            >
              Calendar
            </Link>

            <Link
              to="/reports"
              className="block rounded-lg px-4 py-2.5 text-[#AEC3B0] hover:bg-[#1C3626] hover:text-white transition"
            >
              Reports
            </Link>

          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="pt-4 border-t border-[#375534]/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#375534] text-[#E3EED4] flex items-center justify-center font-bold text-sm border border-[#AEC3B0]/40 shrink-0">
              {(currentUser?.name || currentUser?.email || 'U')[0]?.toUpperCase() || 'U'}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-[#E3EED4] truncate">
                {currentUser?.name || 'Learner'}
              </p>
              <p className="text-xs text-[#AEC3B0] truncate">
                {currentUser?.email || ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-950/40 border border-red-800/40 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-900/60 hover:text-white transition"
          >
            <span>Log Out</span>
            <span>→</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="p-5 md:ml-64 md:p-10">

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <h2 className="text-3xl font-bold text-[#0F2A1D]">
              Dashboard
            </h2>

            <p className="mt-2 text-gray-600">
              Track your learning journey and achieve your goals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="rounded-lg bg-[#375534] px-5 py-2.5 text-center font-medium text-white hover:bg-[#294226] shadow-sm transition"
            >
              + Add New Goal
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-[#AEC3B0]/60 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 hover:border-red-200 shadow-sm transition"
              title="Log out of your account"
            >
              Log Out
            </button>
          </div>

        </div>

        {dataError && <p className="mb-5 rounded-lg bg-red-50 p-4 text-red-700">{dataError}</p>}
        {dataLoading && <p className="mb-5 text-sm text-gray-500">Loading your learning data...</p>}

        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

          <div className="rounded-xl bg-white p-6 shadow-sm border border-[#AEC3B0]/40">
            <p className="text-gray-500">Total Goals</p>
            <h3 className="mt-2 text-3xl font-bold text-[#375534]">
              {dataLoading ? "…" : totalGoals}
            </h3>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-[#AEC3B0]/40">
            <p className="text-gray-500">Total Subjects</p>
            <h3 className="mt-2 text-3xl font-bold text-[#6B9071]">
              {dataLoading ? "…" : totalSubjects}
            </h3>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-[#AEC3B0]/40">
            <p className="text-gray-500">Total Tasks</p>
            <h3 className="mt-2 text-3xl font-bold text-[#0F2A1D]">
              {dataLoading ? "…" : totalTasks}
            </h3>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-[#AEC3B0]/40">
            <p className="text-gray-500">Completed Tasks</p>
            <h3 className="mt-2 text-3xl font-bold text-[#375534]">
              {dataLoading ? "…" : completedTasks}
            </h3>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-[#AEC3B0]/40">
            <p className="text-gray-500">Pending Tasks</p>
            <h3 className="mt-2 text-3xl font-bold text-amber-700">
              {dataLoading ? "…" : pendingTasks}
            </h3>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-[#AEC3B0]/40">
            <p className="text-gray-500">Learning Progress</p>
            <h3 className="mt-2 text-3xl font-bold text-[#375534]">{dataLoading ? "…" : learningProgress}%</h3>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-[#AEC3B0]/40 sm:col-span-2 lg:col-span-1">
            <p className="text-gray-500">Learning Sessions</p>
            <h3 className="mt-2 text-3xl font-bold text-[#6B9071]">
              {dataLoading ? "…" : totalSessions}
            </h3>
          </div>

        </div>

        {/* Learning Time */}
        <div className="mb-8 rounded-xl bg-gradient-to-r from-[#0F2A1D] to-[#375534] p-6 text-white shadow-md border border-[#375534]/30">

          <p className="text-lg text-[#E3EED4]">
            Total Learning Time
          </p>

          <h3 className="mt-2 text-3xl font-bold text-white">
            {dataLoading ? "Loading..." : `${totalHours} hours ${remainingMinutes} minutes`}
          </h3>

          <p className="mt-2 text-sm text-[#AEC3B0]">
            Your total recorded learning time.
          </p>

        </div>

        {/* Goals Section */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-[#AEC3B0]/40">

          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

            <h3 className="text-xl font-bold text-[#0F2A1D]">
              My Learning Goals
            </h3>

            <Link
              to="/goals"
              className="text-sm font-semibold text-[#375534] hover:text-[#0F2A1D]"
            >
              View All Goals →
            </Link>

          </div>

          {dataLoading ? (
            <p className="text-gray-500">Loading goals...</p>
          ) : goals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No goals added yet.</p>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="mt-4 rounded-lg bg-[#375534] px-5 py-2.5 font-medium text-white hover:bg-[#294226] transition shadow-sm"
              >
                Create your first goal
              </button>
            </div>
          ) : (

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {goals.map((goal) => {

                const goalTasks = tasks.filter(
                  (task) => task.goalId === goal.id
                );

                const completedGoalTasks = goalTasks.filter(
                  (task) => task.status === 'Completed'
                ).length;

                const goalProgress =
                  goalTasks.length === 0
                    ? 0
                    : Math.round(
                        (completedGoalTasks / goalTasks.length) * 100
                      );

                const goalSubjects = subjects.filter(
                  (subject) => subject.goalId === goal.id
                );

                const statusInfo = getGoalStatus(goal, goalTasks, goalSubjects);

                return (

                  <div
                    key={goal.id}
                    className="rounded-xl border border-[#AEC3B0]/40 p-5 hover:border-[#375534] transition bg-[#F4F8EE]/30"
                  >

                    <div className="mb-3 flex items-center justify-between gap-3">

                      <h4 className="text-lg font-bold text-[#0F2A1D]">
                        {goal.title}
                      </h4>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>

                    </div>

                    <p className="mb-4 text-sm text-gray-600 line-clamp-2">
                      {goal.description || "No description provided."}
                    </p>

                    <div className="mb-2 flex justify-between text-sm">

                      <span className="text-gray-500">
                        Progress
                      </span>

                      <span className="font-semibold text-[#375534]">
                        {goalProgress}%
                      </span>

                    </div>

                    <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-[#E3EED4]">

                      <div
                        className="h-full rounded-full bg-[#375534] transition-all duration-300"
                        style={{
                          width: `${goalProgress}%`,
                        }}
                      />

                    </div>

                    {/* Subject and Task Count */}
                    <div className="mb-5 flex justify-between text-sm text-gray-500">

                      <span>
                        Subjects: {goalSubjects.length}
                      </span>

                      <span>
                        Tasks: {completedGoalTasks}/{goalTasks.length}
                      </span>

                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">

                      <Link
                        to={`/goals/${goal.id}/subjects`}
                        className="rounded-lg bg-[#375534] px-3 py-2 text-sm text-white hover:bg-[#294226] transition shadow-sm"
                      >
                        Manage Subjects
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(goal)}
                        className="rounded-lg bg-[#AEC3B0]/40 px-3 py-2 text-sm text-[#0F2A1D] hover:bg-[#AEC3B0]/70 transition font-medium"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(goal)}
                        className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 hover:bg-red-200 transition font-medium"
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

      </main>

      {/* Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingGoalId ? 'Edit Learning Goal' : 'Create a New Goal'}
      >
        <form onSubmit={handleSubmitGoal} className="space-y-5">
          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Goal Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Example: Learn Full-Stack Development"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Description
            </label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your learning objectives..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Target Date *
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                min={startDate || undefined}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#375534] focus:ring-1 focus:ring-[#375534]"
              />
            </div>
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
                ? 'Saving...'
                : editingGoalId
                  ? 'Update Goal'
                  : 'Create Goal'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

export default Dashboard;
