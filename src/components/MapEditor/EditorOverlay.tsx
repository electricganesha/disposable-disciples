import { useStore } from "../../store";
import { useState, useCallback } from "react";

export const EditorOverlay = () => {
  const { updateLevelFromASCII, setView } = useStore();
  // Start with empty or current level? Let's use a default template
  const [ascii, setAscii] = useState(`
                  
                  
 G              S A
#######......#####
| | | |      | | | 
  `);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setAscii(val);
      updateLevelFromASCII(val);
    },
    [updateLevelFromASCII],
  );

  return (
    <div className="editor-overlay">
      <div className="editor-panel">
        <div className="editor-header">
          <h3>RITUAL ARCHITECT</h3>
          <button onClick={() => setView('GAME')}>×</button>
        </div>

        <p className="editor-hint">
          #=Stone, B=Bone, C=Support, G=Gate, A=Altar, S=Stair, |=Pillar
        </p>

        <textarea
          spellCheck={false}
          value={ascii}
          onChange={handleChange}
          className="editor-textarea"
          placeholder="Draw your level here..."
        />

        <div className="editor-footer">
          <button onClick={() => navigator.clipboard.writeText(ascii)}>
            COPY ASCII
          </button>
          <span className="editor-hint">Changes are live in the scene</span>
        </div>
      </div>
    </div>
  );
};
