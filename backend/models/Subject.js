
import crypto from "crypto";

export function createSubject(name, description, goalId, userId) {
  return {
    id: crypto.randomUUID(),
    name,
    description,
    goalId,
    userId,
    createdAt: new Date().toISOString(),
  };
}
