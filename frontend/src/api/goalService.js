
import api from "./api";

// Get all goals
export function getGoals() {
  return api.get("/goals");
}

// Create a new goal
export function createGoal(goalData) {
  return api.post("/goals", goalData);
}

// Update an existing goal
export function updateGoal(id, goalData) {
  return api.patch(`/goals/${id}`, goalData);
}

// Delete a goal
export function deleteGoal(id) {
  return api.delete(`/goals/${id}`);
}
