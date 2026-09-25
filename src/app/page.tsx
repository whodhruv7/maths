"use client";

import { useEffect, useState } from "react";
import {
  DATA,
  loadProgress,
  saveProgress,
  emptyProgress,
  type Progress,
} from "@/lib/revision";
import { Home } from "@/components/revision/home";
import { ChapterView } from "@/components/revision/chapter-view";
import { PowerPage } from "@/components/revision/power-page";
import { LovePopup } from "@/components/revision/atoms";

type View = { name: "home" } | { name: "chapter"; num: number } | { name: "power" };

export default function Page() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [view, setView] = useState<View>({ name: "home" });

  useEffect(() => {
    let alive = true;
    Promise.resolve().then(() => {
      if (alive) setProgress(loadProgress());
    });
    return () => {
      alive = false;
    };
  }, []);

  const update = (fn: (p: Progress) => Progress) => {
    setProgress((prev) => {
      const next = fn(prev ?? emptyProgress());
      saveProgress(next);
      return next;
    });
  };

  if (!progress) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            80/80 Mission loading…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <LovePopup />
      {view.name === "home" && (
        <Home
          progress={progress}
          onOpenChapter={(num) => setView({ name: "chapter", num })}
          onOpenPower={() => setView({ name: "power" })}
          onReset={() => setProgress(emptyProgress())}
        />
      )}
      {view.name === "chapter" && (
        <ChapterView
          chapter={DATA.chapters.find((c) => c.num === view.num) ?? DATA.chapters[0]}
          progress={progress}
          setProgress={update}
          onBack={() => setView({ name: "home" })}
        />
      )}
      {view.name === "power" && <PowerPage onBack={() => setView({ name: "home" })} />}
    </main>
  );
}
