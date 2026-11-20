
import crypto from "crypto";

export function createSession(
  title,
  description,
  subjectId,
  goalId,
  userId,
  duration,
  sessionDate
) {
  return {
    id: crypto.randomUUID(),
    title,
    description,
    subjectId,
    goalId,
    userId,
    duration,
    sessionDate,
    createdAt: new Date().toISOString(),
  };
}
