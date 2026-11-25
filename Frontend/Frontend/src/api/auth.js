import api from "./axios";

export const loginUser = (data) => {
  return api.post("/users/login", data);
};

export const registerUser = (data) => {
  return api.post("/users/register", data);
};

// Get currently logged-in user
export const getCurrentUser = () => {
  return api.get("/users/me");
};

// Logout user
export const logoutUser = () => {
  return api.post("/users/logout");
};