import Board from "../models/board.model.js";

export const deleteBoard = async (req, res) => {
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

    // Only owner can delete
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the board owner can delete this board",
      });
    }

    // Delete board
    await Board.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Board deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};