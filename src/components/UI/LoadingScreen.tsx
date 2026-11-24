import { useEffect, useState } from "react";
import styles from "./LoadingScreen.module.css";
import { useStore } from "../../store";

export const LoadingScreen = () => {
  const currentLevelName = useStore((s) => s.currentLevelName);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.loadingOverlay}>
      <div className={`${styles.glassPanel} glass-panel`}>
        <div className={styles.summoningCircle}>
          <div className={styles.runeInner} />
        </div>
        <h1 className={styles.loadingTitle}>INITIATING RITUAL</h1>
        <p className={styles.levelName}>{currentLevelName || "The Temple"}</p>
        <p className={styles.subtext}>Summoning disposable disciples{dots}</p>
      </div>
    </div>
  );
};
