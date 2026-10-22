"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Diff } from "./types";

export interface SubStat { a: number; c: number; s: number; m: number } // attempts, correct, streak, mastery 0-100

interface WarsState {
  xp: number;
  subs: Record<string, SubStat>;        // key `${ch}-${subId}`
  badges: string[];
  bossDone: string[];                   // chapter nums as strings
  daily: Record<string, number>;        // yyyy-mm-dd -> solved count
  last: { ch: number; sub: string } | null;
  visited: Record<string, number>;      // subtopic key -> visit count
  visit: (ch: number, sub: string) => void;
  record: (ch: number, sub: string, ok: boolean, diff: Diff) => { gained: number };
  addBoss: (ch: number) => void;
  resetAll: () => void;
}

export const key = (ch: number, sub: string) => `${ch}-${sub}`;
export const levelOf = (xp: number) => 1 + Math.floor(Math.sqrt(xp / 60));
export const xpForLevel = (lvl: number) => 60 * (lvl - 1) * (lvl - 1);

const today = () => new Date().toISOString().slice(0, 10);

function bump(st: SubStat | undefined, ok: boolean): SubStat {
  const s: SubStat = st ? { ...st } : { a: 0, c: 0, s: 0, m: 0 };
  s.a += 1;
  if (ok) {
    s.c += 1;
    s.s += 1;
    s.m = Math.min(100, Math.round((s.m + (100 - s.m) * 0.14 + (s.s >= 3 ? 4 : 0)) * 10) / 10);
  } else {
    s.s = 0;
    s.m = Math.max(0, Math.round((s.m - 9) * 10) / 10);
  }
  return s;
}

export const useWars = create<WarsState>()(
  persist(
    (set, get) => ({
      xp: 0,
      subs: {},
      badges: [],
      bossDone: [],
      daily: {},
      last: null,
      visited: {},
      visit: (ch, sub) => set((st) => ({ last: { ch, sub }, visited: { ...st.visited, [key(ch, sub)]: (st.visited[key(ch, sub)] ?? 0) + 1 } })),
      record: (ch, sub, ok, diff) => {
        const gained = ok ? 5 + diff * 5 : 1;
        set((st) => {
          const k = key(ch, sub);
          const subs = { ...st.subs, [k]: bump(st.subs[k], ok) };
          const d = today();
          const daily = { ...st.daily, [d]: (st.daily[d] ?? 0) + (ok ? 1 : 0) };
          const xp = st.xp + gained;
          const badges = new Set(st.badges);
          if (st.xp < 500 && xp >= 500) badges.add("first-spark");
          const totalCorrect = Object.values(subs).reduce((a, s) => a + s.c, 0);
          if (totalCorrect >= 100) badges.add("century");
          if (totalCorrect >= 500) badges.add("warlord");
          return { xp, subs, daily, badges: [...badges] };
        });
        return { gained };
      },
      addBoss: (ch) => set((st) => ({ bossDone: st.bossDone.includes(String(ch)) ? st.bossDone : [...st.bossDone, String(ch)], badges: st.badges.includes(`boss-${ch}`) ? st.badges : [...st.badges, `boss-${ch}`] })),
      resetAll: () => set({ xp: 0, subs: {}, badges: [], bossDone: [], daily: {}, last: null, visited: {} }),
    }),
    { name: "maths-wars-v1" }
  )
);

export const dailyGoal = 8;
export function dailyCount(daily: Record<string, number>): number {
  return daily[today()] ?? 0;
}
