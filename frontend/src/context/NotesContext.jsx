import { createContext, useContext, useEffect, useState } from "react";
import { getNotes, createNote as createNoteAPI, updateNote as updateNoteAPI, deleteNote as deleteNoteAPI } from "../api/noteService";

const NotesContext = createContext();

export function NotesProvider({ children }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchNotes() {
    if (!localStorage.getItem("token")) {
      setNotes([]);
      setLoading(false);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await getNotes();
      setNotes(response.data.notes);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to fetch notes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initialFetch = window.setTimeout(fetchNotes, 0);
    const handleAuthChange = () => {
      setNotes([]);
      void fetchNotes();
    };
    const handleGoalDeleted = (event) => setNotes((previous) => previous.filter((note) => note.goalId !== event.detail.goalId));
    const handleSubjectDeleted = (event) => setNotes((previous) => previous.filter((note) => note.subjectId !== event.detail.subjectId));
    window.addEventListener("auth-changed", handleAuthChange);
    window.addEventListener("goal-deleted", handleGoalDeleted);
    window.addEventListener("subject-deleted", handleSubjectDeleted);
    return () => {
      window.clearTimeout(initialFetch);
      window.removeEventListener("auth-changed", handleAuthChange);
      window.removeEventListener("goal-deleted", handleGoalDeleted);
      window.removeEventListener("subject-deleted", handleSubjectDeleted);
    };
  }, []);

  const addNote = async (noteData) => {
    const response = await createNoteAPI(noteData);
    setNotes((previous) => [...previous, response.data.note]);
    return response.data.note;
  };

  const updateNote = async (id, noteData) => {
    const response = await updateNoteAPI(id, noteData);
    setNotes((previous) => previous.map((note) => note.id === id ? response.data.note : note));
    return response.data.note;
  };

  const deleteNote = async (id) => {
    await deleteNoteAPI(id);
    setNotes((previous) => previous.filter((note) => note.id !== id));
  };

  return (
    <NotesContext.Provider value={{ notes, loading, error, addNote, updateNote, deleteNote }}>
      {children}
    </NotesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotes() {
  return useContext(NotesContext);
}
