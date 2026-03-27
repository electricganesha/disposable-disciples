import { useState, useMemo } from "react";
import { useStore } from "../../store";
import { EditorPalette } from "./EditorPalette";
import styles from "./EditorInterface.module.css";

export const EditorInterface = () => {
  const {
    grid,
    gatePosition,
    altarPosition,
    staircasePositions,
    pillarPositions,
    updateLevelFromASCII,
  } = useStore();

  // 1. Generate ASCII from 3D state
  const generatedASCII = useMemo(() => {
    let minX = -8,
      maxX = 8,
      minY = -2,
      maxY = 5;
    const charMap: { [key: string]: string } = {};
    const setChar = (x: number, y: number, char: string) => {
      charMap[`${Math.round(x)},${Math.round(y)}`] = char;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    };

    grid.forEach((type, key) => {
      const char = type === "STONE" ? "#" : type === "BONE" ? "B" : "C";
      const [x, y] = key.split(",").map(Number);
      setChar(x, y, char);
    });

    staircasePositions.forEach((p) => setChar(p[0], p[1], "S"));
    pillarPositions.forEach((p) => setChar(p[0], p[1], "|"));

    // Only place G/A if they are within reasonable bounds
    if (gatePosition[0] < 500)
      setChar(gatePosition[0], Math.floor(gatePosition[1]), "G");
    if (altarPosition[0] < 500)
      setChar(altarPosition[0], Math.floor(altarPosition[1]), "A");

    let output = "";
    for (let y = maxY; y >= minY; y--) {
      let line = "";
      for (let x = minX; x <= maxX; x++) {
        line += charMap[`${x},${y}`] || " ";
      }
      output += line + "\n";
    }
    return output.trimEnd();
  }, [grid, gatePosition, altarPosition, staircasePositions, pillarPositions]);

  const [localASCII, setLocalASCII] = useState(generatedASCII);
  const [isInternalChange, setIsInternalChange] = useState(false);
  const [prevGenerated, setPrevGenerated] = useState(generatedASCII);

  if (generatedASCII !== prevGenerated) {
    setPrevGenerated(generatedASCII);
    if (!isInternalChange) {
      setLocalASCII(generatedASCII);
    }
    setIsInternalChange(false);
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLocalASCII(val);
    setIsInternalChange(true);
    updateLevelFromASCII(val);
  };

  return (
    <div className={styles.editorInterface}>
      <EditorPalette />

      <div className={styles.editorExportPanel}>
        <textarea
          spellCheck={false}
          value={localASCII}
          onChange={handleTextChange}
          className={`${styles.editorTextarea} ${styles.mini}`}
        />
        <button
          className="primary-btn mini"
          onClick={() => navigator.clipboard.writeText(localASCII)}
        >
          COPY ASCII
        </button>
      </div>

      <div className={styles.editorControlsHint}>
        <p>Left Click: Place | Right Click: Erase</p>
        <p>Edit ASCII directly above</p>
      </div>
    </div>
  );
};
