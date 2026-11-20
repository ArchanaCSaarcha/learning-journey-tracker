import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useGoals } from '../context/GoalsContext';
import { useSubjects } from '../context/SubjectsContext';
import { useTasks } from '../context/TasksContext';
import { logoutUser } from '../api/authService';
import Modal from '../components/Modal';

function Goals() {
  const navigate = useNavigate();
  const { id } = useParams();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const {
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    loading,
  } = useGoals();

  const { subjects } = useSubjects();
  const { tasks } = useTasks();

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Load existing goal when editing via URL parameter
  useEffect(() => {
    if (!id || loading) return;
    const existingGoal = goals.find((goal) => goal.id === id);
    if (!existingGoal) return;
    const timer = window.setTimeout(() => {
      setEditingGoalId(id);
      setTitle(existingGoal.title);
      setDescription(existingGoal.description || '');
      setStartDate(existingGoal.startDate || '');
      setTargetDate(existingGoal.targetDate || '');
      setIsModalOpen(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [id, goals, loading]);

  const handleOpenAdd = () => {
    setEditingGoalId(null);
    setTitle('');
    setDescription('');
    setStartDate('');
    setTargetDate('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal) => {
    setEditingGoalId(goal.id);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setStartDate(goal.startDate || '');
    setTargetDate(goal.targetDate || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGoalId(null);
    setTitle('');
    setDescription('');
    setStartDate('');
    setTargetDate('');
    setError('');
    if (id) {
      navigate('/goals', { replace: true });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
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
      setError(
        err.response?.data?.message ||
        'Failed to save goal. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Calculate progress for a goal
  const calculateProgress = (goalId) => {
    const goalTasks = tasks.filter(
      (task) => task.goalId === goalId
    );

    const completedTasks = goalTasks.filter(
      (task) => task.status === 'Completed'
    ).length;

    if (goalTasks.length === 0) {
      return 0;
    }

    return Math.round(
      (completedTasks / goalTasks.length) * 100
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F8EE]">
        <p className="text-lg font-medium text-[#375534]">
          Loading goals...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F8EE] px-4 py-8">
      <div className="mx-auto max-w-5xl">
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

        {/* Page Heading & Action Button */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#0F2A1D]">
              My Learning Goals
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your learning goals and track your progress.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="rounded-lg bg-[#375534] px-5 py-3 font-medium text-white shadow-sm hover:bg-[#294226] transition"
          >
            + Add New Goal
          </button>
        </div>

        {/* Modal Submit Form */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingGoalId ? 'Edit Learning Goal' : 'Create a New Goal'}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Goal Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Example: Learn Web Development"
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
                placeholder="Describe what you want to achieve..."
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

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={handleCloseModal}
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

        {/* All Goals Grid */}
        <div>
          {goals.length === 0 ? (
            <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-[#AEC3B0]/40">
              <p className="text-lg text-gray-500">
                No goals created yet.
              </p>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="mt-4 inline-block rounded-lg bg-[#375534] px-5 py-2.5 font-medium text-white hover:bg-[#294226] transition shadow-sm"
              >
                Create your first goal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {goals.map((goal) => {
                const progress = calculateProgress(goal.id);

                const goalTasks = tasks.filter(
                  (task) => task.goalId === goal.id
                );

                const completedTasks = goalTasks.filter(
                  (task) => task.status === 'Completed'
                ).length;

                const goalSubjects = subjects.filter(
                  (subject) => subject.goalId === goal.id
                );

                const statusInfo = getGoalStatus(goal, goalTasks, goalSubjects);

                return (
                  <div
                    key={goal.id}
                    className="rounded-xl bg-white p-6 shadow-sm border border-[#AEC3B0]/40 hover:border-[#375534] hover:shadow-md transition"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="text-xl font-semibold text-[#0F2A1D]">
                        {goal.title}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    <p className="mb-4 text-sm text-gray-600 line-clamp-2">
                      {goal.description || 'No description added.'}
                    </p>

                    <div className="mb-4 space-y-1 text-sm text-gray-500">
                      <p>Start Date: {goal.startDate}</p>
                      <p>Target Date: {goal.targetDate}</p>
                    </div>

                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium text-gray-600">
                        Goal Progress
                      </span>
                      <span className="font-semibold text-[#375534]">
                        {progress}%
                      </span>
                    </div>

                    <div className="mb-3 h-2.5 w-full overflow-hidden rounded-full bg-[#E3EED4]">
                      <div
                        className="h-full rounded-full bg-[#375534] transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="mb-5 flex justify-between text-xs text-gray-500">
                      <span>Subjects: {goalSubjects.length}</span>
                      <span>Tasks: {completedTasks}/{goalTasks.length}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                      <Link
                        to={`/goals/${goal.id}/subjects`}
                        className="rounded-lg bg-[#375534] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#294226] transition shadow-sm"
                      >
                        Manage Subjects
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(goal)}
                        className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                      >
                        Edit Goal
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          const confirmMsg = `Are you sure you want to delete "${goal.title}"?\n\nThis will permanently delete:\n• ${goalSubjects.length} subject(s)\n• ${goalTasks.length} task(s)\nand any associated study sessions and notes.`;
                          if (window.confirm(confirmMsg)) {
                            try {
                              await deleteGoal(goal.id);
                            } catch (err) {
                              window.alert(err.response?.data?.message || 'Failed to delete goal.');
                            }
                          }
                        }}
                        className="rounded-lg border border-red-200 px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition"
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

export default Goals;
