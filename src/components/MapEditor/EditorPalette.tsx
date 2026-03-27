import { useStore } from "../../store";

const PALETTE_ITEMS = [
  { id: "#", label: "Stone", icon: "⬛" },
  { id: "B", label: "Bone", icon: "🦴" },
  { id: "C", label: "Support", icon: "🧱" },
  { id: "S", label: "Stair", icon: "🪜" },
  { id: "G", label: "Gate", icon: "🌀" },
  { id: "A", label: "Altar", icon: "🏺" },
  { id: "|", label: "Pillar", icon: "🏛️" },
  { id: "REMOVE", label: "Erase", icon: "🧹" },
];

export const EditorPalette = () => {
  const { selectedPaletteItem, setSelectedPaletteItem, setView } = useStore();

  return (
    <div className="editor-palette">
      <div className="palette-header">
        <h3>PALETTE</h3>
        <button onClick={() => setView("GAME")}>EXIT</button>
      </div>
      <div className="palette-grid">
        {PALETTE_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`palette-btn ${selectedPaletteItem === item.id ? "active" : ""}`}
            onClick={() => setSelectedPaletteItem(item.id)}
            title={item.label}
          >
            <span className="palette-icon">{item.icon}</span>
            <span className="palette-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
