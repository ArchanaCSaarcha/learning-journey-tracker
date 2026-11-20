
import crypto from "crypto";

export function createNote(
  title,
  content,
  subjectId,
  goalId,
  userId
) {
  return {
    id: crypto.randomUUID(),
    title,
    content,
    subjectId,
    goalId,
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
