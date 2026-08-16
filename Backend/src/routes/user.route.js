import express from "express"
import registerUser from "../controllers/register.controller.js"
import { loginuser } from "../controllers/login.controller.js"

const userRouter=express.Router()
userRouter.post("/register",registerUser)
userRouter.post("/login",loginuser)
export default userRouter