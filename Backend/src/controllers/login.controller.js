import User from "../models/user.model.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

export const loginuser=async (req,res)=>{
    try{
        //get email and password from request body
        const {email,password}=req.body
        
        //check email and password are provided
        if(!email ||!password){
            return res.status(400).json({
                message:"Email and password are required"
            })
        }

        //find user by email
        const user=await User.findOne({email})
        if(!user){
            return res.status(404).json({
                message:"User not found"
            })
        }
        //compare entered password eith hashed password
        const ispasswordmatch=await bcrypt.compare(password,user.password)

        if(!ispasswordmatch){
            return res.status(401).json({
                success:false,
                message:"Invalid email or password"
            })
        }

        //genarate jwt token
        const token=jwt.sign(
            {
                id:user._id,
                email:user.email,
            },
            process.env.JWT_SECRET,
            
            {
            expiresIn:"1d"
            },
        )

        //send response
        res.status(200).json({
            success:true,
            message:"Login successful",
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
            }
        })
    }
    catch(error){
        res.status(500).json(
            {
                success:false,
                message:error.message,
            }
        )
    }
}
