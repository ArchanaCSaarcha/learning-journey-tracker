
import express from "express";

import {
  createNewSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} from "../controllers/subjectController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create Subject
router.post("/", protect, createNewSubject);

// Get All Subjects
router.get("/", protect, getAllSubjects);

// Get Subject By ID
router.get("/:id", protect, getSubjectById);

// Update Subject
router.patch("/:id", protect, updateSubject);

// Delete Subject
router.delete("/:id", protect, deleteSubject);

export default router;
