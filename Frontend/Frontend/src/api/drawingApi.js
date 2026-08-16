import api from "./axios";

// Save drawing
export const saveDrawing = (boardId, elements) => {
  return api.post("/drawing/save", {
    boardId,
    elements,
  });
};

// Get drawing
export const getDrawing = (boardId) => {
  return api.get(`/drawing/${boardId}`);
};

// Clear drawing
export const clearDrawing = (boardId) => {
  return api.delete(`/drawing/${boardId}`);
};