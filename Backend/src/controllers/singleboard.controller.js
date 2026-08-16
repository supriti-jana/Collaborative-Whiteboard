import Board from "../models/board.model.js";

export const getSingleBoard = async (req, res) => {
  try {
    const { id } = req.params;

    // Find board by ID
    const board = await Board.findById(id)
      .populate("owner", "name email")
      .populate("members", "name email");

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    // Check if logged-in user is a member
    const isMember = board.members.some(
      (member) => member._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this board",
      });
    }

    res.status(200).json({
      success: true,
      board,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};