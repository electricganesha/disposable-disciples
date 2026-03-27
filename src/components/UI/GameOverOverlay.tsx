import { useStore } from "../../store";
import styles from "./GameOverOverlay.module.css";

export const GameOverOverlay = () => {
  const {
    savedCount,
    lostCount,
    gameWon,
    loadLevel,
    loadNextLevel,
    currentLevelIndex,
  } = useStore();

  return (
    <div className={`${styles.landingOverlay} ${styles.fadeIn}`}>
      <div
        className="glass-panel"
        style={{ padding: "48px", maxWidth: "600px", pointerEvents: "auto" }}
      >
        <h1
          className={
            gameWon
              ? `${styles.landingTitle} victory-title`
              : `${styles.landingTitle} defeat-title`
          }
        >
          {gameWon ? "RITUAL COMPLETE" : "RITUAL FAILED"}
        </h1>
        <p className="level-desc" style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
          {gameWon
            ? "The void consumes the offered souls. The gate opens for your ascension."
            : "The sacrifice was insufficient. The ancient ones demand more blood."}
        </p>
        <div className={styles.statsSummary}>
          <div>
            Manifested <span>{savedCount}</span>
          </div>
          <div>
            Shattered <span style={{ color: "var(--danger)" }}>{lostCount}</span>
          </div>
        </div>
        <button
          className="btn-ritual"
          onClick={gameWon ? loadNextLevel : () => loadLevel(currentLevelIndex)}
        >
          {gameWon ? "NEXT RITUAL" : "RETRY RITUAL"}
        </button>
      </div>
    </div>
  );
};
