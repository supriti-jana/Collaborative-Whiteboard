import Board from "../models/board.model.js";

export const leaveBoard = async (req, res) => {
  try {
    const { id } = req.params;

    // Find board
    const board = await Board.findById(id);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    // Owner cannot leave
    if (board.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Board owner cannot leave the board. Transfer ownership or delete the board.",
      });
    }

    // Check membership
    const isMember = board.members.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(404).json({
        success: false,
        message: "You are not a member of this board",
      });
    }

    // Remove current user from members
    board.members = board.members.filter(
      (member) => member.toString() !== req.user._id.toString()
    );

    await board.save();

    res.status(200).json({
      success: true,
      message: "You left the board successfully",
      board,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};