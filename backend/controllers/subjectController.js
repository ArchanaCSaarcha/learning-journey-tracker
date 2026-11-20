import { readData, writeData } from "../config/data.js";
import { DATA_FILES } from "../config/constants.js";
import { createSubject } from "../models/Subject.js";



export async function createNewSubject(req, res) {
  try {
    const { name, description, goalId } = req.body;

    // Check required fields
    if (!name || !goalId) {
      return res.status(400).json({
        message: "Subject name and goal ID are required",
      });
    }

    // Read existing goals
    const goals = await readData(DATA_FILES.GOALS);

    // Check whether the goal belongs to the logged-in user
    const goal = goals.find(
      (goal) =>
        goal.id === goalId && goal.userId === req.user.id
    );

    if (!goal) {
      return res.status(404).json({
        message: "Goal not found",
      });
    }

    // Read existing subjects
    const subjects = await readData(DATA_FILES.SUBJECTS);

    // Create subject
    const newSubject = createSubject(
      name,
      description || "",
      goalId,
      req.user.id
    );

    // Save subject
    subjects.push(newSubject);
    await writeData(DATA_FILES.SUBJECTS, subjects);

    return res.status(201).json({
      message: "Subject created successfully",
      subject: newSubject,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create subject",
      error: error.message,
    });
  }
}

// Get all subjects
export async function getAllSubjects(req, res) {
  try {
    const subjects = await readData(DATA_FILES.SUBJECTS);

    const userSubjects = subjects.filter(
      (subject) => subject.userId === req.user.id
    );

    return res.status(200).json({
      message: "Subjects fetched successfully",
      subjects: userSubjects,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch subjects",
      error: error.message,
    });
  }
}

// Get Subject By ID
export async function getSubjectById(req, res) {
  try {
    const { id } = req.params;

    const subjects = await readData(DATA_FILES.SUBJECTS);

    const subject = subjects.find(
      (subject) =>
        subject.id === id && subject.userId === req.user.id
    );

    if (!subject) {
      return res.status(404).json({
        message: "Subject not found",
      });
    }

    return res.status(200).json({
      message: "Subject fetched successfully",
      subject,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch subject",
      error: error.message,
    });
  }
}


 // Update Subject
export async function updateSubject(req, res) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const subjects = await readData(DATA_FILES.SUBJECTS);

    const subjectIndex = subjects.findIndex(
      (subject) =>
        subject.id === id && subject.userId === req.user.id
    );

    if (subjectIndex === -1) {
      return res.status(404).json({
        message: "Subject not found",
      });
    }

    if (name !== undefined) {
      subjects[subjectIndex].name = name;
    }

    if (description !== undefined) {
      subjects[subjectIndex].description = description;
    }

    await writeData(DATA_FILES.SUBJECTS, subjects);

    return res.status(200).json({
      message: "Subject updated successfully",
      subject: subjects[subjectIndex],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update subject",
      error: error.message,
    });
  }
}


 // Delete Subject
export async function deleteSubject(req, res) {
  try {
    const { id } = req.params;

    // Read existing subjects
    const subjects = await readData(DATA_FILES.SUBJECTS);

    // Find the subject belonging to the logged-in user
    const subject = subjects.find(
      (subject) =>
        subject.id === id && subject.userId === req.user.id
    );

    if (!subject) {
      return res.status(404).json({
        message: "Subject not found",
      });
    }

    // Delete the subject
    const updatedSubjects = subjects.filter(
      (subject) =>
        !(subject.id === id && subject.userId === req.user.id)
    );

    await writeData(DATA_FILES.SUBJECTS, updatedSubjects);

    // Delete related tasks
    const tasks = await readData(DATA_FILES.TASKS);

    const updatedTasks = tasks.filter(
      (task) =>
        !(task.subjectId === id && task.userId === req.user.id)
    );

    await writeData(DATA_FILES.TASKS, updatedTasks);

    // Delete related learning sessions
    const sessions = await readData(DATA_FILES.SESSIONS);

    const updatedSessions = sessions.filter(
      (session) =>
        !(session.subjectId === id && session.userId === req.user.id)
    );

    await writeData(DATA_FILES.SESSIONS, updatedSessions);

    // Delete related notes
    const notes = await readData(DATA_FILES.NOTES);

    const updatedNotes = notes.filter(
      (note) =>
        !(note.subjectId === id && note.userId === req.user.id)
    );

    await writeData(DATA_FILES.NOTES, updatedNotes);

    return res.status(200).json({
      message: "Subject deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete subject",
      error: error.message,
    });
  }
}

