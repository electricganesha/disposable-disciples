import { useStore } from "../../store";
import { GlassPanel, StatDisplay, RitualistButton } from "./UIComponents";
import styles from "./HUD.module.css";

export const HUD = () => {
  const {
    savedCount,
    requiredSavedCount,
    totalSpawned,
    totalSpawningLimit,
    lostCount,
    activeJob,
    setJob,
  } = useStore();

  const pct = Math.min(1, savedCount / requiredSavedCount) * 100;

  return (
    <div className={styles.floatingHud}>
      {/* Top Centre: Unified Stats Panel */}
      <GlassPanel className={`${styles.statsStripFloating} ${styles.slideUp}`}>
        <StatDisplay
          label="Manifested"
          value={totalSpawned}
          subValue={`/ ${totalSpawningLimit}`}
        />

        <div className={styles.statDividerVertical} />

        <div className={styles.ritualProgressCenter}>
          <div className="stat-label">Gathering Souls</div>
          <div className="stat-value" style={{ margin: "2px 0" }}>
            {savedCount}{" "}
            <span style={{ opacity: 0.5, fontSize: "0.7em" }}>
              / {requiredSavedCount}
            </span>
          </div>

          <div
            className="progress-bar"
            style={{ height: "4px", width: "120px", marginTop: "4px" }}
          >
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className={styles.statDividerVertical} />

        <StatDisplay label="Shattered" value={lostCount} danger />
      </GlassPanel>

      {/* Bottom Centre: Ritualist Toolbelt */}
      <div
        className={`${styles.toolbeltFloating} ${styles.slideUp}`}
        style={{ animationDelay: "0.4s" }}
      >
        <GlassPanel style={{ display: "flex", gap: "8px", padding: "10px" }}>
          <RitualistButton
            job="NONE"
            active={activeJob === "NONE"}
            label="Wander"
            icon="/images/wanderer_icon.png"
            onClick={() => setJob("NONE")}
          />
          <RitualistButton
            job="BONE_WEAVER"
            active={activeJob === "BONE_WEAVER"}
            label="Weave"
            icon="/images/weaver_icon.png"
            onClick={() => setJob("BONE_WEAVER")}
          />
          <RitualistButton
            job="BLOCKER"
            active={activeJob === "BLOCKER"}
            label="Halt"
            icon="/images/blocker_icon.png"
            onClick={() => setJob("BLOCKER")}
          />
          <RitualistButton
            job="DIGGER"
            active={activeJob === "DIGGER"}
            label="Dig"
            icon="/images/dig_down.png"
            onClick={() => setJob("DIGGER")}
          />
        </GlassPanel>
      </div>
    </div>
  );
};
