import { readData, writeData } from "../config/data.js";
import { DATA_FILES } from "../config/constants.js";
import { createTask } from "../models/Task.js";

function enrichTask(task) {
  const today = new Date().toISOString().split("T")[0];
  const isOverdue = Boolean(
    task.dueDate && task.dueDate < today && task.status !== "Completed"
  );
  return {
    ...task,
    completed: task.status === "Completed",
    isOverdue,
  };
}

// Create a new task
export async function createNewTask(req, res) {
  try {
    const {
      title,
      description,
      subjectId,
      dueDate,
      status = "Not Started",
    } = req.body;

    // Check required fields
    if (!title?.trim() || !subjectId) {
      return res.status(400).json({
        message: "Task title and subject ID are required",
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

    const allowedStatuses = ["Not Started", "In Progress", "Completed"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Task status is invalid" });
    }

    // Validate due date against goal start and target dates
    if (dueDate) {
      const goals = await readData(DATA_FILES.GOALS);
      const goal = goals.find((g) => g.id === resolvedGoalId && g.userId === req.user.id);
      if (goal) {
        if (goal.startDate && dueDate < goal.startDate) {
          return res.status(400).json({
            message: `Due date cannot be before goal start date (${goal.startDate})`,
          });
        }
        if (goal.targetDate && dueDate > goal.targetDate) {
          return res.status(400).json({
            message: `Due date cannot be after goal target date (${goal.targetDate})`,
          });
        }
      }
    }

    // Create new task
    const tasks = await readData(DATA_FILES.TASKS);

    const newTask = createTask(
      title.trim(),
      description || "",
      subjectId,
      resolvedGoalId,
      req.user.id,
      dueDate || "",
      status
    );

    // Save task
    tasks.push(newTask);
    await writeData(DATA_FILES.TASKS, tasks);

    return res.status(201).json({
      message: "Task created successfully",
      task: enrichTask(newTask),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create task",
      error: error.message,
    });
  }
}

// Get all tasks
export async function getAllTasks(req, res) {
  try {
    const tasks = await readData(DATA_FILES.TASKS);

    // Get only tasks belonging to the logged-in user
    const userTasks = tasks
      .filter((task) => task.userId === req.user.id)
      .map(enrichTask);

    return res.status(200).json({
      message: "Tasks fetched successfully",
      tasks: userTasks,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
}

// Get task by ID
export async function getTaskById(req, res) {
  try {
    const { id } = req.params;

    const tasks = await readData(DATA_FILES.TASKS);

    const task = tasks.find(
      (t) => t.id === id && t.userId === req.user.id
    );

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    return res.status(200).json({
      message: "Task fetched successfully",
      task: enrichTask(task),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch task",
      error: error.message,
    });
  }
}

// Update Task
export async function updateTask(req, res) {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      dueDate,
      completed,
      status,
      subjectId,
    } = req.body;

    const tasks = await readData(DATA_FILES.TASKS);

    const taskIndex = tasks.findIndex(
      (t) => t.id === id && t.userId === req.user.id
    );

    if (taskIndex === -1) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    // If subjectId is updated, derive goalId from the subject
    if (subjectId !== undefined) {
      const subjects = await readData(DATA_FILES.SUBJECTS);
      const relatedSubject = subjects.find(
        (s) => s.id === subjectId && s.userId === req.user.id
      );
      if (!relatedSubject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      tasks[taskIndex].subjectId = subjectId;
      tasks[taskIndex].goalId = relatedSubject.goalId;
    }

    // Due date validation
    const nextDueDate = dueDate !== undefined ? dueDate : tasks[taskIndex].dueDate;
    if (dueDate !== undefined && nextDueDate) {
      const goals = await readData(DATA_FILES.GOALS);
      const parentGoal = goals.find(
        (g) => g.id === tasks[taskIndex].goalId && g.userId === req.user.id
      );
      if (parentGoal) {
        if (parentGoal.startDate && nextDueDate < parentGoal.startDate) {
          return res.status(400).json({
            message: `Due date cannot be before goal start date (${parentGoal.startDate})`,
          });
        }
        if (parentGoal.targetDate && nextDueDate > parentGoal.targetDate) {
          return res.status(400).json({
            message: `Due date cannot be after goal target date (${parentGoal.targetDate})`,
          });
        }
      }
      tasks[taskIndex].dueDate = nextDueDate;
    }

    // Status is the single source of truth; completed is derived
    if (status !== undefined) {
      const allowedStatuses = ["Not Started", "In Progress", "Completed"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Task status is invalid" });
      }
      tasks[taskIndex].status = status;
      tasks[taskIndex].completed = status === "Completed";
    } else if (completed !== undefined) {
      if (typeof completed !== "boolean") {
        return res.status(400).json({ message: "Completed must be a boolean" });
      }
      tasks[taskIndex].completed = completed;
      tasks[taskIndex].status = completed ? "Completed" : "Not Started";
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ message: "Task title cannot be empty" });
      }
      tasks[taskIndex].title = title.trim();
    }

    if (description !== undefined) {
      tasks[taskIndex].description = description;
    }

    await writeData(DATA_FILES.TASKS, tasks);

    return res.status(200).json({
      message: "Task updated successfully",
      task: enrichTask(tasks[taskIndex]),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update task",
      error: error.message,
    });
  }
}

// Delete Task
export async function deleteTask(req, res) {
  try {
    const { id } = req.params;

    const tasks = await readData(DATA_FILES.TASKS);

    const taskIndex = tasks.findIndex(
      (task) => task.id === id && task.userId === req.user.id
    );

    if (taskIndex === -1) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    tasks.splice(taskIndex, 1);
    await writeData(DATA_FILES.TASKS, tasks);

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete task",
      error: error.message,
    });
  }
}