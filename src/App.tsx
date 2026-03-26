import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Physics } from "@react-three/cannon";
import { GateAndAltar } from "./components/GateAndAltar";
import { CultistManager } from "./components/CultistManager";
import { RitualEnvironment } from "./components/Environment";
import { AudioManager } from "./components/AudioManager";
import { useStore } from "./store";
import "./App.css";

const HUD = () => {
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
    <div className="hud">
      {/* Top-centre stats */}
      <div className="stats-panel">
        <div className="stat-item">
          <span className="stat-label">Spawned</span>
          <span className="stat-value">
            {totalSpawned}
            <span style={{ fontSize: "14px", color: "var(--text-dim)" }}>
              {" "}
              /{totalSpawningLimit}
            </span>
          </span>
        </div>

        <div className="stat-divider" />

        <div className="progress-wrap">
          <span className="stat-label">Ritual Progress</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="stat-label" style={{ color: "var(--text)" }}>
            {savedCount} / {requiredSavedCount} Souls
          </span>
        </div>

        <div className="stat-divider" />

        <div className="stat-item">
          <span className="stat-label">Lost</span>
          <span className="stat-value danger">{lostCount}</span>
        </div>
      </div>

      {/* Bottom-centre job selector */}
      <div className="job-selector">
        {(["NONE", "BONE_WEAVER", "BLOCKER"] as const).map((job) => (
          <button
            key={job}
            className={`job-btn ${activeJob === job ? "active" : ""}`}
            onClick={() => setJob(job)}
          >
            <span className="job-icon">
              {job === "NONE" ? "🚶" : job === "BONE_WEAVER" ? "🦴" : "🛑"}
            </span>
            {job === "NONE"
              ? "Wanderer"
              : job === "BONE_WEAVER"
                ? "Bone Weaver"
                : "Blocker"}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const {
    savedCount,
    requiredSavedCount,
    totalSpawned,
    totalSpawningLimit,
    lostCount,
    gameStarted,
    startGame,
  } = useStore();
  const activeCount = useStore((s) => s.cultists.length);

  const victory = savedCount >= requiredSavedCount;
  const allSpawned = totalSpawned >= totalSpawningLimit;
  const defeat =
    allSpawned && activeCount === 0 && savedCount < requiredSavedCount;
  const gameOver = victory || defeat;

  return (
    <div className="container">
      {/* ── Start Screen ── */}
      {!gameStarted && (
        <div className="overlay">
          <div className="glass-card">
            <h1>Disposable Disciples</h1>
            <p>
              Guide the cultists from the eldritch gate to the altar of bone.
              <br />
              Prevent their descent into the void.
            </p>
            <ul className="rules">
              <li>
                <strong>Wanderer</strong> — cultist walks freely (default)
              </li>
              <li>
                <strong>Bone Weaver</strong> — select a cultist to build a
                bridge over gaps
              </li>
              <li>
                <strong>Blocker</strong> — select a cultist to halt others and
                force a turn
              </li>
              <li>
                Save {requiredSavedCount} of {totalSpawningLimit} souls to
                complete the ritual
              </li>
            </ul>
            <button className="primary-btn" onClick={startGame}>
              Begin Ritual
            </button>
          </div>
        </div>
      )}

      {/* ── 3D Scene ── */}
      {gameStarted && (
        <>
          <Canvas camera={{ position: [0, 8, 14], fov: 42 }} shadows>
            {/* ── Lights — top-level, outside Physics ── */}
            <ambientLight intensity={1.2} color="#c4b5fd" />
            <directionalLight
              position={[10, 20, 10]}
              intensity={2.5}
              color="#ffffff"
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-camera-near={0.1}
              shadow-camera-far={100}
              shadow-camera-left={-20}
              shadow-camera-right={20}
              shadow-camera-top={20}
              shadow-camera-bottom={-20}
            />
            <pointLight
              position={[-8, 3, 0]}
              intensity={4}
              color="#9333ea"
              distance={12}
            />
            <pointLight
              position={[8, 4, 0]}
              intensity={4}
              color="#c084fc"
              distance={12}
            />

            <Physics
              gravity={[0, -18, 0]}
              defaultContactMaterial={{ friction: 0, restitution: 0.0 }}
              broadphase="SAP"
              allowSleep={false}
            >
              {/* <Debug color="#ff0000"> */}
              <RitualEnvironment />
              <GateAndAltar />
              <CultistManager />
              {/* </Debug> */}
            </Physics>

            <AudioManager />

            <OrbitControls
              enablePan={false}
              maxPolarAngle={Math.PI / 2.1}
              minDistance={7}
              maxDistance={28}
              target={[0, 0, 0]}
            />
          </Canvas>

          <HUD />

          {/* ── Game Over Overlay ── */}
          {gameOver && (
            <div className="overlay">
              <div className="glass-card">
                <h1 className={victory ? "victory-title" : "defeat-title"}>
                  {victory ? "Ritual Complete" : "Ritual Failed"}
                </h1>
                <p>
                  {victory
                    ? "The void consumes the offered souls. The gate opens."
                    : "The sacrifice was insufficient. The ancient one slumbers still."}
                </p>
                <div className="stats-summary">
                  <div>
                    Saved <span>{savedCount}</span>
                  </div>
                  <div>
                    Lost <span>{lostCount}</span>
                  </div>
                </div>
                <button
                  className="primary-btn"
                  onClick={() => window.location.reload()}
                >
                  Retry Ritual
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
