import { readData, writeData } from "../config/data.js";
import { DATA_FILES } from "../config/constants.js";
import { createSession } from "../models/Session.js";

// Create a new learning session
export async function createNewSession(req, res) {
  try {
    const {
      title,
      description,
      subjectId,
      duration,
      sessionDate,
      taskId,
    } = req.body;

    // Check required subject
    if (!subjectId) {
      return res.status(400).json({
        message: "Subject ID is required",
      });
    }

    // Read existing subjects
    const subjects = await readData(DATA_FILES.SUBJECTS);

    // Check whether the subject belongs to the logged-in user
    const subject = subjects.find(
      (s) => s.id === subjectId && s.userId === req.user.id
    );

    if (!subject) {
      return res.status(404).json({
        message: "Subject not found",
      });
    }

    // Goal is derived from the subject to prevent relational mismatches
    const resolvedGoalId = subject.goalId;

    // Validate duration
    const numDuration = Number(duration);
    if (!Number.isFinite(numDuration) || numDuration <= 0) {
      return res.status(400).json({
        message: "Duration must be a positive number",
      });
    }

    if (numDuration > 1440) {
      return res.status(400).json({
        message: "Session duration cannot exceed 1440 minutes (24 hours)",
      });
    }

    // Validate sessionDate
    if (!sessionDate) {
      return res.status(400).json({
        message: "Session date is required",
      });
    }

    const todayStr = new Date().toISOString().split("T")[0];
    if (sessionDate > todayStr) {
      return res.status(400).json({
        message: "Session date cannot be in the future",
      });
    }

    // If an optional taskId is provided, verify it and promote task to "In Progress" if "Not Started"
    let linkedTaskId = null;
    if (taskId) {
      const tasks = await readData(DATA_FILES.TASKS);
      const taskIndex = tasks.findIndex(
        (t) => t.id === taskId && t.userId === req.user.id
      );

      if (taskIndex !== -1) {
        linkedTaskId = taskId;
        if (tasks[taskIndex].status === "Not Started") {
          tasks[taskIndex].status = "In Progress";
          tasks[taskIndex].completed = false;
          await writeData(DATA_FILES.TASKS, tasks);
        }
      }
    }

    // Create new session
    const sessions = await readData(DATA_FILES.SESSIONS);

    const newSession = createSession(
      title?.trim() || subject.name,
      description?.trim() || "",
      subjectId,
      resolvedGoalId,
      req.user.id,
      numDuration,
      sessionDate
    );

    newSession.taskId = linkedTaskId;

    // Save session
    sessions.push(newSession);
    await writeData(DATA_FILES.SESSIONS, sessions);

    return res.status(201).json({
      message: "Learning session created successfully",
      session: newSession,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create learning session",
      error: error.message,
    });
  }
}

// Get all learning sessions
export async function getAllSessions(req, res) {
  try {
    const sessions = await readData(DATA_FILES.SESSIONS);

    // Get only sessions belonging to the logged-in user
    const userSessions = sessions.filter(
      (session) => session.userId === req.user.id
    );

    return res.status(200).json({
      message: "Learning sessions fetched successfully",
      sessions: userSessions,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch learning sessions",
      error: error.message,
    });
  }
}

// Get learning session by ID
export async function getSessionById(req, res) {
  try {
    const { id } = req.params;

    const sessions = await readData(DATA_FILES.SESSIONS);

    const session = sessions.find(
      (session) =>
        session.id === id &&
        session.userId === req.user.id
    );

    if (!session) {
      return res.status(404).json({
        message: "Learning session not found",
      });
    }

    return res.status(200).json({
      message: "Learning session fetched successfully",
      session,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch learning session",
      error: error.message,
    });
  }
}

// Update Learning Session
export async function updateSession(req, res) {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      duration,
      sessionDate,
      subjectId,
      taskId,
    } = req.body;

    const sessions = await readData(DATA_FILES.SESSIONS);

    const sessionIndex = sessions.findIndex(
      (session) =>
        session.id === id &&
        session.userId === req.user.id
    );

    if (sessionIndex === -1) {
      return res.status(404).json({
        message: "Learning session not found",
      });
    }

    // If subjectId is changed, derive goalId
    if (subjectId !== undefined) {
      const subjects = await readData(DATA_FILES.SUBJECTS);
      const relatedSubject = subjects.find(
        (s) => s.id === subjectId && s.userId === req.user.id
      );
      if (!relatedSubject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      sessions[sessionIndex].subjectId = subjectId;
      sessions[sessionIndex].goalId = relatedSubject.goalId;
    }

    if (title !== undefined) {
      sessions[sessionIndex].title = title;
    }

    if (description !== undefined) {
      sessions[sessionIndex].description = description;
    }

    if (duration !== undefined) {
      const numDuration = Number(duration);
      if (!Number.isFinite(numDuration) || numDuration <= 0) {
        return res.status(400).json({ message: "Duration must be a positive number" });
      }
      if (numDuration > 1440) {
        return res.status(400).json({ message: "Session duration cannot exceed 1440 minutes (24 hours)" });
      }
      sessions[sessionIndex].duration = numDuration;
    }

    if (sessionDate !== undefined) {
      const todayStr = new Date().toISOString().split("T")[0];
      if (sessionDate > todayStr) {
        return res.status(400).json({ message: "Session date cannot be in the future" });
      }
      sessions[sessionIndex].sessionDate = sessionDate;
    }

    if (taskId !== undefined) {
      sessions[sessionIndex].taskId = taskId || null;
      if (taskId) {
        const tasks = await readData(DATA_FILES.TASKS);
        const taskIndex = tasks.findIndex(
          (t) => t.id === taskId && t.userId === req.user.id
        );
        if (taskIndex !== -1 && tasks[taskIndex].status === "Not Started") {
          tasks[taskIndex].status = "In Progress";
          tasks[taskIndex].completed = false;
          await writeData(DATA_FILES.TASKS, tasks);
        }
      }
    }

    await writeData(DATA_FILES.SESSIONS, sessions);

    return res.status(200).json({
      message: "Learning session updated successfully",
      session: sessions[sessionIndex],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update learning session",
      error: error.message,
    });
  }
}

// Delete Learning Session
export async function deleteSession(req, res) {
  try {
    const { id } = req.params;

    const sessions = await readData(DATA_FILES.SESSIONS);

    const sessionIndex = sessions.findIndex(
      (session) =>
        session.id === id &&
        session.userId === req.user.id
    );

    if (sessionIndex === -1) {
      return res.status(404).json({
        message: "Learning session not found",
      });
    }

    sessions.splice(sessionIndex, 1);
    await writeData(DATA_FILES.SESSIONS, sessions);

    return res.status(200).json({
      message: "Learning session deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete learning session",
      error: error.message,
    });
  }
}