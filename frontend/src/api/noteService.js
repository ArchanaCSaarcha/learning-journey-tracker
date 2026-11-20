import api from "./api";

export function getNotes() {
  return api.get("/notes");
}

export function createNote(noteData) {
  return api.post("/notes", noteData);
}

export function updateNote(id, noteData) {
  return api.patch("/notes/" + id, noteData);
}

export function deleteNote(id) {
  return api.delete("/notes/" + id);
}
