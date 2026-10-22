"use client";
import dynamic from "next/dynamic";
import type { VizKind } from "@/lib/wars/types";

const load = (name: string) => dynamic(() => import(`./${name}`), { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5" /> });

const REG: Partial<Record<VizKind, React.ComponentType<{ config?: Record<string, unknown> }>>> = {
  coord: load("CoordLab"),
  numberline: load("NumberLineLab"),
  algebra: load("AlgebraLab"),
  circle: load("CircleLab"),
  geometry: load("GeometryLab"),
  chance: load("ChanceLab"),
  pattern: load("PatternLab"),
};

export default function VizFrame({ kind, config }: { kind?: VizKind; config?: Record<string, unknown> }) {
  if (!kind || kind === "none") return null;
  const C = REG[kind];
  if (!C) return null;
  return (
    <div className="my-4">
      <C config={config} />
    </div>
  );
}
