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
    currentLevelName,
    currentLevelDescription,
    environmentType,
    totalSpawningLimit,
    requiredSavedCount,
    jobQuotas,
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

  const [levelName, setLevelName] = useState(currentLevelName || "Custom Ritual");
  const [levelDesc, setLevelDesc] = useState(currentLevelDescription || "A custom ritual designed by an architect.");
  const [envType, setEnvType] = useState(environmentType || "VOID");
  const [spawnLimit, setSpawnLimit] = useState(totalSpawningLimit || 15);
  const [requiredSaved, setRequiredSaved] = useState(requiredSavedCount || 10);
  const [quotaWeaver, setQuotaWeaver] = useState(jobQuotas.BONE_WEAVER !== undefined ? jobQuotas.BONE_WEAVER : 1);
  const [quotaBlocker, setQuotaBlocker] = useState(jobQuotas.BLOCKER !== undefined ? jobQuotas.BLOCKER : 1);
  const [quotaDigger, setQuotaDigger] = useState(jobQuotas.DIGGER !== undefined ? jobQuotas.DIGGER : 1);
  const [quotaBerserker, setQuotaBerserker] = useState(jobQuotas.BERSERKER !== undefined ? jobQuotas.BERSERKER : 1);
  const [quotaClimber, setQuotaClimber] = useState(jobQuotas.CLIMBER !== undefined ? jobQuotas.CLIMBER : 1);
  const [quotaFloater, setQuotaFloater] = useState(jobQuotas.FLOATER !== undefined ? jobQuotas.FLOATER : 1);
  const [quotaBasher, setQuotaBasher] = useState(jobQuotas.BASHER !== undefined ? jobQuotas.BASHER : 1);

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

  const handleSave = () => {
    const gridData: { [key: string]: any } = {};
    grid.forEach((type, key) => {
      gridData[key] = type;
    });

    const customLevel = {
      id: `custom-${Date.now()}`,
      name: levelName || "Custom Ritual",
      description: levelDesc || "A custom ritual designed by an architect.",
      gridData,
      gatePosition,
      altarPosition,
      staircasePositions,
      pillarPositions,
      spawnLimit: Number(spawnLimit) || 10,
      requiredSaved: Number(requiredSaved) || 5,
      jobQuotas: {
        BONE_WEAVER: Number(quotaWeaver) || 0,
        BLOCKER: Number(quotaBlocker) || 0,
        DIGGER: Number(quotaDigger) || 0,
        BERSERKER: Number(quotaBerserker) || 0,
        CLIMBER: Number(quotaClimber) || 0,
        FLOATER: Number(quotaFloater) || 0,
        BASHER: Number(quotaBasher) || 0,
      },
      environmentType: envType,
    };

    const saved = localStorage.getItem("disposable_disciples_custom_levels");
    const list = saved ? JSON.parse(saved) : [];
    list.push(customLevel);
    localStorage.setItem("disposable_disciples_custom_levels", JSON.stringify(list));
    alert("Ritual saved successfully to the archives!");
  };

  return (
    <div className={styles.editorInterface}>
      <EditorPalette />

      <div className={styles.editorRightPanel}>
        {/* Metadata config form */}
        <div className={styles.editorMetadataPanel}>
          <h3>RITUAL CONFIG</h3>
          
          <div className={styles.inputGroup}>
            <label htmlFor="ritual-name">Ritual Name</label>
            <input id="ritual-name" type="text" value={levelName} onChange={(e) => setLevelName(e.target.value)} />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="ritual-desc">Flavour Description</label>
            <input id="ritual-desc" type="text" value={levelDesc} onChange={(e) => setLevelDesc(e.target.value)} />
          </div>

          <div className={styles.rowInputs}>
            <div className={styles.inputGroup}>
              <label htmlFor="ritual-theme">Theme</label>
              <select id="ritual-theme" value={envType} onChange={(e) => setEnvType(e.target.value)}>
                <option value="ELDRITCH">Eldritch</option>
                <option value="VOID">Void</option>
                <option value="BONE">Bone</option>
                <option value="LAVA">Lava</option>
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="ritual-spawn-limit">Spawn Limit</label>
              <input id="ritual-spawn-limit" type="number" min="1" value={spawnLimit} onChange={(e) => setSpawnLimit(Number(e.target.value))} />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="ritual-goal">Goal</label>
              <input id="ritual-goal" type="number" min="1" value={requiredSaved} onChange={(e) => setRequiredSaved(Number(e.target.value))} />
            </div>
          </div>

          <div className={styles.quotaHeader}>Job Quotas</div>
          <div className={styles.rowInputs}>
            <div className={styles.inputGroup}>
              <label htmlFor="quota-weaver">Weave</label>
              <input id="quota-weaver" type="number" min="0" value={quotaWeaver} onChange={(e) => setQuotaWeaver(Number(e.target.value))} />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="quota-blocker">Halt</label>
              <input id="quota-blocker" type="number" min="0" value={quotaBlocker} onChange={(e) => setQuotaBlocker(Number(e.target.value))} />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="quota-digger">Dig</label>
              <input id="quota-digger" type="number" min="0" value={quotaDigger} onChange={(e) => setQuotaDigger(Number(e.target.value))} />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="quota-berserker">Berserk</label>
              <input id="quota-berserker" type="number" min="0" value={quotaBerserker} onChange={(e) => setQuotaBerserker(Number(e.target.value))} />
            </div>
          </div>
          <div className={styles.rowInputs} style={{ marginTop: "0.5rem" }}>
            <div className={styles.inputGroup}>
              <label htmlFor="quota-climber">Climb</label>
              <input id="quota-climber" type="number" min="0" value={quotaClimber} onChange={(e) => setQuotaClimber(Number(e.target.value))} />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="quota-floater">Float</label>
              <input id="quota-floater" type="number" min="0" value={quotaFloater} onChange={(e) => setQuotaFloater(Number(e.target.value))} />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="quota-basher">Bash</label>
              <input id="quota-basher" type="number" min="0" value={quotaBasher} onChange={(e) => setQuotaBasher(Number(e.target.value))} />
            </div>
            <div className={styles.inputGroup} style={{ visibility: "hidden" }}>
              <label htmlFor="quota-spacer">Spacer</label>
              <input id="quota-spacer" type="number" />
            </div>
          </div>

          <button className="primary-btn mini" onClick={handleSave} style={{ width: "100%", marginTop: "1rem" }}>
            📜 ARCHIVE RITUAL
          </button>
        </div>

        {/* ASCII code and copy options */}
        <div className={styles.editorExportPanel}>
          <textarea
            aria-label="ASCII Layout"
            spellCheck={false}
            value={localASCII}
            onChange={handleTextChange}
            className={`${styles.editorTextarea} ${styles.mini}`}
          />
          <button
            className="primary-btn mini"
            onClick={() => navigator.clipboard.writeText(localASCII)}
            style={{ width: "100%" }}
          >
            COPY ASCII
          </button>
        </div>
      </div>

      <div className={styles.editorControlsHint}>
        <p>Left Click: Place | Right Click: Erase</p>
        <p>Edit ASCII directly above</p>
      </div>
    </div>
  );
};
