import express from "express"
import registerUser from "../controllers/register.controller.js"
import { loginUser } from "../controllers/login.controller.js"

const userRouter=express.Router()
userRouter.post("/register",registerUser)
userRouter.post("/login",loginUser)
export default userRouter