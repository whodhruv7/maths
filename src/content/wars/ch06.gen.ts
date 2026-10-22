import type { Diff, GenFn, Question, RNG } from "@/lib/wars/types";

// ─── ch06 · Measuring Space: Perimeter and Area ───────────────────────────
// π rule (book 6.2/6.4): use π = 22/7 when the radius/diameter is a multiple
// of 7 (tol 0.01), else π = 3.14 (tol 0.05). The question text always states
// which approximation to use.

// ─── helpers ───────────────────────────────────────────────────────────────
const PI22 = 22 / 7;
const P314 = 3.14;
const TAKE22 = "Take $\\pi = \\tfrac{22}{7}$.";
const TAKE314 = "Take $\\pi = 3.14$.";

const dec = (x: number, k = 2): string => {
  const v = Math.round(x * 10 ** k) / 10 ** k;
  return Number.isInteger(v) ? String(v) : String(parseFloat(v.toFixed(k)));
};

const shuffle = <T,>(arr: readonly T[], r: RNG): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r.next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function baseQ(p: Partial<Question> & Pick<Question, "text" | "answer" | "steps" | "concept" | "hint1" | "hint2">): Question {
  return { type: "numeric", diff: 1, ch: 6, sub: "s1", gen: "x", id: "x", ...p };
}

const mkQ = (sub: string) => (
  p: Partial<Question> & Pick<Question, "text" | "answer" | "steps" | "concept" | "hint1" | "hint2">
): Question => baseQ({ sub, ...p });

const qS1 = mkQ("s1");
const qS2 = mkQ("s2");
const qS3 = mkQ("s3");
const qS4 = mkQ("s4");

// ─── 1. peri-poly (s1) ─────────────────────────────────────────────────────
const periPoly: GenFn = (r, d) => {
  if (d === 1) {
    const l = r.int(4, 60), b = r.int(3, 59);
    const P = 2 * (l + b);
    return qS1({
      text: `A rectangular park is $${l}$ m long and $${b}$ m wide. Find its perimeter (in m).`,
      answer: String(P),
      steps: [
        `Perimeter is the total walk around the border: two lengths and two widths.`,
        `$P = 2(l + w) = 2($${l} + ${b})$.`,
        `$P = 2 \\times ${l + b} = ${P}$ m.`,
      ],
      concept: "Perimeter of a rectangle: $P = 2(l + w)$",
      hint1: "Perimeter is the distance around, not the covering inside.",
      hint2: "Add the two dimensions, then double the sum.",
      mistake: "$l \\times w$ is the area. The fence needs $2(l + w)$.",
      verify: `Half the perimeter is ${l + b} = ${l} + ${b} ✓`,
      remember: "Fencing a rectangle: $P = 2(l + w)$.",
    });
  }
  if (d === 2) {
    const kind = r.int(0, 3);
    if (kind === 0) {
      const a = r.int(3, 40), P = 3 * a;
      return qS1({
        text: `An equilateral triangle has side $${a}$ cm. Find its perimeter (in cm).`,
        answer: String(P),
        steps: [`All three sides of an equilateral triangle are equal.`, `$P = 3a = 3 \\times ${a}$.`, `$P = ${P}$ cm.`],
        concept: "Perimeter of a regular polygon: $P = n \\times$ side",
        hint1: "All sides are equal — count them.",
        hint2: "Multiply one side by the number of sides.",
        remember: "Regular $n$-gon: perimeter $= n \\times$ side.",
      });
    }
    if (kind === 1) {
      const e = r.int(5, 30), f = r.int(2, 2 * e - 2), P = 2 * e + f;
      return qS1({
        text: `An isosceles triangle has two equal sides of $${e}$ cm each and a base of $${f}$ cm. Find its perimeter (in cm).`,
        answer: String(P),
        steps: [`The two equal legs contribute $2 \\times ${e} = ${2 * e}$ cm.`, `Add the base: $${2 * e} + ${f}$.`, `$P = ${P}$ cm.`],
        concept: "Perimeter of an isosceles triangle: $P = 2a + b$",
        hint1: "Two sides are identical — double one, add the other.",
        hint2: `Sum $= ${e} + ${e} + ${f}$.`,
        remember: "Isosceles: double the leg, add the base.",
      });
    }
    if (kind === 2) {
      const a = r.int(3, 40), b = r.int(2, 39), P = 2 * (a + b);
      return qS1({
        text: `A parallelogram has adjacent sides $${a}$ cm and $${b}$ cm. Find its perimeter (in cm).`,
        answer: String(P),
        steps: [`Opposite sides of a parallelogram are equal, so the border walk sees each side twice.`, `$P = 2($${a} + ${b}) = 2 \\times ${a + b}$.`, `$P = ${P}$ cm.`],
        concept: "Perimeter of a parallelogram: $P = 2(a + b)$",
        hint1: "Opposite sides are equal — just like a rectangle.",
        hint2: "Double the sum of the two adjacent sides.",
        mistake: "Don't multiply the sides — perimeter adds lengths, area multiplies them.",
        remember: "Parallelogram fence: $P = 2(a + b)$ — the height never enters a perimeter.",
      });
    }
    const n = r.pick([5, 6]);
    const a = r.int(3, 30), P = n * a;
    return qS1({
      text: `A regular ${n === 5 ? "pentagon" : "hexagon"} has side $${a}$ m. Find its perimeter (in m).`,
      answer: String(P),
      steps: [`A regular polygon has ${n} equal sides.`, `$P = ${n} \\times ${a}$.`, `$P = ${P}$ m.`],
      concept: "Perimeter of a regular polygon: $P = n \\times$ side",
      hint1: "How many sides does it have, and are they equal?",
      hint2: `Multiply $${a}$ by ${n}.`,
      remember: "Regular polygon: number of sides × side length.",
    });
  }
  if (d === 3) {
    if (r.next() < 0.6) {
      const a = r.int(5, 25), b = r.int(5, 25);
      // Triangle inequality: third side x must satisfy |a-b| < x < a+b, i.e.
      // P must lie in (2·max(a,b), 2(a+b)).
      const P = r.int(2 * Math.max(a, b) + 1, 2 * (a + b) - 2);
      const miss = P - a - b;
      return qS1({
        text: `A triangle has two sides of $${a}$ cm and $${b}$ cm, and a perimeter of $${P}$ cm. Find its third side (in cm).`,
        answer: String(miss),
        steps: [`Perimeter = sum of all three sides: $${a} + ${b} + x = ${P}$.`, `The known sides add to $${a + b}$.`, `$x = ${P} - ${a + b} = ${miss}$ cm.`],
        concept: "Finding a missing side from the perimeter",
        hint1: "The perimeter is the grand total — subtract what you already know.",
        hint2: `Total $${P}$ minus $${a + b}$ leaves the third side.`,
        mistake: "Don't divide the perimeter by 3 — that only works when all sides are equal.",
        verify: `${a} + ${b} + ${miss} = ${P} ✓`,
        remember: "Missing side = perimeter − known sides.",
      });
    }
    const s4 = [r.int(4, 20), r.int(4, 20), r.int(4, 20), r.int(4, 20)];
    const miss = r.int(3, 20);
    const P = s4[0] + s4[1] + s4[2] + s4[3] + miss;
    const known = s4[0] + s4[1] + s4[2] + s4[3];
    return qS1({
      text: `A pentagon has four sides measuring $${s4[0]}$, $${s4[1]}$, $${s4[2]}$ and $${s4[3]}$ cm, and its perimeter is $${P}$ cm. Find the fifth side (in cm).`,
      answer: String(miss),
      steps: [`The four known sides add to $${known}$.`, `Perimeter means all five sides total $${P}$.`, `Fifth side $= ${P} - ${known} = ${miss}$ cm.`],
      concept: "Missing side = perimeter − sum of known sides",
      hint1: "Add the four known sides first.",
      hint2: "Whatever the total still owes is the fifth side.",
      verify: `${s4.join(" + ")} + ${miss} = ${P} ✓`,
      remember: "The perimeter is a budget: known sides spend it, the rest is left over.",
    });
  }
  const k = r.pick([2, 3]);
  const b = r.int(4, 25);
  const l = k * b;
  const P = 2 * (l + b);
  if (r.next() < 0.5) {
    return qS1({
      text: `The length of a rectangular hall is $${k}$ times its breadth of $${b}$ m. Find its perimeter (in m).`,
      answer: String(P),
      steps: [`Length $= ${k} \\times ${b} = ${l}$ m.`, `$P = 2(l + w) = 2($${l} + ${b})$.`, `$P = 2 \\times ${l + b} = ${P}$ m.`],
      concept: "Perimeter of a rectangle with a side relation",
      hint1: "First turn the words into an actual length.",
      hint2: "Then apply $P = 2(l + w)$ as usual.",
      remember: "Translate the relation first; the formula comes second.",
    });
  }
  return qS1({
    text: `A rectangle has perimeter $${P}$ m, and its length is $${k}$ times its breadth. Find the breadth (in m).`,
    answer: String(b),
    steps: [`Let breadth $= w$; then length $= ${k}w$.`, `$2($${k}w + w) = ${P}$, so $${k + 1}w = ${P / 2}$.`, `$w = ${P / 2} \\div ${k + 1} = ${b}$ m.`],
    concept: "Perimeter equation with a side relation",
    hint1: "Half the perimeter gives length + breadth.",
    hint2: `Length + breadth is $(${k} + 1)$ breadths.`,
    mistake: "$P/2$ is length + breadth together, not the length alone.",
    verify: `Breadth ${b}, length ${k} × ${b} = ${l}; $2(${l} + ${b}) = ${P} ✓`,
    remember: "With relations, keep one unknown and express everything else in it.",
  });
};

// ─── 2. peri-puzzle (s1) ───────────────────────────────────────────────────
const periPuzzle: GenFn = (r, d) => {
  const askMax = d <= 3;
  const nOpts = d <= 2 ? 3 : 4;
  const s = r.int(7, 30);
  const pairs: [number, number][] = [];
  for (let a = 1; a <= s - a; a++) pairs.push([a, s - a]);
  let chosen: [number, number][] | null = null;
  for (let attempt = 0; attempt < 80 && !chosen; attempt++) {
    const sh = shuffle(pairs, r);
    const cand: [number, number][] = [];
    const prods = new Set<number>();
    for (const p of sh) {
      const pr = p[0] * p[1];
      if (!prods.has(pr)) { prods.add(pr); cand.push(p); }
      if (cand.length === nOpts) break;
    }
    if (cand.length === nOpts) chosen = cand;
  }
  if (!chosen) chosen = [[1, 8], [2, 7], [3, 6], [4, 5]]; // deterministic safe fallback (sum 9)
  const sp = chosen.reduce((acc, p) => p[0] + p[1], 0);
  const best = askMax
    ? chosen.reduce((m, p) => (p[0] * p[1] > m[0] * m[1] ? p : m), chosen[0])
    : chosen.reduce((m, p) => (p[0] * p[1] < m[0] * m[1] ? p : m), chosen[0]);
  const areas = chosen.map((p) => p[0] * p[1]);
  const choices = shuffle(chosen.map((p) => `$${p[0]} \\times ${p[1]}$`), r);
  const ansStr = `$${best[0]} \\times ${best[1]}$`;
  const pairLine = chosen.map((p, i) => `$${p[0]} \\times ${p[1]}$ has area $${areas[i]}$`).join(", ");
  const word = askMax ? "greatest" : "smallest";
  const cnt = chosen.length === 4 ? "Four" : "Three";
  return qS1({
    type: "mcq",
    diff: d,
    text: `${cnt} rectangles, each fenced with exactly $${2 * sp}$ m of rope, have dimensions ${chosen.map((p) => `$${p[0]} \\times ${p[1]}$`).join(", ")} (in metres). Which rectangle encloses the **${word}** area?`,
    choices,
    answer: ansStr,
    steps: [
      `All ${chosen.length} share the same perimeter $${2 * sp}$ m — the fence length cannot decide the winner.`,
      `Compute each area (length × width): ${pairLine}.`,
      askMax
        ? `The most square-like rectangle wastes the least rope on stretch: it wins with $${best[0] * best[1]}$ m$^2$.`
        : `The most stretched-out rectangle spends its rope on length, not coverage: only $${best[0] * best[1]}$ m$^2$.`,
      `Answer: $${best[0]} \\times ${best[1]}$.`,
    ],
    concept: "Equal perimeters enclose different areas; the squarest rectangle maximizes area",
    hint1: "Same perimeter for every option — so multiply each pair of dimensions.",
    hint2: askMax ? "Look for the pair whose sides are closest to each other." : "Look for the most lopsided pair.",
    mistake: "A longer rectangle is not a bigger one: $1 \\times 11$ and $5 \\times 7$ share perimeter $24$, but their areas are $11$ vs $35$.",
    verify: `Every pair sums to ${sp}, and ${best[0] * best[1]} is indeed the ${word} product.`,
    remember: "Fixed fence → the squarest field feeds the most cows.",
  });
};

// ─── 3. circumference (s2) ─────────────────────────────────────────────────
const circumference: GenFn = (r, d) => {
  if (d === 1) {
    const k = r.int(1, 10);
    if (r.next() < 0.5) {
      const rad = 7 * k;
      const C = 2 * PI22 * rad; // 44k, exact integer
      return qS2({
        text: `Find the circumference of a circle of radius $${rad}$ cm. ${TAKE22} (Answer in cm.)`,
        answer: dec(C, 2),
        tol: 0.01,
        steps: [`Circumference formula: $C = 2\\pi r$.`, `$C = 2 \\times \\tfrac{22}{7} \\times ${rad} = \\tfrac{44}{7} \\times ${rad}$.`, `$C = ${dec(C, 2)}$ cm.`],
        concept: "Circumference of a circle: $C = 2\\pi r$",
        hint1: "Circumference is the distance once around the circle.",
        hint2: "Double the radius first, then multiply by π.",
        mistake: "The radius enters twice: $C = 2\\pi r$, not $\\pi r$ (that is the semicircle arc).",
        verify: `Circumference must beat $6r = ${6 * rad}$: ${dec(C, 2)} ✓`,
        remember: "$C = 2\\pi r = \\pi d$.",
      });
    }
    const dia = 7 * k;
    const C = PI22 * dia; // 22k
    return qS2({
      text: `A circular track has diameter $${dia}$ m. Find the distance once around it. ${TAKE22} (Answer in m.)`,
      answer: dec(C, 2),
      tol: 0.01,
      steps: [`$C = \\pi d$.`, `$C = \\tfrac{22}{7} \\times ${dia}$.`, `$C = ${dec(C, 2)}$ m.`],
      concept: "Circumference of a circle: $C = \\pi d$",
      hint1: "The diameter is given — no halving needed.",
      hint2: "Multiply the diameter by π directly.",
      remember: "π literally means 'a little more than 3 diameters'.",
    });
  }
  if (d === 2) {
    let rad = r.int(10, 250) / 10;
    let tries = 0;
    while (rad % 7 === 0 && tries < 50) { rad = r.int(10, 250) / 10; tries++; }
    if (rad % 7 === 0) rad = 6.5; // keep the 3.14 branch honest
    const C = 2 * P314 * rad;
    return qS2({
      text: `Find the circumference of a circle of radius $${dec(rad, 1)}$ cm. ${TAKE314} (Answer in cm.)`,
      answer: dec(C, 2),
      tol: 0.05,
      steps: [`$C = 2\\pi r = 2 \\times 3.14 \\times ${dec(rad, 1)}$.`, `$C = 6.28 \\times ${dec(rad, 1)}$.`, `$C = ${dec(C, 2)}$ cm.`],
      concept: "Circumference with a decimal radius: $C = 2\\pi r$",
      hint1: "The question prescribes π = 3.14 — use exactly that.",
      hint2: "Compute $6.28 \\times$ radius, keeping two decimal places.",
      mistake: "Mixing approximations: never swap 3.14 for 22/7 mid-problem.",
      remember: "The question chooses your π — obey it.",
    });
  }
  if (d === 3) {
    const k = r.int(1, 15);
    if (r.next() < 0.5) {
      const C = 44 * k;
      return qS2({
        text: `The circumference of a circle is $${C}$ cm. Find its radius. ${TAKE22} (Answer in cm.)`,
        answer: String(7 * k),
        tol: 0.01,
        steps: [`Undo the formula: $C = 2\\pi r \\Rightarrow r = \\dfrac{C}{2\\pi}$.`, `$r = \\dfrac{${C}}{2 \\times \\tfrac{22}{7}} = \\dfrac{${C} \\times 7}{44}$.`, `$r = ${7 * k}$ cm.`],
        concept: "Working backwards from circumference: $r = C/(2\\pi)$",
        hint1: "Divide the circumference by 2π to undo the formula.",
        hint2: `Dividing by $2\\pi = \\tfrac{44}{7}$ is the same as multiplying by $\\tfrac{7}{44}$.`,
        mistake: "$C \\div \\pi$ gives the diameter, not the radius — halve it.",
        verify: `$2 \\times \\tfrac{22}{7} \\times ${7 * k} = ${C}$ ✓`,
        remember: "$C \\div \\pi = d$, then $d \\div 2 = r$.",
      });
    }
    const C = 22 * k;
    return qS2({
      text: `A circular garden bed has circumference $${C}$ m. Find its diameter. ${TAKE22} (Answer in m.)`,
      answer: String(7 * k),
      tol: 0.01,
      steps: [`$C = \\pi d \\Rightarrow d = \\dfrac{C}{\\pi}$.`, `$d = ${C} \\div \\tfrac{22}{7} = ${C} \\times \\tfrac{7}{22}$.`, `$d = ${7 * k}$ m.`],
      concept: "Working backwards from circumference: $d = C/\\pi$",
      hint1: "Diameter = circumference ÷ π.",
      hint2: `Multiplying by $\\tfrac{7}{22}$ undoes multiplying by $\\tfrac{22}{7}$.`,
      verify: `$\\tfrac{22}{7} \\times ${7 * k} = ${C}$ ✓`,
      remember: "Circumference is just π diameters — divide it back out.",
    });
  }
  const k = r.pick([2, 3, 4, 6]);
  const dia = 7 * k;            // cm
  const Ccm = 22 * k;           // cm per revolution
  const n = r.int(2, 20) * 50;  // 100..1000 revolutions
  const distM = (Ccm * n) / 100;
  return qS2({
    text: `A car tyre has diameter $${dia}$ cm. How many complete revolutions does it make while the car travels $${distM}$ m? ${TAKE22}`,
    answer: String(n),
    tol: 0.01,
    steps: [
      `One full turn covers one circumference: $C = \\pi d = \\tfrac{22}{7} \\times ${dia} = ${Ccm}$ cm.`,
      `Convert the trip to the same units: $${distM}$ m $= ${distM * 100}$ cm.`,
      `Revolutions $= \\dfrac{\\text{distance}}{\\text{circumference}} = \\dfrac{${distM * 100}}{${Ccm}} = ${n}$.`,
    ],
    concept: "Rolling: distance = revolutions × circumference",
    hint1: "How far does the tyre travel in one full turn?",
    hint2: "Divide the total distance by one circumference — after matching units.",
    mistake: "Mixing metres and centimetres ruins the count — convert first.",
    verify: `${n} revolutions × ${Ccm} cm = ${n * Ccm} cm = ${distM} m ✓`,
    remember: "Every wheel is a rolling tape measure of its own circumference.",
  });
};

// ─── 4. arc-length (s2) ────────────────────────────────────────────────────
const arcLength: GenFn = (r, d) => {
  if (d <= 3) {
    const th = d <= 2 ? r.pick([30, 45, 60, 90, 120, 135, 180]) : r.int(8, 68) * 5;
    const rad = 7 * r.int(1, d <= 2 ? 5 : 10);
    const C = 2 * PI22 * rad;
    const L = (th / 360) * C;
    return qS2({
      text: `Find the length of an arc that subtends $${th}^\\circ$ at the centre of a circle of radius $${rad}$ cm. ${TAKE22} (Answer in cm.)`,
      answer: dec(L, 2),
      tol: 0.01,
      steps: [
        `Full circumference: $C = 2\\pi r = 2 \\times \\tfrac{22}{7} \\times ${rad} = ${dec(C, 2)}$ cm.`,
        `An arc is the fraction $\\tfrac{${th}}{360}$ of the whole circle.`,
        `$L = \\tfrac{${th}}{360} \\times ${dec(C, 2)} = ${dec(L, 2)}$ cm.`,
      ],
      concept: "Arc length: $L = \\frac{\\theta}{360} \\times 2\\pi r$",
      hint1: "The arc's share of the circle is θ/360.",
      hint2: "Compute the full circumference, then take the θ/360 slice.",
      mistake: "The fraction is $\\theta/360$, not $\\theta/180$ or $\\theta/100$ — a full turn is $360^\\circ$.",
      verify: `Fraction ${dec(th / 360, 4)} of ${dec(C, 2)} cm = ${dec(L, 2)} ✓`,
      remember: "Arc = (θ/360) × C — the crust of a pizza slice.",
    });
  }
  const th = r.pick([45, 90, 180, 270]);
  const k = r.int(1, 15);
  const rad = 7 * k;
  const C = 44 * k;
  const L = (th / 360) * C;
  return qS2({
    text: `An arc of a circle of radius $${rad}$ cm has length $${dec(L, 2)}$ cm. What angle (in degrees) does it subtend at the centre? ${TAKE22}`,
    answer: String(th),
    tol: 0.01,
    steps: [
      `Full circumference: $C = 2\\pi r = 2 \\times \\tfrac{22}{7} \\times ${rad} = ${C}$ cm.`,
      `Arc fraction: $\\tfrac{\\theta}{360} = \\tfrac{L}{C} = \\tfrac{${dec(L, 2)}}{${C}}$.`,
      `$\\theta = 360 \\times \\tfrac{${dec(L, 2)}}{${C}} = ${th}^\\circ$.`,
    ],
    concept: "Reverse arc length: $\\theta = \\frac{L}{C} \\times 360$",
    hint1: "Ask: what fraction of the whole circumference is this arc?",
    hint2: "Multiply that fraction by 360°.",
    mistake: "Don't leave the answer as a fraction of a turn — convert with ×360.",
    verify: `$\\tfrac{${th}}{360} \\times ${C} = ${dec(L, 2)}$ ✓`,
    remember: "L/C is the turn fraction; ×360 turns it into degrees.",
  });
};

// ─── 5. mcq-pi (s2) ────────────────────────────────────────────────────────
const mcqPi: GenFn = (r, d) => {
  const t = d === 1 ? r.pick([0, 1]) : d === 2 ? r.pick([2, 3]) : d === 3 ? r.pick([4, 5]) : r.pick([6, 7]);
  if (t === 0) {
    return qS2({
      type: "mcq",
      diff: d,
      text: `For every circle — a coin, a bangle, a ferris wheel — the ratio $\\dfrac{C}{d}$ (circumference ÷ diameter) is…`,
      choices: ["different for different circles", "exactly 3.14", "exactly $\\tfrac{22}{7}$", "$\\pi$, the same for every circle"],
      answer: "$\\pi$, the same for every circle",
      steps: [
        `Measure $C$ and $d$ of any circle and divide: you always land near $3.14159\\ldots$`,
        `This invariance is the definition of $\\pi$: the circumference-to-diameter ratio of every circle.`,
        `3.14 and $\\tfrac{22}{7}$ are only approximations of that constant.`,
      ],
      concept: "π is the constant ratio C/d for all circles",
      hint1: "Does the ratio change if the circle grows?",
      hint2: "π is a universal constant, not a property of a particular circle.",
      mistake: "π is not exactly 3.14 or 22/7 — both are convenient approximations.",
      remember: "π = C/d for every circle, always.",
    });
  }
  if (t === 1) {
    const dia = r.int(5, 20);
    return qS2({
      type: "mcq",
      diff: d,
      text: `A circle has diameter $${dia}$ units. Which expression gives its circumference?`,
      choices: [`$${dia}\\pi$ units`, `$${2 * dia}\\pi$ units`, `$${dia / 2}\\pi$ units`, `$${dia * dia}\\pi$ units`],
      answer: `$${dia}\\pi$ units`,
      steps: [
        `$C = \\pi d$ — one π per diameter.`,
        `Here $d = ${dia}$, so $C = ${dia}\\pi$ units.`,
        `$${2 * dia}\\pi$ would treat the diameter as a radius and double it again; $${dia * dia}\\pi$ wrongly squares it.`,
      ],
      concept: "Circumference from diameter: $C = \\pi d$",
      hint1: "How many diameters long is the circumference?",
      hint2: "Exactly π of them — so multiply the diameter by π.",
      mistake: "Using $2\\pi d$ doubles the doubling: $2\\pi r$ needs the radius, not the diameter.",
      remember: "Diameter given? $C = \\pi d$. Radius given? $C = 2\\pi r$.",
    });
  }
  if (t === 2) {
    const rad = r.int(3, 12);
    return qS2({
      type: "mcq",
      diff: d,
      text: `A circle's radius is stretched from $${rad}$ cm to $${2 * rad}$ cm. Its circumference…`,
      choices: ["doubles", "quadruples", "stays the same", "is multiplied by 8"],
      answer: "doubles",
      steps: [
        `$C = 2\\pi r$ is linear in $r$: only a single power of $r$ appears.`,
        `Doubling $r$ from $${rad}$ to $${2 * rad}$ doubles $C$: from $${2 * rad}\\pi$ to $${4 * rad}\\pi$ cm.`,
        `(Watch out — the *area* would quadruple, because $r^2$ doubles twice.)`,
      ],
      concept: "Circumference scales linearly with radius",
      hint1: "Count the powers of r in the formula.",
      hint2: "$C = 2\\pi r$ has $r^1$ — so ×2 in, ×2 out.",
      mistake: "Confusing with area: $A = \\pi r^2$ quadruples when $r$ doubles.",
      remember: "Length formulas scale once; area formulas scale twice.",
    });
  }
  if (t === 3) {
    const a = r.int(2, 9);
    let b = r.int(2, 9);
    let guard = 0;
    while (b === a && guard < 40) { b = r.int(2, 9); guard++; }
    if (b === a) b = a === 2 ? 3 : a - 1;
    const lo = Math.min(a, b), hi = Math.max(a, b);
    return qS2({
      type: "mcq",
      diff: d,
      text: `Two circles have radii $${lo}$ cm and $${hi}$ cm. What is the ratio of their circumferences?`,
      choices: [`$${lo} : ${hi}$`, `$${hi} : ${lo}$`, `$${lo * lo} : ${hi * hi}$`, `$${hi * hi} : ${lo * lo}$`],
      answer: `$${lo} : ${hi}$`,
      steps: [
        `$C_1 = 2\\pi (${lo})$ and $C_2 = 2\\pi (${hi})$ — the $2\\pi$ cancels in the ratio.`,
        `$\\dfrac{C_1}{C_2} = \\dfrac{${lo}}{${hi}}$, i.e. $${lo} : ${hi}$.`,
        `Circumference ratio = radius ratio; the *squared* ratio belongs to areas.`,
      ],
      concept: "Circumference ratio equals radius ratio",
      hint1: "Write both circumferences with 2π and cancel.",
      hint2: "Squaring is for areas, not for lengths.",
      mistake: "$${lo * lo} : ${hi * hi}$ is the *area* ratio trap.",
      remember: "Same-shape scaling: lengths in ratio r, areas in ratio r².",
    });
  }
  if (t === 4) {
    const rad = r.int(3, 12);
    return qS2({
      type: "mcq",
      diff: d,
      text: `A circle's radius is stretched from $${rad}$ cm to $${2 * rad}$ cm. Its area…`,
      choices: ["doubles", "quadruples", "stays the same", "is multiplied by 8"],
      answer: "quadruples",
      steps: [
        `$A = \\pi r^2$ — the radius appears squared.`,
        `Old area $= \\pi (${rad})^2 = ${rad * rad}\\pi$; new area $= \\pi (${2 * rad})^2 = ${4 * rad * rad}\\pi$.`,
        `$${4 * rad * rad}\\pi = 4 \\times ${rad * rad}\\pi$: the area quadruples.`,
      ],
      concept: "Area scales as the square of the radius",
      hint1: "Substitute both radii and compare.",
      hint2: "Doubling r squares a factor of 2: $2^2 = 4$.",
      mistake: "Linear thinking: only the circumference doubles; area jumps ×4.",
      remember: "Scale lengths by k → areas scale by k².",
    });
  }
  if (t === 5) {
    const a = r.int(2, 9);
    let b = r.int(2, 9);
    let guard = 0;
    while (b === a && guard < 40) { b = r.int(2, 9); guard++; }
    if (b === a) b = a === 2 ? 3 : a - 1;
    const lo = Math.min(a, b), hi = Math.max(a, b);
    return qS2({
      type: "mcq",
      diff: d,
      text: `Two circles have radii $${lo}$ cm and $${hi}$ cm. What is the ratio of their areas?`,
      choices: [`$${lo} : ${hi}$`, `$${hi} : ${lo}$`, `$${lo * lo} : ${hi * hi}$`, `$${hi * hi} : ${lo * lo}$`],
      answer: `$${lo * lo} : ${hi * hi}$`,
      steps: [
        `$A_1 = \\pi (${lo})^2 = ${lo * lo}\\pi$ and $A_2 = \\pi (${hi})^2 = ${hi * hi}\\pi$.`,
        `The π cancels: $A_1 : A_2 = ${lo * lo} : ${hi * hi}$.`,
        `In general, $A_1 : A_2 = r_1^2 : r_2^2$.`,
      ],
      concept: "Area ratio equals the square of the radius ratio",
      hint1: "Square each radius before forming the ratio.",
      hint2: `$${lo}^2 = ${lo * lo}$ and $${hi}^2 = ${hi * hi}$.`,
      mistake: "$${lo} : ${hi}$ is the circumference ratio — areas need squares.",
      remember: "Areas compare as $r^2 : r^2$, never as $r : r$.",
    });
  }
  if (t === 6) {
    return qS2({
      type: "mcq",
      diff: d,
      text: `Which statement about $\\pi$ and $\\tfrac{22}{7}$ is true?`,
      choices: [
        "$\\pi$ and $\\tfrac{22}{7}$ are both irrational",
        "$\\pi$ is irrational; $\\tfrac{22}{7}$ is only a rational approximation of it",
        "$\\pi$ is rational because it equals 3.14 exactly",
        "$\\tfrac{22}{7}$ is the exact value of $\\pi$",
      ],
      answer: "$\\pi$ is irrational; $\\tfrac{22}{7}$ is only a rational approximation of it",
      steps: [
        `$\\tfrac{22}{7}$ is a fraction of integers — hence rational; its decimal $3.\\overline{142857}$ repeats.`,
        `$\\pi = 3.14159265\\ldots$ never terminates and never repeats — irrational.`,
        `The two agree to about $0.0013$; close enough for estimates, never equal.`,
      ],
      concept: "π is irrational; 22/7 and 3.14 are rational approximations",
      hint1: "Can 22/7 be written as a ratio of integers? Can π?",
      hint2: "A repeating decimal is always rational — check 22/7's decimal.",
      mistake: "Treating 22/7 as exact π produces small but real errors in long chains.",
      remember: "π is irrational; 22/7 and 3.14 are stand-ins.",
    });
  }
  const k = r.int(2, 6);
  let m = r.int(2, 6);
  let guard2 = 0;
  while (m === k && guard2 < 40) { m = r.int(2, 6); guard2++; }
  if (m === k) m = k === 2 ? 3 : k - 1;
  const lo = Math.min(k, m), hi = Math.max(k, m);
  return qS2({
    type: "mcq",
    diff: d,
    text: `The areas of two circles are in the ratio $${lo * lo} : ${hi * hi}$. What is the ratio of their radii?`,
    choices: [`$${lo * lo} : ${hi * hi}$`, `$${lo} : ${hi}$`, `$${hi} : ${lo}$`, `$${2 * lo} : ${2 * hi}$`],
    answer: `$${lo} : ${hi}$`,
    steps: [
      `Areas scale as $r^2$, so $r_1 : r_2 = \\sqrt{A_1} : \\sqrt{A_2}$.`,
      `$\\sqrt{${lo * lo}} = ${lo}$ and $\\sqrt{${hi * hi}} = ${hi}$.`,
      `Radius ratio $= ${lo} : ${hi}$.`,
    ],
    concept: "Undoing the square: radius ratio = square root of area ratio",
    hint1: "Area ratio is the square of the radius ratio.",
    hint2: "Take square roots of both parts.",
    mistake: "Doubling both parts of the area ratio is not the inverse operation — square-root them.",
    remember: "Areas k² apart → radii k apart.",
  });
};

// ─── 6. area-rect (s3) ─────────────────────────────────────────────────────
const areaRect: GenFn = (r, d) => {
  if (d === 1) {
    if (r.next() < 0.2) {
      const s = r.int(3, 30), A = s * s;
      return qS3({
        text: `A square courtyard has side $${s}$ m. Find its area (in m$^2$).`,
        answer: String(A),
        steps: [`Area of a square $= s^2$.`, `$A = ${s} \\times ${s} = ${A}$.`, `$A = ${A}$ m$^2$.`],
        concept: "Area of a square: $A = s^2$",
        hint1: "A square is a rectangle with equal sides.",
        hint2: "Multiply the side by itself.",
        mistake: "Side × 4 is the perimeter; area needs side × side.",
        remember: "Square area = side squared — the name says it.",
      });
    }
    const l = r.int(4, 60), b = r.int(3, 59), A = l * b;
    return qS3({
      text: `A rectangular floor is $${l}$ m long and $${b}$ m wide. Find its area (in m$^2$).`,
      answer: String(A),
      steps: [`Area = number of unit squares that tile the floor.`, `$A = l \\times b = ${l} \\times ${b}$.`, `$A = ${A}$ m$^2$.`],
      concept: "Area of a rectangle: $A = l \\times b$",
      hint1: "Count tiles: rows × columns.",
      hint2: `${b} rows of ${l} tiles each.`,
      mistake: "Don't add the sides — area multiplies, perimeter adds.",
      remember: "Rectangle area = length × width.",
    });
  }
  if (d === 2) {
    const b = r.int(3, 30), l = r.int(b + 1, 60);
    const P = 2 * (l + b), A = l * b;
    return qS3({
      text: `A rectangular plot has perimeter $${P}$ m and breadth $${b}$ m. Find its area (in m$^2$).`,
      answer: String(A),
      steps: [`Half the perimeter gives length + breadth: $${P} \\div 2 = ${l + b}$ m.`, `Length $= ${l + b} - ${b} = ${l}$ m.`, `Area $= ${l} \\times ${b} = ${A}$ m$^2$.`],
      concept: "Two-step: perimeter → missing side → area",
      hint1: "From the perimeter, recover length + breadth.",
      hint2: "Subtract the known breadth, then multiply.",
      mistake: "Perimeter alone never fixes the area — you need one more clue (here, the breadth).",
      verify: `Check: $2(${l} + ${b}) = ${P}$ ✓`,
      remember: "P gives the sum of sides; one side unlocks the area.",
    });
  }
  if (d === 3) {
    const l = r.int(5, 60), b = r.int(4, 59);
    const rate = r.pick([12, 15, 18, 20, 25]);
    if (r.next() < 0.5) {
      const cost = l * b * rate;
      return qS3({
        text: `A hall measuring $${l}$ m by $${b}$ m is to be tiled at $\\text{₹}${rate}$ per m$^2$. Find the total cost (in ₹).`,
        answer: String(cost),
        steps: [`Area to tile: $${l} \\times ${b} = ${l * b}$ m$^2$.`, `Each square metre costs $\\text{₹}${rate}$.`, `Cost $= ${l * b} \\times ${rate} = \\text{₹}${cost}$.`],
        concept: "Cost = area × rate per square unit",
        hint1: "Tiling covers the surface — that's area.",
        hint2: "Compute the area, then multiply by the rate.",
        mistake: "Fencing uses perimeter, tiling uses area — using the wrong one ruins the budget.",
        remember: "Covering costs by area; edging costs by length.",
      });
    }
    const P = 2 * (l + b), cost = P * rate;
    return qS3({
      text: `A rectangular field $${l}$ m by $${b}$ m must be fenced with wire costing $\\text{₹}${rate}$ per metre. Find the total cost of fencing (in ₹).`,
      answer: String(cost),
      steps: [`Fencing runs along the boundary: $P = 2($${l} + ${b}) = ${P}$ m.`, `Each metre of wire costs $\\text{₹}${rate}$.`, `Cost $= ${P} \\times ${rate} = \\text{₹}${cost}$.`],
      concept: "Cost of fencing = perimeter × rate per unit length",
      hint1: "Wire wraps around the edge — perimeter territory.",
      hint2: "Find P first, then multiply by the per-metre rate.",
      mistake: "Multiplying area by the rate overcharges wildly — fences don't cross the field.",
      remember: "Fencing = perimeter × rate; tiling = area × rate.",
    });
  }
  const w = r.pick([1, 2, 3]);
  const l = r.int(4 + 2 * w, 40), b = r.int(4 + 2 * w, 30);
  const inner = (l - 2 * w) * (b - 2 * w);
  const path = l * b - inner;
  return qS3({
    text: `A rectangular park measuring $${l}$ m by $${b}$ m has a path $${w}$ m wide laid inside it, all along the boundary. Find the area covered by the path (in m$^2$).`,
    answer: String(path),
    steps: [
      `Outer area: $${l} \\times ${b} = ${l * b}$ m$^2$.`,
      `The inner lawn loses $${w}$ m on every side: $(${l} - ${2 * w}) \\times (${b} - ${2 * w}) = ${l - 2 * w} \\times ${b - 2 * w} = ${inner}$ m$^2$.`,
      `Path $= ${l * b} - ${inner} = ${path}$ m$^2$.`,
      `Shortcut check: $2w(l + b) - 4w^2 = ${2 * w * (l + b)} - ${4 * w * w} = ${path}$ ✓`,
    ],
    concept: "Border path area = outer area − inner area",
    hint1: "The path is a frame: big rectangle minus small rectangle.",
    hint2: "The inner rectangle shrinks by w on *each* side, i.e. 2w per dimension.",
    mistake: "Shrinking each dimension by only $w$ (instead of $2w$) steals from the path.",
    verify: `Frame formula $2w(l+b) - 4w^2$ gives ${path} ✓`,
    remember: "A frame eats 2w from every dimension, not w.",
  });
};

// ─── 7. area-para-tri (s3) ─────────────────────────────────────────────────
const areaParaTri: GenFn = (r, d) => {
  if (d === 1) {
    const b = r.int(4, 30), h = r.int(2, 25), A = b * h;
    return qS3({
      text: `A parallelogram has base $${b}$ cm and perpendicular height $${h}$ cm. Find its area (in cm$^2$).`,
      answer: String(A),
      steps: [`Cut the end triangle and shift it right: the parallelogram becomes a rectangle of the same area.`, `That rectangle has base $${b}$ and height $${h}$.`, `$A = b \\times h = ${b} \\times ${h} = ${A}$ cm$^2$.`],
      concept: "Area of a parallelogram: $A = b \\times h$ (h perpendicular)",
      hint1: "Shear a rectangle — area doesn't change.",
      hint2: "Base times perpendicular height.",
      mistake: "The slant side is not the height unless the angle is 90°.",
      remember: "Parallelogram = sheared rectangle: $A = bh$.",
    });
  }
  if (d === 2) {
    const b = r.int(4, 30), h = r.int(2, 25), A = (b * h) / 2;
    return qS3({
      text: `A triangle has base $${b}$ cm and perpendicular height $${h}$ cm. Find its area (in cm$^2$).`,
      answer: dec(A, 2),
      steps: [
        `Two copies of the triangle stack into a parallelogram with the same base $${b}$ and height $${h}$.`,
        `That parallelogram has area $${b} \\times ${h} = ${b * h}$ cm$^2$.`,
        `The triangle is half of it: $A = \\tfrac{1}{2} \\times ${b * h} = ${dec(A, 2)}$ cm$^2$.`,
      ],
      concept: "Area of a triangle: $A = \\frac{1}{2} b h$",
      hint1: "A triangle is half a parallelogram of equal base and height.",
      hint2: "Compute $b \\times h$, then halve it.",
      mistake: "Forgetting the $\\tfrac{1}{2}$ is the classic error — you'd be reporting the doubled parallelogram.",
      verify: `Doubled: $${dec(A, 2)} \\times 2 = ${b * h}$ = $b \\times h$ ✓`,
      remember: "Every triangle is half a parallelogram: $A = \\frac{1}{2}bh$.",
    });
  }
  if (d === 3) {
    const b = r.int(6, 24), h = r.int(3, 15);
    let s = h + r.int(2, 12);
    let guard = 0;
    while (s === b && guard < 40) { s = h + r.int(2, 12); guard++; }
    if (s === b) s = b + 1;
    const A = b * h;
    const cands = [b * s, s * h, 2 * (b + s), b * h + b];
    const ds: number[] = [];
    for (const c of cands) { if (c !== A && !ds.includes(c)) ds.push(c); if (ds.length === 3) break; }
    let pad = A + 11;
    while (ds.length < 3) { if (pad !== A && !ds.includes(pad)) ds.push(pad); pad += 13; }
    return qS3({
      type: "mcq",
      diff: d,
      text: `A parallelogram has base $${b}$ cm, slant side $${s}$ cm, and perpendicular height $${h}$ cm (drawn to the base). What is its area (in cm$^2$)?`,
      choices: shuffle([String(A), ...ds.map(String)], r),
      answer: String(A),
      steps: [
        `Area of a parallelogram uses only base and *perpendicular* height: $A = b \\times h$.`,
        `$A = ${b} \\times ${h} = ${A}$ cm$^2$.`,
        `The slant side $${s}$ cm is a decoy: it belongs to the perimeter $2(${b} + ${s})$, never to the area.`,
        `$${b} \\times ${s} = ${b * s}$ would be the trap answer — it treats a tilt as a height.`,
      ],
      concept: "Parallelogram area needs the perpendicular height, not the slant side",
      hint1: "Which given length is truly perpendicular to the base?",
      hint2: "Ignore the slant side completely for area.",
      mistake: "Base × slant side overestimates area whenever the shape leans.",
      remember: "Slant height lies; perpendicular height tells the truth.",
    });
  }
  const b = r.int(4, 24), h = r.int(2, 20), A = b * h;
  if (r.next() < 0.5) {
    return qS3({
      text: `A parallelogram has area $${A}$ cm$^2$ and base $${b}$ cm. Find its perpendicular height (in cm).`,
      answer: String(h),
      steps: [`$A = b \\times h$.`, `$${A} = ${b} \\times h$.`, `$h = ${A} \\div ${b} = ${h}$ cm.`],
      concept: "Reverse parallelogram: $h = A/b$",
      hint1: "Area is base × height; one factor is missing.",
      hint2: "Divide the area by the base.",
      verify: `${b} × ${h} = ${A} ✓`,
      remember: "Area formulas run both ways: divide to undo.",
    });
  }
  return qS3({
    text: `A parallelogram has area $${A}$ cm$^2$. A triangle stands on the same base and between the same parallels as the parallelogram. Find the triangle's area (in cm$^2$).`,
    answer: dec(A / 2, 2),
    steps: [
      `Same base and same parallels mean same base $b$ and same height $h$.`,
      `Parallelogram: $A = bh = ${A}$.`,
      `Triangle on the same base and height: $\\tfrac{1}{2}bh = \\tfrac{${A}}{2} = ${dec(A / 2, 2)}$ cm$^2$.`,
    ],
    concept: "Triangle on same base & parallels = half the parallelogram",
    hint1: "Both shapes share b and h — compare the formulas.",
    hint2: "$\\frac{1}{2}bh$ vs $bh$: one is half the other.",
    mistake: "The halves match only when base AND height are shared — a taller triangle breaks it.",
    verify: `${dec(A / 2, 2)} × 2 = ${A} ✓`,
    remember: "Same base, same lines → triangle = half parallelogram.",
  });
};

// ─── 8. reverse-area (s3) ──────────────────────────────────────────────────
const reverseArea: GenFn = (r, d) => {
  if (d === 1) {
    const k = r.int(3, 25), A = k * k;
    return qS3({
      text: `A square has area $${A}$ cm$^2$. Find its side length (in cm).`,
      answer: String(k),
      steps: [`$A = s^2 = ${A}$.`, `Which number squares to ${A}? $${k} \\times ${k} = ${A}$.`, `Side $= ${k}$ cm.`],
      concept: "Reverse square area: $s = \\sqrt{A}$",
      hint1: "Area of a square is side × side.",
      hint2: `Hunt the square root of ${A}.`,
      mistake: "Dividing the area by 4 confuses square with perimeter logic.",
      verify: `${k} × ${k} = ${A} ✓`,
      remember: "Area → side: take the square root.",
    });
  }
  if (d === 2) {
    const b = r.int(3, 39), l = r.int(b + 1, 60), A = l * b;
    const giveL = r.next() < 0.5;
    return qS3({
      text: giveL
        ? `A rectangle has area $${A}$ cm$^2$ and length $${l}$ cm. Find its breadth (in cm).`
        : `A rectangle has area $${A}$ cm$^2$ and breadth $${b}$ cm. Find its length (in cm).`,
      answer: String(giveL ? b : l),
      steps: [`$A = l \\times b = ${A}$.`, giveL ? `Breadth $= ${A} \\div ${l} = ${b}$ cm.` : `Length $= ${A} \\div ${b} = ${l}$ cm.`, `Check: ${giveL ? `${l} × ${b}` : `${b} × ${l}`} = ${A} ✓`],
      concept: "Reverse rectangle area: missing side = A ÷ known side",
      hint1: "Area factors into the two sides.",
      hint2: "Divide the area by the side you know.",
      mistake: "Subtracting instead of dividing — area is a product, not a sum.",
      remember: "One side + area → the other side by division.",
    });
  }
  if (d === 3) {
    const a = r.int(3, 20), b = r.int(a + 1, 24);
    const s = a + b, A = a * b, P = 2 * s;
    return qS3({
      text: `A rectangle has perimeter $${P}$ cm and area $${A}$ cm$^2$. Find the length of its longer side (in cm).`,
      answer: String(b),
      steps: [
        `Half-perimeter: $l + w = ${P} \\div 2 = ${s}$.`,
        `Product: $l \\times w = ${A}$.`,
        `Search factor pairs of ${A} that sum to ${s}: $${a} \\times ${b} = ${A}$ and $${a} + ${b} = ${s}$ ✓`,
        `Both sides are $${a}$ cm and $${b}$ cm; the longer side is $${b}$ cm.`,
      ],
      concept: "Perimeter + area together pin down the rectangle's sides",
      hint1: "Turn the perimeter into a sum: $l + w = P/2$.",
      hint2: "Test factor pairs of the area until the sum matches.",
      mistake: "There is only one unordered pair with this sum and product — don't stop at the first factor pair you meet.",
      verify: `Sum ${a} + ${b} = ${s} → P = ${P}; product = ${A} ✓`,
      remember: "Sum from P, product from A — the pair is trapped.",
    });
  }
  if (r.next() < 0.5) {
    const b = r.int(4, 24), h = r.int(2, 20), A = b * h;
    return qS3({
      text: `A parallelogram has area $${A}$ cm$^2$ and base $${b}$ cm. Find its height (in cm).`,
      answer: String(h),
      steps: [`$A = b \\times h = ${A}$.`, `$h = ${A} \\div ${b}$.`, `$h = ${h}$ cm.`],
      concept: "Reverse parallelogram area: $h = A/b$",
      hint1: "Divide the area by the base.",
      hint2: `Ask: ${b} × ? = ${A}?`,
      verify: `${b} × ${h} = ${A} ✓`,
      remember: "Every area formula can be run backwards by division.",
    });
  }
  const b = 2 * r.int(1, 12), h = r.int(2, 20), A = (b * h) / 2;
  return qS3({
    text: `A triangle has area $${A}$ cm$^2$ and base $${b}$ cm. Find its height (in cm).`,
    answer: String(h),
    steps: [`$A = \\tfrac{1}{2} \\times b \\times h$, so $2A = b \\times h$.`, `$2 \\times ${A} = ${b} \\times h$, i.e. $${2 * A} = ${b} \\times h$.`, `$h = ${2 * A} \\div ${b} = ${h}$ cm.`],
    concept: "Reverse triangle area: $h = 2A/b$",
    hint1: "Undo the half first: double the area.",
    hint2: `Then divide by the base ${b}.`,
    mistake: "Dividing $A$ (not $2A$) by the base forgets the hidden $\\tfrac{1}{2}$.",
    verify: `\\tfrac{1}{2} × ${b} × ${h} = ${A} ✓`,
    remember: "Triangle reverse: $h = 2A/b$ — double, then divide.",
  });
};

// ─── 9. area-circle (s4) ───────────────────────────────────────────────────
const areaCircle: GenFn = (r, d) => {
  if (d === 1) {
    const k = r.int(1, 10), rad = 7 * k, A = PI22 * rad * rad; // 22k²
    return qS4({
      text: `Find the area of a circle of radius $${rad}$ cm. ${TAKE22} (Answer in cm$^2$.)`,
      answer: dec(A, 2),
      tol: 0.01,
      steps: [`$A = \\pi r^2$.`, `$A = \\tfrac{22}{7} \\times ${rad} \\times ${rad} = \\tfrac{22}{7} \\times ${rad * rad}$.`, `$A = ${dec(A, 2)}$ cm$^2$.`],
      concept: "Area of a circle: $A = \\pi r^2$",
      hint1: "Square the radius first.",
      hint2: `Then multiply by $\\tfrac{22}{7}$.`,
      mistake: "$2\\pi r$ is the circumference. Area needs $r^2$, not $2r$.",
      remember: "Circumference is linear, area is squared: $2\\pi r$ vs $\\pi r^2$.",
    });
  }
  if (d === 2) {
    if (r.next() < 0.4) {
      const k = r.int(1, 5), dia = 14 * k, rad = 7 * k, A = PI22 * rad * rad;
      return qS4({
        text: `A circular plate has diameter $${dia}$ cm. Find its area. ${TAKE22} (Answer in cm$^2$.)`,
        answer: dec(A, 2),
        tol: 0.01,
        steps: [`Diameter $${dia}$ → radius $${dia} \\div 2 = ${rad}$ cm.`, `$A = \\pi r^2 = \\tfrac{22}{7} \\times ${rad}^2 = \\tfrac{22}{7} \\times ${rad * rad}$.`, `$A = ${dec(A, 2)}$ cm$^2$.`],
        concept: "Circle area from diameter: halve d, then $\\pi r^2$",
        hint1: "Convert diameter to radius before squaring.",
        hint2: `Radius $= ${rad}$; area $= \\tfrac{22}{7} r^2$.`,
        mistake: "Squaring the diameter gives 4× the area: $\\pi d^2 = 4\\pi r^2$.",
        remember: "d → r by halving; then $A = \\pi r^2$.",
      });
    }
    let dia = r.int(4, 60);
    let tries = 0;
    while (dia % 14 === 0 && tries < 50) { dia = r.int(4, 60); tries++; }
    if (dia % 14 === 0) dia = 16;
    const rad = dia / 2, A = P314 * rad * rad;
    return qS4({
      text: `Find the area of a circle of diameter $${dia}$ cm. ${TAKE314} (Answer in cm$^2$.)`,
      answer: dec(A, 2),
      tol: 0.05,
      steps: [`Radius $= ${dia} \\div 2 = ${dec(rad, 2)}$ cm.`, `$A = 3.14 \\times ${dec(rad, 2)}^2 = 3.14 \\times ${dec(rad * rad, 4)}$.`, `$A = ${dec(A, 2)}$ cm$^2$.`],
      concept: "Circle area from diameter with π = 3.14",
      hint1: "Halve the diameter, square it, multiply by 3.14.",
      hint2: `Radius is ${dec(rad, 2)} cm.`,
      mistake: "Using $\\pi d^2$ instead of $\\pi r^2$ quadruples the answer.",
      remember: "Halve d first — the square punishes forgetting.",
    });
  }
  if (d === 3) {
    if (r.next() < 0.5) {
      const i = r.int(2, 10);
      const j = r.int(1, i - 1);
      const R = 7 * i, ri = 7 * j, A = PI22 * (R * R - ri * ri);
      return qS4({
        text: `A circular ring (annulus) has outer radius $${R}$ cm and inner radius $${ri}$ cm. Find the area of the ring. ${TAKE22} (Answer in cm$^2$.)`,
        answer: dec(A, 2),
        tol: 0.01,
        steps: [
          `Ring area = outer disc − inner disc: $\\pi R^2 - \\pi r^2 = \\pi(R^2 - r^2)$.`,
          `$R^2 - r^2 = ${R}^2 - ${ri}^2 = ${R * R} - ${ri * ri} = ${R * R - ri * ri}$.`,
          `$A = \\tfrac{22}{7} \\times ${R * R - ri * ri} = ${dec(A, 2)}$ cm$^2$.`,
        ],
        concept: "Area of an annulus: $A = \\pi(R^2 - r^2)$",
        hint1: "The ring is what remains after punching out the inner circle.",
        hint2: "Subtract the squared radii, then apply π once.",
        mistake: "$\\pi(R - r)^2$ squares the *gap* — it forgets both discs' true sizes.",
        remember: "Annulus: $\\pi(R^2 - r^2)$, not $\\pi(R-r)^2$.",
      });
    }
    const ri = r.int(2, 12) + 0.5;
    const R = ri + r.int(2, 12) + 0.5;
    const A = P314 * (R * R - ri * ri);
    return qS4({
      text: `A washer has outer radius $${dec(R, 1)}$ cm and inner radius $${dec(ri, 1)}$ cm. Find its face area. ${TAKE314} (Answer in cm$^2$.)`,
      answer: dec(A, 2),
      tol: 0.05,
      steps: [
        `$A = \\pi(R^2 - r^2) = 3.14 \\times (${dec(R, 1)}^2 - ${dec(ri, 1)}^2)$.`,
        `$${dec(R, 1)}^2 = ${dec(R * R, 4)}$ and $${dec(ri, 1)}^2 = ${dec(ri * ri, 4)}$; difference $= ${dec(R * R - ri * ri, 4)}$.`,
        `$A = 3.14 \\times ${dec(R * R - ri * ri, 4)} = ${dec(A, 2)}$ cm$^2$.`,
      ],
      concept: "Annulus area with decimals: $\\pi(R^2 - r^2)$",
      hint1: "Square each radius separately, then subtract.",
      hint2: "Apply 3.14 only once, at the end.",
      mistake: "Rounding intermediate squares too early drifts the final answer.",
      remember: "Subtract squares first, π last.",
    });
  }
  const k = r.int(1, 12), A = 22 * k * k;
  if (r.next() < 0.5) {
    return qS4({
      text: `The area of a circle is $${A}$ cm$^2$. Find its radius. ${TAKE22} (Answer in cm.)`,
      answer: String(7 * k),
      tol: 0.01,
      steps: [`$A = \\tfrac{22}{7} r^2 = ${A}$.`, `$r^2 = ${A} \\times \\tfrac{7}{22} = ${7 * k * k}$.`, `$r = \\sqrt{${7 * k * k}} = ${7 * k}$ cm, since $${7 * k}^2 = ${7 * k * k}$.`],
      concept: "Reverse circle area: $r = \\sqrt{A/\\pi}$",
      hint1: "Divide by π to isolate $r^2$.",
      hint2: `Then take the square root of ${7 * k * k}.`,
      mistake: "Halving the area is not square-rooting it.",
      verify: `$\\tfrac{22}{7} \\times ${7 * k}^2 = ${A}$ ✓`,
      remember: "Area → radius: divide by π, then √.",
    });
  }
  const C = 44 * k;
  return qS4({
    text: `The area of a circle is $${A}$ cm$^2$. Find its circumference. ${TAKE22} (Answer in cm.)`,
    answer: String(C),
    tol: 0.01,
    steps: [
      `$\\tfrac{22}{7} r^2 = ${A} \\Rightarrow r^2 = ${7 * k * k} \\Rightarrow r = ${7 * k}$ cm.`,
      `Now the length formula: $C = 2\\pi r = 2 \\times \\tfrac{22}{7} \\times ${7 * k}$.`,
      `$C = ${C}$ cm.`,
    ],
    concept: "Area → radius → circumference (two-stage chain)",
    hint1: "Recover r from the area first.",
    hint2: "Then feed r into $C = 2\\pi r$.",
    mistake: "There is no direct area-to-circumference shortcut — go through r.",
    verify: `Area $\\tfrac{22}{7} \\times ${7 * k}^2 = ${A}$ and $C = 2\\pi r = ${C}$ ✓`,
    remember: "Area and circumference shake hands only through r.",
  });
};

// ─── 10. combo-shape (s4) ──────────────────────────────────────────────────
const comboShape: GenFn = (r, d) => {
  if (d <= 2) {
    const a = r.int(8, 20), b = r.int(6, 16);
    const c = r.int(2, a - 3), e = r.int(2, b - 3);
    const A = a * b - c * e;
    return qS4({
      text: `An L-shaped floor is made by cutting away a $${c}$ m $\\times$ $${e}$ m rectangle from one corner of a $${a}$ m $\\times$ $${b}$ m rectangle. Find the floor's area (in m$^2$).`,
      answer: String(A),
      steps: [
        `Full bounding rectangle: $${a} \\times ${b} = ${a * b}$ m$^2$.`,
        `The missing corner: $${c} \\times ${e} = ${c * e}$ m$^2$.`,
        `L-shape area $= ${a * b} - ${c * e} = ${A}$ m$^2$.`,
      ],
      concept: "Combined shapes: enclose, then subtract (or split and add)",
      hint1: "Imagine completing the rectangle, then removing the notch.",
      hint2: "Big rectangle minus corner rectangle.",
      mistake: "Using the outer dimensions for both parts double-counts the notch.",
      remember: "Subtract the hole, keep the L.",
    });
  }
  if (d === 3) {
    const a = r.int(8, 20), b = r.int(6, 16);
    const c = r.int(2, a - 3), e = r.int(2, b - 3);
    const P = 2 * (a + b);
    return qS4({
      text: `An L-shaped border is formed by cutting a $${c}$ m $\\times$ $${e}$ m corner out of a $${a}$ m $\\times$ $${b}$ m rectangle. Find the perimeter of the L-shape (in m).`,
      answer: String(P),
      steps: [
        `Walk the six sides: $${a} + (${b} - ${e}) + ${c} + ${e} + (${a} - ${c}) + ${b}$.`,
        `Every inward step $${c}$ or $${e}$ is cancelled by an outward step of the same size.`,
        `So the perimeter equals the full rectangle's: $P = 2($${a} + ${b}) = ${P}$ m.`,
      ],
      concept: "The push-out trick: a corner notch does not change the perimeter",
      hint1: "List all six sides of the L.",
      hint2: "Push the inner corner out — the outline becomes the full rectangle.",
      mistake: "Adding the notch's sides *again* inflates the perimeter.",
      verify: `Side walk total: ${a} + ${b - e} + ${c} + ${e} + ${a - c} + ${b} = ${P} ✓`,
      remember: "A corner notch moves the fence but not its length.",
    });
  }
  const wq = r.pick([2, 3, 4]);
  const w = 7 * wq;
  const l = 5 * r.int(4, 18);
  if (r.next() < 0.5) {
    const A = l * w + PI22 * (w / 2) * (w / 2);
    return qS4({
      text: `A running track is a rectangle $${l}$ m long and $${w}$ m wide, with a semicircular bend on each short end (diameter $${w}$ m). Find the total area inside the track. ${TAKE22} (Answer in m$^2$.)`,
      answer: dec(A, 2),
      tol: 0.01,
      steps: [
        `Rectangle: $${l} \\times ${w} = ${l * w}$ m$^2$.`,
        `The two semicircles join into one full circle of diameter $${w}$: radius $${w / 2}$ m.`,
        `Circle area: $\\tfrac{22}{7} \\times ${w / 2}^2 = \\tfrac{22}{7} \\times ${dec((w / 2) * (w / 2), 4)} = ${dec(PI22 * (w / 2) * (w / 2), 2)}$ m$^2$.`,
        `Total: $${l * w} + ${dec(PI22 * (w / 2) * (w / 2), 2)} = ${dec(A, 2)}$ m$^2$.`,
      ],
      concept: "Track area = rectangle + one full circle of the end diameter",
      hint1: "Two semicircles make one whole circle.",
      hint2: "Add the rectangle and that circle.",
      mistake: "Counting two full circles, or using $\\pi w^2$ with the diameter as radius.",
      remember: "Semicircle pair = one circle of the end's diameter.",
    });
  }
  const P = 2 * l + PI22 * w;
  return qS4({
    text: `A running track has two straight sides of $${l}$ m each, joined by two semicircular bends of diameter $${w}$ m. Find the total length of the inner boundary of the track. ${TAKE22} (Answer in m.)`,
    answer: dec(P, 2),
    tol: 0.01,
    steps: [
      `Two straights: $2 \\times ${l} = ${2 * l}$ m.`,
      `The two semicircular ends form one full circle of diameter $${w}$: length $\\pi w = \\tfrac{22}{7} \\times ${w} = ${dec(PI22 * w, 2)}$ m.`,
      `Boundary $= ${2 * l} + ${dec(PI22 * w, 2)} = ${dec(P, 2)}$ m.`,
    ],
    concept: "Track perimeter = 2 straights + one full circle (πd)",
    hint1: "The curved ends join into one complete circle.",
    hint2: "Add the two straights to that circle's circumference.",
    mistake: "Adding the diameter $${w}$ instead of its circumference forgets the bends entirely.",
    remember: "Stadium boundary: 2 straights + πd of curves.",
  });
};

// ─── 11. semi-circle (s4) ──────────────────────────────────────────────────
const semiCircle: GenFn = (r, d) => {
  if (d <= 2) {
    const k = r.int(1, 6), rad = 7 * k;
    const dia = 2 * rad;
    const askPeri = d === 2 ? true : r.next() < 0.5;
    if (askPeri) {
      const P = PI22 * rad + 2 * rad; // 22k + 14k = 36k
      return qS4({
        text: `A semicircular park has radius $${rad}$ m. Find its perimeter (the curved arc plus the diameter). ${TAKE22} (Answer in m.)`,
        answer: dec(P, 2),
        tol: 0.01,
        steps: [
          `Curved arc: half the circumference $= \\pi r = \\tfrac{22}{7} \\times ${rad} = ${dec(PI22 * rad, 2)}$ m.`,
          `Straight edge (the diameter): $2r = ${dia}$ m.`,
          `Perimeter $= ${dec(PI22 * rad, 2)} + ${dia} = ${dec(P, 2)}$ m.`,
        ],
        concept: "Semicircle perimeter: $\\pi r + 2r$",
        hint1: "Walk the shape: one curved arc, one straight edge.",
        hint2: "Arc = πr; then add the full diameter 2r.",
        mistake: "Answering $\\pi r$ alone forgets the diameter edge — the park has a straight side too.",
        verify: `Arc ${dec(PI22 * rad, 2)} + diameter ${dia} = ${dec(P, 2)} ✓`,
        remember: "Semicircle fence = πr (arc) + 2r (lid).",
      });
    }
    const A = (PI22 * rad * rad) / 2; // 77k²/... = 11·7k²/... → (22/7)(49k²)/2 = 77k²
    return qS4({
      text: `A semicircular window has radius $${rad}$ cm. Find the area of the glass. ${TAKE22} (Answer in cm$^2$.)`,
      answer: dec(A, 2),
      tol: 0.01,
      steps: [
        `Full circle area: $\\pi r^2 = \\tfrac{22}{7} \\times ${rad * rad} = ${dec(PI22 * rad * rad, 2)}$ cm$^2$.`,
        `Half of it: $A = \\tfrac{1}{2} \\pi r^2$.`,
        `$A = ${dec(A, 2)}$ cm$^2$.`,
      ],
      concept: "Semicircle area: $A = \\frac{1}{2}\\pi r^2$",
      hint1: "Half a circle means half the area.",
      hint2: `Compute $\\pi r^2$ for r = ${rad}, then halve.`,
      mistake: "Halving the radius instead of the area: $\\pi (r/2)^2$ is a quarter, not a half.",
      remember: "Half the circle: $A = \\frac{1}{2}\\pi r^2$ — halve the area, never the radius.",
    });
  }
  if (d === 3) {
    let rad = r.int(10, 150) / 10;
    let tries = 0;
    while (rad % 7 === 0 && tries < 50) { rad = r.int(10, 150) / 10; tries++; }
    if (rad % 7 === 0) rad = 6.5;
    if (r.next() < 0.5) {
      const A = (P314 * rad * rad) / 2;
      return qS4({
        text: `Find the area of a semicircle of radius $${dec(rad, 1)}$ cm. ${TAKE314} (Answer in cm$^2$.)`,
        answer: dec(A, 2),
        tol: 0.05,
        steps: [`$A = \\tfrac{1}{2}\\pi r^2 = \\tfrac{1}{2} \\times 3.14 \\times ${dec(rad, 1)}^2$.`, `$${dec(rad, 1)}^2 = ${dec(rad * rad, 4)}$.`, `$A = 1.57 \\times ${dec(rad * rad, 4)} = ${dec(A, 2)}$ cm$^2$.`],
        concept: "Semicircle area with π = 3.14",
        hint1: "Half of $3.14$ is $1.57$ — a handy constant.",
        hint2: "$A = 1.57 r^2$.",
        mistake: "Dropping the half, or halving the radius instead.",
        remember: "$A = 1.57 r^2$ when π = 3.14.",
      });
    }
    const P = P314 * rad + 2 * rad;
    return qS4({
      text: `Find the perimeter of a semicircle of radius $${dec(rad, 1)}$ cm (arc + diameter). ${TAKE314} (Answer in cm.)`,
      answer: dec(P, 2),
      tol: 0.05,
      steps: [`Arc: $\\pi r = 3.14 \\times ${dec(rad, 1)} = ${dec(P314 * rad, 2)}$ cm.`, `Diameter: $2r = ${dec(2 * rad, 1)}$ cm.`, `Perimeter $= ${dec(P314 * rad, 2)} + ${dec(2 * rad, 1)} = ${dec(P, 2)}$ cm.`],
      concept: "Semicircle perimeter with π = 3.14: $3.14r + 2r = 5.14r$",
      hint1: "Arc πr plus the straight lid 2r.",
      hint2: `So $P = 5.14 \\times ${dec(rad, 1)}$.`,
      mistake: "Using just $\\pi r$ — the flat edge is part of the walk.",
      remember: "$P = 5.14r$ (when π = 3.14).",
    });
  }
  const k = r.int(1, 10), A = 77 * k * k;
  return qS4({
    text: `The area of a semicircle is $${A}$ cm$^2$. Find its radius. ${TAKE22} (Answer in cm.)`,
    answer: String(7 * k),
    tol: 0.01,
    steps: [
      `$\\tfrac{1}{2} \\times \\tfrac{22}{7} \\times r^2 = ${A}$, i.e. $\\tfrac{11}{7} r^2 = ${A}$.`,
      `$r^2 = ${A} \\times \\tfrac{7}{11} = ${7 * k * k}$.`,
      `$r = \\sqrt{${7 * k * k}} = ${7 * k}$ cm.`,
    ],
    concept: "Reverse semicircle area: $r = \\sqrt{7A/11}$ when π = 22/7",
    hint1: "Undo the half first: the full circle would have area $2A$.",
    hint2: `Then $r^2 = 2A \\times \\tfrac{7}{22} = ${7 * k * k}$.`,
    mistake: "Forgetting to double A before dividing by π leaves a $\\tfrac{1}{2}$ buried in $r^2$.",
    verify: `$\\tfrac{1}{2} \\times \\tfrac{22}{7} \\times ${7 * k}^2 = ${A}$ ✓`,
    remember: "Semicircle reverse: double the area, then treat as a full circle.",
  });
};

// ─── bank ──────────────────────────────────────────────────────────────────
export const bank: Record<string, GenFn> = {
  "peri-poly": periPoly,
  "peri-puzzle": periPuzzle,
  "circumference": circumference,
  "arc-length": arcLength,
  "mcq-pi": mcqPi,
  "area-rect": areaRect,
  "area-para-tri": areaParaTri,
  "reverse-area": reverseArea,
  "area-circle": areaCircle,
  "combo-shape": comboShape,
  "semi-circle": semiCircle,
};

// Honest distinct-question parameter spaces per generator.
export const bankSize: Record<string, number> = {
  // d1 rect 57×57 | d2 four shapes (38 + 832 + 1444 + 76) | d3 missing-side ~12300 | d4 relation 2×22×3
  "peri-poly": 57 * 57 + 2390 + 12300 + 132, // 18071
  // Σ over half-perimeters 7..30 of ordered 3–4 pair selections with distinct products, ×2 (max/min)
  "peri-puzzle": 21846,
  // exact r/d forms 2×10 | decimal radii 241 | reverse 2×15 | wheels 4×19
  "circumference": 20 + 241 + 30 + 76, // 367
  // classic angles 7×5 | 5°-grid angles 61×10 | reverse 4×15
  "arc-length": 35 + 610 + 60, // 705
  // 8 templates with numeric variants (radii, ratios)
  "mcq-pi": 161,
  // direct 57×57+58 | from P ~1218 | cost 3249×5 rates×2 kinds | path ~1800
  "area-rect": 3307 + 1218 + 3249 * 5 * 2 + 1800, // 38815
  // para 27×24 | tri 27×24 | slant-trap ~2717 | reverse 2×648
  "area-para-tri": 648 + 648 + 2717 + 1296, // 5309
  // square 23 | rect ~2886 | P&A pairs 225 | para/tri reverse ~798
  "reverse-area": 23 + 2886 + 225 + 798, // 3932
  // r exact 10 | diameter forms 34 | rings ~150 | reverse 24
  "area-circle": 10 + 34 + 150 + 24, // 218
  // L area 10010 | L perimeter 10010 | track 15×3×2
  "combo-shape": 10010 + 10010 + 90, // 20110
  // exact 6×2+5 | decimal ~282 | reverse 10
  "semi-circle": 17 + 282 + 10, // 309
};
