import { useState } from "react";
import { useStore } from "../../store";
import { LEVEL_REGISTRY } from "../../levels/registry";
import type { Level } from "../../levels/types";
import styles from "./StartScreen.module.css";

export const StartScreen = () => {
  const { startGame } = useStore();
  const [customLevels, setCustomLevels] = useState<Level[]>(() => {
    const saved = localStorage.getItem("disposable_disciples_custom_levels");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse custom levels:", e);
      }
    }
    return [];
  });

  const playStandard = (idx: number) => {
    useStore.getState().loadLevel(idx);
    startGame();
  };

  const playCustom = (level: Level) => {
    useStore.getState().loadLevelObject(level);
    startGame();
  };

  const editStandard = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    useStore.getState().loadLevel(idx);
    useStore.getState().setView("EDITOR");
    startGame();
  };

  const editCustom = (level: Level, e: React.MouseEvent) => {
    e.stopPropagation();
    useStore.getState().loadLevelObject(level);
    useStore.getState().setView("EDITOR");
    startGame();
  };

  const deleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to banish this custom ritual forever?")) {
      const updated = customLevels.filter((lvl) => lvl.id !== id);
      setCustomLevels(updated);
      localStorage.setItem("disposable_disciples_custom_levels", JSON.stringify(updated));
    }
  };

  const openArchitect = () => {
    useStore.getState().setView("EDITOR");
    startGame();
  };

  return (
    <div className={`${styles.landingOverlay} ${styles.fadeIn}`}>
      <div className={styles.splashBackground} />

      <div className={styles.menuContainer}>
        {/* Spacer to keep the choices at the same vertical position */}
        <div className={styles.headerSpacer} />

        {/* Level selection panels */}
        <div className={styles.selectorGrid}>
          {/* Column 1: Built-in levels */}
          <div className={styles.selectorColumn}>
            <h2 className={styles.columnTitle}>🌑 SACRED RITUALS</h2>
            <div className={styles.levelList}>
              {LEVEL_REGISTRY.map((lvl, idx) => (
                <div key={lvl.id} className={styles.levelCard} onClick={() => playStandard(idx)}>
                  <div className={styles.levelCardHeader}>
                    <h3>{lvl.name}</h3>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span className={styles.envTag}>{lvl.environmentType || "ELDRITCH"}</span>
                      <button
                        className={styles.btnEdit}
                        onClick={(e) => editStandard(idx, e)}
                        title="Edit Template"
                      >
                        ✏️
                      </button>
                    </div>
                  </div>
                  <p className={styles.levelDesc}>{lvl.description}</p>
                  <div className={styles.levelStats}>
                    <span>Spawn Limit: {lvl.spawnLimit}</span>
                    <span>Required Saved: {lvl.requiredSaved}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Custom levels */}
          <div className={styles.selectorColumn}>
            <h2 className={styles.columnTitle}>🔮 CUSTOM ARCHIVES</h2>
            <div className={styles.levelList}>
              {customLevels.length === 0 ? (
                <div className={styles.emptyCard}>
                  <p>No custom rituals found in the dark archives.</p>
                  <button className="primary-btn mini" onClick={openArchitect} style={{ marginTop: "1rem" }}>
                    CREATE RITUAL
                  </button>
                </div>
              ) : (
                customLevels.map((lvl) => (
                  <div key={lvl.id} className={styles.levelCard} onClick={() => playCustom(lvl)}>
                    <div key={lvl.id} className={styles.levelCardHeader}>
                      <h3>{lvl.name}</h3>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          className={styles.btnEdit}
                          onClick={(e) => editCustom(lvl, e)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button className={styles.btnDelete} onClick={(e) => deleteCustom(lvl.id, e)} title="Delete">
                          🗑️
                        </button>
                      </div>
                    </div>
                    <p className={styles.levelDesc}>{lvl.description}</p>
                    <div className={styles.levelStats}>
                      <span>Spawn Limit: {lvl.spawnLimit}</span>
                      <span>Required Saved: {lvl.requiredSaved}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Global Footer Button */}
        <div className={styles.menuFooter}>
          <button className={styles.btnSecondaryLink} onClick={openArchitect}>
            ⚙️ ENTER LEVEL ARCHITECT TEMPLE
          </button>
        </div>
      </div>
    </div>
  );
};
