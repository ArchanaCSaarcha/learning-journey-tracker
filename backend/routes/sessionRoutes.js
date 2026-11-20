import express from "express";

import {
  createNewSession,
  getAllSessions,
  getSessionById,
  updateSession,
  deleteSession,
} from "../controllers/sessionController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create Learning Session
router.post("/", protect, createNewSession);

// Get All Learning Sessions
router.get("/", protect, getAllSessions);

// Get Learning Session By ID
router.get("/:id", protect, getSessionById);

// Update Learning Session
router.patch("/:id", protect, updateSession);

// Delete Learning Session
router.delete("/:id", protect, deleteSession);

export default router;