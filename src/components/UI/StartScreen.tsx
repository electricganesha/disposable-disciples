import { useStore } from "../../store";
import styles from "./StartScreen.module.css";

export const StartScreen = () => {
  const { startGame } = useStore();

  const isEditorAllowed =
    new URLSearchParams(window.location.search).get("editor") === "true";

  return (
    <div className={`${styles.landingOverlay} ${styles.fadeIn}`}>
      <div className={styles.splashBackground} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <button className={styles.btnRitual} onClick={startGame}>
          START GAME
        </button>

        {isEditorAllowed && (
          <button
            className={styles.btnSecondaryLink}
            onClick={() => {
              useStore.getState().setView("EDITOR");
              startGame();
            }}
          >
            LEVEL ARCHITECT
          </button>
        )}
      </div>
    </div>
  );
};
