import Board from "../models/board.model.js";

export const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    // Find board
    const board = await Board.findById(id);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    // Only owner can remove members
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the board owner can remove members",
      });
    }

    // Owner cannot remove themselves
    if (board.owner.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "Owner cannot be removed from the board",
      });
    }

    // Check if user is a member
    const isMember = board.members.some(
      (member) => member.toString() === userId
    );

    if (!isMember) {
      return res.status(404).json({
        success: false,
        message: "User is not a member of this board",
      });
    }

    // Remove member
    board.members = board.members.filter(
      (member) => member.toString() !== userId
    );

    await board.save();

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
      board,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};