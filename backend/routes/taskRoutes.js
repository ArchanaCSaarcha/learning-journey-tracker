import express from "express";

import {
  createNewTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create Task
router.post("/", protect, createNewTask);

// Get All Tasks
router.get("/", protect, getAllTasks);

// Get Task By ID
router.get("/:id", protect, getTaskById);

// Update Task
router.patch("/:id", protect, updateTask);

// Delete Task
router.delete("/:id", protect, deleteTask);

export default router;