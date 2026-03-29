import React, { useEffect, useState } from "react";
import { Canvas, PencilBrush, IText } from "fabric";
import {
  MousePointer2,
  Hand,
  Pen,
  Type,
  Highlighter,
  Eraser,
  Undo2,
  Redo2,
  X,
  Bold,
  Italic,
  Trash2
} from "lucide-react";

IText.prototype.editable = true;

const tools = ["select", "pan", "pen", "text", "highlight", "eraser"];

const penColors = ["#ef4444", "#000000", "#3b82f6", "#22c55e"];
const highlightColors = [
  "rgba(253,230,138,0.4)",
  "rgba(252,165,165,0.4)",
  "rgba(165,243,252,0.4)",
  "rgba(187,247,208,0.4)",
];

const CanvasBoard = ({
  canvasRef,
  fabricCanvas,
  containerRef,
  activeTool,
  setActiveTool,
  canvasData,
  setCanvasData,
}) => {
  const [toolOpen, setToolOpen] = useState(false);
  const isInitializingRef = React.useRef(true);
  const [fontSize, setFontSize] = useState(18);
  const [penColor, setPenColor] = useState("#000000");
  const [highlightColor, setHighlightColor] = useState(highlightColors[0]);
  const [size, setSize] = useState(4);
  const [selectedText, setSelectedText] = useState(null);
  const [textBarPos, setTextBarPos] = useState({ top: 0, left: 0 });

  const historyRef = React.useRef([]);
  const historyIndexRef = React.useRef(-1);
  const isUndoRedoActive = React.useRef(false);
  const setCanvasDataRef = React.useRef(setCanvasData);

  useEffect(() => {
    setCanvasDataRef.current = setCanvasData;
  }, [setCanvasData]);

  /* ================= AUTO CLOSE TOOL ================= */
  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest(".toolbox")) {
        setToolOpen(false);
      }
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  /* ================= CANVAS INIT ================= */
  useEffect(() => {
    if (!canvasRef.current || fabricCanvas.current) return;

    const canvas = new Canvas(canvasRef.current, {
      backgroundColor: "#ffffff",
      isDrawingMode: true,
      selection: true,
    });
    fabricCanvas.current = canvas;

    const resize = () => {
      if (!containerRef.current) return;
      canvas.setDimensions({
        width: containerRef.current.clientWidth,
        height: 600,
      });
      canvas.renderAll();
    };

    resize();
    window.addEventListener("resize", resize);

    /* AUTO SAVE */
    const saveCanvas = () => {
      const canvas = fabricCanvas.current;
      if (!canvas || isInitializingRef.current || isUndoRedoActive.current) return;

      const json = canvas.toJSON();
      const strJson = JSON.stringify(json);

      if (historyIndexRef.current >= 0 && historyRef.current[historyIndexRef.current] === strJson) {
        return;
      }

      setCanvasDataRef.current(json);

      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(strJson);

      if (historyRef.current.length > 50) historyRef.current.shift();
      else historyIndexRef.current += 1;
    };

    canvas.on("object:added", saveCanvas);
    canvas.on("path:created", saveCanvas);
    canvas.on("object:modified", saveCanvas);
    canvas.on("object:removed", saveCanvas);
    canvas.on("text:changed", saveCanvas);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.dispose();
      fabricCanvas.current = null;
    };
  }, []);

  /* ================= LOAD DATA (ONCE ON MOUNT) ================= */
  useEffect(() => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    isInitializingRef.current = true;

    if (canvasData) {
      canvas.loadFromJSON(canvasData).then(() => {
        canvas.renderAll();
        isInitializingRef.current = false;
        historyRef.current = [JSON.stringify(canvas.toJSON())];
        historyIndexRef.current = 0;
      });
    } else {
      canvas.clear();
      canvas.backgroundColor = "#ffffff";
      canvas.renderAll();
      isInitializingRef.current = false;
      historyRef.current = [JSON.stringify(canvas.toJSON())];
      historyIndexRef.current = 0;
    }
    // Dependency array is empty because we rely on the parent's 'key' prop 
    // to remount the component when the exercise changes.
  }, []);

  /* ================= TOOL ENGINE ================= */
  useEffect(() => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.defaultCursor = "default";
    canvas.hoverCursor = "move";

    let currentMouseDown = null;

    if (activeTool === "pen") {
      canvas.isDrawingMode = true;
      const brush = new PencilBrush(canvas);
      brush.color = penColor;
      brush.width = size;
      canvas.freeDrawingBrush = brush;
    } else if (activeTool === "highlight") {
      canvas.isDrawingMode = true;
      const brush = new PencilBrush(canvas);
      brush.color = highlightColor;
      brush.width = size * 4;
      canvas.freeDrawingBrush = brush;
    } else if (activeTool === "pan") {
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.defaultCursor = "grab";

      let isDragging = false;
      let lastY = 0;

      currentMouseDown = (opt) => {
        isDragging = true;
        canvas.defaultCursor = "grabbing";
        lastY = opt.e.clientY || opt.e.touches?.[0]?.clientY;
      };

      const handleMouseMove = (opt) => {
        if (!isDragging) return;
        const currentY = opt.e.clientY || opt.e.touches?.[0]?.clientY;
        const deltaY = currentY - lastY;
        if (containerRef.current) {
          containerRef.current.scrollTop -= deltaY;
        }
        lastY = currentY;
      };

      const handleMouseUp = () => {
        isDragging = false;
        canvas.defaultCursor = "grab";
      };

      canvas.on("mouse:down", currentMouseDown);
      canvas.on("mouse:move", handleMouseMove);
      canvas.on("mouse:up", handleMouseUp);

      return () => {
        canvas.off("mouse:down", currentMouseDown);
        canvas.off("mouse:move", handleMouseMove);
        canvas.off("mouse:up", handleMouseUp);
      };
    } else if (activeTool === "text") {
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.defaultCursor = "text";

      currentMouseDown = (opt) => {
        if (opt.target && opt.target instanceof IText) {
          opt.target.enterEditing();
          return;
        }

        const pointer = opt.scenePoint || (canvas.getPointer ? canvas.getPointer(opt.e) : { x: opt.e.offsetX, y: opt.e.offsetY });
        
        // iPad Notes Style: Snap to left margin but keep the Y coordinate of the click
        const leftMargin = 120;

        const text = new IText("Start typing...", {
          left: leftMargin,
          top: pointer.y - 10,
          fontSize,
          fill: penColor,
          fontFamily: "Inter, sans-serif",
          editingBorderColor: penColor,
          padding: 5,
        });

        canvas.add(text);
        canvas.setActiveObject(text);

        setTimeout(() => {
          text.enterEditing();
          text.selectAll();
          if (text.hiddenTextarea) text.hiddenTextarea.focus();
          canvas.renderAll();
          setActiveTool("select");
        }, 50);
      };
      canvas.on("mouse:down", currentMouseDown);
    } else if (activeTool === "eraser") {
      const eraserCursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20H7L3 16a2 2 0 0 1 0-2.8l9.2-9.2a2 2 0 0 1 2.8 0l5 5a2 2 0 0 1 0 2.8L11 20"/><path d="M15 15l-4-4"/></svg>') 12 12, auto`;
      canvas.defaultCursor = eraserCursor;
      canvas.hoverCursor = eraserCursor;

      currentMouseDown = (e) => {
        if (e.target) {
          canvas.remove(e.target);
          canvas.renderAll();
          setCanvasDataRef.current(canvas.toJSON());
        }
      };
      canvas.on("mouse:down", currentMouseDown);
    }

    return () => {
      if (currentMouseDown) canvas.off("mouse:down", currentMouseDown);
    };
  }, [activeTool, penColor, highlightColor, size, fontSize]);

  const handleUndo = (e) => {
    if (e) e.stopPropagation();
    const canvas = fabricCanvas.current;
    if (!canvas || historyIndexRef.current <= 0) return;
    isUndoRedoActive.current = true;
    historyIndexRef.current -= 1;
    canvas.loadFromJSON(JSON.parse(historyRef.current[historyIndexRef.current])).then(() => {
      canvas.renderAll();
      setCanvasDataRef.current(canvas.toJSON());
      isUndoRedoActive.current = false;
    });
  };

  const handleRedo = (e) => {
    if (e) e.stopPropagation();
    const canvas = fabricCanvas.current;
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;
    isUndoRedoActive.current = true;
    historyIndexRef.current += 1;
    canvas.loadFromJSON(JSON.parse(historyRef.current[historyIndexRef.current])).then(() => {
      canvas.renderAll();
      setCanvasDataRef.current(canvas.toJSON());
      isUndoRedoActive.current = false;
    });
  };

  return (
    <div className="relative w-full border border-slate-200 rounded-xl overflow-hidden bg-white">
      <div className="toolbox absolute top-4 left-4 z-[999]">
        <div className="flex items-center gap-2 p-1.5 rounded-full bg-[#8b95a7]/90 backdrop-blur-md shadow-2xl border border-white/20 transition-all duration-300">
          <button
            onClick={(e) => { e.stopPropagation(); setToolOpen(!toolOpen); }}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all ${toolOpen ? "bg-[#ef4444]" : "bg-[#1e2a44]"}`}
          >
            {toolOpen ? <X size={20} /> : <Pen size={22} />}
          </button>
          {toolOpen && (
            <div className="flex items-center gap-4 px-3 tool-entering">
              <div className="flex items-center gap-2 border-r border-white/20 pr-4">
                {tools.map(t => (
                  <button
                    key={t}
                    onClick={(e) => { e.stopPropagation(); setActiveTool(t); }}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${activeTool === t ? "bg-[#1e2a44] text-white" : "text-white hover:bg-white/10"}`}
                  >
                    {t === "pen" && <Pen size={20} />}
                    {t === "text" && <Type size={20} />}
                    {t === "eraser" && <Eraser size={20} />}
                    {t === "select" && <MousePointer2 size={20} />}
                    {t === "pan" && <Hand size={20} />}
                    {t === "highlight" && <Highlighter size={20} />}
                  </button>
                ))}
              </div>

              {/* COLORS */}
              {(activeTool === "pen" || activeTool === "text") && (
                <div className="flex items-center gap-2 border-r border-white/20 pr-4">
                  {penColors.map(c => (
                    <button
                      key={c}
                      onClick={(e) => { e.stopPropagation(); setPenColor(c); }}
                      className="w-6 h-6 rounded-full border border-white/40"
                      style={{ background: c, transform: penColor === c ? 'scale(1.2)' : 'none' }}
                    />
                  ))}
                </div>
              )}

              {activeTool === "highlight" && (
                <div className="flex items-center gap-2 border-r border-white/20 pr-4">
                  {highlightColors.map(c => (
                    <button
                      key={c}
                      onClick={(e) => { e.stopPropagation(); setHighlightColor(c); }}
                      className="w-6 h-6 rounded-full border border-white/40"
                      style={{ background: c, transform: highlightColor === c ? 'scale(1.2)' : 'none' }}
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1">
                <button onClick={handleUndo} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"><Undo2 size={18} /></button>
                <button onClick={handleRedo} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"><Redo2 size={18} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div ref={containerRef} className={`relative w-full h-[65vh] overflow-y-auto bg-slate-50 ${activeTool === 'eraser' ? 'eraser-active' : ''}`}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default CanvasBoard;