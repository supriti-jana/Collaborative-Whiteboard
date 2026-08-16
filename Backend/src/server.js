import dotenv from "dotenv"
dotenv.config()

import app from"./app.js"
import connectDB from "./config/db.js"
const PORT=process.env.PORT||5000

const startserver=async()=>{
    try{
        await connectDB()
        app.listen(PORT,()=>{
            console.log(`server is running on port${PORT}`)
        })
        
    }
    catch(error){
        console.log("Failed to start server")
        console.error(error)
}
}

startserver();