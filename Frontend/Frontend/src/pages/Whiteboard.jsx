import { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDrawing,saveDrawing ,clearDrawing} from "../api/drawingApi";

function Whiteboard() {
  const { id } = useParams();

  // ==========================================
  // CANVAS REFERENCES
  // ==========================================

  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);

  const ctxRef = useRef(null);
  const previewCtxRef = useRef(null);

  // ==========================================
  // DRAWING REFERENCES
  // ==========================================

  const startPointRef = useRef({
    x: 0,
    y: 0,
  });

  const activeElementRef = useRef(null);

  // ==========================================
  // STATES
  // ==========================================

  const [isDrawing, setIsDrawing] = useState(false);

  const [color, setColor] = useState("#000000");

  const [brushSize, setBrushSize] = useState(2);

  const [tool, setTool] = useState("pencil");

  // Completed drawing elements
  const [elements, setElements] = useState([]);


  // Undo / Redo history
  const [undoStack, setUndoStack] = useState([]);

  const [redoStack, setRedoStack] = useState([]);


  // ==========================================
// LOAD DRAWING FROM MONGODB
// ==========================================

useEffect(() => {
  const loadDrawing = async () => {
    try {
      const response = await getDrawing(id);

      console.log("Drawing loaded:", response.data);

      if (response.data.success) {
        setElements(
          response.data.drawing?.elements || []
        );
      }
    } catch (error) {
      console.error(
        "Failed to load drawing:",
        error
      );
    }
  };

  if (id) {
    loadDrawing();
  }
}, [id]);

// ==========================================
// SAVE DRAWING TO MONGODB
// ==========================================

const handleSave = async () => {
  try {
    const response = await saveDrawing(id, elements);

    if (response.data.success) {
      alert("Drawing saved successfully!");
    }
  } catch (error) {
    console.error("Failed to save drawing:", error);

    alert("Failed to save drawing");
  }
};


  // ==========================================
  // INITIALIZE CANVAS
  // ==========================================

  useEffect(() => {
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;

    const ctx = canvas.getContext("2d");
    const previewCtx = previewCanvas.getContext("2d");

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    previewCtx.lineCap = "round";
    previewCtx.lineJoin = "round";

    ctxRef.current = ctx;
    previewCtxRef.current = previewCtx;
  }, []);

  // ==========================================
  // DRAW ELEMENT
  // ==========================================

  const drawElement = (ctx, element) => {
    if (!ctx || !element) {
      return;
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.lineWidth = element.lineWidth || 2;

    ctx.strokeStyle = element.color || "#000000";

    // ========================================
    // PENCIL
    // ========================================

    if (element.type === "pencil") {
      const points = element.points;

      if (!points || points.length === 0) {
        return;
      }

      ctx.beginPath();

      ctx.moveTo(
        points[0].x,
        points[0].y
      );

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(
          points[i].x,
          points[i].y
        );
      }

      ctx.stroke();

      ctx.closePath();

      return;
    }

    // ========================================
    // ERASER
    // ========================================

    if (element.type === "eraser") {
      const points = element.points;

      if (!points || points.length === 0) {
        return;
      }

      ctx.save();

      ctx.globalCompositeOperation =
        "destination-out";

      ctx.lineWidth = element.lineWidth || 10;

      ctx.beginPath();

      ctx.moveTo(
        points[0].x,
        points[0].y
      );

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(
          points[i].x,
          points[i].y
        );
      }

      ctx.stroke();

      ctx.closePath();

      ctx.restore();

      return;
    }

    // ========================================
    // RECTANGLE
    // ========================================

    if (element.type === "rectangle") {
      ctx.beginPath();

      ctx.strokeRect(
        element.x,
        element.y,
        element.width,
        element.height
      );

      ctx.closePath();

      return;
    }

    // ========================================
    // LINE
    // ========================================

    if (element.type === "line") {
      ctx.beginPath();

      ctx.moveTo(
        element.startX,
        element.startY
      );

      ctx.lineTo(
        element.endX,
        element.endY
      );

      ctx.stroke();

      ctx.closePath();

      return;
    }

    // ========================================
    // CIRCLE
    // ========================================

    if (element.type === "circle") {
      ctx.beginPath();

      ctx.arc(
        element.x,
        element.y,
        element.radius,
        0,
        Math.PI * 2
      );

      ctx.stroke();

      ctx.closePath();

      return;
    }
  };

  // ==========================================
  // RENDER ALL ELEMENTS
  // ==========================================

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    if (!canvas || !ctx) {
      return;
    }

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    elements.forEach((element) => {
      drawElement(ctx, element);
    });
  }, [elements]);


  // ==========================================
// AUTO SAVE DRAWING
// ==========================================

useEffect(() => {
  if (!id) return;

  // Don't auto-save when there are no elements
  if (elements.length === 0) return;

  // Wait 1 second after the last change
  const timer = setTimeout(async () => {
    try {
      await saveDrawing(id, elements);

      console.log("Auto saved successfully");
    } catch (error) {
      console.error("Auto save failed:", error);
    }
  }, 1000);

  // Cancel previous timer if elements change again
  return () => {
    clearTimeout(timer);
  };
}, [elements, id]);

  // ==========================================
  // CLEAR PREVIEW
  // ==========================================

  const clearPreview = () => {
    const canvas = previewCanvasRef.current;
    const ctx = previewCtxRef.current;

    if (!canvas || !ctx) {
      return;
    }

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );
  };

  // ==========================================
  // ADD ELEMENT
  // ==========================================

  const addElement = (element) => {
    setElements((previousElements) => {
      const newElements = [
        ...previousElements,
        element,
      ];

      // Save previous state for Undo
      setUndoStack((previousHistory) => [
        ...previousHistory,
        previousElements,
      ]);

      // New drawing means old Redo history
      // is no longer valid
      setRedoStack([]);

      return newElements;
    });
  };

  // ==========================================
  // UNDO
  // ==========================================

  const undo = () => {
    if (undoStack.length === 0) {
      return;
    }

    const previousState =
      undoStack[undoStack.length - 1];

    // Remove last undo state
    setUndoStack((previousHistory) =>
      previousHistory.slice(0, -1)
    );

    // Current state goes into redo
    setRedoStack((previousRedo) => [
      ...previousRedo,
      elements,
    ]);

    // Restore previous state
    setElements(previousState);
  };

  // ==========================================
  // REDO
  // ==========================================

  const redo = () => {
    if (redoStack.length === 0) {
      return;
    }

    const nextState =
      redoStack[redoStack.length - 1];

    // Remove last redo state
    setRedoStack((previousRedo) =>
      previousRedo.slice(0, -1)
    );

    // Current state goes into undo
    setUndoStack((previousHistory) => [
      ...previousHistory,
      elements,
    ]);

    // Restore next state
    setElements(nextState);
  };

  // ==========================================
  // START DRAWING
  // ==========================================

  const startDrawing = (e) => {
    const { offsetX, offsetY } =
      e.nativeEvent;

    // Save starting position
    startPointRef.current = {
      x: offsetX,
      y: offsetY,
    };

    // ========================================
    // PENCIL
    // ========================================

    if (tool === "pencil") {
      const pencilElement = {
        id: crypto.randomUUID(),

        type: "pencil",

        points: [
          {
            x: offsetX,
            y: offsetY,
          },
        ],

        color: color,

        lineWidth: brushSize,
      };

      activeElementRef.current =
        pencilElement;

      setIsDrawing(true);

      return;
    }

    // ========================================
    // ERASER
    // ========================================

    if (tool === "eraser") {
      const eraserElement = {
        id: crypto.randomUUID(),

        type: "eraser",

        points: [
          {
            x: offsetX,
            y: offsetY,
          },
        ],

        lineWidth: brushSize * 3,
      };

      activeElementRef.current =
        eraserElement;

      setIsDrawing(true);

      return;
    }

    // ========================================
    // SHAPES
    // ========================================

    setIsDrawing(true);

    clearPreview();
  };

  // ==========================================
  // DRAW / PREVIEW
  // ==========================================

  const draw = (e) => {
    if (!isDrawing) {
      return;
    }

    const { offsetX, offsetY } =
      e.nativeEvent;

    // ========================================
    // PENCIL
    // ========================================

    if (tool === "pencil") {
      const element =
        activeElementRef.current;

      if (!element) {
        return;
      }

      element.points.push({
        x: offsetX,
        y: offsetY,
      });

      const canvas = canvasRef.current;
      const ctx = ctxRef.current;

      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Draw completed elements
      elements.forEach((item) => {
        drawElement(ctx, item);
      });

      // Draw current pencil stroke
      drawElement(ctx, element);

      return;
    }

    // ========================================
    // ERASER
    // ========================================

    if (tool === "eraser") {
      const element =
        activeElementRef.current;

      if (!element) {
        return;
      }

      element.points.push({
        x: offsetX,
        y: offsetY,
      });

      const canvas = canvasRef.current;
      const ctx = ctxRef.current;

      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Draw completed elements
      elements.forEach((item) => {
        drawElement(ctx, item);
      });

      // Draw current eraser stroke
      drawElement(ctx, element);

      return;
    }

    // ========================================
    // SHAPE PREVIEW
    // ========================================

    const startX =
      startPointRef.current.x;

    const startY =
      startPointRef.current.y;

    clearPreview();

    let previewElement = null;

    // ========================================
    // RECTANGLE
    // ========================================

    if (tool === "rectangle") {
      previewElement = {
        type: "rectangle",

        x: startX,

        y: startY,

        width: offsetX - startX,

        height: offsetY - startY,

        color: color,

        lineWidth: brushSize,
      };
    }

    // ========================================
    // LINE
    // ========================================

    else if (tool === "line") {
      previewElement = {
        type: "line",

        startX: startX,

        startY: startY,

        endX: offsetX,

        endY: offsetY,

        color: color,

        lineWidth: brushSize,
      };
    }

    // ========================================
    // CIRCLE
    // ========================================

    else if (tool === "circle") {
      const radius = Math.sqrt(
        Math.pow(
          offsetX - startX,
          2
        ) +
        Math.pow(
          offsetY - startY,
          2
        )
      );

      previewElement = {
        type: "circle",

        x: startX,

        y: startY,

        radius: radius,

        color: color,

        lineWidth: brushSize,
      };
    }

    // Draw preview
    if (previewElement) {
      drawElement(
        previewCtxRef.current,
        previewElement
      );
    }
  };

  // ==========================================
  // STOP DRAWING
  // ==========================================

  const stopDrawing = (e) => {
    if (!isDrawing) {
      return;
    }

    const { offsetX, offsetY } =
      e.nativeEvent;

    // ========================================
    // PENCIL
    // ========================================

    if (tool === "pencil") {
      const element =
        activeElementRef.current;

      if (element) {
        addElement(element);
      }

      activeElementRef.current = null;

      setIsDrawing(false);

      return;
    }

    // ========================================
    // ERASER
    // ========================================

    if (tool === "eraser") {
      const element =
        activeElementRef.current;

      if (element) {
        addElement(element);
      }

      activeElementRef.current = null;

      setIsDrawing(false);

      return;
    }

    // ========================================
    // SHAPES
    // ========================================

    const startX =
      startPointRef.current.x;

    const startY =
      startPointRef.current.y;

    let element = null;

    // ========================================
    // RECTANGLE
    // ========================================

    if (tool === "rectangle") {
      element = {
        id: crypto.randomUUID(),

        type: "rectangle",

        x: startX,

        y: startY,

        width: offsetX - startX,

        height: offsetY - startY,

        color: color,

        lineWidth: brushSize,
      };
    }

    // ========================================
    // LINE
    // ========================================

    else if (tool === "line") {
      element = {
        id: crypto.randomUUID(),

        type: "line",

        startX: startX,

        startY: startY,

        endX: offsetX,

        endY: offsetY,

        color: color,

        lineWidth: brushSize,
      };
    }

    // ========================================
    // CIRCLE
    // ========================================

    else if (tool === "circle") {
      const radius = Math.sqrt(
        Math.pow(
          offsetX - startX,
          2
        ) +
        Math.pow(
          offsetY - startY,
          2
        )
      );

      element = {
        id: crypto.randomUUID(),

        type: "circle",

        x: startX,

        y: startY,

        radius: radius,

        color: color,

        lineWidth: brushSize,
      };
    }

    // Add element to history
    if (element) {
      addElement(element);
    }

    clearPreview();

    setIsDrawing(false);
  };

  // ==========================================
  // TOOL CHANGE
  // ==========================================

  const changeTool = (newTool) => {
    setTool(newTool);

    clearPreview();

    activeElementRef.current = null;

    setIsDrawing(false);
  };

  // ==========================================
  // KEYBOARD SHORTCUTS
  // ==========================================

  useEffect(() => {
    const handleKeyboard = (e) => {
      // Ctrl + Z
      if (
        e.ctrlKey &&
        !e.shiftKey &&
        e.key.toLowerCase() === "z"
      ) {
        e.preventDefault();

        undo();
      }

      // Ctrl + Y
      if (
        e.ctrlKey &&
        e.key.toLowerCase() === "y"
      ) {
        e.preventDefault();

        redo();
      }

      // Ctrl + Shift + Z
      if (
        e.ctrlKey &&
        e.shiftKey &&
        e.key.toLowerCase() === "z"
      ) {
        e.preventDefault();

        redo();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  }, [undoStack, redoStack, elements]);

  
  const handleClear = async () => {
  const confirmed = window.confirm(
    "Are you sure you want to clear this board?"
  );

  if (!confirmed) return;

  try {
    const response = await clearDrawing(id);

    if (response.data.success) {
      setElements([]);

      const canvas = canvasRef.current;
      const previewCanvas = previewCanvasRef.current;

      const ctx = canvas.getContext("2d");
      const previewCtx = previewCanvas.getContext("2d");

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      previewCtx.clearRect(
        0,
        0,
        previewCanvas.width,
        previewCanvas.height
      );

      alert("Board cleared successfully!");
    }
  } catch (error) {
    console.error("Failed to clear board:", error);

    alert("Failed to clear board");
  }
};

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >

      {/* ======================================
          NAVBAR
      ======================================= */}

      <header
        style={{
          height: "60px",

          background: "#1f2937",

          color: "white",

          display: "flex",

          justifyContent: "space-between",

          alignItems: "center",

          padding: "0 20px",

          flexShrink: 0,
        }}
      >
        <h2>
          Collaborative Whiteboard
        </h2>

        <span>
          Board ID: {id}
        </span>
      </header>

      {/* ======================================
          TOOLBAR
      ======================================= */}

      <div
        style={{
          height: "70px",

          display: "flex",

          alignItems: "center",

          gap: "10px",

          padding: "10px 20px",

          borderBottom: "1px solid #ddd",

          background: "#f8f8f8",

          flexShrink: 0,
        }}
      >

        

        <button onClick={handleSave}>
                  Save
        </button>

        <button onClick={handleClear}>
                Clear
        </button>

        {/* UNDO */}
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          style={{
            padding: "8px 12px",
            cursor:
              undoStack.length === 0
                ? "not-allowed"
                : "pointer",
          }}
        >
          Undo
        </button>

        {/* REDO */}

        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          style={{
            padding: "8px 12px",
            cursor:
              redoStack.length === 0
                ? "not-allowed"
                : "pointer",
          }}
        >
          Redo
        </button>

        {/* PENCIL */}

        <button
          onClick={() =>
            changeTool("pencil")
          }
          style={{
            padding: "8px 12px",

            background:
              tool === "pencil"
                ? "#d1d5db"
                : "white",

            cursor: "pointer",
          }}
        >
          Pencil
        </button>

        {/* RECTANGLE */}

        <button
          onClick={() =>
            changeTool("rectangle")
          }
          style={{
            padding: "8px 12px",

            background:
              tool === "rectangle"
                ? "#d1d5db"
                : "white",

            cursor: "pointer",
          }}
        >
          Rectangle
        </button>

        {/* CIRCLE */}

        <button
          onClick={() =>
            changeTool("circle")
          }
          style={{
            padding: "8px 12px",

            background:
              tool === "circle"
                ? "#d1d5db"
                : "white",

            cursor: "pointer",
          }}
        >
          Circle
        </button>

        {/* LINE */}

        <button
          onClick={() =>
            changeTool("line")
          }
          style={{
            padding: "8px 12px",

            background:
              tool === "line"
                ? "#d1d5db"
                : "white",

            cursor: "pointer",
          }}
        >
          Line
        </button>

        {/* ERASER */}

        <button
          onClick={() =>
            changeTool("eraser")
          }
          style={{
            padding: "8px 12px",

            background:
              tool === "eraser"
                ? "#d1d5db"
                : "white",

            cursor: "pointer",
          }}
        >
          Eraser
        </button>

        {/* COLOR */}

        <label>
          Color
        </label>

        <input
          type="color"
          value={color}
          onChange={(e) =>
            setColor(e.target.value)
          }
        />

        {/* BRUSH SIZE */}

        <label>
          Brush Size
        </label>

        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) =>
            setBrushSize(
              Number(e.target.value)
            )
          }
        />

        <span>
          {brushSize}px
        </span>
      </div>

      {/* ======================================
          CANVAS AREA
      ======================================= */}

      <div
        style={{
          flex: 1,

          display: "flex",

          justifyContent: "center",

          alignItems: "center",

          background: "#ececec",

          overflow: "auto",

          position: "relative",
        }}
      >

        {/* MAIN CANVAS */}

        <canvas
          ref={canvasRef}
          width={1200}
          height={700}
          style={{
            background: "white",

            border: "1px solid #ccc",

            position: "absolute",

            cursor: "crosshair",
          }}
        />

        {/* PREVIEW CANVAS */}

        <canvas
          ref={previewCanvasRef}
          width={1200}
          height={700}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{
            background: "transparent",

            border:
              "1px solid transparent",

            position: "absolute",

            cursor: "crosshair",
          }}
        />

      </div>
    </div>
  );
}

export default Whiteboard;