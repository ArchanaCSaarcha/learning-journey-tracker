import { readData, writeData } from "../config/data.js";
import { DATA_FILES } from "../config/constants.js";
import { createGoal } from "../models/Goal.js";

// Create a new goal for the authenticated user.
export async function createNewGoal(req, res) {
  try {
    const { title, description = "", startDate = "", targetDate = "" } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Goal title is required" });
    }

    if (startDate && targetDate && targetDate < startDate) {
      return res.status(400).json({ message: "Target date must be on or after start date" });
    }

    const goals = await readData(DATA_FILES.GOALS);
    const newGoal = createGoal(
      title.trim(),
      description,
      startDate,
      targetDate,
      req.user.id
    );

    goals.push(newGoal);
    await writeData(DATA_FILES.GOALS, goals);

    return res.status(201).json({
      message: "Goal created successfully",
      goal: newGoal,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create goal",
      error: error.message,
    });
  }
}

export async function getAllGoals(req, res) {
  try {
    const goals = await readData(DATA_FILES.GOALS);
    const userGoals = goals.filter((goal) => goal.userId === req.user.id);

    return res.status(200).json({
      message: "Goals fetched successfully",
      goals: userGoals,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch goals",
      error: error.message,
    });
  }
}

export async function getGoalById(req, res) {
  try {
    const goals = await readData(DATA_FILES.GOALS);
    const goal = goals.find(
      (item) => item.id === req.params.id && item.userId === req.user.id
    );

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    return res.status(200).json({ message: "Goal fetched successfully", goal });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch goal",
      error: error.message,
    });
  }
}

export async function updateGoal(req, res) {
  try {
    const goals = await readData(DATA_FILES.GOALS);
    const goalIndex = goals.findIndex(
      (item) => item.id === req.params.id && item.userId === req.user.id
    );

    if (goalIndex === -1) {
      return res.status(404).json({ message: "Goal not found" });
    }

    const { title, description, startDate, targetDate, completed } = req.body;
    const goal = goals[goalIndex];

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ message: "Goal title cannot be empty" });
      }
      goal.title = title.trim();
    }
    if (description !== undefined) goal.description = description;
    if (startDate !== undefined) goal.startDate = startDate;
    if (targetDate !== undefined) goal.targetDate = targetDate;

    if (goal.startDate && goal.targetDate && goal.targetDate < goal.startDate) {
      return res.status(400).json({ message: "Target date must be on or after start date" });
    }

    if (completed !== undefined) {
      if (typeof completed !== "boolean") {
        return res.status(400).json({ message: "Completed must be a boolean" });
      }
      goal.completed = completed;
    }

    await writeData(DATA_FILES.GOALS, goals);
    return res.status(200).json({ message: "Goal updated successfully", goal });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update goal",
      error: error.message,
    });
  }
}

export async function deleteGoal(req, res) {
  try {
    const goals = await readData(DATA_FILES.GOALS);
    const goalIndex = goals.findIndex((item) => item.id === req.params.id && item.userId === req.user.id);
    if (goalIndex === -1) return res.status(404).json({ message: "Goal not found" });

    const goalId = req.params.id;
    const userId = req.user.id;
    const subjects = await readData(DATA_FILES.SUBJECTS);
    const removedSubjectIds = new Set(subjects.filter((item) => item.goalId === goalId && item.userId === userId).map((item) => item.id));
    const tasks = await readData(DATA_FILES.TASKS);
    const sessions = await readData(DATA_FILES.SESSIONS);
    const notes = await readData(DATA_FILES.NOTES);

    await writeData(DATA_FILES.GOALS, goals.filter((item) => !(item.id === goalId && item.userId === userId)));
    await writeData(DATA_FILES.SUBJECTS, subjects.filter((item) => !(item.goalId === goalId && item.userId === userId)));
    await writeData(DATA_FILES.TASKS, tasks.filter((item) => !(item.userId === userId && (item.goalId === goalId || removedSubjectIds.has(item.subjectId)))));
    await writeData(DATA_FILES.SESSIONS, sessions.filter((item) => !(item.userId === userId && (item.goalId === goalId || removedSubjectIds.has(item.subjectId)))));
    await writeData(DATA_FILES.NOTES, notes.filter((item) => !(item.goalId === goalId && item.userId === userId) && !(removedSubjectIds.has(item.subjectId) && item.userId === userId)));

    return res.status(200).json({ message: "Goal and related data deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete goal", error: error.message });
  }
}
