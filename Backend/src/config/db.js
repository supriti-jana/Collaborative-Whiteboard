import mongoose from "mongoose"

const connectDB=async()=>{
    try{
        const connectionInstance=await mongoose.connect(process.env.MONGO_URL, {
    dbName: process.env.DB_NAME,
});
        console.log("Mongodb connected successfully")
        
    }
    catch(error){
        console.log("Mongodb connection failed")
        console.log(error.message)
        process.exit(1)
    }
}
export default connectDB;