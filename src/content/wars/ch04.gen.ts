import type { GenFn, Question, RNG } from "@/lib/wars/types";

// ─── helpers ───────────────────────────────────────────────────────────────
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
const sq = (x: number): number => x * x;
const par = (n: number): string => (n < 0 ? `(${n})` : `${n}`);

/** Polynomial string from [coef, symbol] pairs, highest degree first (compact form, e.g. "x^2+14x+49"). */
function poly(terms: [number, string][]): string {
  let s = "";
  for (const [c, sym] of terms) {
    if (c === 0) continue;
    const mag = Math.abs(c);
    const piece = `${sym && mag === 1 ? "" : mag}${sym}`;
    s = s ? `${s}${c < 0 ? "-" : "+"}${piece}` : (c < 0 ? "-" : "") + piece;
  }
  return s || "0";
}

const spaced = (s: string): string => s.replace(/([+-])/g, " $1 ").trim();
const fillAcc = (s: string): string[] => [s, spaced(s)];
const pairAcc = (A: string, B: string): string[] => [`${A}${B}`, `${B}${A}`, spaced(`${A}${B}`), spaced(`${B}${A}`)];
const fbin = (c: number): string => `(x${c < 0 ? "-" : "+"}${Math.abs(c)})`;

function coprimePair(r: RNG, lo: number, hi: number): [number, number] {
  let u = r.int(lo, hi), v = r.int(lo, hi);
  for (let i = 0; i < 80 && gcd(u, v) !== 1; i++) { u = r.int(lo, hi); v = r.int(lo, hi); }
  return [u, v];
}

function baseQ(p: Partial<Question> & Pick<Question, "text" | "answer" | "steps" | "concept" | "hint1" | "hint2">): Question {
  return { type: "numeric", diff: 1, ch: 4, sub: "s2", gen: "x", id: "x", ...p };
}

// ─── 1. expand-square ──────────────────────────────────────────────────────
const expandSquare: GenFn = (r, d) => {
  if (d === 1) {
    const b = r.int(2, 12);
    const ans = poly([[1, "x^2"], [2 * b, "x"], [sq(b), ""]]);
    return baseQ({
      type: "fill", diff: d,
      text: `Expand $(x + ${b})^2$.`,
      answer: ans, accept: fillAcc(ans),
      steps: [
        `Use the identity $(a+b)^2 = a^2 + 2ab + b^2$ with $a = x$ and $b = ${b}$.`,
        `First term: $a^2 = x^2$.`,
        `Middle term: $2ab = 2 \\times x \\times ${b} = ${2 * b}x$.`,
        `Last term: $b^2 = ${b}^2 = ${sq(b)}$.`,
        `So $(x + ${b})^2 = ${ans}$.`,
      ],
      concept: "Square of a binomial: $(a+b)^2 = a^2 + 2ab + b^2$",
      hint1: "Apply the identity $(a+b)^2 = a^2 + 2ab + b^2$ term by term.",
      hint2: `The middle term is $2 \\times x \\times ${b}$; the last term is $${b}^2$.`,
      mistake: "The classic forge accident: $(x+b)^2 \\ne x^2 + b^2$ — the middle term $2ab$ never evaporates.",
      verify: `Check with $x = 1$: LHS $= (${1 + b})^2 = ${sq(1 + b)}$; RHS $= 1 + ${2 * b} + ${sq(b)} = ${1 + 2 * b + sq(b)}$. Match!`,
      remember: "Square the first, double the product, square the last.",
    });
  }
  if (d === 2) {
    const b = r.int(2, 25), s = r.sign();
    const ans = poly([[1, "x^2"], [s * 2 * b, "x"], [sq(b), ""]]);
    return baseQ({
      type: "fill", diff: d,
      text: `Expand $\\left(x ${s > 0 ? "+" : "-"} ${b}\\right)^2$.`,
      answer: ans, accept: fillAcc(ans),
      steps: [
        s > 0 ? `Use $(a+b)^2 = a^2 + 2ab + b^2$ with $a = x$, $b = ${b}$.` : `Use $(a-b)^2 = a^2 - 2ab + b^2$ with $a = x$, $b = ${b}$.`,
        `First term: $x^2$; last term: $b^2 = ${sq(b)}$ — always positive.`,
        s > 0 ? `Middle term: $2ab = 2 \\times x \\times ${b} = ${2 * b}x$.` : `Middle term: $-2ab = -2 \\times x \\times ${b} = -${2 * b}x$.`,
        `So the expansion is $${ans}$.`,
      ],
      concept: "Binomial squares: $(a \\pm b)^2 = a^2 \\pm 2ab + b^2$",
      hint1: "Only the middle term changes sign; the constant term stays positive.",
      hint2: `Double product: $2 \\times x \\times ${b}$, then attach the sign.`,
      mistake: "$(x-b)^2$ ends with $+b^2$, never $-b^2$ — squaring erases the minus.",
      verify: `Check with $x = 0$: LHS $= (${s * b})^2 = ${sq(b)}$; constant term of the expansion is $${sq(b)}$. Match!`,
      remember: "$(a \\pm b)^2 = a^2 \\pm 2ab + b^2$ — middle sign follows the operator, last term never does.",
    });
  }
  if (d === 3) {
    const p = r.int(2, 9), q = r.int(1, 30), s = r.sign();
    const ans = poly([[sq(p), "x^2"], [s * 2 * p * q, "x"], [sq(q), ""]]);
    return baseQ({
      type: "fill", diff: d,
      text: `Expand $(${p}x ${s > 0 ? "+" : "-"} ${q})^2$.`,
      answer: ans, accept: fillAcc(ans),
      steps: [
        `Treat $${p}x$ as the first term and $${q}$ as the second in $(A \\pm B)^2 = A^2 \\pm 2AB + B^2$.`,
        `First: $(${p}x)^2 = ${sq(p)}x^2$ — square the coefficient too.`,
        `Middle: $2 \\cdot ${p}x \\cdot ${par(s * q)} = ${s * 2 * p * q}x$.`,
        `Last: $${q}^2 = ${sq(q)}$.`,
        `Result: $${ans}$.`,
      ],
      concept: "Binomial square applied to $(px \\pm q)^2$",
      hint1: `Square the whole first term: $(${p}x)^2 = ${sq(p)}x^2$.`,
      hint2: `Middle term $= 2 \\times ${p}x \\times ${q}$, keeping the sign.`,
      mistake: `Don't forget to square the coefficient: $(${p}x)^2 = ${sq(p)}x^2$, not $${p}x^2$.`,
      verify: `Check with $x = 1$: LHS $= (${p * 1 + s * q})^2 = ${sq(p + s * q)}$; RHS $= ${sq(p)} ${s * 2 * p * q > 0 ? "+" : "-"} ${Math.abs(2 * p * q)} + ${sq(q)} = ${sq(p + s * q)}$. Match!`,
      remember: "$(px \\pm q)^2 = p^2x^2 \\pm 2pqx + q^2.",
    });
  }
  const a = r.int(2, 25);
  if (r.next() < 0.5) {
    return baseQ({
      type: "fill", diff: d,
      text: `Simplify $(x + ${a})^2 - (x - ${a})^2$. (Answer in the form $kx$.)`,
      answer: `${4 * a}x`,
      steps: [
        `Expand: $(x + ${a})^2 = x^2 + ${2 * a}x + ${sq(a)}$.`,
        `And $(x - ${a})^2 = x^2 - ${2 * a}x + ${sq(a)}$.`,
        `Subtract: the $x^2$ and constant terms cancel; $${2 * a}x - (-${2 * a}x) = ${4 * a}x$.`,
        `So the difference is $${4 * a}x$.`,
      ],
      concept: "Difference of matched binomial squares: $(x+a)^2 - (x-a)^2 = 4ax$",
      hint1: "Expand both squares fully before subtracting.",
      hint2: "Subtracting a negative flips it: the middle terms add up instead of cancelling.",
      mistake: `Subtracting $(x-${a})^2$ flips ALL its signs: $-(-${2 * a}x)$ becomes $+${2 * a}x$.`,
      verify: `Test $x = 1$: $(${1 + a})^2 - (${1 - a})^2 = ${sq(a + 1)} - ${sq(a - 1)} = ${4 * a}$ ✓.`,
      remember: "$(x+a)^2 - (x-a)^2 = 4ax$; the sum is $2x^2 + 2a^2$.",
    });
  }
  const ansS = poly([[2, "x^2"], [2 * sq(a), ""]]);
  return baseQ({
    type: "fill", diff: d,
    text: `Simplify $(x + ${a})^2 + (x - ${a})^2$. (Answer in the form $kx^2 + c$.)`,
    answer: ansS, accept: fillAcc(ansS),
    steps: [
      `Expand: $(x + ${a})^2 = x^2 + ${2 * a}x + ${sq(a)}$.`,
      `And $(x - ${a})^2 = x^2 - ${2 * a}x + ${sq(a)}$.`,
      `Add: $x^2 + x^2 = 2x^2$; the middle terms cancel; constants give $${2 * sq(a)}$.`,
      `So the sum is $${ansS}$.`,
    ],
    concept: "Sum of matched binomial squares: $(x+a)^2 + (x-a)^2 = 2x^2 + 2a^2$",
    hint1: "Expand both squares fully before adding.",
    hint2: "The $\\pm 2ax$ middle terms are opposites — they annihilate.",
    mistake: "The middle terms cancel in the SUM but double in the DIFFERENCE — don't swap them.",
    verify: `Test $x = 1$: $(${1 + a})^2 + (${1 - a})^2 = ${sq(a + 1)} + ${sq(a - 1)} = ${2 + 2 * sq(a)}$ ✓.`,
    remember: "Sum kills the middle; difference kills the squares.",
  });
};

// ─── 2. mental-square ──────────────────────────────────────────────────────
const mentalSquare: GenFn = (r, d) => {
  if (d === 1) {
    const t = r.int(2, 12), b = r.int(1, 9), a = 10 * t, n = a + b;
    return baseQ({
      diff: d,
      text: `Compute $${n}^2$ mentally using $(a+b)^2 = a^2 + 2ab + b^2$.`,
      answer: String(n * n),
      steps: [
        `Split: $${n} = ${a} + ${b}$.`,
        `$${a}^2 = ${sq(a)}$, $2ab = 2 \\times ${a} \\times ${b} = ${2 * a * b}$, $${b}^2 = ${sq(b)}$.`,
        `Add the three pieces: $${sq(a)} + ${2 * a * b} + ${sq(b)} = ${n * n}$.`,
        `So $${n}^2 = ${n * n}$ — no pen needed.`,
      ],
      concept: "Mental squaring via $(a+b)^2$",
      hint1: `Split ${n} into a round tens part and a units part.`,
      hint2: `Take $a = ${a}$, $b = ${b}$ and add $a^2 + 2ab + b^2$.`,
      mistake: "Only square the parts after splitting — $(a+b)^2$ is three pieces, not two.",
      verify: `Direct check: ${n} × ${n} = ${n * n} ✓.`,
      remember: "Round number first, units second: $a^2 + 2ab + b^2$.",
    });
  }
  if (d === 2) {
    const k = r.int(2, 30), s = r.sign(), n = 100 + s * k;
    return baseQ({
      diff: d,
      text: `Compute $${n}^2$ in your head by writing it as $(100 ${s > 0 ? "+" : "-"} ${k})^2$.`,
      answer: String(n * n),
      steps: [
        `$${n} = 100 ${s > 0 ? "+" : "-"} ${k}$: take $a = 100$, $b = ${k}$.`,
        `$a^2 = 10000$.`,
        s > 0 ? `$2ab = 200 \\times ${k} = ${200 * k}$.` : `$2ab = 200 \\times ${k} = ${200 * k}$ — subtract this.`,
        `$b^2 = ${sq(k)}$.`,
        s > 0 ? `Total: $10000 + ${200 * k} + ${sq(k)} = ${n * n}$.` : `Total: $10000 - ${200 * k} + ${sq(k)} = ${n * n}$.`,
      ],
      concept: "Mental squaring around a base of 100",
      hint1: `$(100 \\pm k)^2 = 10000 \\pm 200k + k^2$.`,
      hint2: `Here $k = ${k}$: compute $200 \\times ${k}$ and $${k}^2$.`,
      mistake: "Sign discipline: for $(100-k)^2$ the $200k$ is subtracted but $k^2$ is still ADDED.",
      verify: `Direct check: ${n} × ${n} = ${n * n} ✓.`,
      remember: "$(100 \\pm k)^2 = 10000 \\pm 200k + k^2$ — the forge's favourite shortcut.",
    });
  }
  if (d === 3) {
    const A = r.pick([15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 150, 200]);
    const b = r.int(1, Math.min(25, A - 1));
    const n1 = A + b, n2 = A - b, ans = n1 * n2;
    return baseQ({
      diff: d,
      text: `Use $(a+b)(a-b) = a^2 - b^2$ to compute $${n1} \\times ${n2}$ mentally.`,
      answer: String(ans),
      steps: [
        `Spot the pattern: $${n1} = ${A} + ${b}$ and $${n2} = ${A} - ${b}$ — they straddle $${A}$ equally.`,
        `So $${n1} \\times ${n2} = (${A} + ${b})(${A} - ${b}) = ${A}^2 - ${b}^2$.`,
        `$${A}^2 = ${sq(A)}$ and $${b}^2 = ${sq(b)}$.`,
        `Subtract: $${sq(A)} - ${sq(b)} = ${ans}$.`,
      ],
      concept: "Difference of squares for mental products",
      hint1: `Both numbers sit ${b} away from ${A}.`,
      hint2: `Answer $= ${A}^2 - ${b}^2 = ${sq(A)} - ${sq(b)}$.`,
      mistake: "The trick needs equal offsets: $97 \\times 104$ does not fit the pattern.",
      verify: `Sanity: the product ${ans} sits just below ${A}² = ${sq(A)} ✓.`,
      remember: "(a+b)(a−b) = a² − b² turns awkward products into a subtraction.",
    });
  }
  const A = r.pick([150, 200, 300, 500, 1000]), k = r.int(2, 40), s = r.sign(), n = A + s * k;
  return baseQ({
    diff: d,
    text: `Compute $${n}^2$ mentally.`,
    answer: String(n * n),
    steps: [
      `$${n} = ${A} ${s > 0 ? "+" : "-"} ${k}$: take $a = ${A}$, $b = ${k}$.`,
      `$a^2 = ${sq(A)}$.`,
      s > 0 ? `$2ab = 2 \\times ${A} \\times ${k} = ${2 * A * k}$.` : `$2ab = 2 \\times ${A} \\times ${k} = ${2 * A * k}$ — subtract this.`,
      `$b^2 = ${sq(k)}$.`,
      s > 0 ? `Total: $${sq(A)} + ${2 * A * k} + ${sq(k)} = ${n * n}$.` : `Total: $${sq(A)} - ${2 * A * k} + ${sq(k)} = ${n * n}$.`,
    ],
    concept: "Mental squaring around a large round base",
    hint1: `Write ${n} as (${A} ± ${k}) and use $(a \\pm b)^2$.`,
    hint2: `Work out $${A}^2$, $2 \\times ${A} \\times ${k}$ and $${k}^2$ separately.`,
    mistake: `For $(${A} - ${k})^2$, subtract $2ab$ but still ADD $b^2$ — the last term is a square.`,
    verify: `Direct check: ${n} × ${n} = ${n * n} ✓.`,
    remember: "Big mental squares = round base $\\pm$ small offset.",
  });
};

// ─── 3. expand-prod ────────────────────────────────────────────────────────
const expandProd: GenFn = (r, d) => {
  if (d === 1) {
    const a = r.int(1, 15), b = r.int(1, 15);
    const ans = poly([[1, "x^2"], [a + b, "x"], [a * b, ""]]);
    return baseQ({
      type: "fill", diff: d,
      text: `Expand $(x + ${a})(x + ${b})$.`,
      answer: ans, accept: fillAcc(ans),
      steps: [
        `Use $(x+a)(x+b) = x^2 + (a+b)x + ab$.`,
        `Sum: $${a} + ${b} = ${a + b}$ — the middle coefficient.`,
        `Product: $${a} \\times ${b} = ${a * b}$ — the constant.`,
        `So $(x + ${a})(x + ${b}) = ${ans}$.`,
      ],
      concept: "$(x+a)(x+b) = x^2 + (a+b)x + ab$",
      hint1: "Middle coefficient = sum of the constants; constant = their product.",
      hint2: `Add $${a} + ${b}$ and multiply $${a} \\times ${b}$.`,
      mistake: "Sum goes with $x$; product stands alone — swapping them scrambles the polynomial.",
      verify: `Test $x = 1$: LHS $= ${1 + a} \\times ${1 + b} = ${sq(1) + (a + b) + a * b}$; RHS $= 1 + ${a + b} + ${a * b}$. Match!`,
      remember: "Sum in the middle, product at the end.",
    });
  }
  if (d === 2) {
    const a = r.int(2, 30), c = r.int(2, 25);
    const ans = poly([[1, "x^2"], [a - c, "x"], [-a * c, ""]]);
    return baseQ({
      type: "fill", diff: d,
      text: `Expand $(x + ${a})(x - ${c})$.`,
      answer: ans, accept: fillAcc(ans),
      steps: [
        `Use $(x+a)(x+b) = x^2 + (a+b)x + ab$ with $b = -${c}$.`,
        `Sum: $${a} + (-${c}) = ${a - c}$ — keep the sign!`,
        `Product: $${a} \\times (-${c}) = -${a * c}$.`,
        `Result: $${ans}$.`,
      ],
      concept: "$(x+a)(x+b) = x^2 + (a+b)x + ab$ with mixed signs",
      hint1: `Treat the second bracket as $(x + (-${c}))$.`,
      hint2: `Middle: $${a} - ${c} = ${a - c}$; constant: $-${a * c}$.`,
      mistake: "The constant term takes the sign of the PRODUCT, and one negative factor makes it negative.",
      verify: `Test $x = 1$: LHS $= ${1 + a} \\times ${1 - c} = ${sq(1) + (a - c) - a * c}$; RHS $= 1 ${a - c >= 0 ? "+" : "-"} ${Math.abs(a - c)} ${-a * c >= 0 ? "+" : "-"} ${Math.abs(a * c)}$. Match!`,
      remember: "Mixed signs → negative constant is your instant smell-test.",
    });
  }
  if (d === 3) {
    const a = r.nz(-20, 20), b = r.nz(-20, 20);
    const xc = (n: number) => `x ${n < 0 ? "-" : "+"} ${Math.abs(n)}`;
    return baseQ({
      diff: d,
      text: `In the expansion of $(${xc(a)})(${xc(b)})$, what is the coefficient of $x$?`,
      answer: String(a + b),
      steps: [
        `Multiply out: the $x$ terms are (outer) $x \\cdot ${par(b)}$ and (inner) $${par(a)} \\cdot x$.`,
        `Coefficient of $x$ = sum of the two constants: $${par(a)} ${b < 0 ? "-" : "+"} ${Math.abs(b)} = ${a + b}$.`,
        `For contrast, the constant term is their product: $${par(a)} \\times (${b}) = ${a * b}$.`,
      ],
      concept: "Coefficient of $x$ in $(x+a)(x+b)$ is $a+b$",
      hint1: "The $x$ coefficient collects the OUTER and INNER products — that is just the sum of the constants.",
      hint2: `Compute $${par(a)} ${b < 0 ? "-" : "+"} ${Math.abs(b)}$.`,
      mistake: "Sum gives the $x$ coefficient; product gives the constant — don't swap them.",
      remember: "In $(x+a)(x+b)$: $x$-coefficient $= a+b$, constant $= ab$.",
    });
  }
  let p = r.int(2, 5), q = r.int(1, 20), s = r.nz(-20, 20);
  for (let i = 0; i < 40 && p * s + q === 0; i++) { s = r.nz(-20, 20); }
  const ans = poly([[p * p, "x^2"], [p * s + q, "x"], [q * s, ""]]);
  return baseQ({
    type: "fill", diff: d,
    text: `Expand $(${p}x + ${q})(x ${s < 0 ? "-" : "+"} ${Math.abs(s)})$.`,
    answer: ans, accept: fillAcc(ans),
    steps: [
      `Multiply each term of $(${p}x + ${q})$ by each term of $(x ${s < 0 ? "-" : "+"} ${Math.abs(s)})$.`,
      `First: $${p}x \\cdot x = ${p}x^2$.`,
      `Outer + inner: $${p}x \\cdot ${par(s)} = ${p * s}x$ and $${q} \\cdot x = ${q}x$ — middle $= ${p * s + q}x$.`,
      `Last: $${q} \\cdot ${par(s)} = ${q * s}$.`,
      `Result: $${ans}$.`,
    ],
    concept: "Expanding a linear × linear product with a leading coefficient",
    hint1: `Four products: $${p}x \\cdot x$, $${p}x \\cdot ${par(s)}$, $${q} \\cdot x$, $${q} \\cdot ${par(s)}$.`,
    hint2: `The middle coefficient is $${p} \\times ${par(s)} + ${q} = ${p * s + q}$.`,
    mistake: "Outer AND inner both feed the middle term — dropping one is the top expansion error.",
    remember: "(px+q)(x+s) = px² + (ps+q)x + qs.",
  });
};

// ─── 4. identity-pick ──────────────────────────────────────────────────────
const identityPick: GenFn = (r, d) => {
  let text = "", correct = "", concept = "", hint1 = "", hint2 = "", mistake = "", remember = "";
  let steps: string[] = [];
  let choices: string[] = [];
  if (d === 1) {
    const b = r.int(2, 15);
    correct = `$x^2 + ${2 * b}x + ${sq(b)}$`;
    choices = [correct, `$x^2 + ${b}x + ${sq(b)}$`, `$x^2 + ${sq(b)}$`, `$x^2 + ${2 * b}x + ${b + 1}$`];
    text = `Which expansion is correct for $(x + ${b})^2$?`;
    steps = [
      `Apply $(a+b)^2 = a^2 + 2ab + b^2$ with $a = x$, $b = ${b}$.`,
      `Middle term: $2ab = 2 \\times ${b}x = ${2 * b}x$.`,
      `Last term: $${b}^2 = ${sq(b)}$.`,
      `Only $x^2 + ${2 * b}x + ${sq(b)}$ carries the full double product — the others halved or dropped it.`,
    ];
    concept = "Recognising the correct binomial-square expansion";
    hint1 = "The middle term of a binomial square is 2ab, never ab.";
    hint2 = `Compute $2 \\times ${b}$ and $${b}^2$, then compare the options.`;
    mistake = "Writing $bx$ instead of $2bx$ in the middle is the most common expansion slip.";
    remember = "$(a+b)^2 = a^2 + 2ab + b^2$ — the double product is compulsory.";
  } else if (d === 2) {
    const b = r.int(2, 15), s = r.sign();
    if (s > 0) {
      correct = `$x^2 + ${2 * b}x + ${sq(b)}$`;
      choices = [correct, `$x^2 + ${b}x + ${sq(b)}$`, `$x^2 + ${sq(b)}$`, `$x^2 + ${2 * b}x + ${b + 1}$`];
    } else {
      correct = `$x^2 - ${2 * b}x + ${sq(b)}$`;
      choices = [correct, `$x^2 + ${2 * b}x + ${sq(b)}$`, `$x^2 - ${b}x + ${sq(b)}$`, `$x^2 - ${2 * b}x - ${sq(b)}$`];
    }
    text = `Which expansion is correct for $\\left(x ${s > 0 ? "+" : "-"} ${b}\\right)^2$?`;
    steps = [
      `$(a \\pm b)^2 = a^2 \\pm 2ab + b^2$: the middle copies the sign, the last term does not.`,
      `Middle: $\\pm 2ab = ${s > 0 ? "+" : "-"}${2 * b}x$.`,
      `Last: $${b}^2 = ${sq(b)}$, positive either way.`,
      `So the correct expansion is ${correct}.`,
    ];
    concept = "Sign discipline in binomial squares";
    hint1 = "Two traps: halving the middle, and flipping the sign of b².";
    hint2 = `Middle $= \\pm${2 * b}x$; last $= +${sq(b)}$.`;
    mistake = "$(x-b)^2 = x^2 - 2bx + b^2$ — the minus never reaches the last term.";
    remember = "In $(a \\pm b)^2$ only the middle term follows the sign — the last term stays $+b^2$.";
  } else if (d === 3) {
    const [p, q, mean, off] = r.pick([
      [97, 103, 100, 3], [51, 49, 50, 1], [48, 52, 50, 2], [102, 98, 100, 2],
      [63, 57, 60, 3], [71, 69, 70, 1], [45, 55, 50, 5], [88, 112, 100, 12],
      [37, 43, 40, 3], [56, 64, 60, 4], [19, 21, 20, 1],
    ] as [number, number, number, number][]);
    correct = `$(a+b)(a-b) = a^2 - b^2$`;
    choices = [
      `$(a-b)^2 = a^2 - 2ab + b^2$`, correct,
      `$(a+b)^2 = a^2 + 2ab + b^2$`, `$(x+a)(x+b) = x^2 + (a+b)x + ab$`,
    ];
    text = `To compute $${p} \\times ${q}$ in one flash, which identity should you reach for?`;
    steps = [
      `$${p} = ${mean} ${p - mean >= 0 ? "+" : "-"} ${off}$ and $${q} = ${mean} ${q - mean >= 0 ? "+" : "-"} ${off}$ — equal offsets around $${mean}$.`,
      `So the product is $(${mean} + ${off})(${mean} - ${off})$, a pure difference of squares.`,
      `$${p} \\times ${q} = ${mean}^2 - ${off}^2 = ${sq(mean)} - ${sq(off)} = ${p * q}$.`,
    ];
    concept = "Choosing identities for mental computation";
    hint1 = "Both factors hug a round number with equal offsets — which identity loves that shape?";
    hint2 = `Write $${p} = ${mean} ${p - mean >= 0 ? "+" : "-"} ${off}$ and $${q} = ${mean} ${q - mean >= 0 ? "+" : "-"} ${off}$, then apply $(a+b)(a-b)$.`;
    mistake = "Squaring identities need the SAME number twice; here the two factors differ — that screams difference of squares.";
    remember = "Equal offsets around a round number → (a+b)(a−b) = a² − b².";
  } else {
    if (r.next() < 0.5) {
      correct = `$(a-b)^2 = a^2 - 2ab + b^2$`;
      choices = [correct, `$(a-b)^2 = a^2 - 2ab - b^2$`, `$(a-b)^2 = a^2 + 2ab + b^2$`, `$(a-b)^2 = a^2 - b^2$`];
      text = `Given $(a+b)^2 = a^2 + 2ab + b^2$, replace $b$ by $-b$. Which identity results?`;
      steps = [
        `Substitute $-b$ for $b$ everywhere in $(a+b)^2 = a^2 + 2ab + b^2$.`,
        `Middle: $2a(-b) = -2ab$ — the sign flips.`,
        `Last: $(-b)^2 = +b^2$ — squaring erases the minus.`,
        `So $(a-b)^2 = a^2 - 2ab + b^2$: one identity gives birth to another.`,
      ];
      concept = "Deriving $(a-b)^2$ from $(a+b)^2$ by substitution";
      hint1 = "Replace every b with (−b) and simplify each term.";
      hint2 = "Middle term changes sign; the squared term does not.";
      mistake = "Substituting −b does NOT make the last term negative: (−b)² = +b².";
      remember = "Every minus-version identity is a substitution away from a plus-version.";
    } else {
      correct = `$(a+b)(a-b)$`;
      choices = [correct, `$(a-b)^2$`, `$a^2 + b^2$`, `$(a+b)^2 - 4ab$`];
      text = `Which expression is identical to $a^2 - b^2$ for every value of $a$ and $b$?`;
      steps = [
        `Expand the candidate: $(a+b)(a-b) = a^2 - ab + ab - b^2 = a^2 - b^2$ ✓.`,
        `$(a-b)^2 = a^2 - 2ab + b^2 \\ne a^2 - b^2$.`,
        `$a^2 + b^2$ only adds — it never subtracts $b^2$.`,
        `And $(a+b)^2 - 4ab = a^2 - 2ab + b^2 = (a-b)^2$, still not $a^2 - b^2$.`,
      ];
      concept = "Difference of squares as a product";
      hint1 = "Expand each candidate fully and compare.";
      hint2 = "The cross terms must cancel exactly: −ab + ab.";
      mistake = "$(a-b)^2$ is NOT $a^2 - b^2$ — the $-2ab$ middle term separates them forever.";
      remember = "a² − b² = (a+b)(a−b): the only identity that IS a difference of squares.";
    }
  }
  const shuffled = [...choices].sort(() => r.next() - 0.5);
  return baseQ({
    type: "mcq", diff: d, text, choices: shuffled, answer: correct, steps, concept, hint1, hint2, mistake, remember,
  });
};

// ─── 5. coeff-find ─────────────────────────────────────────────────────────
const coeffFind: GenFn = (r, d) => {
  if (d === 1) {
    const b = r.int(2, 15);
    return baseQ({
      diff: d,
      text: `If $(x + ${b})^2 = x^2 + kx + ${sq(b)}$, find $k$.`,
      answer: String(2 * b),
      steps: [
        `Expand the left side with $(a+b)^2 = a^2 + 2ab + b^2$.`,
        `$(x + ${b})^2 = x^2 + ${2 * b}x + ${sq(b)}$.`,
        `Compare with $x^2 + kx + ${sq(b)}$: the constants already agree.`,
        `So $k = 2 \\times ${b} = ${2 * b}$.`,
      ],
      concept: "Matching coefficients in a binomial square",
      hint1: "Expand the square and match the coefficient of x term by term.",
      hint2: `The middle term is $2 \\times x \\times ${b}$.`,
      mistake: "k is the FULL middle coefficient 2ab — writing ab = b loses half.",
      verify: `With $k = ${2 * b}$: $x^2 + ${2 * b}x + ${sq(b)} = (x+${b})^2$ ✓.`,
      remember: "Matching coefficients compares like powers of x, position by position.",
    });
  }
  if (d === 2) {
    const c = r.int(2, 20);
    return baseQ({
      diff: d,
      text: `Find the constant $k$ so that $x^2 + ${2 * c}x + k$ is a perfect square trinomial.`,
      answer: String(sq(c)),
      steps: [
        `A perfect square trinomial has the form $(x + m)^2 = x^2 + 2mx + m^2$.`,
        `Match the middle: $2m = ${2 * c}$, so $m = ${c}$.`,
        `Then the constant must be $m^2 = ${sq(c)}$.`,
        `Check: $x^2 + ${2 * c}x + ${sq(c)} = (x + ${c})^2$ ✓.`,
      ],
      concept: "Completing a perfect square trinomial",
      hint1: "Halve the coefficient of x — that number is m.",
      hint2: `Then $k = m^2$ with $m = ${c}$.`,
      mistake: "k = m², not 2m and not m — square the halved coefficient.",
      verify: `Expand $(x+${c})^2$: $x^2 + ${2 * c}x + ${sq(c)}$ ✓.`,
      remember: "Perfect square trinomial: middle = 2m, constant = m².",
    });
  }
  if (d === 3) {
    const a = r.int(2, 15), b = r.int(2, 15);
    return baseQ({
      diff: d,
      text: `If $(x + ${a})(x + ${b}) = x^2 + kx + ${a * b}$, find $k$.`,
      answer: String(a + b),
      steps: [
        `Expand with $(x+a)(x+b) = x^2 + (a+b)x + ab$.`,
        `The constant matches: $${a} \\times ${b} = ${a * b}$ ✓.`,
        `The middle coefficient is $a + b = ${a} + ${b} = ${a + b}$.`,
        `So $k = ${a + b}$.`,
      ],
      concept: "Matching coefficients in a product of linears",
      hint1: "k is the sum of the two constants.",
      hint2: `Compute $${a} + ${b}$.`,
      mistake: "The product ab sits at the end; the SUM rides with x.",
      verify: `Test $x = 1$: LHS $= ${1 + a} \\times ${1 + b} = ${1 + (a + b) + a * b}$; RHS $= 1 + ${a + b} + ${a * b}$ ✓.`,
      remember: "(x+a)(x+b): sum → x-coefficient, product → constant.",
    });
  }
  const c = r.int(2, 9);
  return baseQ({
    diff: d,
    text: `In the expansion of $(x + ${c})^3$, the coefficient of $x$ is $k$. Find $k$.`,
    answer: String(3 * sq(c)),
    steps: [
      `Cube the binomial: $(x + c)^3 = x^3 + 3x^2c + 3xc^2 + c^3$.`,
      `Substitute $c = ${c}$: $x^3 + ${3 * c}x^2 + ${3 * sq(c)}x + ${c ** 3}$.`,
      `The coefficient of $x$ is $3c^2 = 3 \\times ${sq(c)} = ${3 * sq(c)}$.`,
      `(For contrast, the $x^2$ coefficient is only $3c = ${3 * c}$.)`,
    ],
    concept: "Coefficients in the cube of a binomial",
    hint1: "$(x+c)^3 = x^3 + 3x^2c + 3xc^2 + c^3$ — the x-term carries c².",
    hint2: `Compute $3 \\times (${c})^2$.`,
    mistake: "The x² term carries 3c but the x term carries 3c² — swapping them wrecks the cube.",
    verify: `Full expansion: $x^3 + ${3 * c}x^2 + ${3 * sq(c)}x + ${c ** 3}$; test $x = 1$: LHS $= (${1 + c})^3 = ${(1 + c) ** 3}$; RHS $= ${1 + 3 * c + 3 * sq(c) + c ** 3}$ ✓.`,
    remember: "(x+c)³ = x³ + 3cx² + 3c²x + c³ — powers of c climb as powers of x fall.",
  });
};

// ─── 6. cube-expand ────────────────────────────────────────────────────────
const cubeExpand: GenFn = (r, d) => {
  if (d === 1) {
    const b = r.int(1, 6);
    const ans = poly([[1, "x^3"], [3 * b, "x^2"], [3 * sq(b), "x"], [b ** 3, ""]]);
    return baseQ({
      type: "fill", diff: d,
      text: `Expand $(x + ${b})^3$.`,
      answer: ans, accept: fillAcc(ans),
      steps: [
        `Use $(a+b)^3 = a^3 + 3a^2b + 3ab^2 + b^3$ with $a = x$, $b = ${b}$.`,
        `$a^3 = x^3$.`,
        `$3a^2b = 3 \\times x^2 \\times ${b} = ${3 * b}x^2$.`,
        `$3ab^2 = 3 \\times x \\times ${sq(b)} = ${3 * sq(b)}x$ and $b^3 = ${b ** 3}$.`,
        `Assemble: $${ans}$.`,
      ],
      concept: "Cube of a binomial: $(a+b)^3 = a^3 + 3a^2b + 3ab^2 + b^3$",
      hint1: "Pattern: 1-3-3-1 with powers of b climbing 0,1,2,3.",
      hint2: `Compute $3 \\times ${b}$, $3 \\times ${sq(b)}$ and $${b}^3$.`,
      mistake: "$(a+b)^3 \\ne a^3 + b^3$ — the two middle terms are the whole point.",
      verify: `Test $x = 1$: LHS $= (${1 + b})^3 = ${(1 + b) ** 3}$; RHS $= ${1 + 3 * b + 3 * sq(b) + b ** 3}$ ✓.`,
      remember: "(a+b)³: coefficients 1, 3, 3, 1 — Pascal's triangle row three.",
    });
  }
  if (d === 2) {
    const b = r.int(1, 10), s = r.sign();
    const ans = poly([[1, "x^3"], [s * 3 * b, "x^2"], [3 * sq(b), "x"], [s * b ** 3, ""]]);
    return baseQ({
      type: "fill", diff: d,
      text: `Expand $\\left(x ${s > 0 ? "+" : "-"} ${b}\\right)^3$.`,
      answer: ans, accept: fillAcc(ans),
      steps: [
        `Use $(a ${s > 0 ? "+" : "-"} b)^3 = a^3 ${s > 0 ? "+" : "-"} 3a^2b + 3ab^2 ${s > 0 ? "+" : "-"} b^3$ with $a = x$, $b = ${b}$.`,
        `Signs alternate: $x^3$, then $${s * 3 * b}x^2$, then $+${3 * sq(b)}x$, then $${s * b ** 3}$.`,
        `Note $3ab^2 = 3 \\times ${sq(b)}x$ stays positive — only odd positions flip.`,
        `Result: $${ans}$.`,
      ],
      concept: "Cube of a binomial with subtraction",
      hint1: "Alternating signs: +, −, +, − when the bracket has a minus.",
      hint2: `Middle terms: $-${3 * b}x^2$ and $+${3 * sq(b)}x$.`,
      mistake: "Both the $x^2$ AND constant terms flip sign; the $x$ term does not.",
      verify: `Test $x = 1$: LHS $= (${1 + s * b})^3 = ${(1 + s * b) ** 3}$; RHS $= ${1 + s * 3 * b + 3 * sq(b) + s * b ** 3}$ ✓.`,
      remember: "$(a-b)^3 = a^3 - 3a^2b + 3ab^2 - b^3$ — sign flips ride the odd powers.",
    });
  }
  if (d === 3) {
    const k = r.int(1, 15), s = r.sign(), n = 100 + s * k;
    return baseQ({
      diff: d,
      text: `Use the cube identity to compute $${n}^3$ mentally.`,
      answer: String(n ** 3),
      steps: [
        `$${n} = 100 ${s > 0 ? "+" : "-"} ${k}$: take $a = 100$, $b = ${k}$ in $(a \\pm b)^3$.`,
        `$a^3 = 1000000$.`,
        `$3a^2b = 3 \\times 10000 \\times ${k} = ${30000 * k}$ ${s > 0 ? "(add)" : "(subtract)"}.`,
        `$3ab^2 = 300 \\times ${sq(k)} = ${300 * sq(k)}$ (add) and $b^3 = ${k ** 3}$ ${s > 0 ? "(add)" : "(subtract)"}.`,
        s > 0 ? `Total: $1000000 + ${30000 * k} + ${300 * sq(k)} + ${k ** 3} = ${n ** 3}$.` : `Total: $1000000 - ${30000 * k} + ${300 * sq(k)} - ${k ** 3} = ${n ** 3}$.`,
      ],
      concept: "Mental cubing via $(a \\pm b)^3$ around a base of 100",
      hint1: "$(100 \\pm k)^3 = 1000000 \\pm 30000k + 300k^2 \\pm k^3$.",
      hint2: `Compute the three small pieces for $k = ${k}$ and collect with signs.`,
      mistake: "Signs alternate — $300k^2$ is always added, even for $(100-k)^3$.",
      verify: `Direct check: ${n}³ = ${n ** 3} ✓.`,
      remember: "Cubing near 100: 1000000, ±30000k, +300k², ±k³.",
    });
  }
  const p = r.int(1, 4), q = r.int(2, 12);
  const A = p === 1 ? "x" : `${p}x`;
  return baseQ({
    diff: d,
    text: `In the expansion of $(${A} + ${q})^3$, what is the coefficient of $x^2$?`,
    answer: String(3 * sq(p) * q),
    steps: [
      `$(A + B)^3 = A^3 + 3A^2B + 3AB^2 + B^3$ with $A = ${A}$, $B = ${q}$.`,
      `The $x^2$ term comes only from $3A^2B$: $3 \\times (${A})^2 \\times ${q}$.`,
      `$= 3 \\times ${sq(p)} \\times ${q} = ${3 * sq(p) * q}$.`,
    ],
    concept: "Reading coefficients from $(px+q)^3$",
    hint1: "Only the 3A²B piece contains exactly two powers of x.",
    hint2: `Coefficient $= 3 \\times ${p}^2 \\times ${q}$.`,
    mistake: "3AB² carries only ONE power of x — it feeds the x-term, not x².",
    remember: "(px+q)³: x³ → p³, x² → 3p²q, x → 3pq², const → q³.",
  });
};

// ─── 7. cube-identity ──────────────────────────────────────────────────────
const cubeIdentity: GenFn = (r, d) => {
  if (d === 1 || d === 2) {
    const s = d === 1 ? r.int(3, 15) : r.int(5, 25);
    const p = r.int(2, Math.max(2, Math.floor(sq(s) / 4)));
    const ans = s ** 3 - 3 * p * s;
    return baseQ({
      diff: d,
      text: `If $a + b = ${s}$ and $ab = ${p}$, find $a^3 + b^3$.`,
      answer: String(ans),
      steps: [
        `Crown identity: $a^3 + b^3 = (a+b)^3 - 3ab(a+b)$.`,
        `Substitute: $(${s})^3 - 3(${p})(${s})$.`,
        `$= ${s ** 3} - ${3 * p * s}$.`,
        `Answer: $${ans}$.`,
      ],
      concept: "$a^3+b^3 = (a+b)^3 - 3ab(a+b)$",
      hint1: "You never need a and b separately — only their sum and product.",
      hint2: `Compute $${s}^3$ first, then $3 \\times ${p} \\times ${s}$.`,
      mistake: "Don't expand (a+b)³ and forget the −3ab(a+b) correction — that correction IS the identity.",
      verify: `Real $a, b$ exist since $s^2 - 4p = ${sq(s) - 4 * p} \\ge 0$ ✓.`,
      remember: "a³+b³ = (a+b)³ − 3ab(a+b): sum cubed, minus three products.",
    });
  }
  if (d === 3) {
    const s = r.int(2, 15), p = r.int(2, 30);
    const ans = s ** 3 + 3 * p * s;
    return baseQ({
      diff: d,
      text: `If $a - b = ${s}$ and $ab = ${p}$, find $a^3 - b^3$.`,
      answer: String(ans),
      steps: [
        `Twin identity: $a^3 - b^3 = (a-b)^3 + 3ab(a-b)$.`,
        `Substitute: $(${s})^3 + 3(${p})(${s})$.`,
        `$= ${s ** 3} + ${3 * p * s}$.`,
        `Answer: $${ans}$.`,
      ],
      concept: "$a^3-b^3 = (a-b)^3 + 3ab(a-b)$",
      hint1: "Same skeleton as a³+b³, but the correction term adds.",
      hint2: `Compute $${s}^3 + 3 \\times ${p} \\times ${s}$.`,
      mistake: "For the difference of cubes the 3ab(a−b) term is ADDED, not subtracted.",
      verify: `Sanity: $a^3 - b^3 > (a-b)^3$ because $ab > 0$ — and ${ans} > ${s ** 3} ✓.`,
      remember: "a³−b³ = (a−b)³ + 3ab(a−b): the plus repairs what the difference removed.",
    });
  }
  const s = r.int(3, 20);
  const p = r.int(1, Math.max(1, Math.floor(sq(s) / 4)));
  const t = s ** 3 - 3 * p * s;
  return baseQ({
    diff: 4,
    text: `If $a + b = ${s}$ and $a^3 + b^3 = ${t}$, find $ab$.`,
    answer: String(p),
    steps: [
      `Identity: $a^3 + b^3 = (a+b)^3 - 3ab(a+b)$.`,
      `Substitute: $${t} = ${s ** 3} - 3ab \\times ${s}$.`,
      `So $3ab \\times ${s} = ${s ** 3} - ${t} = ${s ** 3 - t}$.`,
      `$ab = ${s ** 3 - t} \\div ${3 * s} = ${p}$.`,
    ],
    concept: "Reversing $a^3+b^3 = (a+b)^3 - 3ab(a+b)$",
    hint1: "Treat ab as the unknown; everything else is known.",
    hint2: `Isolate: $3ab(${s}) = ${s}^3 - ${t}$.`,
    mistake: "Don't try to find a and b themselves — the identity hands you ab directly.",
    verify: `Forward check: $(${s})^3 - 3(${p})(${s}) = ${s ** 3} - ${3 * p * s} = ${t}$ ✓.`,
    remember: "The identity works in both directions — cubes can uncover the product.",
  });
};

// ─── 8. tri-sq-combo ───────────────────────────────────────────────────────
const triSqCombo: GenFn = (r, d) => {
  // d1 keeps small friendly numbers; d2-d4 widen the space (larger magnitudes still verify)
  const hi = d === 1 ? 15 : 30;
  const a = r.int(2, hi), b = r.int(2, hi), c = r.int(2, hi);
  if (d === 1) {
    const s = a + b + c;
    return baseQ({
      diff: d,
      text: `Use $(a+b+c)^2 = a^2 + b^2 + c^2 + 2ab + 2bc + 2ca$ to evaluate $(${a}+${b}+${c})^2$.`,
      answer: String(s * s),
      steps: [
        `Squares: $${a}^2 = ${sq(a)}$, $${b}^2 = ${sq(b)}$, $${c}^2 = ${sq(c)}$.`,
        `Cross terms: $2ab = ${2 * a * b}$, $2bc = ${2 * b * c}$, $2ca = ${2 * c * a}$.`,
        `Add all six: $${sq(a)} + ${sq(b)} + ${sq(c)} + ${2 * a * b} + ${2 * b * c} + ${2 * c * a} = ${s * s}$.`,
        `So $(${a}+${b}+${c})^2 = ${s * s}$.`,
      ],
      concept: "Square of a trinomial",
      hint1: "Three squares plus three doubled products — six pieces total.",
      hint2: `First find $${a}+${b}+${c} = ${s}$, so the answer is $${s}^2$.`,
      mistake: "Pair every term with every other: ab, bc AND ca — three cross terms, not two.",
      verify: `Direct: ${a} + ${b} + ${c} = ${s}, and ${s}² = ${s * s} ✓.`,
      remember: "(a+b+c)² = a²+b²+c² + 2(ab+bc+ca).",
    });
  }
  if (d === 2) {
    const ans = 2 * (a * b + b * c + c * a);
    return baseQ({
      diff: d,
      text: `For $a = ${a}$, $b = ${b}$, $c = ${c}$, find the value of $2(ab + bc + ca)$.`,
      answer: String(ans),
      steps: [
        `$ab = ${a} \\times ${b} = ${a * b}$.`,
        `$bc = ${b} \\times ${c} = ${b * c}$ and $ca = ${c} \\times ${a} = ${c * a}$.`,
        `Sum: $${a * b} + ${b * c} + ${c * a} = ${a * b + b * c + c * a}$.`,
        `Double it: $2 \\times ${a * b + b * c + c * a} = ${ans}$.`,
      ],
      concept: "Cross-term total in $(a+b+c)^2$",
      hint1: "Form all three pairwise products first.",
      hint2: `Then double: $2(${a * b} + ${b * c} + ${c * a})$.`,
      mistake: "There are three pairs (ab, bc, ca) — forgetting ca shortchanges the total.",
      verify: `This is exactly $(a+b+c)^2 - (a^2+b^2+c^2) = ${sq(a + b + c)} - ${sq(a) + sq(b) + sq(c)} = ${ans}$ for these values ✓.`,
      remember: "2(ab+bc+ca) is the connective tissue of every three-term square.",
    });
  }
  if (d === 3) {
    const s = a + b + c, q = sq(a) + sq(b) + sq(c);
    const m = (s * s - q) / 2;
    return baseQ({
      diff: d,
      text: `If $a + b + c = ${s}$ and $a^2 + b^2 + c^2 = ${q}$, find $ab + bc + ca$.`,
      answer: String(m),
      steps: [
        `Identity: $(a+b+c)^2 = a^2+b^2+c^2 + 2(ab+bc+ca)$.`,
        `So $2(ab+bc+ca) = ${s}^2 - ${q} = ${s * s} - ${q} = ${s * s - q}$.`,
        `Divide by 2: $ab+bc+ca = ${m}$.`,
      ],
      concept: "Extracting pairwise products from a three-term square",
      hint1: "Subtract the sum of squares from the square of the sum.",
      hint2: `Then halve: $(${s * s} − ${q}) \\div 2$.`,
      mistake: "Don't forget the factor 2 — (a+b+c)² contains 2(ab+bc+ca), not (ab+bc+ca).",
      verify: `Rebuild: ${q} + 2×${m} = ${q + 2 * m} = ${s}² ✓.`,
      remember: "ab+bc+ca = [(a+b+c)² − (a²+b²+c²)] ÷ 2.",
    });
  }
  const s = a + b + c, m = a * b + b * c + c * a;
  return baseQ({
    diff: 4,
    text: `If $a + b + c = ${s}$ and $ab + bc + ca = ${m}$, find $a^2 + b^2 + c^2$.`,
    answer: String(s * s - 2 * m),
    steps: [
      `Identity: $(a+b+c)^2 = a^2+b^2+c^2 + 2(ab+bc+ca)$.`,
      `So $a^2+b^2+c^2 = ${s}^2 - 2 \\times ${m}$.`,
      `$= ${s * s} - ${2 * m} = ${s * s - 2 * m}$.`,
    ],
    concept: "Sum of squares from sum and pairwise products",
    hint1: "The squares are what remains after removing the cross terms.",
    hint2: `Compute $${s}^2$ and subtract $2 \\times ${m}$.`,
    mistake: "Subtract 2(ab+bc+ca), not (ab+bc+ca) — the cross terms are doubled in the square.",
    verify: `Rebuild: ${s * s - 2 * m} + 2×${m} = ${s * s} = ${s}² ✓.`,
    remember: "a²+b²+c² = (a+b+c)² − 2(ab+bc+ca).",
  });
};
// ─── 9. eval-area ──────────────────────────────────────────────────────────
const evalArea: GenFn = (r, d) => {
  if (d === 1) {
    const a = 10 * r.int(1, 8), b = r.int(1, 9), n = a + b;
    return baseQ({
      diff: d,
      text: `A square courtyard has side $(${a} + ${b})$ m. Using the split-area model $(a+b)^2 = a^2 + 2ab + b^2$, find its area in $\\text{m}^2$.`,
      answer: String(n * n),
      steps: [
        `Side: $${a} + ${b} = ${n}$ m.`,
        `Four tiles: $${a}^2 = ${sq(a)}$, two strips of $${a} \\times ${b} = ${a * b}$ each, and a $${b}^2 = ${sq(b)}$ corner.`,
        `Total: $${sq(a)} + ${2 * a * b} + ${sq(b)} = ${n * n}$.`,
        `So the courtyard covers $${n * n}$ m².`,
      ],
      concept: "Area model of $(a+b)^2$",
      hint1: "Cut the square into a², two ab strips and b².",
      hint2: `Pieces: ${sq(a)}, ${a * b}, ${a * b}, ${sq(b)} — add them.`,
      mistake: "Two strips, not one: the layout has an $a \\times b$ rectangle on each arm.",
      verify: `Direct: ${n} × ${n} = ${n * n} ✓.`,
      remember: "Every binomial square is one big tile, two strips and one corner.",
    });
  }
  if (d === 2) {
    const a = r.int(6, 40), b = r.int(1, Math.min(8, a - 1));
    const L = a + b, W = a - b, ans = sq(a) - sq(b);
    return baseQ({
      diff: d,
      text: `A rectangle measures $(${a} + ${b})$ cm by $(${a} - ${b})$ cm. Use $(a+b)(a-b) = a^2 - b^2$ to find its area.`,
      answer: String(ans),
      steps: [
        `Sides: $${a} + ${b} = ${L}$ and $${a} - ${b} = ${W}$.`,
        `Area $= (${a}+${b})(${a}-${b}) = ${a}^2 - ${b}^2$.`,
        `$= ${sq(a)} - ${sq(b)} = ${ans}$.`,
        `So the rectangle covers $${ans}$ cm².`,
      ],
      concept: "Area model of the difference of squares",
      hint1: "The rectangle (a+b) × (a−b) rearranges into a² with a b² bite removed.",
      hint2: `Compute $${sq(a)} − ${sq(b)}$.`,
      mistake: "(a+b)(a−b) is a² − b², NOT (a−b)² = a² − 2ab + b².",
      verify: `Direct: ${L} × ${W} = ${ans} ✓.`,
      remember: "Equal-offset rectangle → difference of two squares.",
    });
  }
  if (d === 3) {
    const a = 10 * r.int(1, 6), b = r.int(1, 9), A = sq(a + b);
    return baseQ({
      diff: d,
      text: `A square tile has side $(${a} + b)$ cm and area $${A}$ cm$^2$. Find the value of $b$.`,
      answer: String(b),
      steps: [
        `Side $= a + b$, so $\\sqrt{${A}} = a + b$.`,
        `$\\sqrt{${A}} = ${a + b}$, so $a + b = ${a + b}$ with $a = ${a}$.`,
        `$b = ${a + b} - ${a} = ${b}$.`,
        `Area-model check: $${sq(a)} + 2 \\times ${a} \\times ${b} + ${sq(b)} = ${sq(a)} + ${2 * a * b} + ${sq(b)} = ${A}$ ✓.`,
      ],
      concept: "Reversing the area model of $(a+b)^2$",
      hint1: "Take the square root of the area to recover the side.",
      hint2: `The side is $${a + b}$, and $a = ${a}$ — so $b$ is the leftover.`,
      mistake: "The side is (a + b), not a: subtract a from the side length, not from the area.",
      verify: `(${a} + ${b})² = ${A} ✓.`,
      remember: "Square root first, then peel off the known part.",
    });
  }
  const a = r.int(8, 50), b = r.int(2, a - 2);
  const ans = sq(a) - sq(b);
  return baseQ({
    diff: 4,
    text: `A square photo frame has outer side $${a}$ cm and a square window of side $${b}$ cm cut from its centre. Find the area of the frame wood (outer square minus window).`,
    answer: String(ans),
    steps: [
      `Outer area: $${a}^2 = ${sq(a)}$ cm².`,
      `Window: $${b}^2 = ${sq(b)}$ cm².`,
      `Frame: $${sq(a)} - ${sq(b)}$.`,
      `Identity view: $${a}^2 - ${b}^2 = (${a}+${b})(${a}-${b}) = ${a + b} \\times ${a - b} = ${ans}$.`,
    ],
    concept: "Difference of squares as a region between two squares",
    hint1: "Frame area = big square − small square.",
    hint2: `Use $a^2 - b^2$ with $a = ${a}$, $b = ${b}$.`,
    mistake: "The leftover frame is NOT a square — don't write (a−b)² for it.",
    verify: `Direct: ${sq(a)} − ${sq(b)} = ${ans} ✓.`,
    remember: "a² − b² measures any ring between two squares.",
  });
};

// ─── 10. factor-common ─────────────────────────────────────────────────────
const factorCommon: GenFn = (r, d) => {
  if (d === 1) {
    const g = r.int(2, 9);
    const [u, v] = coprimePair(r, 1, 9);
    const ans = `${g}(${u === 1 ? "" : u}x+${v})`;
    return baseQ({
      type: "fill", diff: d,
      text: `Factorise completely: $${g * u}x + ${g * v}$.`,
      answer: ans, accept: fillAcc(ans),
      steps: [
        `The GCF of $${g * u}$ and $${g * v}$ is $${g}$.`,
        `$${g * u}x = ${g} \\cdot ${u === 1 ? "x" : `${u}x`}$ and $${g * v} = ${g} \\cdot ${v}$.`,
        `Pull out $${g}$: $${g * u}x + ${g * v} = ${ans}$.`,
      ],
      concept: "Factorising out the greatest common factor",
      hint1: "Find the largest number dividing BOTH coefficients.",
      hint2: `Divide each term by ${g} and keep the bracket.`,
      mistake: "Taking out a smaller common factor (e.g. 1) is not factorising completely.",
      verify: `Expand back: ${g} × (${u === 1 ? "" : u}x + ${v}) = ${g * u}x + ${g * v} ✓.`,
      remember: "GCF out front, leftovers in the bracket.",
    });
  }
  if (d === 2) {
    const g = r.int(2, 9);
    const [u, v] = coprimePair(r, 1, 9);
    const ans = `${g}x(${u === 1 ? "" : u}x+${v})`;
    return baseQ({
      type: "fill", diff: d,
      text: `Factorise completely: $${g * u}x^2 + ${g * v}x$.`,
      answer: ans, accept: fillAcc(ans),
      steps: [
        `Both terms share $${g}$ AND at least one $x$ — the GCF is $${g}x$.`,
        `$${g * u}x^2 = ${g}x \\cdot ${u === 1 ? "x" : `${u}x`}$ and $${g * v}x = ${g}x \\cdot ${v}$.`,
        `So $${g * u}x^2 + ${g * v}x = ${ans}$.`,
      ],
      concept: "GCF including the lowest power of x",
      hint1: "The common factor is a number times the lowest power of x present.",
      hint2: `Take out $${g}x$ — the second term loses its $x$ entirely.`,
      mistake: "Forgetting the x in the GCF leaves an unfactorised x behind.",
      verify: `Expand back: ${g}x(${u === 1 ? "" : u}x + ${v}) = ${g * u}x^2 + ${g * v}x ✓.`,
      remember: "GCF = common number × lowest power of every shared letter.",
    });
  }
  const g = r.int(2, 9);
  const [u, v] = coprimePair(r, 1, 9);
  const neg = r.next() < 0.5;
  if (neg) {
    const ans = `${g}x(${u === 1 ? "" : u}x-${v})`;
    return baseQ({
      type: "fill", diff: d,
      text: `Factorise completely: $${g * u}x^2 - ${g * v}x$.`,
      answer: ans, accept: fillAcc(ans),
      steps: [
        `GCF of $${g * u}x^2$ and $${g * v}x$ is $${g}x$.`,
        `Divide: $${g * u}x^2 \\div ${g}x = ${u === 1 ? "x" : `${u}x`}$ and $${g * v}x \\div ${g}x = ${v}$.`,
        `Keep the minus inside: $${g * u}x^2 - ${g * v}x = ${ans}$.`,
      ],
      concept: "GCF factorisation with a negative term",
      hint1: "The sign of the last term travels into the bracket.",
      hint2: `Answer shape: ${g}x(${u === 1 ? "" : u}x − ${v}).`,
      mistake: "Signs must survive the division — check by re-expanding.",
      verify: `Expand back: ${g}x(${u === 1 ? "" : u}x − ${v}) = ${g * u}x^2 − ${g * v}x ✓.`,
      remember: "Whatever the GCF divides out, the signs record.",
    });
  }
  const ans = `${g}x(${u === 1 ? "" : u}x+${v}y)`;
  return baseQ({
    type: "fill", diff: d,
    text: `Factorise completely: $${g * u}x^2 + ${g * v}xy$.`,
    answer: ans, accept: fillAcc(ans),
    steps: [
      `Both terms share $${g}$, an $x$, and the first even shares an extra $x$ — GCF $= ${g}x$.`,
      `$${g * u}x^2 = ${g}x \\cdot ${u === 1 ? "x" : `${u}x`}$ and $${g * v}xy = ${g}x \\cdot ${v}y$.`,
      `So $${g * u}x^2 + ${g * v}xy = ${ans}$.`,
    ],
    concept: "GCF factorisation with two variables",
    hint1: "Lowest power of x is x¹; y appears in only one term.",
    hint2: `The bracket keeps the ${v}y term whole.`,
    mistake: "y is not common to both terms — it must stay inside the bracket.",
    verify: `Expand back: ${g}x(${u === 1 ? "" : u}x + ${v}y) = ${g * u}x^2 + ${g * v}xy ✓.`,
    remember: "Only shared letters leave; loners stay inside.",
  });
};

// ─── 11. factor-group ──────────────────────────────────────────────────────
const factorGroup: GenFn = (r, d) => {
  let e = 1, c: number, a2: number;
  if (d === 1) { e = 1; c = r.int(1, 5); a2 = r.int(1, 5); }
  else if (d === 2) { e = 1; c = r.int(2, 8); a2 = r.int(2, 8); }
  else if (d === 3) { e = -1; c = r.int(1, 6); a2 = r.int(2, 7); }
  else { e = r.sign(); c = r.int(2, 9); a2 = r.int(2, 15); }
  const expr = poly([[1, "x^3"], [e * c, "x^2"], [a2, "x"], [e * c * a2, ""]]);
  const A = fbin(e * c), B = `(x^2+${a2})`;
  const sgn = e < 0 ? "-" : "+";
  return baseQ({
    type: "fill", diff: d,
    text: `Factorise by grouping: $${expr}$.`,
    answer: `${A}${B}`, accept: pairAcc(A, B),
    steps: [
      `Group the first two and last two: $x^3 ${sgn} ${c}x^2 = x^2(x ${sgn} ${c})$.`,
      `$${a2}x ${sgn} ${c * a2} = ${a2}(x ${sgn} ${c})$ — same bracket appears!`,
      `Pull out the common bracket: $(x ${sgn} ${c})(x^2 + ${a2})$.`,
      `So $${expr} = ${A}${B}$.`,
    ],
    concept: "Factorisation by grouping",
    hint1: "Pair terms 1-2 and 3-4; factor each pair.",
    hint2: `Both pairs should reveal $(x ${sgn} ${c})$.`,
    mistake: "If the two brackets don't match, the grouping (or a sign) is wrong — regroup.",
    verify: `Expand back: $${A}${B} = x^3 ${sgn} ${c}x^2 + ${a2}x ${sgn} ${c * a2}$ ✓.`,
    remember: "Four terms → hunt for a common bracket, two by two.",
  });
};

// ─── 12. factor-trinomial ──────────────────────────────────────────────────
const factorTrinomial: GenFn = (r, d) => {
  let a = 1, b = 2;
  if (d === 1) { do { a = r.int(1, 9); b = r.int(1, 9); } while (a === b); }
  else if (d === 2) { do { a = r.int(1, 15); b = r.int(1, 15); } while (a === b); }
  else if (d === 3) { do { a = r.int(1, 15); b = -r.int(1, 15); } while (a + b === 0); }
  else { do { a = -r.int(1, 15); b = -r.int(1, 15); } while (a === b); }
  const S = a + b, P = a * b;
  const expr = poly([[1, "x^2"], [S, "x"], [P, ""]]);
  const A = fbin(a), B = fbin(b);
  return baseQ({
    type: "fill", diff: d,
    text: `Factorise: $${expr}$.`,
    answer: `${A}${B}`, accept: pairAcc(A, B),
    steps: [
      `Find two numbers with sum $${S}$ and product $${P}$.`,
      `They are $${a}$ and $${b}$: $${par(a)} ${b < 0 ? "-" : "+"} ${Math.abs(b)} = ${S}$ and $${par(a)} \\times (${b}) = ${P}$.`,
      `Split the middle or use the identity: $x^2 + (${S})x + (${P}) = ${A}${B}$.`,
    ],
    concept: "Factorising $x^2 + bx + c$ by the product-sum method",
    hint1: `You need two numbers that multiply to ${P} and add to ${S}.`,
    hint2: `Try ${a} and ${b} — check both conditions.`,
    mistake: "Sign rule: product negative → one of each; product positive & sum negative → both negative.",
    verify: `Expand $${A}${B}$: middle $= ${a} ${b < 0 ? "-" : "+"} ${Math.abs(b)} = ${S}$, constant $= ${P}$ ✓.`,
    remember: "For x²+bx+c: think product c, sum b, then drop the numbers into brackets.",
  });
};

// ─── 13. rational-simplify ─────────────────────────────────────────────────
const rationalSimplify: GenFn = (r, d) => {
  if (d === 1) {
    const a = r.int(2, 9), t = r.int(a + 2, 25);
    return baseQ({
      diff: d,
      text: `Simplify $\\frac{x^2 - ${sq(a)}}{x + ${a}}$ and evaluate the result at $x = ${t}$.`,
      answer: String(t - a),
      steps: [
        `Factor the numerator: $x^2 - ${sq(a)} = (x + ${a})(x - ${a})$ — difference of squares.`,
        `Cancel the common factor $x + ${a}$ (safe because $x \\ne -${a}$): the expression is $x - ${a}$.`,
        `At $x = ${t}$: $${t} - ${a} = ${t - a}$.`,
      ],
      concept: "Cancelling common factors in rational expressions",
      hint1: "Factor the numerator as a difference of squares first.",
      hint2: `After cancellation you get $x - ${a}$; substitute ${t}.`,
      mistake: "Cancel FACTORS, never terms: only the whole bracket (x+a) may vanish.",
      verify: `Direct: $(${sq(t)} − ${sq(a)}) \\div (${t} + ${a}) = ${sq(t) - sq(a)} \\div ${t + a} = ${t - a}$ ✓.`,
      remember: "Factor → cancel factors → substitute.",
    });
  }
  if (d === 2) {
    const a = r.int(2, 9), t = r.int(a + 2, 25);
    return baseQ({
      diff: d,
      text: `Simplify $\\frac{x^2 - ${sq(a)}}{x - ${a}}$ and evaluate the result at $x = ${t}$.`,
      answer: String(t + a),
      steps: [
        `Factor: $x^2 - ${sq(a)} = (x + ${a})(x - ${a})$.`,
        `Cancel $x - ${a}$ (valid since $x \\ne ${a}$): the expression becomes $x + ${a}$.`,
        `At $x = ${t}$: $${t} + ${a} = ${t + a}$.`,
      ],
      concept: "Difference of squares over its own factor",
      hint1: "The denominator is one of the numerator's factors.",
      hint2: `What survives is $x + ${a}$.`,
      mistake: "The surviving factor is (x + a), not (x − a) — check which bracket you cancelled.",
      verify: `Direct: $(${sq(t)} − ${sq(a)}) \\div (${t} − ${a}) = ${sq(t) - sq(a)} \\div ${t - a} = ${t + a}$ ✓.`,
      remember: "Cancellation leaves the OTHER factor standing.",
    });
  }
  if (d === 3) {
    let a = r.int(2, 12), bb = r.int(2, 12);
    for (let i = 0; i < 60 && bb === a; i++) { bb = r.int(2, 12); }
    let t = r.int(2, 25);
    for (let i = 0; i < 60 && t === bb; i++) { t = r.int(2, 25); }
    if (t === bb) t = bb === 2 ? 3 : 2; // hard fallback: keep denominator non-zero
    return baseQ({
      diff: d,
      text: `Simplify $\\frac{x^2 - ${a + bb}x + ${a * bb}}{x - ${bb}}$ and evaluate the result at $x = ${t}$.`,
      answer: String(t - a),
      steps: [
        `Factor the numerator: need two numbers with sum $${a + bb}$ and product $${a * bb}$ — they are $${a}$ and $${bb}$.`,
        `$x^2 - ${a + bb}x + ${a * bb} = (x - ${a})(x - ${bb})$.`,
        `Cancel $x - ${bb}$: the expression becomes $x - ${a}$.`,
        `At $x = ${t}$: $${t} - ${a} = ${t - a}$.`,
      ],
      concept: "Cancelling a factor of a factorised trinomial",
      hint1: "Factor the top as (x − ?)(x − ?) using product and sum.",
      hint2: `The bottom $(x - ${bb})$ matches one bracket; what remains is $x - ${a}$.`,
      mistake: "Match the cancelled bracket with the DENOMINATOR, then evaluate with what survives.",
      verify: `Direct: $(${sq(t)} − ${a + bb} \\times ${t} + ${a * bb}) \\div (${t} − ${bb}) = ${sq(t) - (a + bb) * t + a * bb} \\div ${t - bb} = ${t - a}$ ✓.`,
      remember: "Factor top, cancel with bottom, then substitute.",
    });
  }
  const b = r.int(2, 7);
  let t = r.int(2, 15);
  for (let i = 0; i < 60 && t === b; i++) { t = r.int(2, 15); }
  if (t === b) t = b === 2 ? 3 : 2; // hard fallback: keep denominator non-zero
  const ans = sq(t) + t * b + sq(b);
  return baseQ({
    diff: 4,
    text: `Using $a^3 - b^3 = (a-b)(a^2+ab+b^2)$: simplify $\\frac{x^3 - ${b ** 3}}{x - ${b}}$ and evaluate at $x = ${t}$.`,
    answer: String(ans),
    steps: [
      `Factor the numerator: $x^3 - ${b ** 3} = (x - ${b})(x^2 + ${b}x + ${sq(b)})$.`,
      `Cancel $x - ${b}$: the expression becomes $x^2 + ${b}x + ${sq(b)}$.`,
      `At $x = ${t}$: $${sq(t)} + ${t * b} + ${sq(b)}$.`,
      `Total: $${ans}$.`,
    ],
    concept: "Difference of cubes in rational expressions",
    hint1: "a³ − b³ = (a − b)(a² + ab + b²) with b = " + b + ".",
    hint2: `After cancelling, substitute $x = ${t}$ into $x^2 + ${b}x + ${sq(b)}$.`,
    mistake: "The conjugate factor of a³ − b³ is a² + ab + b² — all plus signs inside.",
    verify: `Direct: (${t}³ − ${b ** 3}) ÷ (${t} − ${b}) = ${t ** 3 - b ** 3} ÷ ${t - b} = ${ans} ✓.`,
    remember: "Cube difference: (a−b)(a²+ab+b²) — remember the middle ab.",
  });
};

export const bank: Record<string, GenFn> = {
  "expand-square": expandSquare,
  "mental-square": mentalSquare,
  "expand-prod": expandProd,
  "identity-pick": identityPick,
  "coeff-find": coeffFind,
  "cube-expand": cubeExpand,
  "cube-identity": cubeIdentity,
  "tri-sq-combo": triSqCombo,
  "eval-area": evalArea,
  "factor-common": factorCommon,
  "factor-group": factorGroup,
  "factor-trinomial": factorTrinomial,
  "rational-simplify": rationalSimplify,
};

export const bankSize: Record<string, number> = {
  // expand-square: d1 b∈[2,12] (11) · d2 2 signs × b∈[2,25] (48) · d3 8p × 2 signs × 30q (480) · d4 24a × 2 forms (48)
  "expand-square": 11 + 2 * 24 + 8 * 2 * 30 + 24 * 2,                       // 587
  // mental-square: d1 11 tens × 9 units · d2 2 × 29 k · d3 13 bases × equal offsets · d4 5 bases × 39 k × 2 signs
  "mental-square": 11 * 9 + 2 * 29 + (14 + 19 + 24 + 10 * 25) + 5 * 39 * 2, // 854
  // expand-prod: d1 15×15 · d2 29×24 · d3 40×40 · d4 4p × 20q × 40s
  "expand-prod": 15 * 15 + 29 * 24 + 40 * 40 + 4 * 20 * 40,                 // 5721
  // identity-pick: d1 b(14) · d2 2×b(28) · d3 11 straddle products · d4 2 derivations
  "identity-pick": 14 + 2 * 14 + 11 + 2,                                    // 55
  // coeff-find: d1 b(14) · d2 c(19) · d3 14×14 · d4 c(8)
  "coeff-find": 14 + 19 + 14 * 14 + 8,                                      // 237
  // cube-expand: d1 b(6) · d2 2×10 · d3 2×15 · d4 4p × 11q
  "cube-expand": 6 + 2 * 10 + 2 * 15 + 4 * 11,                              // 100
  // cube-identity: d1 Σ_{s=3}^{15}(⌊s²/4⌋−1)=294 · d2 Σ_{s=5}^{25}=1350 · d3 14×29 · d4 Σ_{s=3}^{20}⌊s²/4⌋=714
  "cube-identity": 294 + 1350 + 406 + 714,                                  // 2764
  // tri-sq-combo: d1 a,b,c∈[2,15] · d2-d4 a,b,c∈[2,30]
  "tri-sq-combo": 14 ** 3 + 3 * 29 ** 3,                                    // 75911
  // eval-area: d1 8×9 · d2 Σ min(8,a−1)=275 · d3 6×9 · d4 Σ_{a=8}^{50}(a−3)=1118
  "eval-area": 8 * 9 + 275 + 6 * 9 + 1118,                                  // 1519
  // factor-common: d1 8g×55 coprime pairs · d2 same · d3 two variants (neg + xy) 2×8×55 · d4 same space as d3
  "factor-common": 8 * 55 + 8 * 55 + 2 * 8 * 55 + 2 * 8 * 55,               // 2640
  // factor-group: d1 5×5 · d2 7×7 · d3 6×6 · d4 2×8×14
  "factor-group": 25 + 49 + 36 + 224,                                       // 334
  // factor-trinomial: d1 C(9,2) · d2 C(15,2) · d3 15×14 (mixed signs) · d4 C(15,2)
  "factor-trinomial": 36 + 105 + 210 + 105,                                 // 456
  // rational-simplify: d1 Σ(24−a)=148 · d2 148 · d3 11a × 10bb × 23t = 2530 · d4 6×13
  "rational-simplify": 148 + 148 + 11 * 10 * 23 + 78,                       // 2904
};
