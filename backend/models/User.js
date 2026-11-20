import crypto from "crypto";

export function createUser(name, email, password) {
  return {
    id: crypto.randomUUID(),
    name,
    email,
    password,
    createdAt: new Date().toISOString(),
  };
}
