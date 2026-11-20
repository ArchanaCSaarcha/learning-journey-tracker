
import api from "./api";

// Get all learning sessions
export function getSessions() {
  return api.get("/sessions");
}

// Create a new learning session
export function createSession(sessionData) {
  return api.post("/sessions", sessionData);
}

// Update a learning session
export function updateSession(id, sessionData) {
  return api.patch(`/sessions/${id}`, sessionData);
}

// Delete a learning session
export function deleteSession(id) {
  return api.delete(`/sessions/${id}`);
}
