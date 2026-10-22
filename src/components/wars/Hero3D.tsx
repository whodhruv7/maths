"use client";
import { Canvas } from "@react-three/fiber";
import { Float, Stars, OrbitControls } from "@react-three/drei";
import { Component, type ReactNode, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Island({ position, scale = 1, top = "#22c55e" }: { position: [number, number, number]; scale?: number; top?: string }) {
  return (
    <Float speed={1.4} rotationIntensity={0.12} floatIntensity={0.9}>
      <group position={position} scale={scale}>
        <mesh position={[0, -0.9, 0]}>
          <coneGeometry args={[1.5, 2.4, 7]} />
          <meshStandardMaterial color="#5b4636" roughness={1} flatShading />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[1.55, 1.35, 0.34, 7]} />
          <meshStandardMaterial color={top} roughness={0.85} flatShading />
        </mesh>
        <mesh position={[0.7, 0.5, 0.2]}>
          <coneGeometry args={[0.28, 0.7, 6]} />
          <meshStandardMaterial color="#166534" flatShading />
        </mesh>
        <mesh position={[-0.6, 0.45, -0.3]}>
          <coneGeometry args={[0.22, 0.55, 6]} />
          <meshStandardMaterial color="#15803d" flatShading />
        </mesh>
      </group>
    </Float>
  );
}

function Castle() {
  return (
    <group position={[0, 0.2, 0]}>
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[1.7, 1.6, 1.7]} />
        <meshStandardMaterial color="#8b8fa3" roughness={0.7} />
      </mesh>
      {[
        [-0.85, 0.85, -0.85], [0.85, 0.85, -0.85], [-0.85, 0.85, 0.85], [0.85, 0.85, 0.85],
      ].map((p, i) => (
        <group key={i} position={p as [number, number, number]}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.34, 0.38, 1.9, 10]} />
            <meshStandardMaterial color="#9ca3af" roughness={0.65} />
          </mesh>
          <mesh position={[0, 1.55, 0]}>
            <coneGeometry args={[0.46, 0.85, 10]} />
            <meshStandardMaterial color="#7c3aed" roughness={0.5} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 2.35, 0]}>
        <coneGeometry args={[0.85, 1.15, 10]} />
        <meshStandardMaterial color="#a78bfa" roughness={0.45} />
      </mesh>
      <mesh position={[0, 3.25, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.7, 6]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>
      <mesh position={[0.18, 3.42, 0]}>
        <planeGeometry args={[0.42, 0.26]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Scene() {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (g.current) g.current.rotation.y += dt * 0.12; });
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 10, 4]} intensity={1.25} color="#fff7e0" />
      <directionalLight position={[-6, -4, -6]} intensity={0.35} color="#7c3aed" />
      <fog attach="fog" args={["#070a18", 14, 34]} />
      <Stars radius={60} depth={40} count={2600} factor={3.4} saturation={0} fade speed={0.6} />
      <group ref={g}>
        <Float speed={1.1} rotationIntensity={0.08} floatIntensity={0.65}>
          <group position={[0, 0.4, 0]} scale={1.5}>
            <mesh position={[0, -1, 0]}>
              <coneGeometry args={[1.9, 2.8, 8]} />
              <meshStandardMaterial color="#4b3b2f" roughness={1} flatShading />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[2, 1.75, 0.4, 8]} />
              <meshStandardMaterial color="#2f9e5f" roughness={0.85} flatShading />
            </mesh>
            <Castle />
          </group>
        </Float>
        <Island position={[6.2, -1.4, -2.5]} scale={0.8} top="#0ea5e9" />
        <Island position={[-6.4, -0.6, -1.8]} scale={0.7} top="#f59e0b" />
        <Island position={[3.6, -2.6, 5.2]} scale={0.55} top="#e11d48" />
        <Island position={[-3.8, -2.2, 5.6]} scale={0.5} top="#8b5cf6" />
        <Island position={[8.5, 1.8, 3.2]} scale={0.45} top="#10b981" />
      </group>
      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 2.6} maxPolarAngle={Math.PI / 1.9} />
    </>
  );
}

class Boundary extends Component<{ children: ReactNode }, { dead: boolean }> {
  state = { dead: false };
  static getDerivedStateFromError() { return { dead: true }; }
  render() { return this.state.dead ? null : this.props.children; }
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0">
      <Boundary>
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 2.4, 12.5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
          <Scene />
        </Canvas>
      </Boundary>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,transparent_40%,#070a18_85%)]" />
    </div>
  );
}
