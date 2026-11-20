
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getGoals,
  createGoal as createGoalAPI,
  updateGoal as updateGoalAPI,
  deleteGoal as deleteGoalAPI,
} from "../api/goalService";

const GoalsContext = createContext();

export function GoalsProvider({ children }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch goals from backend
  async function fetchGoals() {
    const token = localStorage.getItem("token");

    if (!token) {
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getGoals();
      setGoals(response.data.goals);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to fetch goals"
      );
    } finally {
      setLoading(false);
    }
  }

  // Fetch goals when authentication changes
  useEffect(() => {
    const initialFetch = window.setTimeout(fetchGoals, 0);

    function handleAuthChange() {
      fetchGoals();
    }

    window.addEventListener("auth-changed", handleAuthChange);

    return () => {
      window.clearTimeout(initialFetch);
      window.removeEventListener("auth-changed", handleAuthChange);
    };
  }, []);

  // Add a new goal
  const addGoal = async (goal) => {
    const response = await createGoalAPI(goal);
    const newGoal = response.data.goal;

    setGoals((previousGoals) => [
      ...previousGoals,
      newGoal,
    ]);

    return newGoal;
  };

  // Update an existing goal
  const updateGoal = async (id, updatedGoal) => {
    const response = await updateGoalAPI(id, updatedGoal);
    const updatedGoalData = response.data.goal;

    setGoals((previousGoals) =>
      previousGoals.map((goal) =>
        goal.id === id ? updatedGoalData : goal
      )
    );

    return updatedGoalData;
  };

  // Delete a goal
  const deleteGoal = async (id) => {
    await deleteGoalAPI(id);

    setGoals((previousGoals) => previousGoals.filter((goal) => goal.id !== id));
    window.dispatchEvent(new CustomEvent("goal-deleted", { detail: { goalId: id } }));
  };

  return (
    <GoalsContext.Provider
      value={{
        goals,
        loading,
        error,
        addGoal,
        updateGoal,
        deleteGoal,
      }}
    >
      {children}
    </GoalsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGoals() {
  return useContext(GoalsContext);
}
