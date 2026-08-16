import express from "express"
import { verifyToken } from "../middleware/auth.middleware.js"
import { createBoard } from "../controllers/board.controller.js"
import { getBoards } from "../controllers/getboard.controller.js"
import { getSingleBoard } from "../controllers/singleboard.controller.js"
import { updateBoard } from "../controllers/updateBoard.controller.js"
import { deleteBoard } from "../controllers/deleteBoard.controller.js"
import { addMember } from "../controllers/addmember.controller.js"
import { removeMember } from "../controllers/removeuser.controller.js"
import { leaveBoard } from "../controllers/leave.controller.js"

const router=express.Router()

router.post("/create",verifyToken,createBoard)
router.get("/",verifyToken,getBoards)
router.get("/:id",verifyToken,getSingleBoard)
router.put("/:id",verifyToken,updateBoard)
router.delete("/:id",verifyToken,deleteBoard)
router.post("/:id/members",verifyToken,addMember)
router.delete("/:id/members/:userId",verifyToken,removeMember)
router.delete("/:id/leave", verifyToken, leaveBoard);

export default router