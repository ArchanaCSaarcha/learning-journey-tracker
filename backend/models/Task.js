
import crypto from "crypto";

export function createTask(
  title,
  description,
  subjectId,
  goalId,
  userId,
  dueDate,
  status = "Not Started"
) {
  return {
    id: crypto.randomUUID(),
    title,
    description,
    subjectId,
    goalId,
    userId,
    dueDate,
    completed: status === "Completed",
    status,
    createdAt: new Date().toISOString(),
  };
}
