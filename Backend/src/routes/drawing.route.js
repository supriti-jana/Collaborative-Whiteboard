import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { saveDrawing } from "../controllers/drawing/savedrawing.controller.js";
import { getDrawing } from "../controllers/drawing/getdrawing.controller.js";
import { clearDrawing } from "../controllers/drawing/cleardrawing.controller.js";

const router = express.Router();

router.post("/save", verifyToken, saveDrawing);
router.get("/:boardId", verifyToken, getDrawing);
router.delete("/:boardId", verifyToken, clearDrawing);

export default router;