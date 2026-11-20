import { readData, writeData } from "../config/data.js";
import { DATA_FILES } from "../config/constants.js";
import { createNote } from "../models/Note.js";

async function resolveNoteRelationship({ userId, goalId = "", subjectId = "" }) {
  const goals = await readData(DATA_FILES.GOALS);
  const subjects = await readData(DATA_FILES.SUBJECTS);
  let resolvedGoalId = goalId || "";
  let resolvedSubjectId = subjectId || "";

  if (resolvedSubjectId) {
    const subject = subjects.find((item) => item.id === resolvedSubjectId && item.userId === userId);
    if (!subject) return { error: "Subject not found" };
    if (resolvedGoalId && subject.goalId !== resolvedGoalId) return { error: "Subject does not belong to the selected goal" };
    resolvedGoalId = subject.goalId;
  }

  if (resolvedGoalId && !goals.some((item) => item.id === resolvedGoalId && item.userId === userId)) {
    return { error: "Goal not found" };
  }

  return { goalId: resolvedGoalId, subjectId: resolvedSubjectId };
}

export async function createNewNote(req, res) {
  try {
    const { title, content, goalId = "", subjectId = "", attachment = null } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: "Note title and content are required" });
    }
    const attachmentError = validateAttachment(attachment);
    if (attachmentError) return res.status(400).json({ message: attachmentError });
    const relationship = await resolveNoteRelationship({ userId: req.user.id, goalId, subjectId });
    if (relationship.error) return res.status(404).json({ message: relationship.error });

    const notes = await readData(DATA_FILES.NOTES);
    const note = createNote(title.trim(), content, relationship.subjectId, relationship.goalId, req.user.id);
    note.attachment = attachment;
    notes.push(note);
    await writeData(DATA_FILES.NOTES, notes);
    return res.status(201).json({ message: "Note created successfully", note });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create note", error: error.message });
  }
}

export async function getAllNotes(req, res) {
  try {
    const notes = await readData(DATA_FILES.NOTES);
    return res.status(200).json({ message: "Notes fetched successfully", notes: notes.filter((note) => note.userId === req.user.id) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch notes", error: error.message });
  }
}

export async function getNoteById(req, res) {
  try {
    const notes = await readData(DATA_FILES.NOTES);
    const note = notes.find((item) => item.id === req.params.id && item.userId === req.user.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    return res.status(200).json({ message: "Note fetched successfully", note });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch note", error: error.message });
  }
}

export async function updateNote(req, res) {
  try {
    const notes = await readData(DATA_FILES.NOTES);
    const index = notes.findIndex((item) => item.id === req.params.id && item.userId === req.user.id);
    if (index === -1) return res.status(404).json({ message: "Note not found" });
    const note = notes[index];
    const { title, content, goalId, subjectId, attachment } = req.body;
    if (title !== undefined && (typeof title !== "string" || !title.trim())) return res.status(400).json({ message: "Note title cannot be empty" });
    if (content !== undefined && (typeof content !== "string" || !content.trim())) return res.status(400).json({ message: "Note content cannot be empty" });
    const attachmentError = validateAttachment(attachment);
    if (attachmentError) return res.status(400).json({ message: attachmentError });

    if (goalId !== undefined || subjectId !== undefined) {
      const relationship = await resolveNoteRelationship({
        userId: req.user.id,
        goalId: goalId !== undefined ? goalId : note.goalId,
        subjectId: subjectId !== undefined ? subjectId : note.subjectId,
      });
      if (relationship.error) return res.status(404).json({ message: relationship.error });
      note.goalId = relationship.goalId;
      note.subjectId = relationship.subjectId;
    }
    if (title !== undefined) note.title = title.trim();
    if (content !== undefined) note.content = content;
    if (attachment !== undefined) note.attachment = attachment;
    note.updatedAt = new Date().toISOString();
    await writeData(DATA_FILES.NOTES, notes);
    return res.status(200).json({ message: "Note updated successfully", note });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update note", error: error.message });
  }
}

function validateAttachment(attachment) {
  if (attachment === undefined || attachment === null) return "";
  if (typeof attachment.name !== "string" || !attachment.name.toLowerCase().endsWith(".pdf")) return "Attachment must be a PDF file";
  if (typeof attachment.data !== "string" || !attachment.data.startsWith("data:application/pdf;base64,")) return "Attachment must be a valid PDF file";
  const base64Data = attachment.data.slice("data:application/pdf;base64,".length);
  if (Buffer.from(base64Data, "base64").length > 5 * 1024 * 1024) return "PDF file must be smaller than 5 MB";
  return "";
}

export async function deleteNote(req, res) {
  try {
    const notes = await readData(DATA_FILES.NOTES);
    const index = notes.findIndex((item) => item.id === req.params.id && item.userId === req.user.id);
    if (index === -1) return res.status(404).json({ message: "Note not found" });
    notes.splice(index, 1);
    await writeData(DATA_FILES.NOTES, notes);
    return res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete note", error: error.message });
  }
}
