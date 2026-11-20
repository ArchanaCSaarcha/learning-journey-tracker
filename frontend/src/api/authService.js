
import api from "./api";

// Register a new user
export function registerUser(userData) {
  return api.post("/auth/register", userData);
}

// Login an existing user
export async function loginUser(userData) {
  const response = await api.post("/auth/login", userData);

  // Store JWT token
  localStorage.setItem("token", response.data.token);

  // Store logged-in user details
  localStorage.setItem("user", JSON.stringify(response.data.user));

  // Notify the application that login has happened
  window.dispatchEvent(new Event("auth-changed"));

  return response;
}

// Logout user
export function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  // Notify the application that logout has happened
  window.dispatchEvent(new Event("auth-changed"));
}
