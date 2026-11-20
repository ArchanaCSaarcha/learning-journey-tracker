import express from "express";

import {
  createNewNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
} from "../controllers/noteController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create Note
router.post("/", protect, createNewNote);

// Get All Notes
router.get("/", protect, getAllNotes);

// Get Note By ID
router.get("/:id", protect, getNoteById);

// Update Note
router.patch("/:id", protect, updateNote);

// Delete Note
router.delete("/:id", protect, deleteNote);

export default router;