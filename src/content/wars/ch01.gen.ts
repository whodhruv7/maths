import type { GenFn, Question, RNG } from "@/lib/wars/types";

// ─── helpers ───────────────────────────────────────────────────────────────
const QUADS = ["Quadrant I", "Quadrant II", "Quadrant III", "Quadrant IV"];
const quadOf = (x: number, y: number): number => (x > 0 ? (y > 0 ? 0 : 3) : (y > 0 ? 1 : 2));
const signWord = (v: number): string => (v > 0 ? "positive" : v < 0 ? "negative" : "zero");
const fmtN = (v: number): string => String(Math.round(v * 100) / 100);
const pt = (x: number, y: number): string => `(${fmtN(x)}, ${fmtN(y)})`;
const fracHalf = (v: number): string => (Number.isInteger(v) ? fmtN(v) : `${Math.round(v * 2)}/2`);
const pairAccepts = (x: number, y: number): string[] => {
  const sx = fmtN(x), sy = fmtN(y);
  const list = [`(${sx},${sy})`, `${sx},${sy}`, `${sx}, ${sy}`];
  if (!Number.isInteger(x) || !Number.isInteger(y)) list.push(`(${fracHalf(x)},${fracHalf(y)})`, `${fracHalf(x)},${fracHalf(y)}`);
  return list;
};
const shuf = <T,>(r: RNG, arr: readonly T[]): T[] => [...arr].sort(() => r.next() - 0.5);

// Pythagorean-friendly triples [legA, legB, hyp] — answers stay clean integers
const T2: number[][] = [[3, 4, 5], [6, 8, 10], [9, 12, 15]];
const T3: number[][] = [[5, 12, 13], [8, 15, 17], [7, 24, 25], [10, 24, 26], [12, 16, 20], [9, 12, 15]];
const T4: number[][] = [[20, 21, 29], [12, 35, 37], [16, 30, 34], [18, 24, 30], [9, 40, 41], [28, 45, 53], [14, 48, 50], [24, 32, 40]];

function baseQ(p: Partial<Question> & Pick<Question, "text" | "answer" | "steps" | "concept" | "hint1" | "hint2">): Question {
  return { type: "numeric", diff: 1, ch: 1, sub: "s1", gen: "x", id: "x", ...p };
}

// ─── 1. quad-identify ──────────────────────────────────────────────────────
const quadIdentify: GenFn = (r, d) => {
  if (d <= 3) {
    const val = (): number => (d === 1 ? r.nz(-5, 5) : d === 2 ? r.nz(-12, 12) : r.nz(-20, 20) / 2);
    const x = val(), y = val();
    const q = quadOf(x, y);
    return baseQ({
      sub: "s1", diff: d, type: "mcq",
      text: `In which quadrant does the point $P${pt(x, y)}$ lie?`,
      choices: [...QUADS], answer: QUADS[q],
      steps: [
        `Read the signs: the x-coordinate ${fmtN(x)} is ${signWord(x)} and the y-coordinate ${fmtN(y)} is ${signWord(y)}.`,
        `Sign map: Quadrant I $(+, +)$ · Quadrant II $(-, +)$ · Quadrant III $(-, -)$ · Quadrant IV $(+, -)$.`,
        `A ${signWord(x)} x-coordinate with a ${signWord(y)} y-coordinate lands in ${QUADS[q]}.`,
      ],
      concept: "Signs of coordinates in the four quadrants",
      hint1: "Check the sign of the x-coordinate first, then the y-coordinate.",
      hint2: "Negative x sends you left of the y-axis; negative y sends you below the x-axis.",
      mistake: "Points with a zero coordinate sit on an axis, which belongs to no quadrant.",
      remember: "Q I $(+,+)$ · Q II $(-,+)$ · Q III $(-,-)$ · Q IV $(+,-)$ — anticlockwise from top-right.",
    });
  }
  const tq = r.int(0, 3);
  const sx = tq === 0 || tq === 3 ? 1 : -1;
  const sy = tq === 0 || tq === 1 ? 1 : -1;
  const correct = pt(sx * r.int(1, 9), sy * r.int(1, 9));
  const set = new Set<string>([correct]);
  const others: string[] = [];
  for (const q of [0, 1, 2, 3].filter((q) => q !== tq)) {
    for (;;) {
      const ox = q === 0 || q === 3 ? 1 : -1, oy = q === 0 || q === 1 ? 1 : -1;
      const s = pt(ox * r.int(1, 9), oy * r.int(1, 9));
      if (!set.has(s)) { set.add(s); others.push(s); break; }
    }
  }
  const choices = shuf(r, [`$${correct}$`, ...others.map((s) => `$${s}$`)]);
  return baseQ({
    sub: "s1", diff: 4, type: "mcq",
    text: `Which of these points lies in ${QUADS[tq]}?`,
    choices, answer: `$${correct}$`,
    steps: [
      `In ${QUADS[tq]} the x-coordinate must be ${sx > 0 ? "positive" : "negative"} and the y-coordinate must be ${sy > 0 ? "positive" : "negative"}.`,
      `Check each option's signs: three of them carry a sign pattern from a different quadrant.`,
      `Only $${correct}$ matches $(${sx > 0 ? "+" : "-"}, ${sy > 0 ? "+" : "-"})$, so it is the one in ${QUADS[tq]}.`,
    ],
    concept: "Signs of coordinates in the four quadrants",
    hint1: `Quadrant tells you the sign pair: ${QUADS[tq]} means $(${sx > 0 ? "+" : "-"}, ${sy > 0 ? "+" : "-"})$.`,
    hint2: "Test each option's two signs — one wrong sign means a different quadrant.",
    mistake: "Don't judge by size or distance from the origin — only signs decide the quadrant.",
    remember: "Signs of $(x, y)$ are the quadrant's fingerprint.",
  });
};

// ─── 2. mcq-signs ──────────────────────────────────────────────────────────
const mcqSigns: GenFn = (r, d) => {
  if (d <= 2) {
    const x = d === 1 ? r.nz(-9, 9) : r.int(-12, 12);
    const y = d === 1 ? r.nz(-9, 9) : r.int(-12, 12);
    const claim = r.int(0, 3);
    const truth = x !== 0 && y !== 0 && quadOf(x, y) === claim;
    const ans = truth ? "true" : "false";
    return baseQ({
      sub: "s1", diff: d, type: "tf",
      text: `True or False: the point $P${pt(x, y)}$ lies in ${QUADS[claim]}.`,
      answer: ans, accept: [truth ? "t" : "f"],
      steps: [
        `Read the coordinates: $x = ${fmtN(x)}$ and $y = ${fmtN(y)}$.`,
        x === 0 || y === 0
          ? `One coordinate is $0$, so $P$ sits exactly on an axis — the axes belong to no quadrant at all.`
          : `The sign pattern $(${x > 0 ? "+" : "-"}, ${y > 0 ? "+" : "-"})$ belongs to ${QUADS[quadOf(x, y)]}.`,
        `The claim says ${QUADS[claim]} — that statement is ${ans}.`,
      ],
      concept: "Quadrant membership from coordinate signs",
      hint1: "Look at the signs of both coordinates before judging.",
      hint2: "Zero coordinates mean the point is on an axis — never in a quadrant.",
      mistake: "$(-2, 0)$ is on the x-axis, not in a quadrant — zeros override everything.",
      remember: "Axes belong to no quadrant; signs decide everything else.",
    });
  }
  if (d === 3) {
    const inX = r.next() < 0.5; // reflect in the x-axis?
    const x = r.nz(-9, 9), y = r.nz(-9, 9);
    const correct = inX ? pt(x, -y) : pt(-x, y);
    const cands = [correct, pt(-x, y), pt(x, -y), pt(-x, -y), pt(y, x)];
    const set = new Set<string>();
    const uniq: string[] = [];
    for (const c of cands) if (!set.has(c)) { set.add(c); uniq.push(c); }
    let k = 1;
    while (uniq.length < 4) { const s = pt(x + k, y + k); if (!set.has(s)) { set.add(s); uniq.push(s); } k++; }
    const choices = shuf(r, uniq.slice(0, 4).map((s) => `$${s}$`));
    return baseQ({
      sub: "s1", diff: 3, type: "mcq",
      text: `The reflection of the point $P${pt(x, y)}$ in the ${inX ? "x-axis" : "y-axis"} is:`,
      choices, answer: `$${correct}$`,
      steps: [
        `A reflection in the ${inX ? "x-axis" : "y-axis"} mirrors the point straight across that axis.`,
        inX
          ? `Across the x-axis the x-coordinate stays, the y-coordinate flips sign: $(x, y) \\to (x, -y)$.`
          : `Across the y-axis the y-coordinate stays, the x-coordinate flips sign: $(x, y) \\to (-x, y)$.`,
        `So $${pt(x, y)}$ reflects to $${correct}$.`,
      ],
      concept: "Reflections of points in the coordinate axes",
      hint1: "Only ONE coordinate changes in an axis reflection.",
      hint2: inX ? "The distance above/below the x-axis stays the same — only the side changes." : "The distance left/right of the y-axis stays the same — only the side changes.",
      mistake: "Flipping both signs reflects through the origin, not through an axis.",
      remember: "x-axis: $(x, -y)$ · y-axis: $(-x, y)$ · origin: $(-x, -y)$.",
    });
  }
  const sa = r.sign(), sb = r.sign();
  const a = sa * r.int(1, 9), b = sb * r.int(1, 9);
  const v = r.pick([[0, 1], [1, 0], [1, 1]] as const);
  const nx = v[0] ? -a : a, ny = v[1] ? -b : b;
  const nq = quadOf(nx, ny);
  return baseQ({
    sub: "s1", diff: 4, type: "mcq",
    text: `The point $P${pt(a, b)}$ lies in ${QUADS[quadOf(a, b)]}. In which quadrant does the point $Q${pt(nx, ny)}$ lie?`,
    choices: [...QUADS], answer: QUADS[nq],
    steps: [
      `$P$ has sign pattern $(${sa > 0 ? "+" : "-"}, ${sb > 0 ? "+" : "-"})$, which is ${QUADS[quadOf(a, b)]}.`,
      v[0] && v[1]
        ? `$Q$ flips both signs — the rule $(x, y) \\to (-x, -y)$ sends a point to the diagonally opposite quadrant.`
        : v[0]
          ? `$Q$ flips only the x-sign — the rule $(-x, y)$ mirrors $P$ across the y-axis.`
          : `$Q$ flips only the y-sign — the rule $(x, -y)$ mirrors $P$ across the x-axis.`,
      `The new sign pattern is $(${nx > 0 ? "+" : "-"}, ${ny > 0 ? "+" : "-"})$, so $Q$ lies in ${QUADS[nq]}.`,
    ],
    concept: "Sign rules and reflections across axes / through the origin",
    hint1: "Work with signs only — the actual sizes don't matter for the quadrant.",
    hint2: "Flipping one sign = mirror in one axis; flipping both = diagonal jump.",
    mistake: "Flipping both signs is a reflection through the ORIGIN, not through either axis.",
    remember: "Both signs flipped → opposite quadrant, always.",
  });
};

// ─── 3. plot-read ──────────────────────────────────────────────────────────
const plotRead: GenFn = (r, d) => {
  const actor = r.pick(["A rover", "A ferry", "A hiker"]);
  if (d === 1) {
    const a = r.int(1, 9), b = r.int(1, 9);
    return baseQ({
      sub: "s2", diff: 1, type: "fill",
      text: `${actor} starts at the origin $O(0, 0)$, moves ${a} unit${a === 1 ? "" : "s"} east, then ${b} unit${b === 1 ? "" : "s"} north. What are its coordinates? (Answer like (4, 3).)`,
      answer: pt(a, b), accept: pairAccepts(a, b),
      steps: [
        `Start at $O(0, 0)$. East means the x-coordinate grows.`,
        `Moving ${a} east: $x = 0 + ${a} = ${a}$.`,
        `North means the y-coordinate grows: moving ${b} north gives $y = 0 + ${b} = ${b}$.`,
        `The coordinates are $${pt(a, b)}$.`,
      ],
      concept: "Plotting points from directions (east/west → x, north/south → y)",
      hint1: "East–west movement changes x; north–south movement changes y.",
      hint2: "Start from (0, 0) and add each move to the right slot.",
      mistake: "Don't swap the slots — east goes into x first, north into y second.",
      given: ["Start: O(0, 0)", `${a} units east`, `${b} units north`],
      find: "Final coordinates",
      remember: "Ordered pairs are read x-first, y-second, always.",
    });
  }
  if (d === 2) {
    const dx = r.nz(1, 9) * r.sign(), dy = r.nz(1, 9) * r.sign();
    const x = dx, y = dy;
    return baseQ({
      sub: "s2", diff: 2, type: "fill",
      text: `${actor} starts at the origin $O(0, 0)$, sails ${Math.abs(dx)} unit${Math.abs(dx) === 1 ? "" : "s"} ${dx > 0 ? "east" : "west"}, then ${Math.abs(dy)} unit${Math.abs(dy) === 1 ? "" : "s"} ${dy > 0 ? "north" : "south"}. What are its coordinates? (Answer like (4, -3).)`,
      answer: pt(x, y), accept: pairAccepts(x, y),
      steps: [
        `Start at $O(0, 0)$.`,
        `${Math.abs(dx)} units ${dx > 0 ? "east" : "west"}: $x = 0 ${dx > 0 ? "+" : "-"} ${Math.abs(dx)} = ${fmtN(x)}$.`,
        `${Math.abs(dy)} units ${dy > 0 ? "north" : "south"}: $y = 0 ${dy > 0 ? "+" : "-"} ${Math.abs(dy)} = ${fmtN(y)}$.`,
        `The coordinates are $${pt(x, y)}$ — ${x < 0 || y < 0 ? "negative directions (west/south) produce negative coordinates." : "both moves were in positive directions."}`,
      ],
      concept: "Plotting points from directions (west/south give negative coordinates)",
      hint1: "West and south are negative directions.",
      hint2: "Apply the moves in order: x-slot first, y-slot second.",
      mistake: "Going west does not make the point negative — only west/south moves do.",
      given: ["Start: O(0, 0)", `${Math.abs(dx)} units ${dx > 0 ? "east" : "west"}`, `${Math.abs(dy)} units ${dy > 0 ? "north" : "south"}`],
      find: "Final coordinates",
      verify: `Check: $x = ${fmtN(x)}$ is ${signWord(x)}, $y = ${fmtN(y)}$ is ${signWord(y)} — matches the directions taken.`,
      remember: "East/North add, West/South subtract.",
    });
  }
  if (d === 3) {
    const a = r.int(1, 12), b = r.int(1, 12);
    const sx = r.sign(), sy = r.sign();
    const x = sx * a, y = sy * b;
    return baseQ({
      sub: "s2", diff: 3, type: "fill",
      text: `A point $P$ lies exactly ${a} unit${a === 1 ? "" : "s"} to the ${sx > 0 ? "right" : "left"} of the y-axis and ${b} unit${b === 1 ? "" : "s"} ${sy > 0 ? "above" : "below"} the x-axis. What are the coordinates of $P$? (Answer like (4, -3).)`,
      answer: pt(x, y), accept: pairAccepts(x, y),
      steps: [
        `Distance from the y-axis fixes $|x| = ${a}$; ${sx > 0 ? "right" : "left"} of it means $x = ${fmtN(x)}$.`,
        `Distance from the x-axis fixes $|y| = ${b}$; ${sy > 0 ? "above" : "below"} it means $y = ${fmtN(y)}$.`,
        `So $P = ${pt(x, y)}$, which indeed sits in ${QUADS[quadOf(x, y)]}.`,
      ],
      concept: "Coordinates from perpendicular distances to the axes",
      hint1: "Distance from the y-axis is the size of x; the side (left/right) gives its sign.",
      hint2: "Do the same for y with the x-axis.",
      mistake: "Right/above are positive; left/below are negative — don't drop the signs.",
      given: [`|x| = ${a} (${sx > 0 ? "right" : "left"} of y-axis)`, `|y| = ${b} (${sy > 0 ? "above" : "below"} x-axis)`],
      find: "Coordinates of P",
      remember: "From the y-axis read x; from the x-axis read y.",
    });
  }
  const q = r.int(0, 3);
  const m = r.int(1, 15), n = r.int(1, 15);
  const qx = q === 0 || q === 3 ? 1 : -1, qy = q === 0 || q === 1 ? 1 : -1;
  const x = qx * m, y = qy * n;
  return baseQ({
    sub: "s2", diff: 4, type: "fill",
    text: `A point $P$ lies in ${QUADS[q]} at a distance of $${m}$ units from the y-axis and $${n}$ units from the x-axis. Find the coordinates of $P$. (Answer like (4, -3).)`,
    answer: pt(x, y), accept: pairAccepts(x, y),
    steps: [
      `Distance from the y-axis gives $|x| = ${m}$; distance from the x-axis gives $|y| = ${n}$.`,
      `In ${QUADS[q]} the x-coordinate is ${qx > 0 ? "positive" : "negative"} and the y-coordinate is ${qy > 0 ? "positive" : "negative"}.`,
      `So $x = ${fmtN(x)}$ and $y = ${fmtN(y)}$.`,
      `Therefore $P = ${pt(x, y)}$.`,
    ],
    concept: "Quadrant signs combined with distances from the axes",
    hint1: "Distances give the sizes |x| and |y|.",
    hint2: `The quadrant ${QUADS[q]} fixes the two signs.`,
    mistake: "Distances are never negative — the quadrant decides the signs, not the distances.",
    given: [`P in ${QUADS[q]}`, `|x| = ${m}`, `|y| = ${n}`],
    find: "Coordinates of P",
    verify: `Check: $P${pt(x, y)}$ has signs $(${x > 0 ? "+" : "-"}, ${y > 0 ? "+" : "-"})$ — that is ${QUADS[quadOf(x, y)]} ✓`,
    remember: "Quadrant gives signs; distances give magnitudes.",
  });
};

// ─── 4. collinear-check (points on the axes) ───────────────────────────────
const collinearCheck: GenFn = (r, d) => {
  if (d <= 3) {
    const axis = r.pick(["x", "y"] as const);
    const k = r.int(1, d <= 2 ? 6 : 12) * r.sign();
    const correct = axis === "x" ? pt(k, 0) : pt(0, k);
    const mirror = axis === "x" ? pt(0, k) : pt(k, 0);
    const R = d <= 1 ? 4 : d === 2 ? 5 : 5;
    const set = new Set<string>([correct, mirror]);
    const gens: string[] = [];
    while (gens.length < 2) {
      const s = pt(r.nz(-R, R), r.nz(-R, R));
      if (!set.has(s)) { set.add(s); gens.push(s); }
    }
    const choices = shuf(r, [`$${correct}$`, `$${mirror}$`, ...gens.map((s) => `$${s}$`)]);
    return baseQ({
      sub: "s2", diff: d, type: "mcq",
      text: `Which of the following points lies on the ${axis}-axis?`,
      choices, answer: `$${correct}$`,
      steps: [
        `A point lies on the ${axis}-axis exactly when ${axis === "x" ? "its y-coordinate is $0$" : "its x-coordinate is $0$"}.`,
        `Only $${correct}$ has ${axis === "x" ? "$y = 0$" : "$x = 0$"}; the others have two non-zero coordinates or sit on the other axis.`,
        `So $${correct}$ is on the ${axis}-axis.`,
      ],
      concept: "Recognising points on the x-axis and y-axis",
      hint1: axis === "x" ? "On the x-axis, every point looks like (a, 0)." : "On the y-axis, every point looks like (0, b).",
      hint2: "Scan the choices for the matching zero slot — beware of the swapped decoy.",
      mistake: `(0, ${Math.abs(k)}) and (${Math.abs(k)}, 0) are different points — one is on the y-axis, the other on the x-axis.`,
      remember: "x-axis ⇔ y = 0; y-axis ⇔ x = 0.",
    });
  }
  const axis = r.pick(["x", "y"] as const);
  const dist = r.int(2, 10);
  const positive = r.next() < 0.5;
  const s = positive ? 1 : -1;
  const correct = axis === "y" ? pt(0, s * dist) : pt(s * dist, 0);
  const opposite = axis === "y" ? pt(0, -s * dist) : pt(-s * dist, 0);
  const otherAxis = axis === "y" ? pt(s * dist, 0) : pt(0, s * dist);
  const set = new Set<string>([correct, opposite, otherAxis]);
  let generic = "";
  while (!generic || set.has(generic)) generic = pt(r.nz(-9, 9), r.nz(-9, 9));
  const choices = shuf(r, [`$${correct}$`, `$${opposite}$`, `$${otherAxis}$`, `$${generic}$`]);
  const dirWord = axis === "y" ? (positive ? "above" : "below") : positive ? "to the right of" : "to the left of";
  return baseQ({
    sub: "s2", diff: 4, type: "mcq",
    text: `Which point lies on the ${axis}-axis, exactly $${dist}$ units ${dirWord} the ${axis === "y" ? "x-axis" : "y-axis"}?`,
    choices, answer: `$${correct}$`,
    steps: [
      `On the ${axis}-axis, the non-axis coordinate is $0$: ${axis === "y" ? "$x = 0$" : "$y = 0$"}.`,
      `${positive ? "Positive" : "Negative"} direction: ${axis === "y" ? `$y = ${s * dist}$` : `$x = ${s * dist}$`} (the sign comes from ${dirWord.replace("to the ", "")} the other axis).`,
      `So the point is $${correct}$ — the decoy $${opposite}$ has the right distance but the wrong side.`,
    ],
    concept: "Locating points on the axes with distance and direction",
    hint1: `Zero goes in the ${axis === "y" ? "x" : "y"}-slot.`,
    hint2: `${dirWord} means the signed coordinate is ${s > 0 ? "positive" : "negative"}.`,
    mistake: `${positive ? "Below/left" : "Above/right"} means ${s > 0 ? "positive" : "negative"} — the mirror decoy flips the sign.`,
    verify: `Check: $${correct}$ is on the ${axis}-axis and $${dist}$ units from the other axis ✓`,
    remember: "Axis point = one zero + one signed distance.",
  });
};

// ─── 5. axis-dist ──────────────────────────────────────────────────────────
const axisDist: GenFn = (r, d) => {
  if (d <= 2) {
    const x = d === 1 ? r.int(1, 12) : r.nz(-12, 12);
    const y = d === 1 ? r.int(1, 12) : r.nz(-12, 12);
    const ax = r.pick(["x-axis", "y-axis"] as const);
    const ans = Math.abs(ax === "x-axis" ? y : x);
    return baseQ({
      sub: "s3", diff: d, type: "numeric",
      text: `Find the perpendicular distance of the point $P${pt(x, y)}$ from the ${ax}.`,
      answer: String(ans),
      steps: [
        ax === "x-axis"
          ? `Drop a perpendicular from $P$ to the x-axis: it is a vertical segment of length $|y|$.`
          : `Drop a perpendicular from $P$ to the y-axis: it is a horizontal segment of length $|x|$.`,
        ax === "x-axis" ? `$|y| = |${y}| = ${ans}$.` : `$|x| = |${x}| = ${ans}$.`,
        `So $P$ is $${ans}$ units from the ${ax} — the sign only records direction, distance drops it.`,
      ],
      concept: "Perpendicular distance of a point from the coordinate axes",
      hint1: ax === "x-axis" ? "Distance from the x-axis is |y|." : "Distance from the y-axis is |x|.",
      hint2: "Absolute value strips the sign — distances are never negative.",
      mistake: "From the x-axis read y, not x! Mixing them is the classic slip.",
      given: [`P${pt(x, y)}`, `target: the ${ax}`],
      find: "Perpendicular distance",
      remember: "From x-axis → |y| · from y-axis → |x|.",
    });
  }
  if (d === 3 && r.next() < 0.5) {
    const T = r.pick(T2);
    const x = T[0] * r.sign(), y = T[1] * r.sign();
    return baseQ({
      sub: "s3", diff: 3, type: "numeric",
      text: `Find the distance of the point $P${pt(x, y)}$ from the origin $O$.`,
      answer: String(T[2]),
      steps: [
        `Distance from the origin: $d = \\sqrt{x^2 + y^2}$.`,
        `$d = \\sqrt{(${x})^2 + (${y})^2} = \\sqrt{${T[0] * T[0]} + ${T[1] * T[1]}} = \\sqrt{${T[2] * T[2]}}$.`,
        `$d = ${T[2]}$ units — a hidden ${T[0]}-${T[1]}-${T[2]} right triangle.`,
      ],
      concept: "Distance of a point from the origin (Pythagoras)",
      hint1: "Origin distance = √(x² + y²).",
      hint2: `Square both coordinates, add, then take the root: $${T[0] * T[0]} + ${T[1] * T[1]}$ is a perfect square.`,
      mistake: "Don't add x + y — squares first, then one square root.",
      given: [`P${pt(x, y)}`, "origin O(0, 0)"],
      find: "Distance OP",
      verify: `Check: $${T[2]}^2 = ${T[2] * T[2]} = ${T[0] * T[0]} + ${T[1] * T[1]}$ ✓`,
      remember: "$OP = \\sqrt{x^2 + y^2}$ — the point's Pythagorean range.",
    });
  }
  if (d === 3) {
    const x = r.nz(-18, 18) / 2, y = r.nz(-18, 18) / 2;
    const ax = r.pick(["x-axis", "y-axis"] as const);
    const ans = Math.abs(ax === "x-axis" ? y : x);
    return baseQ({
      sub: "s3", diff: 3, type: "numeric",
      text: `Find the perpendicular distance of the point $P${pt(x, y)}$ from the ${ax}.`,
      answer: fmtN(ans), tol: 1e-9,
      steps: [
        ax === "x-axis" ? `From the x-axis the distance is $|y|$.` : `From the y-axis the distance is $|x|$.`,
        ax === "x-axis" ? `$|y| = |${fmtN(y)}| = ${fmtN(ans)}$.` : `$|x| = |${fmtN(x)}| = ${fmtN(ans)}$.`,
        `Half-unit coordinates work exactly like whole ones — distance still drops the sign.`,
      ],
      concept: "Perpendicular distance of a point from the coordinate axes",
      hint1: ax === "x-axis" ? "Distance from the x-axis is |y|." : "Distance from the y-axis is |x|.",
      hint2: "Decimal and half-unit coordinates obey the same rule.",
      mistake: "Between which grid lines the point sits does not matter — only the coordinate value does.",
      remember: "From x-axis → |y| · from y-axis → |x| — decimals included.",
    });
  }
  const T = r.pick(T4);
  const x = T[0] * r.sign(), y = T[1] * r.sign();
  return baseQ({
    sub: "s3", diff: 4, type: "numeric",
    text: `Find the distance of the point $P${pt(x, y)}$ from the origin $O$.`,
    answer: String(T[2]),
    steps: [
      `Distance from the origin: $d = \\sqrt{x^2 + y^2}$.`,
      `$d = \\sqrt{(${x})^2 + (${y})^2} = \\sqrt{${T[0] * T[0]} + ${T[1] * T[1]}} = \\sqrt{${T[2] * T[2]}}$.`,
      `$d = ${T[2]}$ units.`,
    ],
    concept: "Distance of a point from the origin (Pythagoras)",
    hint1: "Origin distance = √(x² + y²).",
    hint2: `Compute $${T[0] * T[0]} + ${T[1] * T[1]}$ — it is a perfect square.`,
    mistake: "Large coordinates tempt calculators — spot the Pythagorean triple instead.",
    given: [`P${pt(x, y)}`, "origin O(0, 0)"],
    find: "Distance OP",
    verify: `Check: $${T[2]}^2 = ${T[2] * T[2]}$ ✓`,
    remember: "Know your triples: 3-4-5, 5-12-13, 8-15-17, 7-24-25, 20-21-29…",
  });
};

// ─── 6. dist-formula ───────────────────────────────────────────────────────
const distFormula: GenFn = (r, d) => {
  if (d === 1) {
    const horiz = r.next() < 0.5;
    const x1 = r.int(-6, 6), y1 = r.int(-6, 6);
    const delta = r.nz(1, 9) * r.sign();
    const x2 = horiz ? x1 + delta : x1, y2 = horiz ? y1 : y1 + delta;
    const ans = Math.abs(delta);
    return baseQ({
      sub: "s3", diff: 1, type: "numeric",
      text: `Find the distance between the points $A${pt(x1, y1)}$ and $B${pt(x2, y2)}$.`,
      answer: String(ans),
      steps: [
        `${horiz ? `The y-coordinates match ($y = ${y1}$), so $AB$ is a horizontal segment.` : `The x-coordinates match ($x = ${x1}$), so $AB$ is a vertical segment.`}`,
        horiz ? `$d = |x_2 - x_1| = |${x2} - (${x1})| = |${delta}| = ${ans}$.` : `$d = |y_2 - y_1| = |${y2} - (${y1})| = |${delta}| = ${ans}$.`,
        `The distance is $${ans}$ units.`,
      ],
      concept: "Horizontal and vertical distances between points",
      hint1: horiz ? "Same y → count grid squares horizontally." : "Same x → count grid squares vertically.",
      hint2: "Distance = |difference of the changing coordinate|.",
      mistake: "Subtract in the wrong order and panic at the minus sign — absolute value fixes any order.",
      given: [`A${pt(x1, y1)}`, `B${pt(x2, y2)}`],
      find: "Length AB",
      remember: "Same y → horizontal · same x → vertical · distance = |difference|.",
    });
  }
  const T = r.pick(d === 2 ? T2 : d === 3 ? T3 : T4);
  const swapped = r.next() < 0.5;
  const a = swapped ? T[1] : T[0], b = swapped ? T[0] : T[1];
  const lim = d === 2 ? 6 : d === 3 ? 8 : 10;
  const x1 = r.int(-lim, lim), y1 = r.int(-lim, lim);
  const sx = r.sign(), sy = r.sign();
  const x2 = x1 + sx * a, y2 = y1 + sy * b;
  const dx = x2 - x1, dy = y2 - y1;
  return baseQ({
    sub: "s3", diff: d, type: "numeric",
    text: `Find the straight-line distance between $A${pt(x1, y1)}$ and $B${pt(x2, y2)}$.`,
    answer: String(T[2]),
    steps: [
      `$\\Delta x = ${x2} - (${x1}) = ${dx}$ and $\\Delta y = ${y2} - (${y1}) = ${dy}$.`,
      `Distance formula: $d = \\sqrt{(\\Delta x)^2 + (\\Delta y)^2}$.`,
      `$d = \\sqrt{(${dx})^2 + (${dy})^2} = \\sqrt{${dx * dx} + ${dy * dy}} = \\sqrt{${T[2] * T[2]}}$.`,
      `$d = ${T[2]}$ units — the legs $${Math.abs(dx)}$ and $${Math.abs(dy)}$ form a Pythagorean triple with hypotenuse $${T[2]}$.`,
    ],
    concept: "Distance formula $d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$",
    hint1: "Compute the run (Δx) and rise (Δy) separately first.",
    hint2: `Squaring kills the signs: $(${dx})^2 = ${dx * dx}$ — then look for a perfect square total.`,
    mistake: "$\\sqrt{a^2 + b^2} \\ne a + b$ — sum the squares before taking the single root.",
    given: [`A${pt(x1, y1)}`, `B${pt(x2, y2)}`],
    find: "Distance AB",
    verify: `Check: $${T[2]}^2 = ${T[2] * T[2]} = ${dx * dx} + ${dy * dy}$ ✓`,
    remember: "d = √((x₂−x₁)² + (y₂−y₁)²) — Pythagoras wearing coordinates.",
  });
};

// ─── 7. midpoint ───────────────────────────────────────────────────────────
const midpoint: GenFn = (r, d) => {
  if (d <= 2) {
    const mx = d === 1 ? r.int(2, 8) : r.int(-6, 6);
    const my = d === 1 ? r.int(2, 8) : r.int(-6, 6);
    const p = r.int(1, 5), q = r.int(1, 5);
    const x1 = mx - p, y1 = my - q, x2 = mx + p, y2 = my + q;
    return baseQ({
      sub: "s3", diff: d, type: "fill",
      text: `Find the midpoint of the segment joining $A${pt(x1, y1)}$ and $B${pt(x2, y2)}$. (Answer like (4, 3).)`,
      answer: pt(mx, my), accept: pairAccepts(mx, my),
      steps: [
        `Midpoint formula: $M = \\left(\\frac{x_1 + x_2}{2}, \\frac{y_1 + y_2}{2}\\right)$.`,
        `$x$-coordinate: $\\frac{${x1} + (${x2})}{2} = \\frac{${x1 + x2}}{2} = ${mx}$.`,
        `$y$-coordinate: $\\frac{${y1} + (${y2})}{2} = \\frac{${y1 + y2}}{2} = ${my}$.`,
        `So $M = ${pt(mx, my)}$ — check it sits visually halfway between $A$ and $B$.`,
      ],
      concept: "Midpoint formula (average of the endpoints)",
      hint1: "Average the x-coordinates; average the y-coordinates.",
      hint2: "Add first, then halve — the midpoint is the mean of the two ends.",
      mistake: "Don't halve each coordinate separately and then add — add, then halve.",
      given: [`A${pt(x1, y1)}`, `B${pt(x2, y2)}`],
      find: "Midpoint M",
      verify: `Check: from $A$ to $M$ is $${p}$ right and $${q}$ up; from $M$ to $B$ is also $${p}$ right and $${q}$ up ✓`,
      remember: "Midpoint = ((x₁+x₂)/2, (y₁+y₂)/2).",
    });
  }
  if (d === 3) {
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    do {
      x1 = r.int(-6, 6); x2 = r.int(-6, 6);
      y1 = r.int(-6, 6); y2 = r.int(-6, 6);
    } while ((x1 + x2) % 2 === 0 && (y1 + y2) % 2 === 0);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    return baseQ({
      sub: "s3", diff: 3, type: "fill",
      text: `Find the midpoint of the segment joining $A${pt(x1, y1)}$ and $B${pt(x2, y2)}$. (Answer like (2.5, -3).)`,
      answer: pt(mx, my), accept: pairAccepts(mx, my),
      steps: [
        `Midpoint formula: average each coordinate.`,
        `$x$: $\\frac{${x1} + (${x2})}{2} = \\frac{${x1 + x2}}{2} = ${fmtN(mx)}$.`,
        `$y$: $\\frac{${y1} + (${y2})}{2} = \\frac{${y1 + y2}}{2} = ${fmtN(my)}$.`,
        `Odd sums give half-unit midpoints — perfectly legal coordinates: $M = ${pt(mx, my)}$.`,
      ],
      concept: "Midpoint formula with fractional results",
      hint1: "Add the coordinates first — don't worry if the sum is odd.",
      hint2: "An odd sum halves to something like 2.5 — that's the answer, not a mistake.",
      mistake: "Rounding 2.5 to 2 or 3 destroys the midpoint — keep the exact half.",
      given: [`A${pt(x1, y1)}`, `B${pt(x2, y2)}`],
      find: "Midpoint M",
      remember: "Midpoints can land on half-units — averages don't have to be integers.",
    });
  }
  const mx = r.int(-6, 6), my = r.int(-6, 6);
  const p = r.nz(-6, 6), q = r.nz(-6, 6);
  const ax = mx - p, ay = my - q, bx = mx + p, by = my + q;
  return baseQ({
    sub: "s3", diff: 4, type: "fill",
    text: `$M${pt(mx, my)}$ is the midpoint of segment $AB$, and $A${pt(ax, ay)}$. Find the coordinates of $B$. (Answer like (4, 3).)`,
    answer: pt(bx, by), accept: pairAccepts(bx, by),
    steps: [
      `Reverse the midpoint formula: $M$ is the average of $A$ and $B$, so $x_A + x_B = 2x_M$.`,
      `$x_B = 2(${mx}) - (${ax}) = ${2 * mx - ax} = ${bx}$.`,
      `$y_B = 2(${my}) - (${ay}) = ${2 * my - ay} = ${by}$.`,
      `So $B = ${pt(bx, by)}$ — $A$ and $B$ are symmetric about $M$.`,
    ],
    concept: "Reverse midpoint (finding an endpoint)",
    hint1: "Rewrite the midpoint equation with B as the unknown.",
    hint2: "Endpoint = 2 × midpoint − other endpoint.",
    mistake: "Don't just add M to A — the midpoint is the average, so undo it by doubling M first.",
    given: [`Midpoint M${pt(mx, my)}`, `A${pt(ax, ay)}`],
    find: "Endpoint B",
    verify: `Check: midpoint of $A${pt(ax, ay)}$ and $B${pt(bx, by)}$ is $\\left(\\frac{${ax + bx}}{2}, \\frac{${ay + by}}{2}\\right) = ${pt(mx, my)}$ ✓`,
    remember: "B = 2M − A — reflect A through the midpoint.",
  });
};

// ─── 8. shape-shape ────────────────────────────────────────────────────────
const shapeShape: GenFn = (r, d) => {
  const kind = r.pick(["square", "rect", "tri"] as const);
  const lo = d <= 2 ? 0 : d === 3 ? -5 : -6;
  const hi = d <= 2 ? 4 : d === 3 ? 5 : 6;
  const smin = d <= 2 ? 2 : d === 3 ? 2 : 2;
  const smax = d <= 2 ? 5 : d === 3 ? 7 : 9;
  const x = r.int(lo, hi), y = r.int(lo, hi);
  const sx = r.sign(), sy = r.sign();
  let verts: { x: number; y: number }[] = [];
  let answer = "", steps: string[] = [], sides = "";
  if (kind === "square") {
    const s = r.int(smin, smax);
    verts = [{ x, y }, { x: x + sx * s, y }, { x: x + sx * s, y: y + sy * s }, { x, y: y + sy * s }];
    answer = "A square";
    sides = `All four sides measure $${s}$`;
    steps = [
      `Compute the sides with the distance formula: $AB = |${verts[1].x} - (${x})| = ${s}$ and $BC = |${verts[2].y} - (${y})| = ${s}$.`,
      `By the same count $CD = ${s}$ and $DA = ${s}$ — four equal sides.`,
      `Successive sides run horizontally then vertically, so every angle is $90°$.`,
      `Four equal sides + four right angles → the figure is a square.`,
    ];
  } else if (kind === "rect") {
    let w = r.int(smin, smax), h = r.int(smin, smax);
    while (w === h) h = r.int(smin, smax);
    verts = [{ x, y }, { x: x + sx * w, y }, { x: x + sx * w, y: y + sy * h }, { x, y: y + sy * h }];
    answer = "A rectangle but not a square";
    sides = `Sides $${w}$ and $${h}$, unequal`;
    steps = [
      `Compute the sides: $AB = ${w}$ (horizontal) and $BC = ${h}$ (vertical); opposite sides repeat these lengths.`,
      `Horizontal-then-vertical turns mean all four angles are $90°$.`,
      `But $${w} \\ne ${h}$ — adjacent sides are unequal.`,
      `Right angles with unequal adjacent sides → a rectangle that is not a square.`,
    ];
  } else {
    const a = r.int(smin, smax), b = r.int(smin, smax);
    verts = [{ x, y }, { x: x + sx * a, y }, { x, y: y + sy * b }];
    answer = "A right triangle";
    sides = `Legs $${a}$ and $${b}$`;
    steps = [
      `$AB$ is horizontal with length $${a}$; $AC$ is vertical with length $${b}$.`,
      `A horizontal segment and a vertical segment meet at $90°$, so the angle at $A$ is a right angle.`,
      `The third side is the hypotenuse: $BC = \\sqrt{${a}^2 + ${b}^2} = \\sqrt{${a * a + b * b}}$.`,
      `One right angle + three sides → a right triangle.`,
    ];
  }
  const L = ["A", "B", "C", "D"];
  const vertStr = verts.map((v, i) => `$${L[i]}${pt(v.x, v.y)}$`).join(", ");
  const choices = kind === "tri"
    ? ["A right triangle", "An equilateral triangle", "A rectangle", "A square"]
    : ["A square", "A rectangle but not a square", "A right triangle", "A trapezium"];
  return baseQ({
    sub: "s3", diff: d, type: "mcq",
    text: `A figure has vertices ${vertStr}. What kind of figure is it?`,
    choices, answer,
    steps,
    concept: "Identifying shapes on the grid from vertex coordinates",
    hint1: "Find the length of each side with the distance formula (count grid units).",
    hint2: `${sides} — match that against the definitions.`,
    mistake: "Right angles alone mean rectangle, not square — compare adjacent side lengths too.",
    given: verts.map((v, i) => `${L[i]}${pt(v.x, v.y)}`),
    find: "The type of figure",
    remember: "Equal sides + right angles = square · right angles alone = rectangle.",
  });
};

// ─── 9. apply-dist ─────────────────────────────────────────────────────────
const applyDist: GenFn = (r, d) => {
  const FR = [
    { who: "A swimmer", a: "buoy $A$", b: "buoy $B$", verb: "swims" },
    { who: "A courier robot", a: "the dock", b: "the beacon", verb: "rolls" },
    { who: "A delivery drone", a: "the warehouse", b: "the drop zone", verb: "flies" },
    { who: "A treasure hunter", a: "the old palm", b: "the buried chest", verb: "walks" },
  ];
  const f = r.pick(FR);
  const mk = (T: number[], lim: number): { A: number[]; B: number[] } => {
    const x1 = r.int(-lim, lim), y1 = r.int(-lim, lim);
    const sx = r.sign(), sy = r.sign();
    return { A: [x1, y1], B: [x1 + sx * T[0], y1 + sy * T[1]] };
  };
  if (d === 1) {
    const horiz = r.next() < 0.5;
    const x1 = r.int(-5, 5), y1 = r.int(-5, 5);
    const dist = r.int(2, 12);
    const B = horiz ? [x1 + dist * r.sign(), y1] : [x1, y1 + dist * r.sign()];
    return baseQ({
      sub: "s4", diff: 1, type: "numeric",
      text: `${f.who} ${f.verb} in a perfectly straight line from ${f.a} at $${pt(x1, y1)}$ to ${f.b} at $${pt(B[0], B[1])}$. How far does ${f.who.toLowerCase().startsWith("a ") ? f.who.replace(/^A /, "the ") : f.who} travel?`,
      answer: String(dist),
      steps: [
        `The two points share the same ${horiz ? "y-coordinate ($y = " + y1 + "$), so the trip is horizontal" : "x-coordinate ($x = " + x1 + "$), so the trip is vertical"}.`,
        `${horiz ? `$d = |x_B - x_A| = |${B[0]} - (${x1})| = ${dist}$` : `$d = |y_B - y_A| = |${B[1]} - (${y1})| = ${dist}$`}.`,
        `The straight trip covers $${dist}$ units.`,
      ],
      concept: "Real-world horizontal/vertical distances on a coordinate map",
      hint1: "Compare the coordinates: which one changed?",
      hint2: "Distance = |difference of the coordinate that changed|.",
      mistake: "When one coordinate never changes, no Pythagoras is needed — just |difference|.",
      given: [`${f.a}: ${pt(x1, y1)}`, `${f.b}: ${pt(B[0], B[1])}`],
      find: "Distance travelled (units)",
      remember: "Straight trips along a grid line are one-coordinate differences.",
    });
  }
  const T = r.pick(d === 2 ? T2 : d === 3 ? T3 : T4);
  const lim = d === 2 ? 5 : d === 3 ? 7 : 10;
  const { A, B } = mk(T, lim);
  const dx = B[0] - A[0], dy = B[1] - A[1];
  if (d <= 3) {
    return baseQ({
      sub: "s4", diff: d, type: "numeric",
      text: `${f.who} ${f.verb} in a perfectly straight line from ${f.a} at $${pt(A[0], A[1])}$ to ${f.b} at $${pt(B[0], B[1])}$. How far apart are ${f.a} and ${f.b}?`,
      answer: String(T[2]),
      steps: [
        `Run: $\\Delta x = ${B[0]} - (${A[0]}) = ${dx}$; rise: $\\Delta y = ${B[1]} - (${A[1]}) = ${dy}$.`,
        `Straight-line distance: $d = \\sqrt{(\\Delta x)^2 + (\\Delta y)^2}$.`,
        `$d = \\sqrt{${dx * dx} + ${dy * dy}} = \\sqrt{${T[2] * T[2]}} = ${T[2]}$ units.`,
      ],
      concept: "Distance formula in map/word-problem settings",
      hint1: "Strip the story: this is just the distance formula on two points.",
      hint2: `The legs are $${Math.abs(dx)}$ and $${Math.abs(dy)}$ — spot the triple.`,
      mistake: "Keep the units 'grid units' until a scale is mentioned — d4 questions add scale.",
      given: [`${f.a}: ${pt(A[0], A[1])}`, `${f.b}: ${pt(B[0], B[1])}`],
      find: "Straight-line distance (units)",
      verify: `Check: $${T[2]}^2 = ${T[2] * T[2]} = ${dx * dx} + ${dy * dy}$ ✓`,
      remember: "Word problems are distance formula questions in costume.",
    });
  }
  const mode = r.next() < 0.5 ? "scale" : "round";
  if (mode === "scale") {
    const scale = r.pick([10, 100]);
    return baseQ({
      sub: "s4", diff: 4, type: "numeric",
      text: `On a treasure map where 1 grid unit represents $${scale}$ m, ${f.a} sits at $${pt(A[0], A[1])}$ and ${f.b} at $${pt(B[0], B[1])}$. Find the straight-line distance between them in metres.`,
      answer: String(T[2] * scale),
      steps: [
        `Grid distance first: $\\Delta x = ${dx}$, $\\Delta y = ${dy}$.`,
        `$d = \\sqrt{${dx * dx} + ${dy * dy}} = \\sqrt{${T[2] * T[2]}} = ${T[2]}$ grid units.`,
        `Apply the scale: $${T[2]} \\times ${scale} = ${T[2] * scale}$ m.`,
      ],
      concept: "Distance formula with a map scale",
      hint1: "Find the distance in grid units first — scale comes last.",
      hint2: `Legs $${Math.abs(dx)}$ and $${Math.abs(dy)}$ give hypotenuse $${T[2]}$; multiply by the scale.`,
      mistake: "Don't scale the coordinates before squaring — convert units after the distance, not during.",
      given: [`${f.a}: ${pt(A[0], A[1])}`, `${f.b}: ${pt(B[0], B[1])}`, `1 unit = ${scale} m`],
      find: "Distance in metres",
      verify: `Check: $${T[2] * scale} \\div ${scale} = ${T[2]}$ grid units ✓`,
      remember: "Grid distance first, scale multiplication last.",
    });
  }
  return baseQ({
    sub: "s4", diff: 4, type: "numeric",
    text: `${f.who} ${f.verb} in a straight line from ${f.a} at $${pt(A[0], A[1])}$ to ${f.b} at $${pt(B[0], B[1])}$, then returns by the same straight route. What is the total distance travelled?`,
    answer: String(2 * T[2]),
    steps: [
      `One-way distance: $\\Delta x = ${dx}$, $\\Delta y = ${dy}$.`,
      `$d = \\sqrt{${dx * dx} + ${dy * dy}} = \\sqrt{${T[2] * T[2]}} = ${T[2]}$ units.`,
      `The return leg doubles it: $2 \\times ${T[2]} = ${2 * T[2]}$ units.`,
    ],
    concept: "Distance formula plus round-trip reasoning",
    hint1: "Compute the one-way distance first.",
    hint2: "Out and back along the same line: multiply by 2.",
    mistake: "The return trip is the SAME length — don't recompute with swapped signs and double-count differently.",
    given: [`${f.a}: ${pt(A[0], A[1])}`, `${f.b}: ${pt(B[0], B[1])}`, "out and back"],
    find: "Total distance (units)",
    verify: `Check: $${2 * T[2]} \\div 2 = ${T[2]}$ per leg ✓`,
    remember: "Round trip = 2 × one-way distance.",
  });
};

// ─── 10. path-len ──────────────────────────────────────────────────────────
const pathLen: GenFn = (r, d) => {
  const TR = [
    { who: "A taxi", road: "the grid roads of Coordinate City", verb: "drives" },
    { who: "A rook", road: "the rows and columns of the board", verb: "slides" },
    { who: "A floor-cleaning robot", road: "the tiled corridors", verb: "moves" },
  ];
  const f = r.pick(TR);
  if (d <= 3) {
    const lim = d === 1 ? 6 : d === 2 ? 6 : 8;
    const lo = d === 1 ? 0 : -lim;
    const x1 = r.int(lo, lim), y1 = r.int(lo, lim);
    const dx = r.int(1, d === 1 ? 7 : d === 2 ? 8 : 9) * r.sign();
    const dy = r.int(1, d === 1 ? 7 : d === 2 ? 8 : 9) * r.sign();
    const x2 = x1 + dx, y2 = y1 + dy;
    const ans = Math.abs(dx) + Math.abs(dy);
    return baseQ({
      sub: "s4", diff: d, type: "numeric",
      text: `${f.who} ${f.verb} from $A${pt(x1, y1)}$ to $B${pt(x2, y2)}$ only along ${f.road} (horizontal and vertical segments). What is the length of the shortest such path?`,
      answer: String(ans),
      steps: [
        `Along grid lines the route is horizontal and vertical pieces: no diagonals allowed.`,
        `Horizontal part: $|x_2 - x_1| = |${x2} - (${x1})| = ${Math.abs(dx)}$.`,
        `Vertical part: $|y_2 - y_1| = |${y2} - (${y1})| = ${Math.abs(dy)}$.`,
        `Shortest path $= ${Math.abs(dx)} + ${Math.abs(dy)} = ${ans}$ units.`,
      ],
      concept: "Grid-path (taxicab) length: |Δx| + |Δy|",
      hint1: "No diagonals: the journey is a horizontal chunk plus a vertical chunk.",
      hint2: "Add the absolute coordinate differences — order of turning doesn't matter.",
      mistake: "The straight-line distance √(Δx² + Δy²) is shorter but not allowed on grid roads.",
      given: [`A${pt(x1, y1)}`, `B${pt(x2, y2)}`, "grid lines only"],
      find: "Shortest grid-path length",
      remember: "Taxicab distance = go across + go up: |Δx| + |Δy|.",
    });
  }
  const x1 = r.int(-6, 6), y1 = r.int(-6, 6);
  const p = r.int(1, 4) * r.sign(), q = r.int(1, 4) * r.sign();
  const C = [x1 + p, y1 + q];
  const u = r.int(1, 2) * r.sign(), v = r.int(1, 2) * r.sign();
  const B = [C[0] + u, C[1] + v];
  const l1 = Math.abs(p) + Math.abs(q), l2 = Math.abs(u) + Math.abs(v);
  return baseQ({
    sub: "s4", diff: 4, type: "numeric",
    text: `${f.who} must travel from $A${pt(x1, y1)}$ via $C${pt(C[0], C[1])}$ to $B${pt(B[0], B[1])}$, moving only along grid lines. Find the length of the shortest possible journey.`,
    answer: String(l1 + l2),
    steps: [
      `Split the journey at the compulsory stop $C$.`,
      `Leg 1 $A \\to C$: $|${C[0]} - (${x1})| + |${C[1]} - (${y1})| = ${Math.abs(p)} + ${Math.abs(q)} = ${l1}$.`,
      `Leg 2 $C \\to B$: $|${B[0]} - (${C[0]})| + |${B[1]} - (${C[1]})| = ${Math.abs(u)} + ${Math.abs(v)} = ${l2}$.`,
      `Total: $${l1} + ${l2} = ${l1 + l2}$ units.`,
    ],
    concept: "Grid-path length through a compulsory via-point",
    hint1: "A compulsory stop splits one journey into two independent grid paths.",
    hint2: "Compute |Δx| + |Δy| for each leg, then add.",
    mistake: "Never shortcut A to B directly — the via-point C is compulsory, so the direct path is not an option.",
    given: [`A${pt(x1, y1)}`, `via C${pt(C[0], C[1])}`, `B${pt(B[0], B[1])}`],
    find: "Total journey length",
    verify: `Check: legs $${l1}$ and $${l2}$ are each minimal for their endpoints ✓`,
    remember: "Via-point journeys: two taxicab distances added.",
  });
};

// ─── 11. missing-vertex ────────────────────────────────────────────────────
const missingVertex: GenFn = (r, d) => {
  const lo = d <= 2 ? 0 : -7, hi = d <= 2 ? 5 : 7;
  const whMax = d <= 2 ? 6 : d === 3 ? 6 : 8;
  const x = r.int(lo, hi), y = r.int(lo, hi);
  const w = r.int(1, whMax), h = r.int(1, whMax);
  const xs = [x, x + w, x + w, x], ys = [y, y, y + h, y + h];
  const corners = [0, 1, 2, 3].map((i) => ({ x: xs[i], y: ys[i] }));
  const hide = r.int(0, 3);
  const D = corners[hide];
  const given = corners.filter((_, i) => i !== hide).map((c, i) => ({ ...c, L: "ABC"[i] }));
  const V = given.find((g) => g.x === D.x && g.y !== D.y)!;
  const H = given.find((g) => g.y === D.y && g.x !== D.x)!;
  const givenStr = given.map((g) => `$${g.L}${pt(g.x, g.y)}$`).join(", ");
  return baseQ({
    sub: "s4", diff: d, type: "fill",
    text: `Three vertices of a rectangle are ${givenStr}. Find the coordinates of the fourth vertex $D$. (Answer like (4, 7).)`,
    answer: pt(D.x, D.y), accept: pairAccepts(D.x, D.y),
    steps: [
      `This rectangle is axis-aligned: its sides are horizontal and vertical segments.`,
      `$D$ completes two sides, so it shares its x-coordinate with $${V.L}${pt(V.x, V.y)}$ → $x = ${fmtN(D.x)}$.`,
      `And it shares its y-coordinate with $${H.L}${pt(H.x, H.y)}$ → $y = ${fmtN(D.y)}$.`,
      `So the fourth vertex is $D = ${pt(D.x, D.y)}$.`,
    ],
    concept: "Completing an axis-aligned rectangle from three vertices",
    hint1: "In a rectangle every side is horizontal or vertical — match coordinates.",
    hint2: "D takes x from the given corner on the same vertical side, y from the same horizontal side.",
    mistake: "The diagonal corner shares NEITHER coordinate with D — don't copy from it.",
    given: given.map((g) => `${g.L}${pt(g.x, g.y)}`),
    find: "Coordinates of D",
    verify: `Check: opposite sides equal — width $${w}$ twice, height $${h}$ twice ✓`,
    remember: "Fourth corner = (x of vertical neighbour, y of horizontal neighbour).",
  });
};

export const bank: Record<string, GenFn> = {
  "quad-identify": quadIdentify,
  "mcq-signs": mcqSigns,
  "plot-read": plotRead,
  "collinear-check": collinearCheck,
  "axis-dist": axisDist,
  "dist-formula": distFormula,
  "midpoint": midpoint,
  "shape-shape": shapeShape,
  "apply-dist": applyDist,
  "path-len": pathLen,
  "missing-vertex": missingVertex,
};

export const bankSize: Record<string, number> = {
  "quad-identify": 100 + 24 * 24 + 20 * 20 + 24 * 24,                 // sign patterns × ranges per branch
  "mcq-signs": 18 * 18 * 4 + 25 * 25 * 4 + 2 * 18 * 18 * 2 + 4 * 3 * 4, // point × claim / point × axis / sign combos × variant
  "plot-read": 9 * 9 + 2 * 9 * 2 * 9 + 4 * 12 * 12 + 4 * 15 * 15,       // moves / directions / sides / quadrant
  "collinear-check": 2 * 6 * (64 * 63 / 2) + 2 * 6 * (100 * 99 / 2) + 2 * 12 * (100 * 99 / 2) + 2 * 9 * 2, // axis × k × distractor pairs + d4
  "axis-dist": 2 * 12 * 12 + 2 * 24 * 24 + (3 * 4 + 2 * 36 * 36) + 8 * 4, // point × axis (+ triples × signs)
  "dist-formula": 2 * 13 * 13 * 9 * 2 + 3 * 17 * 17 * 4 * 2 + 6 * 17 * 17 * 4 * 2 + 8 * 21 * 21 * 4 * 2, // anchor × triple × orient × swap
  "midpoint": 7 * 7 * 5 * 5 + 13 * 13 * 5 * 5 + 13 * 13 * 13 * 13 + 13 * 13 * 12 * 12, // centre × offset (+ free endpoints / reverse)
  "shape-shape": (2 * 25 * (4 + 12 + 16) + 121 * (6 + 30 + 36) + 169 * (8 + 56 + 64)) * 4, // anchor × size × 4 orientations
  "apply-dist": 4 * 11 * 11 * 11 * 4 + 4 * 3 * 11 * 11 * 4 + 4 * 6 * 15 * 15 * 4 + 4 * 6 * 21 * 21 * 4 * 3, // frame × start × (dist/triple × orient × mode)
  "path-len": 7 * 7 * 7 * 7 * 4 + 13 * 13 * 8 * 8 * 4 + 17 * 17 * 9 * 9 * 4 + 13 * 13 * 8 * 8 * 4 * 4, // anchor × offsets (+ via point)
  "missing-vertex": 2 * 6 * 6 * 6 * 6 * 4 + 15 * 15 * 6 * 6 * 4 + 15 * 15 * 8 * 8 * 4, // anchor × w × h × hidden corner
};
