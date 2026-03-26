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
  questionId
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

    return () => {
      window.removeEventListener("click", close);
    };
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

    /* 🔥 AUTO EXPAND (STABLE VERSION) */
    canvas.on("path:created", () => {
      const container = containerRef.current;
      if (!container) return;

      setTimeout(() => {
        const objects = canvas.getObjects();
        if (!objects.length) return;

        let maxY = 0;

        objects.forEach(obj => {
          obj.setCoords();
          const bottom = obj.aCoords?.bl?.y || (obj.top + obj.height);
          if (bottom > maxY) maxY = bottom;
        });

        // Expand if they draw within 200px of bottom
        if (maxY > canvas.height - 200) {
          const newHeight = canvas.height + 600;
          canvas.setDimensions({ width: canvas.width, height: newHeight });
          canvas.renderAll();
        }
      }, 120);
    });

    /* SELECTION LOGIC */
    const handleSelection = (e) => {
      const selected = e.selected?.[0];
      if (selected instanceof IText) {
        setSelectedText(selected);
        const bound = selected.getBoundingRect();
        setTextBarPos({
          top: bound.top - 60,
          left: bound.left + (bound.width / 2) - 60
        });
      } else {
        setSelectedText(null);
      }
    };

    canvas.on("selection:created", handleSelection);
    canvas.on("selection:updated", handleSelection);
    canvas.on("selection:cleared", () => setSelectedText(null));
    canvas.on("object:moving", (opt) => {
      if (opt.target instanceof IText) {
        const bound = opt.target.getBoundingRect();
        setTextBarPos({
          top: bound.top - 60,
          left: bound.left + (bound.width / 2) - 60
        });
      }
    });

    return () => {
      window.removeEventListener("resize", resize);
      canvas.off("selection:created");
      canvas.off("selection:updated");
      canvas.off("selection:cleared");
      canvas.off("object:moving");
      canvas.dispose();
      fabricCanvas.current = null;
    };
  }, []);

  /* ================= LOAD PER QUESTION ================= */
  useEffect(() => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    isInitializingRef.current = true;

    if (canvasData) {
      canvas.loadFromJSON(canvasData).then(() => {
        // 🔥 Expand canvas after load
        let maxY = 600;

        canvas.getObjects().forEach(obj => {
          obj.setCoords();

          const bottom =
            obj.aCoords?.bl?.y ||
            (obj.top + (obj.height * (obj.scaleY || 1)));

          if (bottom > maxY) maxY = bottom;
        });

        if (maxY > 600) {
          canvas.setDimensions({
            width: containerRef.current?.clientWidth || canvas.width,
            height: maxY + 300,
          });
        }

        canvas.renderAll();

        // ✅ reset ONCE
        isInitializingRef.current = false;

        // ✅ reset history
        historyRef.current = [JSON.stringify(canvas.toJSON())];
        historyIndexRef.current = 0;
      });

    } else {
      // 🔥 empty canvas state
      canvas.clear();
      canvas.backgroundColor = "#ffffff";

      if (containerRef.current) {
        canvas.setDimensions({
          width: containerRef.current.clientWidth,
          height: 600,
        });
      }

      canvas.renderAll();

      isInitializingRef.current = false;

      historyRef.current = [JSON.stringify(canvas.toJSON())];
      historyIndexRef.current = 0;
    }

  }, []); // DO NOT CHANGE 

  /* ================= TOOL ENGINE ================= */
  useEffect(() => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    // 🔥 RESET EVERYTHING FIRST
    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.defaultCursor = "default";
    canvas.hoverCursor = "move";

    canvas.forEachObject(obj => {
      obj.selectable = true;
      obj.evented = true;
    });

    // Instead of obliterating all global handlers, we track ours for safe cleanup
    let currentMouseDown = null;
    let currentMouseMove = null;
    let currentMouseUp = null;

    // ================= TOOLS =================

    if (activeTool === "pen") {
      canvas.isDrawingMode = true;

      const brush = new PencilBrush(canvas);
      brush.color = penColor;
      brush.width = size;
      canvas.freeDrawingBrush = brush;
    }

    else if (activeTool === "highlight") {
      canvas.isDrawingMode = true;

      const brush = new PencilBrush(canvas);
      brush.color = highlightColor;
      brush.width = size * 2;
      canvas.freeDrawingBrush = brush;
    }

    else if (activeTool === "eraser") {
      const eraserSVG = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20H7L3 16a2 2 0 0 1 0-2.8l9.2-9.2a2 2 0 0 1 2.8 0l5 5a2 2 0 0 1 0 2.8L11 20"/><path d="M15 15l-4-4"/></svg>') 0 24, auto`;

      canvas.defaultCursor = eraserSVG;
      canvas.hoverCursor = eraserSVG;

      currentMouseDown = (e) => {
        if (e.target) {
          canvas.remove(e.target);
          canvas.renderAll();

          // 🔥 FORCE SAVE AFTER DELETE
          setCanvasDataRef.current(canvas.toJSON());
        }
      };
      
      canvas.on("mouse:down", currentMouseDown);
    }

    else if (activeTool === "text") {
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.defaultCursor = "text";

      currentMouseDown = (opt) => {
        const pointer = opt.scenePoint || (canvas.getPointer ? canvas.getPointer(opt.e) : { x: opt.e.offsetX, y: opt.e.offsetY });
        
        const lineSpacing = 36; // Notepad-like ruled line height
        const leftMargin = 40;  // Standard notepad left margin
        
        // Snap the Y coordinate to the nearest ruled line
        const snappedY = Math.max(lineSpacing, Math.round(pointer.y / lineSpacing) * lineSpacing);

        // Scan the entire document to see if a text object already exists on this line grid
        let existingText = null;
        canvas.getObjects().forEach(obj => {
          if (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox") {
            if (Math.abs(obj.top - snappedY) < lineSpacing / 2) {
              existingText = obj;
            }
          }
        });

        if (existingText) {
          // A text line already exists here! Select it safely without spawning an overlap.
          canvas.setActiveObject(existingText);
          existingText.enterEditing();
          setTimeout(() => {
            if (existingText.hiddenTextarea) existingText.hiddenTextarea.focus();
            setActiveTool("select");
          }, 50);
          return;
        }

        // Spawn a brand new text row clamped to the left margin!
        const text = new IText("", {
          left: leftMargin,
          top: snappedY,
          fontSize,
          fill: penColor,
          editable: true,
          selectable: true,
          fontFamily: "sans-serif"
        });

        // Destroy invisible text chunks to prevent overlap traps
        text.on("editing:exited", () => {
          if (!text.text || text.text.trim() === "") {
            canvas.remove(text);
          }
        });

        canvas.add(text);
        canvas.setActiveObject(text);

        // Required to let Fabric release native event holds before hooking focus
        setTimeout(() => {
          text.enterEditing();
          if (text.hiddenTextarea) text.hiddenTextarea.focus();
          canvas.renderAll();
          setActiveTool("select"); // Immediately exit text creation mode
        }, 50);
      };
      
      canvas.on("mouse:down", currentMouseDown);
    }

    else if (activeTool === "select") {
      canvas.isDrawingMode = false;
    }

    else if (activeTool === "pan") {
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.defaultCursor = "grab";

      canvas.forEachObject(obj => {
        obj.selectable = false;
        obj.evented = false;
      });

      let isDragging = false;
      let lastY = 0;

      currentMouseDown = (opt) => {
        isDragging = true;
        canvas.defaultCursor = "grabbing";
        lastY = opt.e.clientY ?? opt.e.touches?.[0]?.clientY ?? opt.e.changedTouches?.[0]?.clientY ?? 0;
      };

      currentMouseMove = (opt) => {
        if (!isDragging) return;
        const currentY = opt.e.clientY ?? opt.e.touches?.[0]?.clientY ?? opt.e.changedTouches?.[0]?.clientY ?? 0;
        if (currentY && lastY) {
          const deltaY = currentY - lastY;
          if (containerRef.current) {
            containerRef.current.scrollTop -= deltaY;
          }
          lastY = currentY;
        }
      };

      currentMouseUp = () => {
        isDragging = false;
        canvas.defaultCursor = "grab";
      };

      canvas.on("mouse:down", currentMouseDown);
      canvas.on("mouse:move", currentMouseMove);
      canvas.on("mouse:up", currentMouseUp);
    }

    canvas.renderAll();

    return () => {
      // PROPER CLEANUP! Only remove exactly the functions we added!
      if (currentMouseDown) canvas.off("mouse:down", currentMouseDown);
      if (currentMouseMove) canvas.off("mouse:move", currentMouseMove);
      if (currentMouseUp) canvas.off("mouse:up", currentMouseUp);
    };

  }, [activeTool, penColor, highlightColor, size, fontSize]);
  /* ================= ICON ================= */
  const getIcon = (tool) => {
    const size = 22;
    const stroke = 2.5;

    switch (tool) {
      case "select": return <MousePointer2 size={size} strokeWidth={stroke} />;
      case "pan": return <Hand size={size} strokeWidth={stroke} />;
      case "pen": return <Pen size={size} strokeWidth={stroke} />;
      case "text": return <Type size={size} strokeWidth={stroke} />;
      case "highlight": return <Highlighter size={size} strokeWidth={stroke} />;
      case "eraser": return <Eraser size={size} strokeWidth={stroke} />;
      default: return null;
    }
  };

  /* ================= TEXT STYLING ================= */
  const toggleStyle = (style) => {
    if (!selectedText) return;
    const canvas = fabricCanvas.current;

    if (style === "bold") {
      const current = selectedText.fontWeight;
      selectedText.set("fontWeight", current === "bold" ? "normal" : "bold");
    }
    if (style === "italic") {
      const current = selectedText.fontStyle;
      selectedText.set("fontStyle", current === "italic" ? "normal" : "italic");
    }
    if (style === "delete") {
      canvas.remove(selectedText);
      setSelectedText(null);
    }

    canvas.renderAll();

    // Explicitly call to sync changes to history
    if (fabricCanvas.current) {
      if (!isInitializingRef.current && !isUndoRedoActive.current) {
        setCanvasData(fabricCanvas.current.toJSON());
      }
    }
  };

  /* ================= UNDO / REDO ================= */
  const handleUndo = (e) => {
    e.stopPropagation();
    const canvas = fabricCanvas.current;
    if (!canvas || historyIndexRef.current <= 0) return;

    isUndoRedoActive.current = true;
    historyIndexRef.current -= 1;
    const prevState = historyRef.current[historyIndexRef.current];

    canvas.loadFromJSON(JSON.parse(prevState)).then(() => {
      canvas.renderAll();
      setCanvasDataRef.current(canvas.toJSON());
      isUndoRedoActive.current = false;
    });
  };

  const handleRedo = (e) => {
    e.stopPropagation();
    const canvas = fabricCanvas.current;
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;

    isUndoRedoActive.current = true;
    historyIndexRef.current += 1;
    const nextState = historyRef.current[historyIndexRef.current];

    canvas.loadFromJSON(JSON.parse(nextState)).then(() => {
      canvas.renderAll();
      setCanvasDataRef.current(canvas.toJSON());
      isUndoRedoActive.current = false;
    });
  };

  return (
    <div className="relative w-full border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* FLOATING ACTION TOOLBAR */}
      <div className="toolbox absolute top-4 left-4 z-[999]">
        <div className="flex items-center gap-2 p-1.5 rounded-full bg-[#8b95a7]/90 backdrop-blur-md shadow-2xl border border-white/20 transition-all duration-300">

          {/* MAIN TOGGLE / ACTIVE TOOL INDICATOR */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setToolOpen(!toolOpen);
            }}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 transform active:scale-90
                ${toolOpen ? "bg-[#ef4444] -rotate-90" : "bg-[#1e2a44] hover:scale-105"}`}
          >
            {toolOpen ? <X size={20} /> : getIcon(activeTool)}          </button>

          {/* EXPANDABLE MOD - TOOLS & SETTINGS */}
          {toolOpen && (
            <div className="flex items-center gap-4 px-3 animate-in fade-in slide-in-from-left-4 duration-300">

              {/* TOOLS */}
              <div className="flex items-center gap-2 border-r border-white/30 pr-4">
                {tools.map((tool) => (
                  <button
                    key={tool}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTool(tool);
                      setToolOpen(false); // Close after selection
                    }}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all
                        ${activeTool === tool
                        ? "bg-[#1e2a44] text-white scale-110 shadow-md"
                        : "text-white hover:bg-white/20"
                      }`}
                    title={tool.charAt(0).toUpperCase() + tool.slice(1)}
                  >
                    {getIcon(tool)}
                  </button>
                ))}
              </div>

              {/* CONTEXTUAL SETTINGS (COLORS/SIZE) */}
              <div className="flex items-center gap-3">

                {/* PEN COLORS */}
                {activeTool === "pen" && penColors.map((c, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPenColor(c);
                      setToolOpen(false);
                    }}
                    className="w-6 h-6 rounded-full cursor-pointer border-2 transition hover:scale-125 shadow-sm"
                    style={{
                      background: c,
                      borderColor: penColor === c ? "white" : "transparent",
                    }}
                  />
                ))}

                {/* HIGHLIGHT COLORS */}
                {activeTool === "highlight" && highlightColors.map((c, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setHighlightColor(c);
                      setToolOpen(false);
                    }}
                    className="w-6 h-6 rounded-full cursor-pointer border-2 transition hover:scale-125 shadow-sm"
                    style={{
                      background: c,
                      borderColor: highlightColor === c ? "white" : "transparent"
                    }}
                  />
                ))}

                {/* TEXT SIZE */}
                {activeTool === "text" && (
                  <div className="flex items-center bg-white/20 rounded-lg px-2 py-1">
                    <span className="text-[10px] text-white font-bold mr-2 uppercase">Size</span>
                    <select
                      value={fontSize}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer"
                    >
                      {[12, 16, 18, 24, 32].map((s) => (
                        <option key={s} value={s} className="text-slate-900">{s}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* HISTORY ACTIONS (UNDO/REDO) */}
              <div className="flex items-center gap-1 border-l border-white/30 pl-4">
                <button
                  onClick={handleUndo}
                  className={`w-9 h-9 text-white rounded-full flex items-center justify-center transition
                    ${historyIndexRef.current > 0 ? "hover:bg-white/20" : "opacity-50 cursor-not-allowed"}`}
                  title="Undo"
                >
                  <Undo2 size={18} strokeWidth={2.5} />                </button>
                <button
                  onClick={handleRedo}
                  className={`w-9 h-9 text-white rounded-full flex items-center justify-center transition
                    ${historyRef.current.length > 0 && historyIndexRef.current < historyRef.current.length - 1 ? "hover:bg-white/20" : "opacity-50 cursor-not-allowed"}`}
                  title="Redo"
                >
                  <Redo2 size={18} strokeWidth={2.5} />                </button>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* SCROLL CONTAINER */}
      <div
        ref={containerRef}
        className="relative w-full h-[65vh] overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-50"
      >
        <canvas
          ref={canvasRef}
          style={{ pointerEvents: "auto" }}
        />

        {/* TEXT FLOATING BAR */}
        {selectedText && (
          <div
            className="absolute z-[100] flex items-center gap-1 p-1 bg-[#1e2a44] rounded-lg shadow-xl border border-white/20 animate-in fade-in"
            style={{
              top: `${textBarPos.top}px`,
              left: `${textBarPos.left}px`
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.preventDefault()}
          >
            <button
              onClick={() => toggleStyle("bold")}
              className={`w-8 h-8 rounded flex items-center justify-center text-white hover:bg-white/20 transition
              ${selectedText.fontWeight === "bold" ? "bg-blue-500" : ""}`}
            >
              <Bold size={16} strokeWidth={2.5} />            </button>
            <button
              onClick={() => toggleStyle("italic")}
              className={`w-8 h-8 rounded flex items-center justify-center text-white hover:bg-white/20 transition
              ${selectedText.fontStyle === "italic" ? "bg-blue-500" : ""}`}
            >
              <Italic size={16} strokeWidth={2.5} />            </button>
            <div className="w-[1px] h-4 bg-white/20 mx-1" />
            <button
              onClick={() => toggleStyle("delete")}
              className="w-8 h-8 rounded flex items-center justify-center text-red-400 hover:bg-red-500/20 transition"
            >
              <Trash2 size={16} strokeWidth={2.5} />            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default CanvasBoard;