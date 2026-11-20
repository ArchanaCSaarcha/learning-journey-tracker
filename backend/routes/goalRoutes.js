
import express from "express";

import {
  createNewGoal,
  getAllGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
} from "../controllers/goalController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create Goal
router.post("/", protect, createNewGoal);

// Get All Goals
router.get("/", protect, getAllGoals);

// Get Goal by ID
router.get("/:id", protect, getGoalById);

// Update Goal
router.patch("/:id", protect, updateGoal);

// Delete Goal
router.delete("/:id", protect, deleteGoal);

export default router;
