import Board from "../models/board.model.js"

export const createBoard=async(req,res)=>{
    try{
        const {title,ispublic}=req.body

        if(!title){
            return res.status(400).json(
                {
                    message:"Board title is required"
                }
            )
        }

        const board=await Board.create({
            title,
            owner:req.user._id,
            members:[req.user._id],
            ispublic,
        })

        res.status(201).json({
            success:true,
            message:"Board created successfully",
            board,
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

