import Board from "../models/board.model.js";
import User from "../models/user.model.js";

export const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    // Find board
    const board = await Board.findById(id);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    // Only owner can add members
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the board owner can add members",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if already a member
    const alreadyMember = board.members.includes(user._id);

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: "User is already a member",
      });
    }

    // Add member
    board.members.push(user._id);

    await board.save();

    res.status(200).json({
      success: true,
      message: "Member added successfully",
      board,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};