import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app=express()
app.use(cors())
    
app.use(express.json())
app.use(
    express.urlencoded({
        extended:true,
    })
)

app.use(cookieParser())


app.get("/",(req,res)=>{
    res.status(200).json({
        success:true,
        message:"Whiteboard Backend is running"
    })
})


import userRouter from "./routes/user.route.js"
import boardRouter from "./routes/board.route.js"
import drawingrouter from "./routes/drawing.route.js"

//route for register
app.use("/users",userRouter)

//route for board creation
app.use("/boards",boardRouter)

//route for drawing
app.use("/drawing",drawingrouter)

export default app;