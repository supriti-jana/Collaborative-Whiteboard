import Board from "../models/board.model.js";

export const getBoards = async (req, res) => {
  try {
    const boards = await Board.find({
      members: req.user._id,
    })
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: boards.length,
      boards,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};