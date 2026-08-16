import mongoose from "mongoose";

const drawingElementSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },

    // Pencil / Eraser points
    points: {
      type: [
        {
          x: Number,
          y: Number,
        },
      ],
      default: [],
    },

    // Rectangle / Circle
    x: Number,
    y: Number,

    // Rectangle
    width: Number,
    height: Number,

    // Circle
    radius: Number,

    // Line
    startX: Number,
    startY: Number,
    endX: Number,
    endY: Number,

    // Text
    text: String,

    // Styling
    color: {
      type: String,
      default: "#000000",
    },

    lineWidth: {
      type: Number,
      default: 2,
    },
  },
  {
    _id: false,
  }
);

const drawingSchema = new mongoose.Schema(
  {
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      unique: true,
    },

    elements: {
      type: [drawingElementSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Drawing",
  drawingSchema
);