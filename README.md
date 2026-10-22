# ⚔️ MATHS WARS — Class 9 Maths, Weaponised

**MATHS WARS** is a 3D-first learning & practice platform for **Class 9 mathematics (Ganita Manjari)**, built for **VidyaSaathy**.

Learning is the core mechanic — not decoration. Every concept follows the loop:
**UNDERSTAND → EXPLORE → PREDICT → SOLVE → VERIFY → PRACTISE → MASTER**

## 🌍 The 8 Worlds
| # | World | Chapter |
|---|-------|---------|
| 1 | Number Realm | Number Systems & Exponents |
| 2 | Linear Legion | Linear Equations (1 & 2 Variables) |
| 3 | Pattern Forge | Sequences & Progressions |
| 4 | Identity Forge | Algebraic Identities & Factorisation |
| 5 | Coordinate Islands | Coordinate Geometry |
| 6 | Geometry Forts | Perimeter & Area |
| 7 | Chance Citadel | Probability |
| 8 | The Proof Chambers | Proofs & Reasoning |

*(actual world names/themes come from the chapter registry — see `src/content/wars/`)*

## ✨ Features
- **7-stage lessons** per subtopic: Hook → Explore → Predict → Explain → Guided example → Common mistake → Check
- **Interactive 3D / 2D labs**: CoordLab, CircleLab, GeometryLab, NumberLineLab, AlgebraLab, ChanceLab, PatternLab (React Three Fiber + KaTeX)
- **Paper-first practice**: the app asks you to work on paper *before* checking — MCQ, numeric, fraction, expression, multi-select, true/false
- **Massive question bank**: 32+ parameterised generators per chapter set → **millions of unique, auto-validated questions** (every answer computed from parameters, never hand-typed)
- **Step-by-step Solution Deck**: reveal one step at a time, final answer pops, common mistakes called out
- **Boss battles**: slay the chapter boss (need 55% chapter mastery) — 6 rounds, 5 to win
- **Progress without pressure**: XP, levels, mastery %, weak-spot radar — no timers, no lives, no streaks
- **Everything saved locally** (localStorage) — no account needed

## 🚀 Run locally
```bash
bun install
bun run dev
# open http://localhost:3000 → ⚔️ Enter the Battlefield
```

## 📦 Deploy (GitHub Pages)
```bash
STATIC_EXPORT=1 bunx next build   # → out/
# push out/ to gh-pages branch with .nojekyll
```

## 🗂 Structure
- `src/app/wars/` — landing + game shell routes
- `src/components/wars/` — GameShell, LessonViewer, PracticeArena, BossView, ProgressView, SolutionDeck, viz labs
- `src/content/wars/` — 8 chapters × 4 subtopics × 7 slides + question generators (`chNN.gen.ts`)
- `src/lib/wars/` — types, engine, progress

Built with Next.js 16 · TypeScript · Tailwind 4 · React Three Fiber · KaTeX
