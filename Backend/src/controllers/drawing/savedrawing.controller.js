import Drawing from "../../models/drawing.model.js";
import Board from "../../models/board.model.js";

export const saveDrawing = async (req, res) => {
  try {
    const { boardId, elements } = req.body;

    if (!boardId || !elements) {
      return res.status(400).json({
        success: false,
        message: "Board ID and elements are required",
      });
    }

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
        message: "You are not a member of this board",
      });
    }

    // Check if drawing already exists
    let drawing = await Drawing.findOne({ board: boardId });

    if (drawing) {
      drawing.elements = elements;
      await drawing.save();
    } else {
      drawing = await Drawing.create({
        board: boardId,
        elements,
      });
    }

    res.status(200).json({
      success: true,
      message: "Drawing saved successfully",
      drawing,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};