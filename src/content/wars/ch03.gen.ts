import type { Diff, GenFn, Question } from "@/lib/wars/types";

// ─── helpers ───────────────────────────────────────────────────────────────
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
const frac = (n: number, d: number): string => {
  const g = gcd(n, d) || 1;
  const sn = n < 0 !== d < 0 ? "-" : "";
  return `${sn}${Math.abs(n) / g}/${Math.abs(d) / g}`;
};
const dec = (x: number, k = 3) => String(Math.round(x * 10 ** k) / 10 ** k);

function baseQ(p: Partial<Question> & Pick<Question, "text" | "answer" | "steps" | "concept" | "hint1" | "hint2">): Question {
  return { type: "numeric", diff: 1, ch: 3, sub: "s1", gen: "x", id: "x", ...p };
}

// ─── 1. integer-ops ────────────────────────────────────────────────────────
const intOps: GenFn = (r, d) => {
  let a: number, b: number, ans: number, op: string, txt = "", steps: string[] = [];
  if (d === 1) {
    a = r.int(12, 89); b = r.int(12, 89); ans = a + b; op = "+";
    txt = `Find the value of $${a} + ${b}$.`;
    steps = [`Line up the numbers and add the units first: $${a} + ${b}$.`, `Units: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}. Tens: ${Math.floor(a / 10) * 10} + ${Math.floor(b / 10) * 10}.`, `So $${a} + ${b} = ${ans}$.`];
  } else if (d === 2) {
    a = r.int(-99, -10); b = r.int(-99, -10); ans = a + b; op = "+";
    txt = `Find the value of $(${a}) + (${b})$.`;
    steps = [`Both numbers are negative, so we move $${Math.abs(b)}$ steps to the **left** of $${a}$ on the number line.`, `$(${a}) + (${b}) = -(${Math.abs(a) + Math.abs(b)})$.`, `So the sum is $${ans}$.`];
  } else if (d === 3) {
    a = r.nz(-12, 12); b = r.nz(-9, 9); ans = a * b; op = "×";
    txt = `Evaluate $(${a}) \\times (${b})$.`;
    steps = [`Multiply the magnitudes: $${Math.abs(a)} \\times ${Math.abs(b)} = ${Math.abs(ans)}$.`, `The signs are ${a * b > 0 ? "the same, so the product is positive" : "different, so the product is negative"}.`, `$(${a}) \\times (${b}) = ${ans}$.`];
  } else {
    a = r.int(6, 19); b = r.nz(-8, 8); const c = r.nz(-9, 9);
    ans = a * b + c; op = "mixed";
    txt = `Evaluate $${a} \\times (${b}) + (${c})$.`;
    steps = [`BODMAS: multiplication first. $${a} \\times (${b}) = ${a * b}$.`, `Now add: $${a * b} + (${c}) = ${ans}$.`, `Answer: $${ans}$.`];
  }
  return baseQ({ text: txt, answer: String(ans), steps, concept: "Integer operations and the number line (sign rules)", hint1: op === "+" && a < 0 ? "Two negatives add up to a bigger negative." : "Follow the sign rules carefully.", hint2: op === "mixed" ? "Do multiplication before addition (BODMAS)." : "Work on the magnitudes first, then fix the sign.", mistake: "A very common slip: $(-)\\times(-)=+$, not $-$.", verify: `Quick check: ${ans} ${ans > 0 ? ">" : "<"} 0 matches the expected sign.`, remember: "Same signs → positive product; opposite signs → negative product." });
};

// ─── 2. frac-dec ───────────────────────────────────────────────────────────
const fracDec: GenFn = (r, d) => {
  if (d <= 2) {
    const den = r.pick([2, 4, 5, 8, 10, 16, 20, 25]);
    const num = r.int(1, den - 1);
    const v = num / den;
    return baseQ({ text: `Express $\\frac{${num}}{${den}}$ as a decimal.`, answer: dec(v, 4), tol: 1e-9, steps: [`Divide: $${num} \\div ${den}$.`, `The denominator ${den} has only 2s and 5s as prime factors, so the division must finish — a terminating decimal.`, `Long division gives exactly $${dec(v, 4)}$.`], concept: "Converting fractions to terminating decimals", hint1: "Divide the numerator by the denominator.", hint2: "The decimal stops after finitely many digits — it terminates.", mistake: "Don't round too early — carry the division until it terminates exactly.", remember: "Denominators built from 2s and 5s always give terminating decimals." });
  }
  if (d === 3) {
    const den = r.pick([3, 6, 7, 9, 11, 12, 15]);
    const num = r.int(1, den - 1);
    const term = gcd(den, 10) === 1 && ![6, 12, 15].includes(den);
    const ans = term ? "terminating" : "recurring";
    return baseQ({ type: "tf", text: `True or False: the decimal expansion of $\\frac{${num}}{${den}}$ is ${ans === "terminating" ? "terminating" : "non-terminating recurring"}.`, answer: "true", accept: ["t"], steps: [`Factor the denominator $${den} = ${primeFactors(den)}$.`, `A fraction terminates iff the denominator (in lowest terms) has only $2$s and $5$s.`, gcd(den, num) === 1 ? `Here $\\frac{${num}}{${den}}$ is already in lowest terms.` : `Reduce first, then inspect the denominator.`, `Hence the expansion is ${ans === "terminating" ? "terminating" : "non-terminating recurring"} — the statement is true.`], concept: "Terminating vs recurring decimal criterion", hint1: "Look at the prime factors of the denominator.", hint2: "Only 2s and 5s → terminating; anything else → recurring.", remember: "Lowest terms first, then check the denominator's primes." });
  }
  const p = r.int(1, 98);
  const period = r.pick([1, 2]);
  const rep = period === 1 ? p % 10 || 9 : p % 100 || 37;
  const numer = rep, denom = period === 1 ? 9 : 99;
  return baseQ({ text: `Write $0.\\overline{${String(rep).padStart(period, "0")}}$ as a fraction in lowest terms (use the form $a/b$).`, answer: frac(numer, denom), accept: [`${numer}/${denom}`], steps: [`Let $x = 0.\\overline{${String(rep).padStart(period, "0")}}$.`, `Multiply by $${period === 1 ? 10 : 100}$: $${period === 1 ? "10x" : "100x"} = ${String(rep).padStart(period, "0")}.\\overline{${String(rep).padStart(period, "0")}}$.`, `Subtract: $${period === 1 ? "10x - x" : "100x - x"} = ${rep}$, so $x = \\frac{${rep}}{${period === 1 ? 9 : 99}}$.`, `Reduce by GCD: $\\frac{${rep}}{${period === 1 ? 9 : 99}} = ${frac(numer, denom)}$.`], concept: "Converting recurring decimals to fractions", hint1: "Multiply x by 10 or 100 so the repeating block shifts.", hint2: "Subtract the original equation to kill the repeating part.", mistake: "Don't forget to reduce the fraction to lowest terms.", verify: `Check: ${rep} ÷ ${period === 1 ? 9 : 99} = 0.${String(rep).repeat(3)}…`, remember: "$0.\\overline{ab} = ab/99$ and $0.\\overline{a} = a/9$." });
};

function primeFactors(n: number): string {
  const f: number[] = [];
  for (let p = 2; p * p <= n; p++) while (n % p === 0) { f.push(p); n /= p; }
  if (n > 1) f.push(n);
  return f.join(" \\times ");
}

// ─── 3. sqrt-simplify ──────────────────────────────────────────────────────
const sqrtSimplify: GenFn = (r, d) => {
  if (d <= 2) {
    const k = r.int(2, d === 1 ? 12 : 25);
    return baseQ({ text: `Evaluate $\\sqrt{${k * k}}$.`, answer: String(k), steps: [`Ask: which number squared gives $${k * k}$?`, `$${k} \\times ${k} = ${k * k}$.`, `So $\\sqrt{${k * k}} = ${k}$.`], concept: "Square roots of perfect squares", hint1: "Try small squares: 4, 9, 16, 25…", hint2: `Test $${k}$ — what do you get?`, remember: "√ undoes squaring." });
  }
  if (d === 3) {
    const m = r.int(2, 9); const p = r.pick([2, 3, 5, 6, 7, 10, 11]);
    const n = m * m * p;
    return baseQ({ text: `Write $\\sqrt{${n}}$ in the form $k\\sqrt{${p}}$. What is $k$?`, answer: String(m), steps: [`Factor: $${n} = ${m * m} \\times ${p}$ and $${m * m} = ${m}^2$.`, `$\\sqrt{${n}} = \\sqrt{${m}^2 \\times ${p}} = ${m}\\sqrt{${p}}$.`, `So $k = ${m}$.`], concept: "Extracting perfect-square factors from a surd", hint1: "Find the largest perfect square dividing " + n + ".", hint2: `Pull it out of the root as $${m}^2$.`, mistake: "Don't write $\\sqrt{a^2 b} = ab$ — only one factor comes out.", remember: "$\\sqrt{a^2b} = a\\sqrt{b}$ for $a \\ge 0$." });
  }
  const k = r.pick([2, 3, 5]);
  const a1 = r.int(2, 6), a2 = r.int(2, 6);
  const n1 = a1 * a1 * k, n2 = a2 * a2 * k;
  const coef = a1 + a2;
  return baseQ({ type: "fill", text: `Simplify fully: $\\sqrt{${n1}} + \\sqrt{${n2}}$. (Answer like $8\\sqrt{2}$.)`, answer: `${coef}\\sqrt{${k}}`, accept: [`${coef}sqrt${k}`, `${coef}√${k}`, `${coef}sqrt(${k})`], steps: [`$\\sqrt{${n1}} = ${a1}\\sqrt{${k}}$ because $${n1} = ${a1}^2 \\times ${k}$.`, `$\\sqrt{${n2}} = ${a2}\\sqrt{${k}}$.`, `Add like surds: $${a1}\\sqrt{${k}} + ${a2}\\sqrt{${k}} = ${coef}\\sqrt{${k}}$.`], concept: "Adding like surds", hint1: "Simplify each root into the form $a\\sqrt{k}$.", hint2: "Like surds add like coefficients — just as $3x+4x=7x$.", mistake: "$\\sqrt{a}+\\sqrt{b} \\ne \\sqrt{a+b}$ — simplify first!", remember: "Only like surds can be added." });
};

// ─── 4. rat-or-irrat ───────────────────────────────────────────────────────
const ratOrIrrat: GenFn = (r, d) => {
  const perfect = r.pick([4, 9, 16, 25, 36, 49, 64, 81]);
  const nonPerfect = r.pick([2, 3, 5, 6, 7, 8, 10, 12]);
  const rationals = [`\\sqrt{${perfect}}`, `\\frac{${r.int(2, 19)}}{${r.int(2, 9)}}`, `0.\\overline{${r.int(1, 9)}}`, `${r.int(2, 40)}.\\overline{${r.int(1, 99)}}`];
  const irrationals = [`\\sqrt{${nonPerfect}}`, "\\pi", `${r.int(1, 9)} + \\sqrt{${nonPerfect + 1}}`];
  const irr = r.pick(irrationals);
  const choices = [irr, ...r.pick(rationals) === irr ? rationals[0] : rationals[0], rationals[1], rationals[2]].slice(0, 4);
  const uniq = [...new Set([irr, rationals[0], rationals[1], rationals[2]])];
  while (uniq.length < 4) uniq.push(rationals[3]);
  const opts = r.next() < 0.5 ? uniq : [uniq[1], uniq[0], uniq[3], uniq[2]];
  return baseQ({ type: "mcq", text: `Which of these numbers is **irrational**?`, choices: opts.map((s) => `$${s}$`), answer: `$${irr}$`, steps: [`A rational number can be written as $\\frac{p}{q}$ with integers $p, q$ ($q \\ne 0$).`, `$${rationals[0]}$ is an integer, $${rationals[1]}$ is a fraction, and a repeating decimal is exactly a fraction — all rational.`, `$${irr}$ cannot be written as a ratio of integers (its decimal never repeats).`, `Hence $${irr}$ is the irrational one.`], concept: "Definition of rational vs irrational numbers", hint1: "Irrational = decimal never terminates and never repeats.", hint2: "Perfect squares under a root are rational; non-perfect squares are not.", mistake: "$\\sqrt{9}$ is rational! Irrationality depends on the number, not the √ symbol.", remember: "Non-perfect square roots, π and non-repeating decimals are irrational." });
};

// ─── 5. sqrt-between ───────────────────────────────────────────────────────
const sqrtBetween: GenFn = (r, d) => {
  const lo = d <= 2 ? 2 : 20, hi = d <= 2 ? 30 : 99;
  let n = r.int(lo, hi);
  while (Math.sqrt(n) % 1 === 0) n = r.int(lo, hi);
  const k = Math.floor(Math.sqrt(n));
  const wrong1 = `${k - 1} and ${k}`, wrong2 = `${k + 1} and ${k + 2}`, wrong3 = `${k} and ${k + 2}`;
  const choices = [`${k} and ${k + 1}`, wrong1, wrong2, wrong3];
  return baseQ({ type: "mcq", text: `Between which two consecutive integers does $\\sqrt{${n}}$ lie?`, choices, answer: `${k} and ${k + 1}`, steps: [`$${k}^2 = ${k * k}$ and $${k + 1}^2 = ${(k + 1) * (k + 1)}$.`, `Since $${k * k} < ${n} < ${(k + 1) * (k + 1)}$, taking square roots gives $${k} < \\sqrt{${n}} < ${k + 1}$.`, `So $\\sqrt{${n}}$ lies between $${k}$ and $${k + 1}$.`], concept: "Locating surds between consecutive integers", hint1: "Find the perfect squares just below and just above " + n + ".", hint2: `Try $${k}^2$ and $${k + 1}^2$.`, mistake: "√ sits between the roots of the *neighbouring* perfect squares, not midway.", remember: "Squaring is increasing, so it preserves the in-between order." });
};

// ─── 6. cyc-digit ──────────────────────────────────────────────────────────
const cycDigit: GenFn = (r, d) => {
  const b = r.pick([2, 3, 4, 6, 7, 8, 9]);
  const e = d === 1 ? r.int(3, 9) : d === 2 ? r.int(10, 40) : d === 3 ? r.int(40, 120) : r.int(300, 2026);
  // find cycle of last digit
  let x = 1; const seen: number[] = [];
  for (let i = 0; i < 12; i++) { x = (x * b) % 10; seen.push(x); }
  const cycleLen = 1 + seen.slice(1).indexOf(seen[0]) || seen.indexOf(seen[0], 1);
  const cyc = seen.slice(0, cycleLen);
  const lastDigit = cyc[(e - 1) % cyc.length];
  const cycStr = cyc.join(", ");
  return baseQ({ text: `What is the last digit of $${b}^{${e}}$?`, answer: String(lastDigit), steps: [`Powers of $${b}$ repeat their last digit in a cycle: $${cycStr}, ${cycStr}, \\ldots$ (length $${cyc.length}$).`, `$e = ${e}$; divide: $${e} = ${cyc.length}q + ${((e - 1) % cyc.length) + 1}$ position in the cycle.`, `Position $${((e - 1) % cyc.length) + 1}$ of the cycle $(${cycStr})$ gives $${lastDigit}$.`], concept: "Cyclic patterns of last digits of powers", hint1: "List the last digits of " + b + "^1, " + b + "^2, " + b + "^3, … until they repeat.", hint2: `The cycle length is $${cyc.length}$ — use the remainder of $${e}$.`, mistake: "The cycle position is (e − 1) mod L + 1, not e mod L.", verify: `Remainder check: ${e} mod ${cyc.length} = ${e % cyc.length}.`, remember: "Last digits of powers are cyclic — remainders pick the digit." });
};

// ─── 7. dec-order ──────────────────────────────────────────────────────────
const decOrder: GenFn = (r, d) => {
  const mk = (): { s: string; v: number } => {
    const kind = r.int(0, 2);
    if (kind === 0) { const n = r.int(11, 49), dd = r.pick([2, 4, 5, 8]); return { s: `\\frac{${n}}{${dd}}`, v: n / dd }; }
    if (kind === 1) { return { s: `${r.int(2, 12)}.${r.int(10, 99)}`, v: 0 }; }
    return { s: `${r.int(2, 12)}.${r.int(100, 999)}`, v: 0 };
  };
  const items = [mk(), mk(), mk(), mk()];
  // fill real values for decimal kinds
  items.forEach((it, i) => { if (it.v === 0) it.v = parseFloat(it.s); });
  const s = `${r.int(2, 9)}.${r.int(10, 99)}`;
  items[r.int(0, 3)] = { s, v: parseFloat(s) };
  const max = Math.max(...items.map((i) => i.v));
  const winner = items.find((i) => i.v === max)!;
  const uniqVals = new Set(items.map((i) => i.v));
  if (uniqVals.size < 4) return decOrder(r, d);
  const shuffled = [...items].sort(() => r.next() - 0.5);
  return baseQ({ diff: d, type: "mcq", text: `Which of the following is the **greatest** number?`, choices: shuffled.map((i) => `$${i.s}$`), answer: `$${winner.s}$`, steps: [`Convert every number to decimal form: ${shuffled.map((i) => `$${i.s} = ${dec(i.v, 4)}`).join(", ")}.`, `Compare the integer parts first; when equal, compare tenths, then hundredths.`, `The largest value is $${dec(max, 4)}$, which is $${winner.s}$.`], concept: "Comparing rationals in different forms", hint1: "Turn fractions into decimals first.", hint2: "Compare digit by digit from the left.", mistake: "More digits ≠ bigger value: 0.9 > 0.1234.", remember: "A common decimal form makes comparison safe." });
};

// ─── 8. numline-betw ───────────────────────────────────────────────────────
const numlineBetw: GenFn = (r, d) => {
  const a = r.int(-6, 4);
  const num = r.int(1, d >= 3 ? 7 : 3);
  const den = r.pick(d >= 3 ? [4, 5, 6, 7, 8, 9] : [2, 3, 4]);
  const b = a + r.int(2, 8);
  const v = a + ((b - a) * num) / den;
  return baseQ({ text: `A point $P$ lies $\\frac{${num}}{${den}}$ of the way from $A(${a})$ to $B(${b})$ on the number line. Find the coordinate of $P$.`, answer: dec(v, 4), tol: 1e-9, accept: [frac((b - a) * num + a * den, den)], steps: [`The distance from $A$ to $B$ is $${b} - (${a}) = ${b - a}$.`, `$\\frac{${num}}{${den}}$ of that distance is $\\frac{${num}}{${den}} \\times ${b - a} = ${dec(((b - a) * num) / den, 4)}$.`, `Starting at $A$: $${a} + ${dec(((b - a) * num) / den, 4)} = ${dec(v, 4)}$.`], concept: "Interpolating points on the number line", hint1: "Total jump = b − a. Take the given fraction of it.", hint2: "Add that share to A's coordinate.", given: [`A is at ${a}`, `B is at ${b}`, `P splits AB in ratio ${num}:${den - num}`], find: "Coordinate of P", mistake: "Measure from A, not from 0.", verify: `P is between ${a} and ${b}: ${a < v && v < b}.`, remember: "New point = start + fraction × (end − start)." });
};

// ─── 9. abs-ops ────────────────────────────────────────────────────────────
const absOps: GenFn = (r, d) => {
  const a = r.nz(-15, 15), b = r.nz(-15, 15);
  if (d <= 2) {
    const ans = Math.abs(a - b);
    return baseQ({ text: `Evaluate $|${a} - (${b})|$.`, answer: String(ans), steps: [`Inside the bars first: $${a} - (${b}) = ${a - b}$.`, `Absolute value makes it non-negative: $|${a - b}| = ${ans}$.`], concept: "Absolute value as distance", hint1: "Simplify inside the modulus first.", hint2: "Distance is never negative.", mistake: "$|a-b|$ is NOT $|a|-|b|$ in general.", remember: "|x| = distance of x from 0." });
  }
  const c = r.nz(-12, 12);
  const ans = Math.abs(a) + Math.abs(b) - Math.abs(c);
  return baseQ({ text: `Evaluate $|${a}| + |${b}| - |${c}|$.`, answer: String(ans), steps: [`$|${a}| = ${Math.abs(a)}$, $|${b}| = ${Math.abs(b)}$, $|${c}| = ${Math.abs(c)}$.`, `Combine: $${Math.abs(a)} + ${Math.abs(b)} - ${Math.abs(c)} = ${ans}$.`], concept: "Operations with absolute values", hint1: "Replace each |x| by its magnitude.", hint2: "Then do the plain arithmetic.", remember: "Absolute value strips the sign, then normal arithmetic applies." });
};

// ─── 10. dens-rat ──────────────────────────────────────────────────────────
const densRat: GenFn = (r, d) => {
  const den = r.pick(d <= 2 ? [5, 6, 8, 9] : [7, 11, 12, 13]);
  const n1 = r.int(1, den - 3);
  const gap = r.int(2, den - n1 - 1);
  const n2 = n1 + gap;
  const inside = n1 + r.int(1, gap - 1);
  const lo = n1 - r.int(2, 4), hi = n2 + r.int(2, 4);
  const mk = (n: number) => `$\\frac{${n}}{${den}}$`;
  const choices = [mk(inside), mk(Math.max(0, n1 - 1)), mk(n2 + 1), mk(hi)].filter((v, i, arr) => arr.indexOf(v) === i);
  while (choices.length < 4) choices.push(mk(hi + choices.length));
  const shuffled = [...choices].sort(() => r.next() - 0.5);
  return baseQ({ diff: d, type: "mcq", text: `Which number lies strictly between $${mk(n1)}$ and $${mk(n2)}$?`, choices: shuffled, answer: mk(inside), steps: [`With the common denominator $${den}$, compare numerators: we need $x$ with $${n1} < x < ${n2}$.`, `$${inside}$ satisfies $${n1} < ${inside} < ${n2}$.`, `So $${mk(inside)}$ lies between them.`], concept: "Density of rational numbers", hint1: "Same denominator → just compare numerators.", hint2: `Look for a numerator strictly between ${n1} and ${n2}.`, mistake: "Endpoints don't count — 'strictly between' excludes them.", verify: `${n1} < ${inside} < ${n2} ✓`, remember: "Between any two rationals hides another rational — infinitely many!" });
};

export const bank: Record<string, GenFn> = {
  "int-ops": intOps,
  "frac-dec": fracDec,
  "sqrt-simplify": sqrtSimplify,
  "rat-or-irrat": ratOrIrrat,
  "sqrt-between": sqrtBetween,
  "cyc-digit": cycDigit,
  "dec-order": decOrder,
  "numline-betw": numlineBetw,
  "abs-ops": absOps,
  "dens-rat": densRat,
};

export const bankSize: Record<string, number> = {
  "int-ops": 4 * 90 * 90,          // 4 diff branches × operand spaces
  "frac-dec": 8 * 24 + 7 * 23 + 98 * 2,
  "sqrt-simplify": 12 + 24 + 8 * 7 * 6 * 6,
  "rat-or-irrat": 8 * 9 * 9 * 4 * 3,
  "sqrt-between": 70 * 4,
  "cyc-digit": 7 * 2000,
  "dec-order": 39 * 4 * 4 * 900,
  "numline-betw": 11 * 7 * 6 * 7,
  "abs-ops": 31 * 31 + 31 * 31 * 25,
  "dens-rat": 4 * 6 * 5 * 6 * 7,
};
