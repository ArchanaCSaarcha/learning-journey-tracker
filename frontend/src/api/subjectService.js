
import api from "./api";

// Get all subjects
export function getSubjects() {
  return api.get("/subjects");
}

// Create a new subject
export function createSubject(subjectData) {
  return api.post("/subjects", subjectData);
}

// Update an existing subject
export function updateSubject(id, subjectData) {
  return api.patch(`/subjects/${id}`, subjectData);
}

// Delete a subject
export function deleteSubject(id) {
  return api.delete(`/subjects/${id}`);
}
