
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useTasks } from '../context/TasksContext';
import { useSessions } from '../context/SessionsContext';
import { useGoals } from '../context/GoalsContext';
import { useSubjects } from '../context/SubjectsContext';

function Calendar() {
    const { tasks } = useTasks();
    const { sessions } = useSessions();
    const { goals } = useGoals();
    const { subjects } = useSubjects();

    const today = new Date();

    const [currentMonth, setCurrentMonth] = useState(
        new Date(today.getFullYear(), today.getMonth(), 1)
    );

    const [selectedDate, setSelectedDate] = useState(
        getDateString(today)
    );

    // Convert a date into YYYY-MM-DD format using local time
    function getDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    // Get the first day and total days of the current month
    const firstDay = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
    ).getDay();

    const daysInMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
    ).getDate();

    // Make Monday the first day of the calendar week
    const startingDay = (firstDay + 6) % 7;

    const calendarDays = [
        ...Array(startingDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];

    // Move to previous month
    const previousMonth = () => {
        setCurrentMonth(
            new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() - 1,
                1
            )
        );
    };

    // Move to next month
    const nextMonth = () => {
        setCurrentMonth(
            new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                1
            )
        );
    };

    // Get tasks and sessions for the selected date
    const selectedTasks = tasks.filter(
        (task) => task.dueDate === selectedDate
    );

    const selectedSessions = sessions.filter(
        (session) => (session.sessionDate || session.date) === selectedDate
    );

    // Check whether a date has tasks or sessions
    const hasActivity = (day) => {
        if (!day) return false;

        const date = getDateString(
            new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth(),
                day
            )
        );

        return (
            tasks.some((task) => task.dueDate === date) ||
            sessions.some((session) => (session.sessionDate || session.date) === date)
        );
    };

    return (
        <div className="min-h-screen bg-[#F4F8EE] p-6">
            <div className="max-w-6xl mx-auto">

                <Link
                    to="/dashboard"
                    className="mb-6 inline-block font-medium text-[#375534] hover:underline"
                >
                    ← Back to Dashboard
                </Link>

                <h1 className="text-3xl font-bold text-[#0F2A1D] mb-2">
                    Learning Calendar
                </h1>

                <p className="text-gray-600 mb-8">
                    View your learning tasks and sessions by date.
                </p>

                {/* Calendar */}
                <div className="bg-white rounded-xl shadow-sm border border-[#AEC3B0]/40 p-6 mb-8">

                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-6">

                        <button
                            onClick={previousMonth}
                            className="px-4 py-2 bg-[#F4F8EE] border border-[#AEC3B0]/50 rounded-lg hover:bg-[#E3EED4] text-[#0F2A1D] font-medium transition"
                        >
                            Previous
                        </button>

                        <h2 className="text-xl font-bold text-[#0F2A1D]">
                            {currentMonth.toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric',
                            })}
                        </h2>

                        <button
                            onClick={nextMonth}
                            className="px-4 py-2 bg-[#F4F8EE] border border-[#AEC3B0]/50 rounded-lg hover:bg-[#E3EED4] text-[#0F2A1D] font-medium transition"
                        >
                            Next
                        </button>

                    </div>

                    {/* Weekday Names */}
                    <div className="grid grid-cols-7 gap-2 mb-2">

                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
                            (day) => (
                                <div
                                    key={day}
                                    className="text-center font-semibold text-gray-500 py-2"
                                >
                                    {day}
                                </div>
                            )
                        )}

                    </div>

                    {/* Calendar Dates */}
                    <div className="grid grid-cols-7 gap-2">

                        {calendarDays.map((day, index) => {
                            const date = day
                                ? getDateString(
                                    new Date(
                                        currentMonth.getFullYear(),
                                        currentMonth.getMonth(),
                                        day
                                    )
                                )
                                : '';

                            const isToday = date === getDateString(today);
                            const isSelected = date === selectedDate;
                            const activityExists = hasActivity(day);

                            return (
                                <button
                                    key={index}
                                    disabled={!day}
                                    onClick={() => setSelectedDate(date)}
                                    className={`
                    min-h-16 rounded-lg flex flex-col items-center justify-center gap-1 transition
                    ${!day ? 'invisible' : ''}
                    ${isSelected ? 'bg-[#375534] text-[#E3EED4] font-bold shadow-sm' : 'bg-gray-50 hover:bg-[#E3EED4] text-gray-700'}
                    ${isToday && !isSelected ? 'border-2 border-[#375534]' : ''}
                  `}
                                >
                                    {day && (
                                        <>
                                            <span>{day}</span>

                                            {activityExists && (
                                                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-[#E3EED4]' : 'bg-[#375534]'
                                                    }`} />
                                            )}
                                        </>
                                    )}
                                </button>
                            );
                        })}

                    </div>

                </div>

                {/* Selected Date Activities */}
                <div className="bg-white rounded-xl shadow-sm border border-[#AEC3B0]/40 p-6">

                    <h2 className="text-xl font-bold text-[#0F2A1D] mb-5">
                        Activities for {selectedDate}
                    </h2>

                    {/* Tasks */}
                    <h3 className="font-semibold text-[#375534] mb-3">
                        Tasks ({selectedTasks.length})
                    </h3>

                    {selectedTasks.length === 0 ? (
                        <p className="text-gray-500 mb-6">
                            No tasks scheduled for this date.
                        </p>
                    ) : (
                        <div className="space-y-3 mb-6">

                            {selectedTasks.map((task) => {
                                const goal = goals.find(
                                    (item) => item.id === task.goalId
                                );

                                const subject = subjects.find(
                                    (item) => item.id === task.subjectId
                                );

                                return (
                                    <div
                                        key={task.id}
                                        className="border border-[#AEC3B0]/40 rounded-lg p-4 bg-[#F4F8EE]/30"
                                    >
                                        <h4 className="font-semibold text-gray-800">
                                            {task.title}
                                        </h4>

                                        <p className="text-sm text-gray-500 mt-1">
                                            {goal?.title || 'Goal unavailable'}
                                            {' • '}
                                            {subject?.name || 'Subject unavailable'}
                                        </p>

                                        <p className="text-sm text-gray-600 mt-2">
                                            Status: {task.status}
                                        </p>
                                    </div>
                                );
                            })}

                        </div>
                    )}

                    {/* Learning Sessions */}
                    <h3 className="font-semibold text-[#6B9071] mb-3">
                        Learning Sessions ({selectedSessions.length})
                    </h3>

                    {selectedSessions.length === 0 ? (
                        <p className="text-gray-500">
                            No learning sessions recorded for this date.
                        </p>
                    ) : (
                        <div className="space-y-3">

                            {selectedSessions.map((session) => {
                                const goal = goals.find(
                                    (item) => item.id === session.goalId
                                );

                                const subject = subjects.find(
                                    (item) => item.id === session.subjectId
                                );

                                return (
                                    <div
                                        key={session.id}
                                        className="border border-[#AEC3B0]/40 rounded-lg p-4 bg-[#F4F8EE]/30"
                                    >
                                        <h4 className="font-semibold text-gray-800">
                                            {subject?.name || 'Subject unavailable'}
                                        </h4>

                                        <p className="text-sm text-gray-500 mt-1">
                                            Goal: {goal?.title || 'Goal unavailable'}
                                        </p>

                                        <p className="text-sm text-gray-600 mt-2">
                                            Duration: {session.duration} minutes
                                        </p>

                                        {(session.description || session.notes) && (
                                            <p className="text-sm text-gray-600 mt-2">
                                                {session.description || session.notes}
                                            </p>
                                        )}
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

export default Calendar;
