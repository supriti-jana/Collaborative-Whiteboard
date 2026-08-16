import Board from "../models/board.model.js";

export const updateBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, isPublic } = req.body;

    // Find board
    const board = await Board.findById(id);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    // Only owner can update
    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the board owner can update this board",
      });
    }

    // Update fields only if they are provided
    if (title !== undefined) {
      board.title = title;
    }

    if (isPublic !== undefined) {
      board.isPublic = isPublic;
    }

    await board.save();

    res.status(200).json({
      success: true,
      message: "Board updated successfully",
      board,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};