
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getSubjects,
  createSubject as createSubjectAPI,
  updateSubject as updateSubjectAPI,
  deleteSubject as deleteSubjectAPI,
} from "../api/subjectService";

const SubjectsContext = createContext();

export function SubjectsProvider({ children }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch subjects from backend
  async function fetchSubjects() {
    const token = localStorage.getItem("token");

    if (!token) {
      setSubjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getSubjects();
      setSubjects(response.data.subjects);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to fetch subjects"
      );
    } finally {
      setLoading(false);
    }
  }

  // Fetch subjects when authentication changes
  useEffect(() => {
    const initialFetch = window.setTimeout(fetchSubjects, 0);

    function handleAuthChange() {
      fetchSubjects();
    }

    window.addEventListener("auth-changed", handleAuthChange);

    return () => {
      window.clearTimeout(initialFetch);
      window.removeEventListener("auth-changed", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    const removeForGoal = (event) => setSubjects((previous) => previous.filter((subject) => subject.goalId !== event.detail.goalId));
    window.addEventListener("goal-deleted", removeForGoal);
    return () => window.removeEventListener("goal-deleted", removeForGoal);
  }, []);

  // Add a new subject
  const addSubject = async (goalId, subject) => {
    const response = await createSubjectAPI({
      ...subject,
      goalId,
    });

    const newSubject = response.data.subject;

    setSubjects((previousSubjects) => [
      ...previousSubjects,
      newSubject,
    ]);

    return newSubject;
  };

  // Update an existing subject
  const updateSubject = async (id, updatedSubject) => {
    const response = await updateSubjectAPI(id, updatedSubject);

    const updatedSubjectData = response.data.subject;

    setSubjects((previousSubjects) =>
      previousSubjects.map((subject) =>
        subject.id === id ? updatedSubjectData : subject
      )
    );

    return updatedSubjectData;
  };

  // Delete a subject
  const deleteSubject = async (id) => {
    await deleteSubjectAPI(id);

    setSubjects((previousSubjects) => previousSubjects.filter((subject) => subject.id !== id));
    window.dispatchEvent(new CustomEvent("subject-deleted", { detail: { subjectId: id } }));
  };

  return (
    <SubjectsContext.Provider
      value={{
        subjects,
        loading,
        error,
        addSubject,
        updateSubject,
        deleteSubject,
      }}
    >
      {children}
    </SubjectsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSubjects() {
  return useContext(SubjectsContext);
}
