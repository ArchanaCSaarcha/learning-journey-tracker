import api from "./api";

// Get all tasks
export function getTasks() {
  return api.get("/tasks");
}

// Create a new task
export function createTask(taskData) {
  return api.post("/tasks", taskData);
}

// Update a task
export function updateTask(id, taskData) {
  return api.patch(`/tasks/${id}`, taskData);
}

// Delete a task
export function deleteTask(id) {
  return api.delete(`/tasks/${id}`);
}