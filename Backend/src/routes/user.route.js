import express from "express";
import registerUser from "../controllers/register.controller.js";
import { loginUser } from "../controllers/login.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);

userRouter.post("/login", loginUser);

// Check currently logged-in user
userRouter.get("/me", verifyToken, (req, res) => {
    return res.status(200).json({
        success: true,
        user: req.user
    });
});

// Logout user
userRouter.post("/logout", (req, res) => {

    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production"
            ? "none"
            : "lax",
        path: "/"
    });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
});

export default userRouter;