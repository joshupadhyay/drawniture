import { useRef, useState } from "react";
import {
  ReactSketchCanvas,
  type ReactSketchCanvasRef,
} from "react-sketch-canvas";
import { Button } from "@/components/ui/button";

export function DrawingCanvas() {
  const [isOpen, setIsOpen] = useState(true);

  const canvasRef = useRef<ReactSketchCanvasRef | null>(null); // in functional react, useRef / use State subsitute the class based inits / variables

  const canvasStyles = {
    border: "0.0625rem solid #9c9c9c",
    borderRadius: "0.25rem",
  };

  const handleExport = async () => {
    try {
      if (!canvasRef.current) return; // strict check if still null ?
      await canvasRef.current.exportImage("png");
    } catch (err) {
      console.log(err);
    }
  };

  // has to be capitalized?
  function OpenCanvasButton() {
    return (
      <Button
        onClick={() => setIsOpen((isOpen) => !isOpen)}
        name="My super cool button"
      >
        Toggle Canvas
      </Button>
    );
  }

  return (
    <>
      <div>
        <OpenCanvasButton />

        {isOpen && (
          <div>
            <ReactSketchCanvas
              ref={canvasRef}
              strokeWidth={5}
              strokeColor="black"
            />
            <Button onClick={handleExport}>Get Image</Button>
          </div>
        )}
      </div>
    </>
  );
}
