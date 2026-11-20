import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useGoals } from '../context/GoalsContext';
import { useSubjects } from '../context/SubjectsContext';
import { useTasks } from '../context/TasksContext';
import { useSessions } from '../context/SessionsContext';

function Reports() {
  const { goals } = useGoals();
  const { subjects } = useSubjects();
  const { tasks } = useTasks();
  const { sessions } = useSessions();

  // Date Range Filter: "all", "week", "month"
  const [dateFilter, setDateFilter] = useState('all');
  const [now] = useState(() => Date.now());
  const todayStr = new Date(now).toISOString().split('T')[0];

  // Filter sessions according to date range
  const filteredSessions = sessions.filter((session) => {
    const sessionDate = session.sessionDate || session.date;
    if (!sessionDate) return false;
    if (dateFilter === 'all') return true;

    const sessionTime = new Date(sessionDate).getTime();

    if (dateFilter === 'week') {
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      return sessionTime >= sevenDaysAgo;
    }
    if (dateFilter === 'month') {
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      return sessionTime >= thirtyDaysAgo;
    }
    return true;
  });

  // Calculate task statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
  const notStartedTasks = tasks.filter((t) => t.status === 'Not Started').length;
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate < todayStr && t.status !== 'Completed'
  ).length;

  const completionPercentage =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Total learning time for filtered sessions
  const totalMinutes = filteredSessions.reduce(
    (total, session) => total + Number(session.duration || 0),
    0
  );
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  // Study streak calculation
  const calculateStreak = () => {
    if (!sessions || sessions.length === 0) return 0;
    const uniqueDates = Array.from(
      new Set(sessions.map((s) => s.sessionDate || s.date).filter(Boolean))
    ).sort().reverse();

    if (uniqueDates.length === 0) return 0;

    const yesterdayStr = new Date(now - 86400000).toISOString().split('T')[0];
    const latest = uniqueDates[0];

    if (latest !== todayStr && latest !== yesterdayStr) {
      return 0;
    }

    let streak = 0;
    const checkDate = new Date(latest);

    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedStr = checkDate.toISOString().split('T')[0];
      if (uniqueDates[i] === expectedStr) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const streakDays = calculateStreak();

  // On track vs Behind calculation
  const getGoalScheduleStatus = (goal, goalTasks) => {
    if (goalTasks.length === 0) {
      return { label: 'No Tasks Yet', color: 'bg-gray-100 text-gray-600' };
    }
    const compCount = goalTasks.filter((t) => t.status === 'Completed').length;
    const progress = Math.round((compCount / goalTasks.length) * 100);

    if (progress === 100) {
      return { label: 'Completed', color: 'bg-green-100 text-green-700', progress };
    }

    if (!goal.startDate || !goal.targetDate) {
      return { label: 'In Progress', color: 'bg-blue-100 text-blue-700', progress };
    }

    const start = new Date(goal.startDate).getTime();
    const target = new Date(goal.targetDate).getTime();

    if (target <= start) {
      return { label: 'In Progress', color: 'bg-blue-100 text-blue-700', progress };
    }

    if (now > target) {
      return { label: 'Overdue', color: 'bg-red-100 text-red-700', progress };
    }

    const elapsed = Math.min(100, Math.max(0, Math.round(((now - start) / (target - start)) * 100)));

    if (progress >= elapsed) {
      return { label: 'On Track', color: 'bg-emerald-100 text-emerald-800', progress, elapsed };
    } else {
      return { label: 'Behind Schedule', color: 'bg-amber-100 text-amber-800', progress, elapsed };
    }
  };

  // Time per subject
  const subjectTimeMap = subjects.map((subject) => {
    const subjectSessions = filteredSessions.filter((s) => s.subjectId === subject.id);
    const mins = subjectSessions.reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
    const parentGoal = goals.find((g) => g.id === subject.goalId);
    return {
      id: subject.id,
      name: subject.name,
      goalTitle: parentGoal?.title || 'Unknown Goal',
      minutes: mins,
      percentage: totalMinutes > 0 ? Math.round((mins / totalMinutes) * 100) : 0,
    };
  }).sort((a, b) => b.minutes - a.minutes);

  // Time per goal
  const goalTimeMap = goals.map((goal) => {
    const goalSessions = filteredSessions.filter((s) => s.goalId === goal.id);
    const mins = goalSessions.reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
    return {
      id: goal.id,
      title: goal.title,
      minutes: mins,
      percentage: totalMinutes > 0 ? Math.round((mins / totalMinutes) * 100) : 0,
    };
  }).sort((a, b) => b.minutes - a.minutes);

  // Insights
  const avgSessionDuration =
    filteredSessions.length > 0
      ? Math.round(totalMinutes / filteredSessions.length)
      : 0;

  // Upcoming deadlines in the next 7 days
  const upcomingSevenDaysStr = new Date(now + 7 * 86400000).toISOString().split('T')[0];
  const upcomingTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate >= todayStr && t.dueDate <= upcomingSevenDaysStr && t.status !== 'Completed'
  ).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  // Daily study minutes for the last 7 days
  const lastSevenDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const daySessions = sessions.filter((s) => (s.sessionDate || s.date) === dateStr);
    const mins = daySessions.reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    return { date: dateStr, dayLabel, minutes: mins };
  });

  const maxDailyMins = Math.max(60, ...lastSevenDays.map((d) => d.minutes));

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Session Date', 'Goal', 'Subject', 'Duration (Minutes)', 'Description'];
    const rows = filteredSessions.map((s) => {
      const g = goals.find((item) => item.id === s.goalId)?.title || 'N/A';
      const sub = subjects.find((item) => item.id === s.subjectId)?.name || 'N/A';
      return [
        `"${s.sessionDate || s.date || ''}"`,
        `"${g.replace(/"/g, '""')}"`,
        `"${sub.replace(/"/g, '""')}"`,
        s.duration || 0,
        `"${(s.description || s.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `study_report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F4F8EE] p-8">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/dashboard"
          className="mb-6 inline-block font-medium text-[#375534] hover:underline"
        >
          ← Back to Dashboard
        </Link>

        {/* Heading & Toolbar */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#0F2A1D]">
              Learning Analytics & Reports
            </h1>
            <p className="mt-1 text-gray-600 text-sm">
              Deep insights, schedule pacing, and time allocation across your goals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Selector */}
            <div className="flex rounded-lg bg-white p-1 shadow-sm border border-[#AEC3B0]/40 text-xs font-medium">
              <button
                type="button"
                onClick={() => setDateFilter('all')}
                className={`rounded-md px-3 py-1.5 transition ${
                  dateFilter === 'all'
                    ? 'bg-[#375534] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('month')}
                className={`rounded-md px-3 py-1.5 transition ${
                  dateFilter === 'month'
                    ? 'bg-[#375534] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('week')}
                className={`rounded-md px-3 py-1.5 transition ${
                  dateFilter === 'week'
                    ? 'bg-[#375534] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Last 7 Days
              </button>
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="rounded-lg border border-[#AEC3B0] bg-white px-4 py-2 text-xs font-semibold text-[#375534] shadow-sm hover:bg-[#E3EED4]/50 transition"
            >
              Export CSV ↓
            </button>
          </div>
        </div>

        {/* Top Summary KPI Cards */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-[#AEC3B0]/40">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Filtered Study Time
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[#375534]">
              {hours}h {remainingMinutes}m
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Across {filteredSessions.length} recorded session(s)
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-[#AEC3B0]/40">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Study Streak
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[#6B9071] flex items-center gap-2">
              <span>{streakDays}</span>
              <span className="text-base font-normal text-gray-600">days</span>
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {streakDays > 0 ? 'Consecutive daily activity!' : 'Log a session today to start your streak'}
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-[#AEC3B0]/40">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Task Completion Rate
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[#375534]">
              {completionPercentage}%
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {completedTasks} completed of {totalTasks} total
            </p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-[#AEC3B0]/40">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Overdue Tasks
            </p>
            <h2 className={`mt-2 text-3xl font-bold ${overdueTasks > 0 ? 'text-red-600' : 'text-[#0F2A1D]'}`}>
              {overdueTasks}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {overdueTasks > 0 ? 'Past deadline and incomplete' : 'All deadlines on track'}
            </p>
          </div>
        </div>

        {/* 7-Day Study Time Visual Chart */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm border border-[#AEC3B0]/40">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0F2A1D]">
                Daily Study Activity (Last 7 Days)
              </h2>
              <p className="text-xs text-gray-500">Minutes spent studying each day</p>
            </div>
            <span className="text-xs font-semibold text-[#0F2A1D] bg-[#E3EED4] px-3 py-1 rounded-full">
              Avg: {avgSessionDuration} mins / session
            </span>
          </div>

          <div className="flex items-end justify-between gap-3 h-44 pt-4 px-2">
            {lastSevenDays.map((day) => {
              const heightPercent = Math.round((day.minutes / maxDailyMins) * 100);
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-xs font-semibold text-[#0F2A1D]">
                    {day.minutes > 0 ? `${day.minutes}m` : '-'}
                  </span>
                  <div className="w-full max-w-12 bg-[#F4F8EE] rounded-t-lg h-28 flex items-end overflow-hidden border border-[#AEC3B0]/30">
                    <div
                      className="w-full bg-[#375534] rounded-t-lg transition-all duration-500 hover:bg-[#294226]"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    {day.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Goal Pacing: On Track vs Behind Schedule */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm border border-[#AEC3B0]/40">
          <h2 className="text-lg font-bold text-[#0F2A1D] mb-1">
            Goal Pacing & Schedule Status
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            Compares percentage of goal duration elapsed against actual tasks completed.
          </p>

          {goals.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No goals recorded yet.</p>
          ) : (
            <div className="space-y-6">
              {goals.map((goal) => {
                const goalTasks = tasks.filter((t) => t.goalId === goal.id);
                const pacing = getGoalScheduleStatus(goal, goalTasks);

                return (
                  <div key={goal.id} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-800 text-sm">{goal.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit ${pacing.color}`}>
                        {pacing.label}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span>Tasks Done: {goalTasks.filter((t) => t.status === 'Completed').length}/{goalTasks.length} ({pacing.progress || 0}%)</span>
                      {pacing.elapsed !== undefined && <span>Time Elapsed: {pacing.elapsed}%</span>}
                    </div>

                    <div className="h-2 w-full rounded-full bg-[#E3EED4] overflow-hidden">
                      <div
                        className="h-full bg-[#375534] rounded-full transition-all duration-300"
                        style={{ width: `${pacing.progress || 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Two-Column Breakdown: Time Per Subject & Task Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Time Per Subject */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-[#AEC3B0]/40">
            <h2 className="text-lg font-bold text-[#0F2A1D] mb-1">
              Time Per Subject
            </h2>
            <p className="text-xs text-gray-500 mb-5">Where your study hours are allocated</p>

            {subjectTimeMap.length === 0 || totalMinutes === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">No study time recorded in this period.</p>
            ) : (
              <div className="space-y-4">
                {subjectTimeMap.map((sub) => (
                  <div key={sub.id}>
                    <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                      <span>{sub.name} <span className="text-gray-400">({sub.goalTitle})</span></span>
                      <span>{Math.floor(sub.minutes / 60)}h {sub.minutes % 60}m ({sub.percentage}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#E3EED4] overflow-hidden">
                      <div
                        className="h-full bg-[#6B9071] rounded-full"
                        style={{ width: `${sub.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Task Status Breakdown */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-[#AEC3B0]/40">
            <h2 className="text-lg font-bold text-[#0F2A1D] mb-1">
              Task Status Breakdown
            </h2>
            <p className="text-xs text-gray-500 mb-5">Overview of current pipeline</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                <span className="text-xs font-semibold text-gray-600 uppercase">Not Started</span>
                <p className="text-2xl font-bold text-gray-700 mt-1">{notStartedTasks}</p>
              </div>

              <div className="rounded-lg bg-[#AEC3B0]/20 p-4 border border-[#AEC3B0]/40">
                <span className="text-xs font-semibold text-[#375534] uppercase">In Progress</span>
                <p className="text-2xl font-bold text-[#375534] mt-1">{inProgressTasks}</p>
              </div>

              <div className="rounded-lg bg-[#E3EED4] p-4 border border-[#CBE0BD]">
                <span className="text-xs font-semibold text-[#0F2A1D] uppercase">Completed</span>
                <p className="text-2xl font-bold text-[#0F2A1D] mt-1">{completedTasks}</p>
              </div>

              <div className="rounded-lg bg-red-50 p-4 border border-red-100">
                <span className="text-xs font-semibold text-red-700 uppercase">Overdue</span>
                <p className="text-2xl font-bold text-red-800 mt-1">{overdueTasks}</p>
              </div>
            </div>

            {/* Upcoming 7 Days Deadlines */}
            <div>
              <h3 className="text-sm font-semibold text-[#0F2A1D] mb-2">
                Upcoming Deadlines (Next 7 Days)
              </h3>
              {upcomingTasks.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No tasks due in the next 7 days.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingTasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="flex justify-between items-center text-xs p-2.5 bg-[#F4F8EE] rounded-lg border border-[#AEC3B0]/30">
                      <span className="font-medium text-gray-800 truncate max-w-xs">{task.title}</span>
                      <span className="text-[#375534] font-semibold">{task.dueDate}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Time per Goal Distribution */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-[#AEC3B0]/40">
          <h2 className="text-lg font-bold text-[#0F2A1D] mb-1">
            Time Distribution by Goal
          </h2>
          <p className="text-xs text-gray-500 mb-5">Hours spent across overarching goals</p>

          {goalTimeMap.length === 0 || totalMinutes === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No sessions recorded yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {goalTimeMap.map((g) => (
                <div key={g.id} className="rounded-lg border border-[#AEC3B0]/40 p-4 bg-[#F4F8EE]/30">
                  <h3 className="text-sm font-bold text-[#0F2A1D] truncate mb-1">{g.title}</h3>
                  <div className="text-xl font-bold text-[#375534]">
                    {Math.floor(g.minutes / 60)}h {g.minutes % 60}m
                  </div>
                  <div className="mt-2 text-xs text-gray-500 flex justify-between">
                    <span>Share of total:</span>
                    <span className="font-semibold text-gray-700">{g.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;
