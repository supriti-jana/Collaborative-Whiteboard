import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

function Whiteboard() {
  const { id } = useParams();

  const canvasRef = useRef(null);

  // --------------------------------------------------
  // DRAWING STATE
  // --------------------------------------------------

  const [elements, setElements] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(2);

  const [isDrawing, setIsDrawing] = useState(false);

  // Temporary element while dragging
  const [previewElement, setPreviewElement] = useState(null);

  // --------------------------------------------------
  // SAVE STATE
  // --------------------------------------------------

  const [saveStatus, setSaveStatus] = useState("Saved");

  // Used to prevent autosave before MongoDB drawing is loaded
  const drawingLoaded = useRef(false);

  // Autosave timer
  const autoSaveTimer = useRef(null);

  // --------------------------------------------------
  // CAMERA
  // --------------------------------------------------

  const [camera, setCamera] = useState({
    x: 0,
    y: 0,
    zoom: 1,
  });

  // --------------------------------------------------
  // PAN
  // --------------------------------------------------

  const isPanning = useRef(false);

  const panStart = useRef({
    x: 0,
    y: 0,
  });

  const cameraStart = useRef({
    x: 0,
    y: 0,
  });

  // --------------------------------------------------
  // DRAWING START POINT
  // --------------------------------------------------

  const startPoint = useRef({
    x: 0,
    y: 0,
  });

  // --------------------------------------------------
  // SPACE KEY
  // --------------------------------------------------

  const spacePressed = useRef(false);

  // ==================================================
  // LOAD DRAWING FROM MONGODB
  // ==================================================

  useEffect(() => {
    const loadDrawing = async () => {
      try {
        setSaveStatus("Loading...");

        const response = await api.get(`/drawing/${id}`);

        if (
          response.data.success &&
          response.data.drawing
        ) {
          const savedElements =
            response.data.drawing.elements || [];

          setElements(savedElements);
        }

        drawingLoaded.current = true;

        setSaveStatus("Saved");
      } catch (error) {
        console.error(
          "Failed to load drawing:",
          error
        );

        setSaveStatus("Load failed");
      }
    };

    loadDrawing();
  }, [id]);

  // ==================================================
  // SAVE DRAWING
  // ==================================================

  const saveDrawing = async (elementsToSave = elements) => {
    if (!drawingLoaded.current) {
      return;
    }

    try {
      setSaveStatus("Saving...");

      await api.post("/drawing/save", {
        boardId: id,
        elements: elementsToSave,
      });

      setSaveStatus("Saved");
    } catch (error) {
      console.error(
        "Failed to save drawing:",
        error
      );

      setSaveStatus("Save failed");
    }
  };

  // ==================================================
  // AUTO SAVE
  // ==================================================

  useEffect(() => {
    if (!drawingLoaded.current) {
      return;
    }

    // Clear previous timer
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    setSaveStatus("Unsaved changes");

    // Wait 1 second after the last change
    autoSaveTimer.current = setTimeout(() => {
      saveDrawing(elements);
    }, 1000);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [elements]);

  // ==================================================
  // CANVAS RESIZE
  // ==================================================

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      drawCanvas();
    };

    resizeCanvas();

    window.addEventListener(
      "resize",
      resizeCanvas
    );

    return () => {
      window.removeEventListener(
        "resize",
        resizeCanvas
      );
    };
  }, []);

  // ==================================================
  // KEYBOARD SHORTCUTS
  // ==================================================

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        spacePressed.current = true;
      }

      // Ctrl + Z
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "z" &&
        !e.shiftKey
      ) {
        e.preventDefault();

        undo();
      }

      // Ctrl + Y
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "y"
      ) {
        e.preventDefault();

        redo();
      }

      // Ctrl + Shift + Z
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "z"
      ) {
        e.preventDefault();

        redo();
      }

      // Ctrl + S
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "s"
      ) {
        e.preventDefault();

        saveDrawing(elements);
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === "Space") {
        spacePressed.current = false;
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    window.addEventListener(
      "keyup",
      handleKeyUp
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      window.removeEventListener(
        "keyup",
        handleKeyUp
      );
    };
  }, [elements, redoStack]);

  // ==================================================
  // DRAW CANVAS
  // ==================================================

  useEffect(() => {
    drawCanvas();
  }, [
    elements,
    previewElement,
    camera,
  ]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Background
    ctx.fillStyle = "#f8fafc";

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Grid
    drawGrid(ctx);

    // Camera
    ctx.save();

    ctx.translate(
      camera.x,
      camera.y
    );

    ctx.scale(
      camera.zoom,
      camera.zoom
    );

    // Saved elements
    elements.forEach((element) => {
      drawElement(ctx, element);
    });

    // Temporary preview
    if (previewElement) {
      drawElement(
        ctx,
        previewElement
      );
    }

    ctx.restore();
  };

  // ==================================================
  // GRID
  // ==================================================

  const drawGrid = (ctx) => {
    const gridSize =
      40 * camera.zoom;

    if (gridSize <= 0) return;

    const offsetX =
      ((camera.x % gridSize) +
        gridSize) %
      gridSize;

    const offsetY =
      ((camera.y % gridSize) +
        gridSize) %
      gridSize;

    ctx.beginPath();

    ctx.strokeStyle = "#e2e8f0";

    ctx.lineWidth = 1;

    for (
      let x = offsetX;
      x < canvasRef.current.width;
      x += gridSize
    ) {
      ctx.moveTo(x, 0);

      ctx.lineTo(
        x,
        canvasRef.current.height
      );
    }

    for (
      let y = offsetY;
      y < canvasRef.current.height;
      y += gridSize
    ) {
      ctx.moveTo(0, y);

      ctx.lineTo(
        canvasRef.current.width,
        y
      );
    }

    ctx.stroke();
  };

  // ==================================================
  // DRAW ELEMENT
  // ==================================================

  const drawElement = (
    ctx,
    element
  ) => {
    ctx.save();

    ctx.strokeStyle =
      element.color || "#000000";

    ctx.lineWidth =
      element.strokeWidth || 2;

    ctx.lineCap = "round";

    ctx.lineJoin = "round";

    // -----------------------------------------------
    // PENCIL
    // -----------------------------------------------

    if (element.type === "pencil") {
      if (
        !element.points ||
        element.points.length < 2
      ) {
        ctx.restore();

        return;
      }

      ctx.beginPath();

      ctx.moveTo(
        element.points[0].x,
        element.points[0].y
      );

      for (
        let i = 1;
        i < element.points.length;
        i++
      ) {
        ctx.lineTo(
          element.points[i].x,
          element.points[i].y
        );
      }

      ctx.stroke();
    }

    // -----------------------------------------------
    // RECTANGLE
    // -----------------------------------------------

    if (
      element.type === "rectangle"
    ) {
      ctx.strokeRect(
        element.x,
        element.y,
        element.width,
        element.height
      );
    }

    // -----------------------------------------------
    // CIRCLE
    // -----------------------------------------------

    if (
      element.type === "circle"
    ) {
      const radius =
        Math.sqrt(
          Math.pow(
            element.width,
            2
          ) +
            Math.pow(
              element.height,
              2
            )
        );

      ctx.beginPath();

      ctx.arc(
        element.x,
        element.y,
        radius,
        0,
        Math.PI * 2
      );

      ctx.stroke();
    }

    // -----------------------------------------------
    // LINE
    // -----------------------------------------------

    if (
      element.type === "line"
    ) {
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
    }

    ctx.restore();
  };

  // ==================================================
  // SCREEN → WORLD
  // ==================================================

  const getWorldPoint = (e) => {
    const rect =
      canvasRef.current.getBoundingClientRect();

    const screenX =
      e.clientX - rect.left;

    const screenY =
      e.clientY - rect.top;

    return {
      x:
        (screenX - camera.x) /
        camera.zoom,

      y:
        (screenY - camera.y) /
        camera.zoom,
    };
  };

  // ==================================================
  // MOUSE DOWN
  // ==================================================

  const handleMouseDown = (e) => {
    // Middle mouse button
    if (e.button === 1) {
      e.preventDefault();

      startPanning(e);

      return;
    }

    // Space + left click
    if (
      spacePressed.current
    ) {
      startPanning(e);

      return;
    }

    const point =
      getWorldPoint(e);

    startPoint.current =
      point;

    // Eraser
    if (tool === "eraser") {
      setIsDrawing(true);

      eraseElement(point);

      return;
    }

    setIsDrawing(true);

    // -----------------------------------------------
    // PENCIL
    // -----------------------------------------------

    if (tool === "pencil") {
      setPreviewElement({
        type: "pencil",

        points: [point],

        color,

        strokeWidth:
          brushSize,
      });
    }

    // -----------------------------------------------
    // RECTANGLE
    // -----------------------------------------------

    if (
      tool === "rectangle"
    ) {
      setPreviewElement({
        type: "rectangle",

        x: point.x,

        y: point.y,

        width: 0,

        height: 0,

        color,

        strokeWidth:
          brushSize,
      });
    }

    // -----------------------------------------------
    // CIRCLE
    // -----------------------------------------------

    if (
      tool === "circle"
    ) {
      setPreviewElement({
        type: "circle",

        x: point.x,

        y: point.y,

        width: 0,

        height: 0,

        color,

        strokeWidth:
          brushSize,
      });
    }

    // -----------------------------------------------
    // LINE
    // -----------------------------------------------

    if (tool === "line") {
      setPreviewElement({
        type: "line",

        startX: point.x,

        startY: point.y,

        endX: point.x,

        endY: point.y,

        color,

        strokeWidth:
          brushSize,
      });
    }
  };

  // ==================================================
  // MOUSE MOVE
  // ==================================================

  const handleMouseMove = (e) => {
    // -----------------------------------------------
    // PAN
    // -----------------------------------------------

    if (isPanning.current) {
      const dx =
        e.clientX -
        panStart.current.x;

      const dy =
        e.clientY -
        panStart.current.y;

      setCamera((prev) => ({
        ...prev,

        x:
          cameraStart.current.x +
          dx,

        y:
          cameraStart.current.y +
          dy,
      }));

      return;
    }

    if (!isDrawing) {
      return;
    }

    const point =
      getWorldPoint(e);

    // -----------------------------------------------
    // ERASER
    // -----------------------------------------------

    if (tool === "eraser") {
      eraseElement(point);

      return;
    }

    // -----------------------------------------------
    // PENCIL
    // -----------------------------------------------

    if (tool === "pencil") {
      setPreviewElement(
        (prev) => {
          if (!prev) return prev;

          return {
            ...prev,

            points: [
              ...prev.points,
              point,
            ],
          };
        }
      );
    }

    // -----------------------------------------------
    // RECTANGLE
    // -----------------------------------------------

    if (
      tool === "rectangle"
    ) {
      setPreviewElement(
        (prev) => {
          if (!prev) return prev;

          return {
            ...prev,

            width:
              point.x -
              startPoint.current.x,

            height:
              point.y -
              startPoint.current.y,
          };
        }
      );
    }

    // -----------------------------------------------
    // CIRCLE
    // -----------------------------------------------

    if (
      tool === "circle"
    ) {
      setPreviewElement(
        (prev) => {
          if (!prev) return prev;

          return {
            ...prev,

            width:
              point.x -
              startPoint.current.x,

            height:
              point.y -
              startPoint.current.y,
          };
        }
      );
    }

    // -----------------------------------------------
    // LINE
    // -----------------------------------------------

    if (tool === "line") {
      setPreviewElement(
        (prev) => {
          if (!prev) return prev;

          return {
            ...prev,

            endX: point.x,

            endY: point.y,
          };
        }
      );
    }
  };

  // ==================================================
  // MOUSE UP
  // ==================================================

  const handleMouseUp = () => {
    // Stop panning
    if (isPanning.current) {
      stopPanning();

      return;
    }

    if (!isDrawing) {
      return;
    }

    // Eraser
    if (tool === "eraser") {
      setIsDrawing(false);

      return;
    }

    if (previewElement) {
      setElements((prev) => [
        ...prev,
        previewElement,
      ]);

      // New action removes redo history
      setRedoStack([]);
    }

    setPreviewElement(null);

    setIsDrawing(false);
  };

  // ==================================================
  // PAN
  // ==================================================

  const startPanning = (e) => {
    isPanning.current = true;

    panStart.current = {
      x: e.clientX,
      y: e.clientY,
    };

    cameraStart.current = {
      x: camera.x,
      y: camera.y,
    };
  };

  const stopPanning = () => {
    isPanning.current = false;
  };

  // ==================================================
  // ZOOM
  // ==================================================

  const handleWheel = (e) => {
    e.preventDefault();

    // -----------------------------------------------
    // CTRL + SCROLL = ZOOM
    // -----------------------------------------------

    if (
      e.ctrlKey ||
      e.metaKey
    ) {
      const zoomFactor =
        e.deltaY > 0
          ? 0.9
          : 1.1;

      const newZoom =
        Math.min(
          Math.max(
            camera.zoom *
              zoomFactor,
            0.2
          ),
          5
        );

      const rect =
        canvasRef.current.getBoundingClientRect();

      const mouseX =
        e.clientX -
        rect.left;

      const mouseY =
        e.clientY -
        rect.top;

      // World position before zoom
      const worldX =
        (mouseX - camera.x) /
        camera.zoom;

      const worldY =
        (mouseY - camera.y) /
        camera.zoom;

      // Keep mouse position fixed
      const newCameraX =
        mouseX -
        worldX * newZoom;

      const newCameraY =
        mouseY -
        worldY * newZoom;

      setCamera({
        x: newCameraX,

        y: newCameraY,

        zoom: newZoom,
      });

      return;
    }

    // -----------------------------------------------
    // NORMAL SCROLL = PAN
    // -----------------------------------------------

    setCamera((prev) => ({
      ...prev,

      x:
        prev.x -
        e.deltaX,

      y:
        prev.y -
        e.deltaY,
    }));
  };

  // ==================================================
  // ERASER
  // ==================================================

  const eraseElement = (
    point
  ) => {
    const threshold =
      15 / camera.zoom;

    let foundIndex = -1;

    for (
      let i =
        elements.length - 1;
      i >= 0;
      i--
    ) {
      const element =
        elements[i];

      // -----------------------------------------------
      // PENCIL
      // -----------------------------------------------

      if (
        element.type ===
        "pencil"
      ) {
        const found =
          element.points.some(
            (p) => {
              return (
                Math.abs(
                  p.x -
                    point.x
                ) <
                  threshold &&
                Math.abs(
                  p.y -
                    point.y
                ) <
                  threshold
              );
            }
          );

        if (found) {
          foundIndex = i;

          break;
        }
      }

      // -----------------------------------------------
      // RECTANGLE
      // -----------------------------------------------

      if (
        element.type ===
        "rectangle"
      ) {
        const left =
          Math.min(
            element.x,
            element.x +
              element.width
          );

        const right =
          Math.max(
            element.x,
            element.x +
              element.width
          );

        const top =
          Math.min(
            element.y,
            element.y +
              element.height
          );

        const bottom =
          Math.max(
            element.y,
            element.y +
              element.height
          );

        const nearLeft =
          Math.abs(
            point.x -
              left
          ) <
          threshold;

        const nearRight =
          Math.abs(
            point.x -
              right
          ) <
          threshold;

        const nearTop =
          Math.abs(
            point.y -
              top
          ) <
          threshold;

        const nearBottom =
          Math.abs(
            point.y -
              bottom
          ) <
          threshold;

        if (
          (nearLeft ||
            nearRight) &&
          point.y >=
            top -
              threshold &&
          point.y <=
            bottom +
              threshold
        ) {
          foundIndex = i;

          break;
        }

        if (
          (nearTop ||
            nearBottom) &&
          point.x >=
            left -
              threshold &&
          point.x <=
            right +
              threshold
        ) {
          foundIndex = i;

          break;
        }
      }

      // -----------------------------------------------
      // CIRCLE
      // -----------------------------------------------

      if (
        element.type ===
        "circle"
      ) {
        const radius =
          Math.sqrt(
            Math.pow(
              element.width,
              2
            ) +
              Math.pow(
                element.height,
                2
              )
          );

        const distance =
          Math.sqrt(
            Math.pow(
              point.x -
                element.x,
              2
            ) +
              Math.pow(
                point.y -
                  element.y,
                2
              )
          );

        if (
          Math.abs(
            distance -
              radius
          ) < threshold
        ) {
          foundIndex = i;

          break;
        }
      }

      // -----------------------------------------------
      // LINE
      // -----------------------------------------------

      if (
        element.type ===
        "line"
      ) {
        const distance =
          pointToLineDistance(
            point.x,
            point.y,
            element.startX,
            element.startY,
            element.endX,
            element.endY
          );

        if (
          distance <
          threshold
        ) {
          foundIndex = i;

          break;
        }
      }
    }

    if (foundIndex !== -1) {
      const deletedElement =
        elements[foundIndex];

      setElements(
        (prev) =>
          prev.filter(
            (_, index) =>
              index !==
              foundIndex
          )
      );

      setRedoStack(
        (prev) => [
          ...prev,
          deletedElement,
        ]
      );
    }
  };

  // ==================================================
  // POINT TO LINE DISTANCE
  // ==================================================

  const pointToLineDistance = (
    px,
    py,
    x1,
    y1,
    x2,
    y2
  ) => {
    const A =
      px - x1;

    const B =
      py - y1;

    const C =
      x2 - x1;

    const D =
      y2 - y1;

    const dot =
      A * C +
      B * D;

    const lenSq =
      C * C +
      D * D;

    let param = -1;

    if (lenSq !== 0) {
      param =
        dot / lenSq;
    }

    let xx;
    let yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (
      param > 1
    ) {
      xx = x2;
      yy = y2;
    } else {
      xx =
        x1 +
        param * C;

      yy =
        y1 +
        param * D;
    }

    return Math.sqrt(
      Math.pow(
        px - xx,
        2
      ) +
        Math.pow(
          py - yy,
          2
        )
    );
  };

  // ==================================================
  // UNDO
  // ==================================================

  const undo = () => {
    if (
      elements.length === 0
    ) {
      return;
    }

    const lastElement =
      elements[
        elements.length - 1
      ];

    setElements(
      (prev) =>
        prev.slice(
          0,
          prev.length - 1
        )
    );

    setRedoStack(
      (prev) => [
        ...prev,
        lastElement,
      ]
    );
  };

  // ==================================================
  // REDO
  // ==================================================

  const redo = () => {
    if (
      redoStack.length === 0
    ) {
      return;
    }

    const element =
      redoStack[
        redoStack.length - 1
      ];

    setRedoStack(
      (prev) =>
        prev.slice(
          0,
          prev.length - 1
        )
    );

    setElements(
      (prev) => [
        ...prev,
        element,
      ]
    );
  };

  // ==================================================
  // CLEAR
  // ==================================================

  const clearCanvas = () => {
    if (
      elements.length === 0
    ) {
      return;
    }

    setRedoStack(
      (prev) => [
        ...prev,
        ...elements,
      ]
    );

    setElements([]);
  };

  // ==================================================
  // RESET VIEW
  // ==================================================

  const resetView = () => {
    setCamera({
      x: 0,
      y: 0,
      zoom: 1,
    });
  };

  // ==================================================
  // SELECT TOOL
  // ==================================================

  const selectTool = (
    selectedTool
  ) => {
    setTool(selectedTool);
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-100 overflow-hidden">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="h-[64px] shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-30">

        {/* LEFT */}

        <div className="flex items-center gap-3">

          <button
            onClick={() =>
              window.history.back()
            }
            className="text-slate-500 hover:text-slate-900 text-xl"
          >
            ←
          </button>

          <div>

            <h1 className="font-semibold text-slate-900">
              Collaborative Whiteboard
            </h1>

            <p className="text-xs text-slate-400">
              Board ID: {id}
            </p>

          </div>

        </div>

        {/* RIGHT */}

        <div className="flex items-center gap-3">

          {/* SAVE STATUS */}

          <div
            className={`text-sm ${
              saveStatus ===
              "Saved"
                ? "text-green-600"
                : saveStatus ===
                  "Saving..."
                ? "text-blue-600"
                : saveStatus ===
                  "Save failed"
                ? "text-red-600"
                : "text-orange-600"
            }`}
          >
            {saveStatus}
          </div>

          {/* RESET VIEW */}

          <button
            onClick={resetView}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 bg-white"
          >
            Reset View
          </button>

          {/* SAVE */}

          <button
            onClick={() =>
              saveDrawing(elements)
            }
            disabled={
              saveStatus ===
              "Saving..."
            }
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saveStatus ===
            "Saving..."
              ? "Saving..."
              : "Save"}
          </button>

        </div>

      </header>

      {/* ==================================================
          TOOLBAR
      ================================================== */}

      <div className="absolute top-[80px] left-1/2 -translate-x-1/2 z-20 bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2 flex items-center gap-2">

        {/* PENCIL */}

        <button
          onClick={() =>
            selectTool(
              "pencil"
            )
          }
          className={`px-4 py-2 rounded-lg text-sm ${
            tool === "pencil"
              ? "bg-indigo-100 text-indigo-600"
              : "hover:bg-slate-100"
          }`}
        >
          ✎ Pencil
        </button>

        {/* RECTANGLE */}

        <button
          onClick={() =>
            selectTool(
              "rectangle"
            )
          }
          className={`px-4 py-2 rounded-lg text-sm ${
            tool === "rectangle"
              ? "bg-indigo-100 text-indigo-600"
              : "hover:bg-slate-100"
          }`}
        >
          □ Rectangle
        </button>

        {/* CIRCLE */}

        <button
          onClick={() =>
            selectTool(
              "circle"
            )
          }
          className={`px-4 py-2 rounded-lg text-sm ${
            tool === "circle"
              ? "bg-indigo-100 text-indigo-600"
              : "hover:bg-slate-100"
          }`}
        >
          ○ Circle
        </button>

        {/* LINE */}

        <button
          onClick={() =>
            selectTool("line")
          }
          className={`px-4 py-2 rounded-lg text-sm ${
            tool === "line"
              ? "bg-indigo-100 text-indigo-600"
              : "hover:bg-slate-100"
          }`}
        >
          ／ Line
        </button>

        {/* ERASER */}

        <button
          onClick={() =>
            selectTool(
              "eraser"
            )
          }
          className={`px-4 py-2 rounded-lg text-sm ${
            tool === "eraser"
              ? "bg-red-100 text-red-600"
              : "hover:bg-slate-100"
          }`}
        >
          ⌫ Eraser
        </button>

        <div className="h-8 w-px bg-slate-200 mx-1" />

        {/* COLOR */}

        <div className="flex items-center gap-2">

          <span className="text-xs text-slate-500">
            Color
          </span>

          <input
            type="color"
            value={color}
            onChange={(e) =>
              setColor(
                e.target.value
              )
            }
            className="w-9 h-9 cursor-pointer"
          />

        </div>

        {/* SIZE */}

        <div className="flex items-center gap-2">

          <span className="text-xs text-slate-500">
            Size
          </span>

          <input
            type="range"
            min="1"
            max="20"
            value={
              brushSize
            }
            onChange={(e) =>
              setBrushSize(
                Number(
                  e.target.value
                )
              )
            }
          />

          <span className="text-sm text-slate-500 w-6">
            {brushSize}
          </span>

        </div>

        <div className="h-8 w-px bg-slate-200 mx-1" />

        {/* UNDO */}

        <button
          onClick={undo}
          disabled={
            elements.length ===
            0
          }
          className="px-3 py-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-lg"
          title="Undo (Ctrl + Z)"
        >
          ↶
        </button>

        {/* REDO */}

        <button
          onClick={redo}
          disabled={
            redoStack.length ===
            0
          }
          className="px-3 py-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-lg"
          title="Redo (Ctrl + Y)"
        >
          ↷
        </button>

        <div className="h-8 w-px bg-slate-200 mx-1" />

        {/* CLEAR */}

        <button
          onClick={
            clearCanvas
          }
          className="px-3 py-2 text-red-500 rounded-lg hover:bg-red-50 text-sm"
        >
          Clear
        </button>

      </div>

      {/* ==================================================
          CANVAS
      ================================================== */}

      <main className="flex-1 relative overflow-hidden">

        <canvas
          ref={canvasRef}
          onMouseDown={
            handleMouseDown
          }
          onMouseMove={
            handleMouseMove
          }
          onMouseUp={
            handleMouseUp
          }
          onMouseLeave={
            handleMouseUp
          }
          onWheel={
            handleWheel
          }
          className={`absolute inset-0 ${
            tool === "eraser"
              ? "cursor-cell"
              : spacePressed.current
              ? "cursor-grab"
              : "cursor-crosshair"
          }`}
        />

        {/* ==================================================
            ZOOM
        ================================================== */}

        <div className="absolute bottom-5 right-5 bg-white border border-slate-200 shadow-md rounded-lg px-3 py-2 text-sm text-slate-600">
          {Math.round(
            camera.zoom * 100
          )}
          %
        </div>

        {/* ==================================================
            ELEMENT COUNT
        ================================================== */}

        <div className="absolute bottom-5 left-5 bg-white border border-slate-200 shadow-md rounded-lg px-3 py-2 text-sm text-slate-500">
          Elements:{" "}
          {elements.length}
        </div>

        {/* ==================================================
            HELP
        ================================================== */}

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white border border-slate-200 shadow-md rounded-lg px-4 py-2 text-xs text-slate-500">
          Ctrl + Scroll =
          Zoom &nbsp; • &nbsp;
          Space + Drag =
          Pan &nbsp; • &nbsp;
          Ctrl + Z = Undo
          &nbsp; • &nbsp;
          Ctrl + Y = Redo
          &nbsp; • &nbsp;
          Ctrl + S = Save
        </div>

      </main>
    </div>
  );
}

export default Whiteboard;