
import { createContext, useContext, useEffect, useState } from "react";

import {
  getSessions,
  createSession as createSessionAPI,
  updateSession as updateSessionAPI,
  deleteSession as deleteSessionAPI,
} from "../api/sessionService";

const SessionsContext = createContext();

export function SessionsProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch sessions from backend
  async function fetchSessions() {
    const token = localStorage.getItem("token");

    if (!token) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getSessions();

      setSessions(response.data.sessions);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to fetch learning sessions"
      );
    } finally {
      setLoading(false);
    }
  }

  // Fetch sessions when app loads or authentication changes
  useEffect(() => {
    const initialFetch = window.setTimeout(fetchSessions, 0);

    function handleAuthChange() {
      fetchSessions();
    }

    window.addEventListener("auth-changed", handleAuthChange);

    return () => {
      window.clearTimeout(initialFetch);
      window.removeEventListener("auth-changed", handleAuthChange);
    };
  }, []);

  // Add a new learning session
  const addSession = async (session) => {
    const response = await createSessionAPI(session);

    const newSession = response.data.session;

    setSessions((previousSessions) => [
      ...previousSessions,
      newSession,
    ]);

    return newSession;
  };

  // Update an existing learning session
  const updateSession = async (id, updatedSession) => {
    const response = await updateSessionAPI(id, updatedSession);

    const updatedSessionData = response.data.session;

    setSessions((previousSessions) =>
      previousSessions.map((session) =>
        session.id === id ? updatedSessionData : session
      )
    );

    return updatedSessionData;
  };

  // Keep local session state in sync after a parent record is deleted on the server.
  useEffect(() => {
    const removeForGoal = (event) => setSessions((previous) => previous.filter((session) => session.goalId !== event.detail.goalId));
    const removeForSubject = (event) => setSessions((previous) => previous.filter((session) => session.subjectId !== event.detail.subjectId));
    window.addEventListener("goal-deleted", removeForGoal);
    window.addEventListener("subject-deleted", removeForSubject);
    return () => { window.removeEventListener("goal-deleted", removeForGoal); window.removeEventListener("subject-deleted", removeForSubject); };
  }, []);

  // Delete a learning session
  const deleteSession = async (id) => {
    await deleteSessionAPI(id);

    setSessions((previousSessions) =>
      previousSessions.filter((session) => session.id !== id)
    );
  };

  return (
    <SessionsContext.Provider
      value={{
        sessions,
        loading,
        error,
        addSession,
        updateSession,
        deleteSession,
      }}
    >
      {children}
    </SessionsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSessions() {
  return useContext(SessionsContext);
}
