
import crypto from "crypto";

export function createGoal(
  title,
  description,
  startDate,
  targetDate,
  userId
) {
  return {
    id: crypto.randomUUID(),
    title,
    description,
    startDate,
    targetDate,
    userId,
    completed: false,
    createdAt: new Date().toISOString(),
  };
}
