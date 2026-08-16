import User from "../models/user.model.js"
import bcrypt from "bcrypt"

const registerUser=async(req,res)=>{
    try{
        //get data from the client
        const {name,email,password}=req.body;

        //check whether the user already exists
        const existinguser=await User.findOne({email})

        if(existinguser){
            return res.status(400).json({
                success:false,
                message:"User already exists"
            })
        }

        //convert the plain password into a hashed password
        const hashedpassword=await bcrypt.hash(password,10)

        //save the new user
        const user=await User.create(
            {
                name,
                email,
                password:hashedpassword,
            }
        
        )
        //send success response
        res.status(201).json({
            success:true,
            message:"User registered successfully",
            user,
        })
        
    }
    catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}
export default registerUser;