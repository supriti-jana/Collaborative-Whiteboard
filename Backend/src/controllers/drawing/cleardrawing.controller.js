import Drawing from "../../models/drawing.model.js";
import Board from "../../models/board.model.js";

export const clearDrawing = async (req, res) => {
  try {
    const { boardId } = req.params;

    // Check if board exists
    const board = await Board.findById(boardId);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    // Check if logged-in user is a member
    const isMember = board.members.some(
      (member) => member.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to clear this board",
      });
    }

    // Find drawing
    const drawing = await Drawing.findOne({ board: boardId });

    if (!drawing) {
      return res.status(404).json({
        success: false,
        message: "Drawing not found",
      });
    }

    // Remove all elements
    drawing.elements = [];

    await drawing.save();

    res.status(200).json({
      success: true,
      message: "Drawing cleared successfully",
      drawing,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};