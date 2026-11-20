
import { createContext, useContext, useEffect, useState } from "react";

import {
  getTasks,
  createTask as createTaskAPI,
  updateTask as updateTaskAPI,
  deleteTask as deleteTaskAPI,
} from "../api/taskService";

const TasksContext = createContext();

// Convert backend completed value into frontend status
function formatTask(task) {
  return {
    ...task,
    status: task.status || (task.completed ? "Completed" : "Not Started"),
  };
}

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch tasks from backend
  async function fetchTasks() {
    const token = localStorage.getItem("token");

    if (!token) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getTasks();

      setTasks(response.data.tasks.map(formatTask));
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to fetch tasks"
      );
    } finally {
      setLoading(false);
    }
  }

  // Fetch tasks when app loads or authentication changes
  useEffect(() => {
    const initialFetch = window.setTimeout(fetchTasks, 0);

    function handleAuthChange() {
      fetchTasks();
    }

    window.addEventListener("auth-changed", handleAuthChange);

    return () => {
      window.clearTimeout(initialFetch);
      window.removeEventListener("auth-changed", handleAuthChange);
    };
  }, []);

  // Add a new task
  const addTask = async (goalId, subjectId, task) => {
    const { status, ...taskData } = task;

    const response = await createTaskAPI({
      ...taskData,
      goalId,
      subjectId,
      status: status ?? (task.completed ? "Completed" : "Not Started"),
      completed: task.completed ?? status === "Completed",
    });

    const newTask = formatTask(response.data.task);

    setTasks((previousTasks) => [
      ...previousTasks,
      newTask,
    ]);

    return newTask;
  };

  // Update an existing task
  const updateTask = async (id, updatedTask) => {
    const { status, ...taskData } = updatedTask;

    const statusMap = {
      "Not Started": false,
      "In Progress": false,
      Completed: true,
    };

    const payload = {
      ...taskData,
      ...(status !== undefined && { status, completed: statusMap[status] }),
    };

    const response = await updateTaskAPI(id, payload);

    const updatedTaskData = formatTask(response.data.task);

    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === id ? updatedTaskData : task
      )
    );

    return updatedTaskData;
  };

  // Keep local task state in sync after a parent record is deleted on the server.
  useEffect(() => {
    const removeForGoal = (event) => setTasks((previous) => previous.filter((task) => task.goalId !== event.detail.goalId));
    const removeForSubject = (event) => setTasks((previous) => previous.filter((task) => task.subjectId !== event.detail.subjectId));
    window.addEventListener("goal-deleted", removeForGoal);
    window.addEventListener("subject-deleted", removeForSubject);
    return () => { window.removeEventListener("goal-deleted", removeForGoal); window.removeEventListener("subject-deleted", removeForSubject); };
  }, []);

  // Delete a task
  const deleteTask = async (id) => {
    await deleteTaskAPI(id);

    setTasks((previousTasks) =>
      previousTasks.filter((task) => task.id !== id)
    );
  };

  return (
    <TasksContext.Provider
      value={{
        tasks,
        loading,
        error,
        addTask,
        updateTask,
        deleteTask,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTasks() {
  return useContext(TasksContext);
}
