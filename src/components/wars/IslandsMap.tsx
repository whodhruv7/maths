"use client";
import { Canvas } from "@react-three/fiber";
import { Float, Html, Stars, OrbitControls } from "@react-three/drei";
import { Component, type ReactNode, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface MapIsland {
  num: number;
  world: string;
  emoji: string;
  color: string;
  mastery: number; // 0-100
}

function ChapterIsland({ isl, angle, onSelect }: { isl: MapIsland; angle: number; onSelect: (n: number) => void }) {
  const [hover, setHover] = useState(false);
  const R = 7.2;
  const x = Math.cos(angle) * R;
  const z = Math.sin(angle) * R;
  const y = Math.sin(angle * 2.3) * 0.8 - 0.4;
  return (
    <Float speed={1.5} rotationIntensity={0.15} floatIntensity={1}>
      <group
        position={[x, y, z]}
        scale={hover ? 1.18 : 1}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = "auto"; }}
        onClick={(e) => { e.stopPropagation(); onSelect(isl.num); }}
      >
        <mesh position={[0, -0.75, 0]}>
          <coneGeometry args={[1.15, 1.9, 6]} />
          <meshStandardMaterial color="#54422f" roughness={1} flatShading />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[1.2, 1.05, 0.3, 6]} />
          <meshStandardMaterial color="#2f9e5f" roughness={0.85} flatShading />
        </mesh>
        {/* mastery crystal */}
        <mesh position={[0, 1.05, 0]}>
          <octahedronGeometry args={[0.52]} />
          <meshStandardMaterial color={isl.color} emissive={isl.color} emissiveIntensity={0.35 + (isl.mastery / 100) * 0.85} roughness={0.25} metalness={0.35} flatShading />
        </mesh>
        <mesh position={[0, 1.05, 0]}>
          <octahedronGeometry args={[0.72]} />
          <meshBasicMaterial color={isl.color} transparent opacity={hover ? 0.22 : 0.08} />
        </mesh>
        <Html center distanceFactor={13} position={[0, 2.2, 0]} zIndexRange={[10, 0]}>
          <div className={`select-none whitespace-nowrap rounded-xl border border-white/15 bg-[#0b0f24]/90 px-3 py-1.5 text-center backdrop-blur transition-opacity ${hover ? "opacity-100" : "opacity-80"}`}>
            <div className="text-base leading-none">{isl.emoji}</div>
            <div className="mt-1 text-[10px] font-bold tracking-wide text-zinc-100">{isl.world}</div>
            <div className="text-[9px]" style={{ color: isl.color }}>{isl.mastery > 0 ? `${Math.round(isl.mastery)}% mastered` : "unexplored"}</div>
          </div>
        </Html>
      </group>
    </Float>
  );
}

function HubCastle({ onHub }: { onHub: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <Float speed={1.1} rotationIntensity={0.06} floatIntensity={0.7}>
      <group
        scale={hover ? 1.1 : 1}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = "auto"; }}
        onClick={(e) => { e.stopPropagation(); onHub(); }}
      >
        <group position={[0, 0.2, 0]} scale={1.35}>
          <mesh position={[0, -0.9, 0]}>
            <coneGeometry args={[2.1, 3.2, 8]} />
            <meshStandardMaterial color="#4b3b2f" roughness={1} flatShading />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[2.2, 1.95, 0.42, 8]} />
            <meshStandardMaterial color="#2f9e5f" roughness={0.85} flatShading />
          </mesh>
          <mesh position={[0, 1.15, 0]}>
            <boxGeometry args={[1.5, 1.4, 1.5]} />
            <meshStandardMaterial color="#8b8fa3" roughness={0.7} />
          </mesh>
          <mesh position={[0, 2.25, 0]}>
            <coneGeometry args={[0.9, 1.1, 10]} />
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.25} roughness={0.4} />
          </mesh>
          <Html center distanceFactor={14} position={[0, 3.6, 0]} zIndexRange={[10, 0]}>
            <div className="select-none whitespace-nowrap rounded-xl border border-amber-400/40 bg-[#0b0f24]/90 px-3 py-1.5 text-center backdrop-blur">
              <div className="text-[11px] font-black tracking-[0.2em] text-amber-300">MATHS WARS</div>
              <div className="text-[9px] text-zinc-400">click the castle for quests</div>
            </div>
          </Html>
        </group>
      </group>
    </Float>
  );
}

function MapScene({ islands, onSelect }: { islands: MapIsland[]; onSelect: (n: number) => void }) {
  const g = useRef<THREE.Group>(null);
  const [spin, setSpin] = useState(true);
  useFrame((_, dt) => { if (g.current && spin) g.current.rotation.y += dt * 0.07; });
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[8, 12, 6]} intensity={1.2} color="#fff7e0" />
      <directionalLight position={[-8, -4, -8]} intensity={0.3} color="#7c3aed" />
      <fog attach="fog" args={["#070a18", 16, 40]} />
      <Stars radius={70} depth={40} count={2400} factor={3.6} fade speed={0.5} />
      <group ref={g}>
        <HubCastle onHub={() => onSelect(-1)} />
        {islands.map((isl, i) => (
          <ChapterIsland key={isl.num} isl={isl} angle={(i / islands.length) * Math.PI * 2} onSelect={onSelect} />
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -1.9, 0]}>
          <torusGeometry args={[7.2, 0.02, 8, 90]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.12} />
        </mesh>
      </group>
      <OrbitControls enablePan={false} minDistance={9} maxDistance={20} minPolarAngle={Math.PI / 3.2} maxPolarAngle={Math.PI / 1.8} onStart={() => setSpin(false)} />
    </>
  );
}

class Boundary extends Component<{ children: ReactNode; fallback: ReactNode }, { dead: boolean }> {
  state = { dead: false };
  static getDerivedStateFromError() { return { dead: true }; }
  render() { return this.state.dead ? this.props.fallback : this.props.children; }
}

export default function IslandsMap({ islands, onSelect, fallback }: { islands: MapIsland[]; onSelect: (n: number) => void; fallback: ReactNode }) {
  return (
    <div className="absolute inset-0">
      <Boundary fallback={fallback}>
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 7, 15.5], fov: 42 }} gl={{ antialias: true, alpha: true }}>
          <MapScene islands={islands} onSelect={onSelect} />
        </Canvas>
      </Boundary>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_45%,#070a18_88%)]" />
    </div>
  );
}
