import { useRef, useState } from "react";
import {
  ReactSketchCanvas,
  type ReactSketchCanvasRef,
} from "react-sketch-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ViewType = "front" | "back" | "side";

export function DrawingCanvas() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeView, setActiveView] = useState<ViewType>("front");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [isEraseMode, setIsEraseMode] = useState(false);
  const [furnitureType, setFurnitureType] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const frontCanvasRef = useRef<ReactSketchCanvasRef | null>(null);
  const backCanvasRef = useRef<ReactSketchCanvasRef | null>(null);
  const sideCanvasRef = useRef<ReactSketchCanvasRef | null>(null);

  const colors = [
    "#000000", "#FF0000", "#00FF00", "#0000FF", 
    "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500",
    "#800080", "#008000", "#FFC0CB", "#A52A2A"
  ];

  const canvasStyles = {
    border: "0.0625rem solid #9c9c9c",
    borderRadius: "0.25rem",
  };

  const getCurrentCanvasRef = () => {
    switch (activeView) {
      case "front": return frontCanvasRef;
      case "back": return backCanvasRef;
      case "side": return sideCanvasRef;
      default: return frontCanvasRef;
    }
  };

  const handleExport = async (view?: ViewType) => {
    try {
      const targetView = view || activeView;
      let canvasRef;
      
      switch (targetView) {
        case "front": canvasRef = frontCanvasRef; break;
        case "back": canvasRef = backCanvasRef; break;
        case "side": canvasRef = sideCanvasRef; break;
        default: canvasRef = frontCanvasRef;
      }
      
      if (!canvasRef.current) return;
      
      // Get the canvas data as a data URL
      const dataURL = await canvasRef.current.exportImage("png");
      
      // Create a download link
      const link = document.createElement("a");
      link.href = dataURL;
      
      // Generate filename with timestamp and view
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.download = `furniture-${targetView}-${timestamp}.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.log(err);
    }
  };

  const handleExportAll = async () => {
    await handleExport("front");
    await handleExport("back");
    await handleExport("side");
  };

  const toggleEraseMode = () => {
    const currentCanvas = getCurrentCanvasRef().current;
    if (currentCanvas) {
      currentCanvas.eraseMode(!isEraseMode);
      setIsEraseMode(!isEraseMode);
    }
  };

  const clearCanvas = () => {
    const currentCanvas = getCurrentCanvasRef().current;
    if (currentCanvas) {
      currentCanvas.clearCanvas();
    }
  };

  const undo = () => {
    const currentCanvas = getCurrentCanvasRef().current;
    if (currentCanvas) {
      currentCanvas.undo();
    }
  };

  const redo = () => {
    const currentCanvas = getCurrentCanvasRef().current;
    if (currentCanvas) {
      currentCanvas.redo();
    }
  };

  const searchFurniture = async () => {
    if (!furnitureType.trim()) {
      alert("Please specify the type of furniture you're drawing");
      return;
    }

    setIsSearching(true);
    try {
      // Get all three canvas images as data URLs
      let frontData, backData, sideData;
      
      try {
        frontData = frontCanvasRef.current ? await frontCanvasRef.current.exportImage("png") : null;
        backData = backCanvasRef.current ? await backCanvasRef.current.exportImage("png") : null;
        sideData = sideCanvasRef.current ? await sideCanvasRef.current.exportImage("png") : null;
      } catch (exportError) {
        console.error('Canvas export error:', exportError);
        // Use placeholder data if export fails
        frontData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
        backData = frontData;
        sideData = frontData;
      }

      console.log('Exported canvas data types:', typeof frontData, typeof backData, typeof sideData);

      // Create the payload for Claude
      const payload = {
        furnitureType,
        drawings: {
          front: frontData?.split(',')[1] || "placeholder", // Remove data:image/png;base64, prefix
          back: backData?.split(',')[1] || "placeholder",
          side: sideData?.split(',')[1] || "placeholder"
        }
      };

      // Call Claude API (using the existing API pattern from APITester)
      console.log('Sending payload:', payload);

      const response = await fetch('/api/search-furniture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Search failed: ${response.status}`);
      }

      const results = await response.json();
      console.log('Search results:', results);
      setSearchResults(results.matches || []);
      
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Search failed: ${errorMessage}. Check console for details.`);
    } finally {
      setIsSearching(false);
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
    <div className="w-full max-w-4xl mx-auto">
      <OpenCanvasButton />

      {isOpen && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Draw Your Furniture</CardTitle>
            <div className="flex gap-2 mb-4">
              {(["front", "back", "side"] as ViewType[]).map((view) => (
                <Button
                  key={view}
                  variant={activeView === view ? "default" : "outline"}
                  onClick={() => setActiveView(view)}
                  className="capitalize"
                >
                  {view} View
                </Button>
              ))}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Colors:</span>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setStrokeColor(color)}
                      className={`w-8 h-8 rounded border-2 ${
                        strokeColor === color ? "border-gray-800" : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Brush Size:</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm">{strokeWidth}px</span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={toggleEraseMode}
                  variant={isEraseMode ? "default" : "outline"}
                  size="sm"
                >
                  {isEraseMode ? "✏️ Draw" : "🧹 Erase"}
                </Button>
                <Button onClick={undo} variant="outline" size="sm">↶ Undo</Button>
                <Button onClick={redo} variant="outline" size="sm">↷ Redo</Button>
                <Button onClick={clearCanvas} variant="outline" size="sm">🗑️ Clear</Button>
              </div>
              
              <div className="flex items-center gap-4 pt-4 border-t">
                <div className="flex-1">
                  <Label htmlFor="furniture-type" className="text-sm font-medium">
                    What furniture are you drawing?
                  </Label>
                  <Input
                    id="furniture-type"
                    placeholder="e.g., couch, chair, table, dresser..."
                    value={furnitureType}
                    onChange={(e) => setFurnitureType(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={searchFurniture}
                  disabled={isSearching || !furnitureType.trim()}
                  className="self-end"
                >
                  {isSearching ? "Searching..." : "🔍 Find Similar"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <ReactSketchCanvas
                ref={frontCanvasRef}
                strokeWidth={strokeWidth}
                strokeColor={strokeColor}
                style={{
                  ...canvasStyles,
                  display: activeView === "front" ? "block" : "none"
                }}
                width="100%"
                height="600px"
              />
              <ReactSketchCanvas
                ref={backCanvasRef}
                strokeWidth={strokeWidth}
                strokeColor={strokeColor}
                style={{
                  ...canvasStyles,
                  display: activeView === "back" ? "block" : "none"
                }}
                width="100%"
                height="600px"
              />
              <ReactSketchCanvas
                ref={sideCanvasRef}
                strokeWidth={strokeWidth}
                strokeColor={strokeColor}
                style={{
                  ...canvasStyles,
                  display: activeView === "side" ? "block" : "none"
                }}
                width="100%"
                height="600px"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => handleExport()}>Export Current View</Button>
              <Button onClick={handleExportAll} variant="outline">Export All Views</Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Similar Furniture Found:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((result, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardContent className="p-4">
                        {result.image && (
                          <img 
                            src={result.image} 
                            alt={result.title || `Furniture match ${index + 1}`}
                            className="w-full h-48 object-cover rounded mb-3"
                          />
                        )}
                        <h4 className="font-medium text-sm mb-2">
                          {result.title || `Match ${index + 1}`}
                        </h4>
                        {result.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-3">
                            {result.description}
                          </p>
                        )}
                        {result.price && (
                          <p className="font-semibold text-green-600 text-sm">
                            {result.price}
                          </p>
                        )}
                        {result.source && (
                          <a 
                            href={result.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-2 block"
                          >
                            View on {result.source}
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
