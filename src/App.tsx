import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Physics } from "@react-three/cannon";
import { GateAndAltar } from "./components/Game/GateAndAltar";
import { CultistManager } from "./components/Game/CultistManager";
import { RitualEnvironment } from "./components/Game/Environment";
import { AudioManager } from "./components/Game/AudioManager";
import { useStore } from "./store";

import "./styles/variables.css";
import "./styles/global.css";
import "./styles/animations.css";
import "./App.css";

import { StartScreen } from "./components/UI/StartScreen";
import { GameOverOverlay } from "./components/UI/GameOverOverlay";
import { HUD } from "./components/UI/HUD";

import { EditorInterface } from "./components/MapEditor/EditorInterface";
import { EditorInteraction } from "./components/MapEditor/EditorInteraction";

export default function App() {
  const gameStarted = useStore((s) => s.gameStarted);
  const gameWon = useStore((s) => s.gameWon);
  const gameLost = useStore((s) => s.gameLost);
  const view = useStore((s) => s.view);
  const ambientColor = useStore((s) => s.ambientColor);
  const lightIntensity = useStore((s) => s.lightIntensity);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#050208" }}>
      {/* ── Start Screen ── */}
      {!gameStarted && <StartScreen />}

      {/* ── 3D Scene ── */}
      {gameStarted && (
        <>
          {view === "GAME" ? <HUD /> : <EditorInterface />}
          {gameWon && <GameOverOverlay />}
          {gameLost && <GameOverOverlay />}

          <Canvas
            camera={{ position: [0, 8, 14], fov: 42 }}
            shadows
            style={{ cursor: view === "EDITOR" ? "crosshair" : "default" }}
          >
            {/* ... lights and physics ... */}
            <ambientLight intensity={lightIntensity} color={ambientColor} />
            <directionalLight
              position={[10, 20, 10]}
              intensity={2.5}
              color="#ffffff"
              castShadow
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
              gravity={view === "EDITOR" ? [0, 0, 0] : [0, -18, 0]}
              defaultContactMaterial={{ friction: 0, restitution: 0.0 }}
              broadphase="SAP"
            >
              <RitualEnvironment />
              <GateAndAltar />
              {view === "GAME" && <CultistManager />}
              {view === "EDITOR" && <EditorInteraction />}
            </Physics>

            <AudioManager />
            <OrbitControls
              enablePan={view === "EDITOR"}
              enableDamping
              dampingFactor={0.05}
              zoomSpeed={0.1}
              maxPolarAngle={view === "EDITOR" ? Math.PI : Math.PI / 2.1}
              target={[0, 0, 0]}
            />
          </Canvas>
        </>
      )}
    </div>
  );
}
