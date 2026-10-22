import type { Diff, GenFn, Question } from "@/lib/wars/types";

// ─── helpers ───────────────────────────────────────────────────────────────
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
const frac = (n: number, d: number): string => {
  const g = gcd(n, d) || 1;
  const sn = n < 0 !== d < 0 ? "-" : "";
  const rn = Math.abs(n) / g, rd = Math.abs(d) / g;
  return rd === 1 ? `${sn}${rn}` : `${sn}${rn}/${rd}`;
};
const dec = (x: number, k = 3) => String(Math.round(x * 10 ** k) / 10 ** k);

/** LaTeX for the linear polynomial ax + b (a ≠ 0). */
const linStr = (a: number, b: number, v = "x"): string => {
  const head = a === 1 ? "" : a === -1 ? "-" : String(a);
  const tail = b === 0 ? "" : b > 0 ? ` + ${b}` : ` - ${Math.abs(b)}`;
  return `${head}${v}${tail}`;
};

/** LaTeX for a general polynomial from [coefficient, power] pairs. */
const polyStr = (terms: [number, number][], v: string): string => {
  const parts: string[] = [];
  for (const [c, p] of terms) {
    if (c === 0) continue;
    const powS = p === 0 ? "" : p === 1 ? v : `${v}^{${p}}`;
    const mag = Math.abs(c);
    const coefS = mag === 1 && p > 0 ? "" : String(mag);
    parts.push((parts.length === 0 ? (c < 0 ? "-" : "") : c < 0 ? " - " : " + ") + coefS + powS);
  }
  return parts.join("") || "0";
};

function baseQ(p: Partial<Question> & Pick<Question, "text" | "answer" | "steps" | "concept" | "hint1" | "hint2">): Question {
  return { type: "numeric", diff: 1, ch: 2, sub: "s1", gen: "x", id: "x", ...p };
}

// ─── 1. eval-poly (s1) ─────────────────────────────────────────────────────
const evalPoly: GenFn = (r, d) => {
  if (d === 1) {
    const a = r.int(2, 9), b = r.int(1, 9), x = r.int(1, 9);
    const ans = a * x + b;
    return baseQ({ sub: "s1", diff: d, text: `A machine turns every input $x$ into $${a}x + ${b}$. What is the output when the input is $${x}$? (Find $p(${x})$ for $p(x) = ${a}x + ${b}$.)`, answer: String(ans), steps: [`Substitute the input: $p(${x}) = ${a} \\times ${x} + ${b}$.`, `Multiply first: $${a} \\times ${x} = ${a * x}$.`, `Then add: $${a * x} + ${b} = ${ans}$.`, `The machine outputs $${ans}$.`], concept: "Evaluating a linear polynomial p(x) = ax + b at a value", hint1: "Substitute the input value in place of x.", hint2: "Multiply before you add (BODMAS).", mistake: "Don't add before multiplying — $ax$ means $a \\times x$.", verify: `Rough check: ${a} × ${x} ≈ ${a * x}, plus ${b} gives about ${ans}. ✓`, remember: "p(k) means: replace every x by k, then simplify." });
  }
  if (d === 2) {
    const a = r.nz(-9, 9), b = r.nz(-12, 12), x = r.nz(-8, 8);
    const ans = a * x + b;
    return baseQ({ sub: "s1", diff: d, text: `If $p(x) = ${linStr(a, b)}$, find the value of $p(${x})$.`, answer: String(ans), steps: [`Substitute with brackets: $p(${x}) = (${a}) \\times (${x}) ${b >= 0 ? "+" : "-"} ${Math.abs(b)}$.`, `Multiply: $(${a}) \\times (${x}) = ${a * x}$ (${a * x > 0 ? "same signs give +" : "opposite signs give −"}).`, `Add the constant: $${a * x} ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = ${ans}$.`], concept: "Evaluating linear polynomials with negative numbers", hint1: "Put every substitution inside brackets to keep signs safe.", hint2: `First compute $(${a}) \\times (${x})$, then handle ${b}.`, mistake: "Losing a minus sign: $(-2)(-3) = +6$, and $-12 + (-5)$ means $-12 - 5$.", verify: `Sign sense: the product term is ${a * x >= 0 ? "positive" : "negative"}, and the answer ${ans} has the expected sign. ✓`, remember: "Brackets first, signs second, arithmetic third." });
  }
  if (d === 3) {
    const [an, ad] = r.pick([[1, 2], [3, 2], [1, 4], [3, 4], [2, 3], [5, 2]]);
    const b = r.nz(-9, 9), x = r.int(-6, 6);
    const num = an * x + b * ad;
    const v = num / ad;
    return baseQ({ sub: "s1", diff: d, text: `For $p(x) = \\frac{${an}}{${ad}}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)}$, find $p(${x})$. (Answer as a fraction like $3/4$ or a decimal.)`, answer: frac(num, ad), accept: [dec(v, 4)], tol: 0.001, steps: [`Substitute: $p(${x}) = \\frac{${an}}{${ad}} \\times (${x}) ${b >= 0 ? "+" : "-"} ${Math.abs(b)}$.`, `The x-part is $\\frac{${an} \\times ${x}}{${ad}} = \\frac{${an * x}}{${ad}}$.`, `Rewrite the constant over the same denominator: $${Math.abs(b)} = \\frac{${Math.abs(b) * ad}}{${ad}}$.`, `Combine: $\\frac{${num}}{${ad}} = ${frac(num, ad)}$ ≈ ${dec(v, 4)}.`], concept: "Evaluating linear polynomials with fractional coefficients", hint1: "Turn the constant into a fraction with denominator " + ad + ".", hint2: `Combine the numerators over the common denominator ${ad}.`, mistake: "Adding the coefficient to the constant directly: $\\frac{a}{d}x + b \\ne \\frac{a+bd}{d}x$ — multiply the x-part first.", verify: `Decimal check: ${an}/${ad} × ${x} + ${b} ≈ ${dec(v, 4)}. ✓`, remember: "With fractions, build a common denominator before adding." });
  }
  const a = r.nz(-6, 6), b = r.nz(-9, 9);
  const x1 = r.int(1, 4), x2 = x1 + r.int(1, 3), x3 = x2 + r.int(2, 6);
  const y1 = a * x1 + b, y2 = a * x2 + b, ans = a * x3 + b;
  return baseQ({ sub: "s1", diff: d, text: `The Algebra Engine machine computes output $= ax + b$ from input $x$. Two runs are logged: input $${x1}$ → output $${y1}$, and input $${x2}$ → output $${y2}$. What will the machine output for input $${x3}$?`, answer: String(ans), steps: [`Each extra unit of input changes the output by $a$: $a = \\frac{${y2} - (${y1})}{${x2} - (${x1})} = \\frac{${y2 - y1}}{${x2 - x1}} = ${a}$.`, `Recover $b$ from run 1: $${y1} = ${a} \\times ${x1} + b \\Rightarrow b = ${y1} - ${a * x1} = ${b}$.`, `So the machine is output $= ${linStr(a, b)}$.`, `Feed in $x = ${x3}$: $${a} \\times ${x3} ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = ${ans}$.`], concept: "Reconstructing a linear rule from two input-output pairs", hint1: "The output grows by the same amount a for every +1 of input.", hint2: `Between the two logs the input rises by ${x2 - x1} — so the output rises by ${y2 - y1} in total.`, given: [`Run 1: input ${x1} → output ${y1}`, `Run 2: input ${x2} → output ${y2}`, `Machine form: output = ax + b`], find: `Output for input ${x3}`, mistake: "Dividing the output difference by the wrong input difference — rate = Δoutput ÷ Δinput.", verify: `Check with run 2: ${a} × ${x2} + (${b}) = ${y2}. ✓`, remember: "Two inputs and two outputs pin down a and b completely." });
};

// ─── 2. find-zero (s1) ─────────────────────────────────────────────────────
const findZero: GenFn = (r, d) => {
  if (d === 1) {
    const k = r.int(1, 9), a = r.int(2, 9), b = -a * k;
    return baseQ({ sub: "s1", diff: d, text: `Find the zero of the linear polynomial $p(x) = ${linStr(a, b)}$.`, answer: String(k), steps: [`The zero is the value of $x$ where $p(x) = 0$.`, `Set up: $${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = 0$.`, `Move the constant: $${a}x = ${Math.abs(b)}$.`, `Divide: $x = \\frac{${Math.abs(b)}}{${a}} = ${k}$.`], concept: "Zero of a linear polynomial: solve ax + b = 0", hint1: "Solve the equation p(x) = 0.", hint2: `First shift ${b} across, then divide by ${a}.`, mistake: "The zero is the x-value that makes p(x) = 0 — not the value p(0).", verify: `Check: p(${k}) = ${a} × ${k} ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = 0. ✓`, remember: "Zero of ax + b is x = −b/a." });
  }
  if (d === 2) {
    const k = r.nz(-9, 9), a = r.nz(2, 9) * r.sign(), b = -a * k;
    return baseQ({ sub: "s1", diff: d, text: `Find the zero of $p(x) = ${linStr(a, b)}$.`, answer: String(k), steps: [`Set $p(x) = 0$: $${linStr(a, b)} = 0$.`, `Isolate the x-term: $${a}x = ${-b}$ (sign flips when the constant crosses).`, `$x = \\frac{${-b}}{${a}} = ${k}$.`], concept: "Zero of a linear polynomial with negative coefficients", hint1: "Zero of ax + b is x = −b/a.", hint2: `Here $-b = ${-b}$ and $a = ${a}$ — mind the signs.`, mistake: "Forgetting the minus in x = −b/a when b is negative.", verify: `Check: p(${k}) = (${a})(${k}) ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = 0. ✓`, remember: "x = −b/a works for every sign combination." });
  }
  if (d === 3) {
    const qq = r.int(2, 9), n = r.int(1, qq - 1), m = r.int(1, 3);
    if (gcd(n, qq) !== 1) return findZero(r, d);
    const a = qq * m, b = -n * m;
    const v = n / qq;
    return baseQ({ sub: "s1", diff: d, text: `Find the zero of $p(x) = ${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)}$. (A fraction like $2/3$ is a fine answer.)`, answer: frac(n, qq), accept: [dec(v, 4)], tol: 0.001, steps: [`Set $${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = 0$.`, `$${a}x = ${Math.abs(b)}$.`, `$x = \\frac{${Math.abs(b)}}{${a}} = \\frac{${n}}{${qq}}$ ≈ ${dec(v, 4)}.`], concept: "Zeros of linear polynomials can be fractions", hint1: "x = −b/a — then reduce the fraction.", hint2: `Divide top and bottom by their GCD.`, mistake: "Leaving 4/6 unreduced, or rounding a fraction too early.", verify: `Check: ${a} × ${n}/${qq} ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = ${n * m} - ${Math.abs(n * m)} = 0. ✓`, remember: "Every linear polynomial has exactly one zero — it may be a fraction." });
  }
  const ctxI = r.int(0, 2);
  const ctx = [
    { pre: "A phone battery is at", unit: "%", rate: "percentage points per hour", noun: "hours", item: "battery", tMin: 4, tMax: 8, rrs: [4, 5, 6, 8, 10] },
    { pre: "A water tank holds", unit: " L", rate: "litres per minute", noun: "minutes", item: "tank", tMin: 6, tMax: 15, rrs: [4, 6, 7, 8, 12, 15] },
    { pre: "A prepaid data pack has", unit: " GB", rate: "GB per day", noun: "days", item: "data pack", tMin: 3, tMax: 8, rrs: [5, 6, 8, 10, 12] },
  ][ctxI];
  const rr = r.pick(ctx.rrs);
  const t = r.int(ctx.tMin, ctx.tMax);
  const T = rr * t;
  return baseQ({ sub: "s1", diff: d, text: `${ctx.pre} $${T}${ctx.unit}$ and drains at a constant rate of $${rr}$ ${ctx.rate}. Its amount after time $t$ is the linear polynomial $p(t) = ${T} - ${rr}t$. After how many ${ctx.noun} does the ${ctx.item} hit zero?`, answer: String(t), steps: [`Form the zero condition: $p(t) = 0$ means the ${ctx.item} is empty.`, `$${T} - ${rr}t = 0$.`, `$${rr}t = ${T}$, so $t = \\frac{${T}}{${rr}} = ${t}$.`], concept: "Linear decay: the zero of the polynomial is the empty-time", hint1: "Empty means the polynomial equals 0.", hint2: `Solve ${T} − ${rr}t = 0 for t.`, given: [`Initial amount: ${T}${ctx.unit}`, `Constant drain: ${rr} per ${ctx.noun.slice(0, -1)}`, `Polynomial: p(t) = ${T} − ${rr}t`], find: `The zero of p(t) (time when the ${ctx.item} empties)`, mistake: "Answering with the initial amount instead of solving for t.", verify: `Check: ${T} − ${rr} × ${t} = 0. ✓`, remember: "In decay problems, the zero of the polynomial = run-out time." });
};

// ─── 3. mcq-degree (s1) ────────────────────────────────────────────────────
const mcqDegree: GenFn = (r, d) => {
  if (r.next() < 0.5) {
    const lin = linStr(r.nz(2, 6), r.nz(-9, 9));
    const quad = polyStr([[r.int(1, 5), 2], [r.nz(-8, 8), 1], [r.nz(-9, 9), 0]], "x");
    const cub = polyStr([[r.int(1, 4), 3], [r.nz(-6, 6), 2], [r.nz(-8, 8), 1], [r.nz(-9, 9), 0]], "y");
    const con = String(r.nz(-9, 9) * r.pick([1, 1, 1]));
    const uniq = [...new Set([lin, quad, cub, con])];
    while (uniq.length < 4) uniq.push(`${r.int(10, 40)}z + ${r.int(2, 9)}`);
    const shuffled = [...uniq].sort(() => r.next() - 0.5);
    return baseQ({ sub: "s1", diff: d, type: "mcq", text: "Which of the following is a **linear polynomial**?", choices: shuffled.map((s) => `$${s}$`), answer: `$${lin}$`, steps: [`A linear polynomial has degree exactly $1$ — the highest power of the variable is $1$.`, `$${lin}$ has highest power $1$ → linear.`, `$${quad}$ has an $x^{2}$ term (degree 2, quadratic) and $${cub}$ has a $y^{3}$ term (degree 3, cubic).`, `$${con}$ is a constant polynomial (degree 0).`, `So the linear polynomial is $${lin}$.`], concept: "Degree of a polynomial: highest power of the variable", hint1: "Linear = degree 1 = plain ax + b, no squares or cubes.", hint2: "Scan each option for the highest power of the variable.", mistake: "A single constant like 7 is a polynomial too — of degree 0, not degree 1.", remember: "Degree 1 → linear, 2 → quadratic, 3 → cubic, 0 → constant." });
  }
  const dg = r.int(0, 3);
  const P =
    dg === 0 ? String(r.nz(-9, 9)) :
    dg === 1 ? polyStr([[r.nz(1, 6), 1], [r.nz(-9, 9), 0]], "z") :
    dg === 2 ? polyStr([[r.int(1, 6), 2], [r.nz(-8, 8), 1], [r.nz(-9, 9), 0]], "z") :
               polyStr([[r.int(1, 5), 3], [r.nz(-6, 6), 2], [r.nz(-8, 8), 1], [r.nz(-9, 9), 0]], "z");
  return baseQ({ sub: "s1", diff: d, type: "mcq", text: `What is the degree of the polynomial $${P}$?`, choices: ["0", "1", "2", "3"], answer: String(dg), steps: [`The degree is the highest power of the variable that appears with a non-zero coefficient.`, `In $${P}$ the highest such power is $${dg}$.`, `So the degree is $${dg}$.`], concept: "Degree of a polynomial", hint1: "Look for the biggest exponent actually present.", hint2: dg === 0 ? "A lone constant is 8·x⁰ — degree 0." : `The term with power ${dg} decides it.`, mistake: "Counting terms instead of powers: degree is about exponents, not how many terms there are.", verify: `Only powers 0…${dg} appear, and power ${dg} has a non-zero coefficient. ✓`, remember: "Degree = highest power with non-zero coefficient." });
};

// ─── 4. coeff-read (s1) ────────────────────────────────────────────────────
const coeffRead: GenFn = (r, d) => {
  if (d <= 2) {
    const a = d === 1 ? r.int(2, 9) : r.nz(-9, 9);
    const b = d === 1 ? r.int(1, 9) : r.nz(-9, 9);
    return baseQ({ sub: "s1", diff: d, type: "fill", text: `Write $p(x) = ${linStr(a, b)}$ in the form $ax + b$. State $a$ and $b$. (Answer like $3,-5$.)`, answer: `${a},${b}`, accept: [`${a}, ${b}`, `a=${a}, b=${b}`, `a = ${a}, b = ${b}`, `a:${a}, b:${b}`], steps: [`Compare $${linStr(a, b)}$ with the template $ax + b$ term by term.`, `The coefficient of $x$ is $a = ${a}$.`, `The constant term is $b = ${b}$.`], concept: "Coefficients and constant term of a linear polynomial", hint1: "a multiplies the variable; b stands alone.", hint2: `The $x$-coefficient here is ${a}.`, mistake: "Reading $5x - 8$ as $a = 5, b = 8$: the constant is $-8$, sign included.", remember: "The sign belongs to its term — b carries its minus." });
  }
  if (d === 3) {
    const coefs = [r.nz(-9, 9), r.nz(-9, 9), r.nz(-9, 9), r.nz(-9, 9), r.nz(-9, 9)]; // x^4 … const
    const hideX = r.next() < 0.3;
    if (hideX) coefs[3] = 0; // coefficient of x is 0 → book-style trick
    const askP = hideX ? 1 : r.int(0, 4);
    const P = polyStr([[coefs[0], 4], [coefs[1], 3], [coefs[2], 2], [coefs[3], 1], [coefs[4], 0]], "x");
    const ans = coefs[4 - askP];
    return baseQ({ sub: "s1", diff: d, text: `In the polynomial $${P}$, what is the coefficient of $${askP === 0 ? "the constant term" : askP === 1 ? "x" : `x^{${askP}}`}$?`, answer: String(ans), steps: [`Line the polynomial up against the powers: $x^{4}, x^{3}, x^{2}, x, $ constant.`, `The $${askP === 0 ? "constant" : askP === 1 ? "x" : `x^{${askP}}`}$ term is $${ans === 0 ? "\\text{absent}" : `${ans}${askP === 0 ? "" : askP === 1 ? "x" : `x^{${askP}}`}`}$${ans === 0 ? " — an absent term has coefficient 0" : ""}.`, `So the coefficient is $${ans}$.`], concept: "Reading coefficients from a polynomial", hint1: "Coefficient = the number multiplied by that power of x.", hint2: ans === 0 ? "No such term is written — its coefficient is 0." : `Match the term with power ${askP}.`, mistake: "In $x^{4} - 3x^{3} + 6x^{2} - 2x + 7$ the coefficient of $x^{2}$ is $+6$, not $2$.", verify: `Rebuild: ${askP === 0 ? "constant" : "x^" + askP} × (${ans}) reproduces that term. ✓`, remember: "Every power has a coefficient — written, or silently 0." });
  }
  const a = r.nz(-6, 6), b = r.nz(-9, 9);
  const x1 = r.int(1, 4), x2 = x1 + r.int(2, 4);
  const y1 = a * x1 + b, y2 = a * x2 + b;
  const ans = a + b;
  return baseQ({ sub: "s1", diff: d, text: `A linear polynomial $p(x) = ax + b$ satisfies $p(${x1}) = ${y1}$ and $p(${x2}) = ${y2}$. Find $a + b$.`, answer: String(ans), steps: [`Rate: $a = \\frac{${y2} - (${y1})}{${x2} - (${x1})} = \\frac{${y2 - y1}}{${x2 - x1}} = ${a}$.`, `Constant: from $p(${x1}) = ${y1}$: $b = ${y1} - (${a})(${x1}) = ${b}$.`, `So $a + b = ${a} + (${b}) = ${ans}$.`], concept: "Determining a and b of a linear polynomial from two values", hint1: "Find a from the constant step of p between the two inputs.", hint2: `Then push ${y1} back through p(${x1}) = ${a}·${x1} + b to get b.`, given: [`p(${x1}) = ${y1}`, `p(${x2}) = ${y2}`, `p(x) = ax + b`], find: "a + b", mistake: "Computing a correctly but forgetting b can be negative.", verify: `Check: ${a}·${x2} + (${b}) = ${y2}. ✓`, remember: "a is the step size, b is the starting offset." });
};

// ─── 5. pattern-nth (s2) ───────────────────────────────────────────────────
const patternNth: GenFn = (r, d) => {
  if (d <= 2) {
    const dd = d === 1 ? r.int(2, 4) : r.nz(2, 8);
    const c = d === 1 ? r.int(3, 8) : r.int(4, 12);
    const n = d === 1 ? r.int(10, 15) : r.int(12, 20);
    const terms = [0, 1, 2, 3].map((i) => c + i * dd);
    const ans = c + (n - 1) * dd;
    return baseQ({ sub: "s2", diff: d, text: `A growing pattern of tiles has $${terms.join(", ")}, \\ldots$ units in its $1^{st}, 2^{nd}, 3^{rd}, 4^{th}$ terms. If its $n^{th}$ term is $dn + c$, how many units appear in term number $${n}$?`, answer: String(ans), steps: [`The step between neighbours is $${terms[1]} - ${terms[0]} = ${dd}$, so $d = ${dd}$.`, `Test term 1: $d(1) + c = ${dd} + c = ${terms[0]}$, so $c = ${terms[0] - dd}$.`, `Rule: $T(n) = ${dd}n ${terms[0] - dd >= 0 ? "+" : "-"} ${Math.abs(terms[0] - dd)}$.`, `Term $${n}$: $${dd} \\times ${n} ${terms[0] - dd >= 0 ? "+" : "-"} ${Math.abs(terms[0] - dd)} = ${ans}$.`], concept: "nth term of a linear pattern: T(n) = dn + c", hint1: "d = the constant step between terms.", hint2: `Work back from term 1 to find c, then push n = ${n} through the rule.`, mistake: "Using $d(n-1)$ as the whole rule and forgetting the constant c.", verify: `Sanity check: T(${n - 1}) = ${ans - dd}, T(${n}) = ${ans} — step ${dd}. ✓`, remember: "Linear pattern = constant step d, plus a starting offset." });
  }
  if (d === 3) {
    const dd = r.pick([0.5, 1.5, 2.5, -0.5, -1.5]);
    const c = r.int(3, 12);
    const n = r.int(8, 16);
    const terms = [0, 1, 2, 3].map((i) => dec(c + i * dd, 2));
    const ans = c + (n - 1) * dd;
    return baseQ({ sub: "s2", diff: d, text: `A pattern advances by the same amount each time: $${terms.join(", ")}, \\ldots$. Find its $${n}^{th}$ term. (Decimals allowed.)`, answer: dec(ans, 2), steps: [`Constant step: $d = ${terms[1]} - ${terms[0]} = ${dec(dd, 2)}$.`, `Offset: term 1 is $${terms[0]}$, so $T(n) = ${dec(dd, 2)}n ${c - dd >= 0 ? "+" : "-"} ${dec(Math.abs(c - dd), 2)}$.`, `Substitute $n = ${n}$: $${dec(dd, 2)} \\times ${n} ${c - dd >= 0 ? "+" : "-"} ${dec(Math.abs(c - dd), 2)} = ${dec(ans, 2)}$.`], concept: "Linear patterns with fractional steps", hint1: "The rule works exactly the same with decimal steps.", hint2: `T(n) = ${dec(dd, 2)}n + (${dec(c - dd, 2)}).`, mistake: "Rounding mid-way — halves like 0.5 stay exact in the rule.", verify: `T(${n - 1}) = ${dec(ans - dd, 2)} and T(${n}) = ${dec(ans, 2)} — step ${dec(dd, 2)}. ✓`, remember: "Decimals follow the same dn + c engine as integers." });
  }
  const nStar = r.int(4, 12);
  const a1 = r.int(3, 7), a2 = r.int(1, a1 - 1);
  const fA = r.int(2, 8);
  const fB = fA + (a1 - a2) * (nStar - 1);
  const tA = [0, 1, 2].map((i) => fA + i * a1);
  const tB = [0, 1, 2].map((i) => fB + i * a2);
  return baseQ({ sub: "s2", diff: d, text: `Two conveyor belts carry tile patterns. Belt A lays out $${tA.join(", ")}, \\ldots$ and belt B lays out $${tB.join(", ")}, \\ldots$. At which term number $n$ do both belts carry the same number of tiles?`, answer: String(nStar), steps: [`Belt A grows by $${a1}$ each term; belt B grows by $${a2}$.`, `Rules: $A(n) = ${a1}n + ${fA - a1}$ and $B(n) = ${a2}n + ${fB - a2}$.`, `Set them equal: $${a1}n + ${fA - a1} = ${a2}n + ${fB - a2}$.`, `Collect: $(${a1} - ${a2})n = ${(fB - a2) - (fA - a1)}$, so $${a1 - a2}n = ${nStar * (a1 - a2)}$ and $n = ${nStar}$.`, `Both belts carry $${fA + a1 * (nStar - 1)}$ tiles at term $${nStar}$.`], concept: "Solving when two linear patterns coincide", hint1: "Write each belt as dn + c first.", hint2: `A gains ${a1 - a2} tiles per term on B — that gap must swallow the starting difference.`, given: [`Belt A: ${tA.join(", ")}, …`, `Belt B: ${tB.join(", ")}, …`], find: "Term number n where A(n) = B(n)", mistake: "Comparing the values at the same term by eye across the whole list — set the rules equal instead.", verify: `A(${nStar}) = ${fA + a1 * (nStar - 1)} and B(${nStar}) = ${fB + a2 * (nStar - 1)}. ✓`, remember: "Two lines meet where their rules are equal." });
};

// ─── 6. matchstick-rule (s2) ───────────────────────────────────────────────
const matchRule: GenFn = (r, d) => {
  const shapes = [{ name: "squares", per: 3, first: 4 }, { name: "triangles", per: 2, first: 3 }, { name: "hexagons", per: 5, first: 6 }] as const;
  if (d === 1) {
    const sh = r.pick(shapes);
    const n = r.int(5, 12);
    const ans = sh.per * n + 1;
    const terms = [0, 1, 2].map((i) => sh.first + i * sh.per);
    return baseQ({ sub: "s2", diff: d, text: `A row of matchstick ${sh.name} is built like: ${sh.name[0].toUpperCase() + sh.name.slice(1).replace(/s$/, "")} 1 needs $${sh.first}$ sticks, then $${terms[1]}, ${terms[2]}, \\ldots$ for $2, 3, \\ldots$ ${sh.name} (neighbours share one stick). How many sticks does a row of $${n}$ such ${sh.name} need?`, answer: String(ans), steps: [`After the first ${sh.name.slice(0, -1)}, each new one adds only $${sh.per}$ sticks (one side is shared).`, `Rule: $S(n) = ${sh.per}n + 1$.`, `$S(${n}) = ${sh.per} \\times ${n} + 1 = ${ans}$.`], concept: "Matchstick chain patterns: S(n) = per × n + 1", hint1: "First shape is special; every extra shape adds a fixed number.", hint2: `Each extra ${sh.name.slice(0, -1)} costs ${sh.per} sticks.`, mistake: "Multiplying $4 \\times n$ for squares — neighbours share a side, so use $3n + 1$.", verify: `S(${n - 1}) = ${ans - sh.per}, one shape fewer. ✓`, remember: "Shared walls are free: subtract one stick per join." });
  }
  if (d === 2) {
    const sh = r.pick(shapes);
    const n = r.int(6, 15);
    const S = sh.per * n + 1;
    return baseQ({ sub: "s2", diff: d, text: `A row of matchstick ${sh.name} follows the rule $S(n) = ${sh.per}n + 1$ sticks. Ravi has used $${S}$ sticks. How many ${sh.name} has he built?`, answer: String(n), steps: [`Set up: $${sh.per}n + 1 = ${S}$.`, `$${sh.per}n = ${S - 1}$.`, `$n = \\frac{${S - 1}}{${sh.per}} = ${n}$.`], concept: "Reversing a linear pattern rule", hint1: "Work the rule backwards: subtract 1, then divide.", hint2: `${S} − 1 = ${S - 1} should split evenly by ${sh.per}.`, mistake: "Dividing first and subtracting later — order matters.", verify: `${sh.per} × ${n} + 1 = ${S}. ✓`, remember: "Undo a rule in reverse order: +1 came last, so it leaves first." });
  }
  if (d === 3) {
    const n = r.int(8, 20);
    const ans = 5 * n + 2;
    return baseQ({ sub: "s2", diff: d, text: `Matchsticks form a $2 \\times n$ grid of squares (2 rows, $n$ columns, sharing sides): a $2\\times1$ grid needs $7$ sticks, $2\\times2$ needs $12$, $2\\times3$ needs $17$, … How many sticks does a $2 \\times ${n}$ grid need?`, answer: String(ans), steps: [`From $7, 12, 17, \\ldots$ the step is $5$ per extra column.`, `Rule: $S(n) = 5n + 2$ (check: $n=1$ gives $7$ ✓).`, `$S(${n}) = 5 \\times ${n} + 2 = ${ans}$.`], concept: "Building rules for 2-D matchstick grids", hint1: "Find the per-column cost from the difference 12 − 7.", hint2: "Each extra column adds 3 horizontal + 2 vertical sticks = 5.", mistake: "Using 3n + 1 — that is the single-row rule; the second row adds more edges.", verify: `n = 2: 5×2 + 2 = 12 ✓ matches the given data.`, remember: "Fit S(n) = dn + c to two known values, then trust it." });
  }
  const sh = r.pick(shapes);
  const n = r.int(10, 30);
  const rem = r.int(0, sh.per - 1);
  const S = sh.per * n + 1 + rem;
  return baseQ({ sub: "s2", diff: d, text: `A chain of $n$ matchstick ${sh.name} needs $S(n) = ${sh.per}n + 1$ sticks. Meera has a box of $${S}$ sticks and keeps building complete ${sh.name} in one row until she cannot finish another one. How many complete ${sh.name} does she build?`, answer: String(n), steps: [`Complete chains need $${sh.per}n + 1$ sticks, so solve $${sh.per}n + 1 \\le ${S}$.`, `$${sh.per}n \\le ${S - 1}$, so $n \\le \\frac{${S - 1}}{${sh.per}} = ${n}$ exactly${rem > 0 ? ` with $${rem}$ stick${rem > 1 ? "s" : ""} left over` : ""}.`, `She completes $${n}$ ${sh.name}.`], concept: "Applying linear rules with inequalities (floor reasoning)", hint1: "She stops when the next shape cannot be completed.", hint2: `(${S} − 1) ÷ ${sh.per} lands right on a whole number${rem > 0 ? " plus a small leftover" : ""}.`, given: [`Rule: S(n) = ${sh.per}n + 1`, `Sticks available: ${S}`], find: "Largest n with S(n) ≤ available sticks", mistake: "Ignoring the +1: n complete shapes cost per·n + 1 sticks, not per·n.", verify: `Sticks used: ${sh.per} × ${n} + 1 = ${sh.per * n + 1} ≤ ${S}, leftover ${rem}. ✓`, remember: "Real supplies force inequalities — floor the answer." });
};

// ─── 7. table-rule (s3) ────────────────────────────────────────────────────
const tableRule: GenFn = (r, d) => {
  const showTable = (xs: number[], ys: (number | string)[]) =>
    xs.map((x, i) => `x = ${x} → ${ys[i]}`).join(", ");
  if (d === 1) {
    const a = r.int(2, 5), b = r.int(0, 9), k = r.int(7, 10);
    const xs = [1, 2, 3, 4, 5];
    const ys = xs.map((x) => a * x + b);
    const ans = a * k + b;
    return baseQ({ sub: "s3", diff: d, text: `A machine's inputs and outputs are logged: ${showTable(xs, ys)}, … The output follows $y = ax + b$. What is the output when the input is $${k}$?`, answer: String(ans), steps: [`Output jumps by $${ys[1] - ys[0]}$ for each $+1$ of input, so $a = ${a}$.`, `From $x = 1$: $b = ${ys[0]} - ${a} = ${b}$. Rule: $y = ${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)}$.`, `At $x = ${k}$: $y = ${a} \\times ${k} + ${b} = ${ans}$.`], concept: "From a table of values to the linear rule y = ax + b", hint1: "Constant difference in the table = the coefficient a.", hint2: `Then subtract to find b and evaluate at x = ${k}.`, mistake: "Continuing the table by repeatedly adding instead of using the rule — fine here, but the rule is faster and safer.", verify: `y(${k - 1}) = ${ans - a}; one more step of ${a} gives ${ans}. ✓`, remember: "Table → difference a → offset b → rule → predict anything." });
  }
  if (d === 2) {
    const a = r.nz(-6, 6), b = r.nz(-9, 9), k = r.int(6, 12);
    const xs = [0, 1, 2, 3, 4];
    const ys = xs.map((x) => a * x + b);
    const ans = a * k + b;
    return baseQ({ sub: "s3", diff: d, text: `A cooling rod's temperature is logged: ${showTable(xs, ys.map((y) => `${y}°`))}, … The rule is linear, $y = ax + b$. Predict the temperature at $x = ${k}$.`, answer: String(ans), steps: [`Step per unit: $a = ${ys[1]} - (${ys[0]}) = ${a}$.`, `At $x = 0$ the output is $${ys[0]}$, so $b = ${b}$. Rule: $y = ${linStr(a, b)}$.`, `At $x = ${k}$: $y = (${a})(${k}) ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = ${ans}$.`], concept: "Linear rules from tables, including negative rates", hint1: "Here x = 0 is in the table — that entry IS b.", hint2: `The temperature changes by ${a} per unit of x.`, mistake: "With a negative rate the outputs fall — a positive difference check will catch a sign slip.", verify: `y(${k - 1}) = ${ans - a}; step ${a} → ${ans}. ✓`, remember: "The x = 0 row hands you b for free." });
  }
  if (d === 3) {
    const a = r.pick([0.5, 1.5, 2.5, -1.5, -2.5]), b = r.int(-9, 9), k = r.int(9, 15);
    const xs = [1, 2, 3, 4, 5];
    const ys = xs.map((x) => dec(a * x + b, 2));
    const ans = a * k + b;
    return baseQ({ sub: "s3", diff: d, text: `A filling tap is logged every second: ${showTable(xs, ys.map((y) => `${y} L`))}, … The rule is linear with $y = ax + b$. How many litres are in the tank at $t = ${k}$ s?`, answer: dec(ans, 2), steps: [`Step per second: $a = ${dec(a, 2)}$ L/s.`, `Offset: $b = ${ys[0]} - (${dec(a, 2)})(1) = ${b}$. Rule: $y = ${dec(a, 2)}t ${b >= 0 ? "+" : "-"} ${Math.abs(b)}$.`, `At $t = ${k}$: $y = ${dec(a, 2)} \\times ${k} ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = ${dec(ans, 2)}$ L.`], concept: "Linear rules with decimal rates", hint1: "The rate can be fractional — half a litre per second is still linear.", hint2: `y = ${dec(a, 2)}t + (${b}).`, mistake: "Dropping the decimal point when multiplying — 2.5 × 12 = 30, not 300 or 3.", verify: `y(${k - 1}) = ${dec(ans - a, 2)}; plus ${dec(a, 2)} gives ${dec(ans, 2)}. ✓`, remember: "Decimal rates obey the same y = ax + b machinery." });
  }
  const a = r.int(2, 6), b = r.nz(-9, 9), k = r.int(5, 12);
  const Y = a * k + b;
  const xs = [1, 2, 3, 4, 5];
  const ys = xs.map((x) => a * x + b);
  return baseQ({ sub: "s3", diff: d, text: `A machine logs: ${showTable(xs, ys)}, … following $y = ax + b$. At which input does the machine first produce the output $${Y}$?`, answer: String(k), steps: [`Step: $a = ${ys[1] - ys[0]}$; offset: $b = ${b}$. Rule: $y = ${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)}$.`, `Set $${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = ${Y}$.`, `$${a}x = ${Y - b}$, so $x = \\frac{${Y - b}}{${a}} = ${k}$.`], concept: "Running a linear rule backwards from output to input", hint1: "Build the rule first, then solve for x.", hint2: `Subtract ${b}, then divide by ${a}.`, mistake: "Guessing by extending the table — the target input may be far beyond the logged rows.", verify: `y(${k}) = ${a} × ${k} + (${b}) = ${Y}. ✓`, remember: "A rule predicts in both directions: outputs→inputs too." });
};

// ─── 8. rate-word (s3) ─────────────────────────────────────────────────────
const rateWord: GenFn = (r, d) => {
  if (d === 1) {
    const F = r.int(2, 8) * 5, P = r.int(8, 15), k = r.int(4, 12);
    const ans = F + P * k;
    return baseQ({ sub: "s3", diff: d, text: `A taxi charges ₹${F} as a fixed hire fee plus ₹${P} per kilometre. The total fare in rupees is the linear polynomial $C(x) = ${F} + ${P}x$. What is the fare for a $${k}$ km ride?`, answer: String(ans), steps: [`Fixed part: ₹${F} (paid even at $x = 0$).`, `Distance part: $${P} \\times ${k} = ₹${P * k}$.`, `Total: $${F} + ${P * k} = ₹${ans}$.`], concept: "Linear cost models: total = fixed + rate × quantity", hint1: "Two parts: a fixed fee and a per-km rate.", hint2: `Multiply the rate by ${k} km, then add the fee.`, mistake: "Multiplying the fixed fee by distance too — it does not grow with x.", given: [`Fixed fee: ₹${F}`, `Rate: ₹${P} per km`, `Distance: ${k} km`], find: "Total fare", verify: `C(${k}) = ${F} + ${P}×${k} = ${ans}. ✓`, remember: "Linear word models split into fixed + rate × units." });
  }
  if (d === 2) {
    const k = r.int(5, 16), P = r.int(8, 15), F = r.int(2, 6) * 5;
    const fare = F + P * k;
    return baseQ({ sub: "s3", diff: d, text: `An auto costs ₹${F} plus ₹${P} per km. Priya paid ₹${fare} in total. How many kilometres did she travel?`, answer: String(k), steps: [`Model: $${F} + ${P}x = ${fare}$.`, `$${P}x = ${fare - F}$.`, `$x = \\frac{${fare - F}}{${P}} = ${k}$ km.`], concept: "Solving linear equations from word models", hint1: "Peel the fixed fee off first.", hint2: `${fare} − ${F} = ${fare - F} is pure distance money.`, mistake: "Dividing the whole fare by the rate — the fixed fee must be removed first.", given: [`Fare rule: ${F} + ${P}x`, `Total paid: ₹${fare}`], find: "Distance x in km", verify: `${F} + ${P} × ${k} = ${fare}. ✓`, remember: "Fixed + rate·x = total → solve for x." });
  }
  if (d === 3) {
    const P = r.pick([7.5, 8.5, 9.5, 12.5]), F = r.int(2, 6) * 5, k = r.int(6, 14);
    const ans = F + P * k;
    return baseQ({ sub: "s3", diff: d, text: `A radio taxi charges ₹${F} fixed plus ₹${dec(P, 2)} per km. What is the fare (in ₹) for a $${k}$ km trip?`, answer: dec(ans, 2), steps: [`Distance money: $${dec(P, 2)} \\times ${k} = ₹${dec(P * k, 2)}$.`, `Add the fixed fee: $${F} + ${dec(P * k, 2)} = ₹${dec(ans, 2)}$.`], concept: "Linear cost models with decimal rates", hint1: "Same model as before — just decimal arithmetic.", hint2: `${dec(P, 2)} × ${k}: multiply ${P * 10} × ${k} then divide by 10.`, mistake: "Misplacing the decimal: 7.5 × 12 = 90, not 9.0 or 900.", given: [`Fixed: ₹${F}`, `Rate: ₹${dec(P, 2)}/km`, `Trip: ${k} km`], find: "Total fare in ₹", verify: `Approx: 8 × ${k} ≈ ${8 * k}; with the exact rate we get ${dec(P * k, 2)}. ✓`, remember: "Keep the decimal aligned through the whole chain." });
  }
  const nStar = r.int(5, 20);
  const fA = r.int(15, 30) * 10, pA = r.int(8, 14), dlt = r.int(2, 6), pB = pA - dlt, fB = fA + dlt * nStar;
  return baseQ({ sub: "s3", diff: d, text: `Two courier plans: **Plan A** costs ₹${fA} + ₹${pA} per parcel; **Plan B** costs ₹${fB} + ₹${pB} per parcel. After how many parcels do both plans cost exactly the same?`, answer: String(nStar), steps: [`Set the models equal: $${fA} + ${pA}n = ${fB} + ${pB}n$.`, `Bring rates together: $(${pA} - ${pB})n = ${fB - fA}$.`, `$${dlt}n = ${dlt * nStar}$, so $n = ${nStar}$.`, `Check: A costs $${fA} + ${pA * nStar} = ₹${fA + pA * nStar}$ and B costs $${fB} + ${pB * nStar} = ₹${fB + pB * nStar}$ — equal ✓.`], concept: "Break-even of two linear cost models", hint1: "Same cost means: fixedA + rateA·n = fixedB + rateB·n.", hint2: `Plan A's per-parcel advantage is ₹${dlt} — it must repay the ₹${fB - fA} fee gap.`, given: [`Plan A: ${fA} + ${pA}n`, `Plan B: ${fB} + ${pB}n`], find: "n where the costs are equal", mistake: "Comparing costs at n = 1 only — the plans balance at one special n.", verify: `Both plans cost ₹${fA + pA * nStar} at n = ${nStar}. ✓`, remember: "Higher fixed fee ⇒ cheaper rate must eventually catch up." });
};

// ─── 9. growth-decay (s3) ──────────────────────────────────────────────────
const growthDecay: GenFn = (r, d) => {
  if (d === 1) {
    const f = r.int(2, 12), g = r.int(1, 4), day = r.int(5, 14);
    const ans = f + g * day;
    return baseQ({ sub: "s3", diff: d, text: `A sunflower is $${f}$ cm tall and grows $${g}$ cm every day. Its height after $d$ days is $h(d) = ${f} + ${g}d$. How tall is it after $${day}$ days?`, answer: String(ans), steps: [`Growth so far: $${g} \\times ${day} = ${g * day}$ cm.`, `Add the starting height: $${f} + ${g * day} = ${ans}$ cm.`], concept: "Linear growth: new = start + rate × time", hint1: "Height = start + rate × days.", hint2: `${g} × ${day} first, then add ${f}.`, mistake: "Forgetting the starting height — growth alone is not the height.", given: [`Start: ${f} cm`, `Rate: ${g} cm/day`, `Time: ${day} days`], find: "Height after " + day + " days", verify: `h(${day - 1}) = ${ans - g}; one more day adds ${g}. ✓`, remember: "Linear growth is a straight climb: start + rate·t." });
  }
  if (d === 2) {
    const t = r.int(6, 14), rr = r.pick([10, 12, 15, 20, 25]);
    const T = rr * t + r.int(20, 60);
    const ans = T - rr * t;
    return baseQ({ sub: "s3", diff: d, text: `A water tank holds $${T}$ L and drains at $${rr}$ L/min. The water left after $t$ minutes is $W(t) = ${T} - ${rr}t$. How much water remains after $${t}$ minutes?`, answer: String(ans), steps: [`Drained: $${rr} \\times ${t} = ${rr * t}$ L.`, `Remaining: $${T} - ${rr * t} = ${ans}$ L.`], concept: "Linear decay: remaining = start − rate × time", hint1: "W(t) = start − rate·t.", hint2: `Subtract ${rr} × ${t} from ${T}.`, mistake: "Adding the drained amount instead of subtracting.", given: [`Start: ${T} L`, `Drain: ${rr} L/min`, `Time: ${t} min`], find: "Water remaining after " + t + " min", verify: `W(${t - 1}) = ${ans + rr}; one more minute removes ${rr}. ✓`, remember: "Decay = negative slope: start − rate·t." });
  }
  if (d === 3) {
    const t = r.int(6, 18), rr = r.pick([8, 10, 12, 15, 18, 20, 25]);
    const T = rr * t;
    return baseQ({ sub: "s3", diff: d, text: `A phone battery at $${T}$% drains $${rr}$% per hour of video: $B(t) = ${T} - ${rr}t$. After how many hours does the battery reach exactly $0$%?`, answer: String(t), steps: [`Empty means $B(t) = 0$ — the zero of the polynomial.`, `$${T} - ${rr}t = 0 \\Rightarrow ${rr}t = ${T}$.`, `$t = \\frac{${T}}{${rr}} = ${t}$ hours.`], concept: "Run-out time = zero of a linear decay polynomial", hint1: "Set the polynomial to 0 and solve.", hint2: `${T} ÷ ${rr} is a whole number here.`, mistake: "Dividing the rate by the amount instead of the amount by the rate.", given: [`B(t) = ${T} − ${rr}t`, "Empty: B(t) = 0"], find: "t when the battery dies", verify: `${T} − ${rr} × ${t} = 0. ✓`, remember: "Time to empty = start ÷ rate for linear decay." });
  }
  const t1 = r.int(6, 12), t2 = t1 + r.int(3, 10);
  const rr1 = r.pick([10, 12, 15, 20]), rr2 = r.pick([8, 10, 12, 15]);
  const T1 = rr1 * t1, T2 = rr2 * t2;
  return baseQ({ sub: "s3", diff: d, text: `Two tanks drain together: Tank P holds $${T1}$ L losing $${rr1}$ L/min, Tank Q holds $${T2}$ L losing $${rr2}$ L/min. How many minutes after Tank P empties does Tank Q empty?`, answer: String(t2 - t1), steps: [`Tank P empties at $t = \\frac{${T1}}{${rr1}} = ${t1}$ min.`, `Tank Q empties at $t = \\frac{${T2}}{${rr2}} = ${t2}$ min.`, `Gap: $${t2} - ${t1} = ${t2 - t1}$ minutes.`], concept: "Comparing two linear decay processes", hint1: "Empty-time for each = amount ÷ rate.", hint2: `Find both times, then subtract the smaller from the larger.`, given: [`Tank P: ${T1} L at ${rr1} L/min`, `Tank Q: ${T2} L at ${rr2} L/min`], find: "Gap between the two empty-times", mistake: "Subtracting the amounts or rates — the gap is between the times.", verify: `P: ${rr1}×${t1} = ${T1} ✓; Q: ${rr2}×${t2} = ${T2} ✓.`, remember: "For each tank, run-out time = start ÷ rate; then compare." });
};

// ─── 10. graph-read (s4) ───────────────────────────────────────────────────
const graphRead: GenFn = (r, d) => {
  if (d === 1) {
    const a = r.int(2, 6), b = r.int(1, 9), x = r.int(1, 9);
    const ans = a * x + b;
    return baseQ({ sub: "s4", diff: d, text: `The line $y = ${a}x + ${b}$ is drawn on the coordinate plane. What is the $y$-coordinate of the point on the line with $x = ${x}$?`, answer: String(ans), steps: [`Every point on the line obeys $y = ${a}x + ${b}$.`, `At $x = ${x}$: $y = ${a} \\times ${x} + ${b} = ${ans}$.`, `So the point $(${x}, ${ans})$ sits on the line.`], concept: "Reading points off the line y = ax + b", hint1: "The equation is the rule for every point on the line.", hint2: `Substitute x = ${x} and compute y.`, mistake: "Reading x as y — the input is the x-coordinate, the output is y.", verify: `Trace up from x = ${x} to the line, across to the y-axis: ${ans}. ✓`, remember: "On a line, y is the machine output of x." });
  }
  if (d === 2) {
    const a = r.nz(-6, 6), b = r.nz(-9, 9);
    if (r.next() < 0.5) {
      const x = r.nz(-8, 8), ans = a * x + b;
      return baseQ({ sub: "s4", diff: d, text: `For the line $y = ${linStr(a, b)}$, find the $y$-coordinate of the point with $x = ${x}$.`, answer: String(ans), steps: [`Substitute: $y = (${a})(${x}) ${b >= 0 ? "+" : "-"} ${Math.abs(b)}$.`, `Product: $${a * x}$; then add: $y = ${ans}$.`], concept: "Evaluating the line equation at negative x", hint1: "Negative x is allowed — lines continue left of the y-axis.", hint2: `(${a})(${x}) = ${a * x} first.`, mistake: "Sign slips with negative x — bracket every substitution.", verify: `The point (${x}, ${ans}) satisfies the equation. ✓`, remember: "Lines extend in both directions — so do x values." });
    }
    const k = r.nz(-8, 8), target = a * k + b;
    return baseQ({ sub: "s4", diff: d, text: `The line $y = ${linStr(a, b)}$ passes through a point whose $y$-coordinate is $${target}$. What is that point's $x$-coordinate?`, answer: String(k), steps: [`Set $${linStr(a, b)} = ${target}$.`, `$${a}x = ${target - b}$.`, `$x = \\frac{${target - b}}{${a}} = ${k}$.`], concept: "Inverting the line equation: given y, find x", hint1: "This time y is known — solve for x.", hint2: `Move ${b} across, divide by ${a}.`, mistake: "Dividing before moving b — order of undoing matters.", verify: `y(${k}) = ${target}. ✓`, remember: "y → x is just solving the line's equation." });
  }
  if (d === 3) {
    const a = r.int(2, 6), b = r.nz(-9, 9), n = r.int(1, a - 1);
    const k = n / a, target = a * k + b;
    return baseQ({ sub: "s4", diff: d, text: `The line $y = ${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)}$ passes through a point with $y = ${target}$ whose $x$-coordinate is not a whole number. Find that $x$-coordinate. (Fractions like $2/3$ are fine.)`, answer: frac(n, a), accept: [dec(k, 4)], tol: 0.001, steps: [`Set $${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = ${target}$.`, `$${a}x = ${target - b}$.`, `$x = \\frac{${target - b}}{${a}} = \\frac{${n}}{${a}}$ ≈ ${dec(k, 4)}.`], concept: "Lines pass through fractional coordinates too", hint1: "Solve exactly, then reduce the fraction.", hint2: `${target} − (${b}) = ${target - b}, divide by ${a}.`, mistake: "Rounding to the nearest integer point — the grid may be finer than 1.", verify: `y(${n}/${a}) = ${n} + (${b}) = ${target}. ✓`, remember: "A line is continuous: it hits every y, not just integer heights." });
  }
  const k = r.nz(-8, 8), a = r.nz(-5, 5), b = -a * k;
  const x1 = r.int(1, 3), x2 = x1 + r.int(1, 3);
  const p1 = `${x1}, ${a * x1 + b}`, p2 = `${x2}, ${a * x2 + b}`;
  return baseQ({ sub: "s4", diff: d, text: `A line passes through the points $(${p1})$ and $(${p2})$. Where does it cross the $x$-axis? Give the $x$-coordinate of the crossing point.`, answer: String(k), steps: [`Rate: $a = \\frac{(${a * x2 + b}) - (${a * x1 + b})}{${x2} - ${x1}} = ${a}$.`, `From $(${p1})$: $b = ${a * x1 + b} - ${a} \\times ${x1} = ${b}$. Line: $y = ${linStr(a, b)}$.`, `The $x$-axis crossing has $y = 0$: $${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = 0$.`, `$x = \\frac{${-b}}{${a}} = ${k}$.`], concept: "The x-axis crossing of a line is the zero of its polynomial", hint1: "Crossing the x-axis means y = 0.", hint2: `Build y = ax + b from the two points, then solve y = 0.`, given: [`Points (${p1}) and (${p2})`, "x-axis crossing: y = 0"], find: "x-coordinate of the crossing", mistake: "Setting x = 0 instead of y = 0 — that finds the y-axis crossing.", verify: `y(${k}) = ${a}×${k} + (${b}) = 0. ✓`, remember: "x-axis crossing ⇔ zero of ax + b." });
};

// ─── 11. line-cross (s4) ───────────────────────────────────────────────────
const lineCross: GenFn = (r, d) => {
  if (d === 1) {
    const a = r.int(2, 9), b = r.int(1, 12);
    return baseQ({ sub: "s4", diff: d, text: `Where does the line $y = ${a}x + ${b}$ cut the $y$-axis? Give the $y$-coordinate of the crossing point.`, answer: String(b), steps: [`Points on the $y$-axis have $x = 0$.`, `Substitute: $y = ${a} \\times 0 + ${b} = ${b}$.`, `The line cuts the $y$-axis at $(0, ${b})$ — the $y$-coordinate is $${b}$.`], concept: "The constant b is the y-intercept of y = ax + b", hint1: "On the y-axis, x = 0.", hint2: "y = a·0 + b = b.", mistake: "Reporting the intercept as (0, b) when only the y-coordinate b is asked (or vice-versa).", verify: `a × 0 always vanishes, so the entry height is exactly b. ✓`, remember: "y = ax + b enters the y-axis at height b." });
  }
  if (d === 2) {
    const k = r.nz(-9, 9), a = r.nz(2, 9) * r.sign(), b = -a * k;
    return baseQ({ sub: "s4", diff: d, text: `Find the $x$-coordinate where the line $y = ${linStr(a, b)}$ crosses the $x$-axis.`, answer: String(k), steps: [`On the $x$-axis, $y = 0$.`, `$${linStr(a, b)} = 0 \\Rightarrow ${a}x = ${-b}$.`, `$x = \\frac{${-b}}{${a}} = ${k}$, so the crossing is at $(${k}, 0)$.`], concept: "x-axis crossing = zero of the linear polynomial", hint1: "Set y = 0 — the crossing point is the polynomial's zero.", hint2: `x = −b/a = ${-b}/${a}.`, mistake: "Setting x = 0 — that is the y-axis, not the x-axis.", verify: `y(${k}) = ${a}×${k} ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = 0. ✓`, remember: "Zero of the polynomial ↔ x-axis crossing." });
  }
  if (d === 3) {
    if (r.next() < 0.5) {
      const qq = r.int(2, 9), n = r.int(1, qq - 1), m = r.int(1, 3);
      if (gcd(n, qq) !== 1) return lineCross(r, d);
      const a = qq * m, b = -n * m;
      return baseQ({ sub: "s4", diff: d, text: `The line $y = ${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)}$ crosses the $x$-axis at a fractional point. Find the $x$-coordinate of the crossing. (Fractions like $2/3$ are fine.)`, answer: frac(n, qq), accept: [dec(n / qq, 4)], tol: 0.001, steps: [`Set $y = 0$: $${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = 0$.`, `$x = \\frac{${Math.abs(b)}}{${a}} = \\frac{${n}}{${qq}}$ ≈ ${dec(n / qq, 4)}.`], concept: "Fractional x-intercepts of lines", hint1: "x = −b/a, then reduce.", hint2: `Divide ${Math.abs(b)} by ${a} and simplify.`, mistake: "Forcing an integer answer — intercepts are often fractions.", verify: `${a} × ${n}/${qq} ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = 0. ✓`, remember: "Intercepts can be fractions — keep them exact." });
    }
    const halfA = r.pick(["\\frac{1}{2}", "\\frac{3}{2}", "\\frac{1}{4}", "\\frac{5}{2}"]);
    const bdec = r.pick([2.5, 3.5, -4.5, 6.5, -1.5]);
    return baseQ({ sub: "s4", diff: d, text: `The line $y = ${halfA}x ${bdec >= 0 ? "+" : "-"} ${dec(Math.abs(bdec), 2)}$ is drawn. Where does it cut the $y$-axis? Give the $y$-coordinate.`, answer: dec(bdec, 2), steps: [`On the $y$-axis $x = 0$, and $${halfA} \\times 0 = 0$.`, `So $y = ${dec(bdec, 2)}$ — the line enters the $y$-axis at $(0, ${dec(bdec, 2)})$.`], concept: "y-intercept survives fractional slopes untouched", hint1: "The slope only matters when x ≠ 0.", hint2: "At x = 0 the line sits at exactly b.", mistake: "Multiplying b by the slope as well — the intercept is pure b.", verify: `Any line y = (anything)·x + b meets the y-axis at b. ✓`, remember: "b is the launch height — slope changes nothing at x = 0." });
  }
  const p = r.int(5, 20), nStar = r.int(10, 60), C = p * nStar;
  return baseQ({ sub: "s4", diff: d, text: `A workshop's profit on $n$ tiffin boxes is the linear polynomial $P(n) = ${p}n - ${C}$ (₹${p} profit per box, ₹${C} fixed setup cost). Find the **break-even point**: the value of $n$ where $P(n) = 0$.`, answer: String(nStar), steps: [`Break-even means profit exactly zero: $P(n) = 0$.`, `$${p}n - ${C} = 0 \\Rightarrow ${p}n = ${C}$.`, `$n = \\frac{${C}}{${p}} = ${nStar}$ boxes.`], concept: "Break-even = zero of a linear profit polynomial", hint1: "Break-even ⇔ P(n) = 0.", hint2: `Cost ÷ per-unit profit: ${C} ÷ ${p}.`, mistake: "Calling break-even the point of maximum profit — it is exactly where profit is zero.", given: [`P(n) = ${p}n − ${C}`, "Break-even: P(n) = 0"], find: "Number of boxes n at break-even", verify: `P(${nStar}) = ${p}×${nStar} − ${C} = 0. ✓`, remember: "Every zero has a story: here it is break-even." });
};

// ─── 12. compare-lines (s4) ────────────────────────────────────────────────
const compareLines: GenFn = (r, d) => {
  if (d === 1) {
    const slopes = [-3, -1, 1, 2, 3, 4, 5].sort(() => r.next() - 0.5).slice(0, 4);
    const lines = slopes.map((a) => ({ a, s: `y = ${linStr(a, r.nz(-6, 9))}` }));
    const win = lines.reduce((m, l) => (l.a > m.a ? l : m));
    const shuffled = [...lines].sort(() => r.next() - 0.5);
    return baseQ({ sub: "s4", diff: d, type: "mcq", text: "Four machines run on the coordinate plane. Which line **grows fastest** (climbs steepest) as x increases?", choices: shuffled.map((l) => `$${l.s}$`), answer: `$${win.s}$`, steps: [`Growth speed is the coefficient of $x$ — the slope $a$ in $y = ax + b$.`, `Slopes here: ${lines.map((l) => `${l.a}`).join(", ")}.`, `The largest slope is $${win.a}$, so $${win.s}$ climbs fastest.`], concept: "Slope as growth speed", hint1: "Ignore the constant b — it only shifts the line up or down.", hint2: "Bigger coefficient of x ⇒ faster climb.", mistake: "Picking the line that starts highest — start height says nothing about speed.", remember: "Slope = speed; intercept = starting height." });
  }
  if (d === 2) {
    const down = `y = ${linStr(-r.int(2, 6), r.nz(-6, 9))}`;
    const ups = [r.int(1, 3), r.int(3, 5), r.int(4, 7)].map((a) => `y = ${linStr(a, r.nz(-6, 9))}`);
    const uniq = [...new Set([down, ...ups])];
    while (uniq.length < 4) uniq.push(`y = ${linStr(r.int(1, 8), r.nz(-6, 9))}`);
    const shuffled = [...uniq].sort(() => r.next() - 0.5);
    return baseQ({ sub: "s4", diff: d, type: "mcq", text: "Which of these lines **tilts downward** (falls as x increases)?", choices: shuffled.map((s) => `$${s}$`), answer: `$${down}$`, steps: [`A line falls exactly when its slope is negative.`, `Checking coefficients of $x$: only $${down}$ has a negative one.`, `So $${down}$ tilts downward.`], concept: "Sign of the slope controls the tilt", hint1: "Look at the sign of the x-coefficient.", hint2: "Negative a ⇒ falling line, positive a ⇒ rising line.", mistake: "A negative constant b does NOT make the line fall — b only shifts it.", remember: "a < 0 falls, a > 0 rises, a = 0 flat." });
  }
  if (d === 3) {
    let lines: { a: number; b: number; s: string; v: number }[] = [];
    for (let tries = 0; tries < 20; tries++) {
      const as = [-4, -2, 1, 3, 4, 5, 6].sort(() => r.next() - 0.5).slice(0, 4);
      lines = as.map((a) => { const b = r.nz(-9, 9); return { a, b, s: `y = ${linStr(a, b)}`, v: a * 10 + b }; });
      if (new Set(lines.map((l) => l.v)).size === 4) break;
    }
    const win = lines.reduce((m, l) => (l.v > m.v ? l : m));
    const shuffled = [...lines].sort(() => r.next() - 0.5);
    return baseQ({ sub: "s4", diff: d, type: "mcq", text: "At the vertical strip $x = 10$, which line is **highest**?", choices: shuffled.map((l) => `$${l.s}$`), answer: `$${win.s}$`, steps: [`Compute each line's height at $x = 10$: ${lines.map((l) => `$${l.s.replace("y = ", "")}$ gives ${l.v}`).join(", ")}.`, `The tallest is $${win.s}$ at $y = ${win.v}$.`], concept: "Comparing line heights at a fixed x", hint1: "Substitute x = 10 into every equation.", hint2: "A negative slope loses height fast by x = 10.", mistake: "Assuming the steepest line always wins — with negative slopes or big intercepts, compute!", verify: `win: ${win.a}×10 + (${win.b}) = ${win.v} is the max. ✓`, remember: "Height at x = 10 is ax + b — compute, don't guess." });
  }
  const nStar = r.int(3, 15);
  const a1 = r.int(2, 6), a2 = a1 > 2 ? r.int(1, a1 - 1) : 1;
  const b1 = r.nz(-5, 9), b2 = b1 + (a1 - a2) * nStar;
  return baseQ({ sub: "s4", diff: d, text: `Two lines are drawn on the same plane: $L_1: y = ${a1}x ${b1 >= 0 ? "+" : "-"} ${Math.abs(b1)}$ and $L_2: y = ${a2}x ${b2 >= 0 ? "+" : "-"} ${Math.abs(b2)}$. At what $x$-coordinate do the two lines cross each other?`, answer: String(nStar), steps: [`At a crossing the two outputs match: $${a1}x ${b1 >= 0 ? "+" : "-"} ${Math.abs(b1)} = ${a2}x ${b2 >= 0 ? "+" : "-"} ${Math.abs(b2)}$.`, `Collect x-terms: $(${a1} - ${a2})x = ${b2 - b1}$.`, `$${a1 - a2}x = ${b2 - b1}$, so $x = ${nStar}$.`, `Both lines pass through $(${nStar}, ${a1 * nStar + b1})$.`], concept: "Intersection of two lines by equating them", hint1: "Same point means same y — set the equations equal.", hint2: `L₁ gains ${a1 - a2} on L₂ per step; the start gap is ${b2 - b1}.`, given: [`L₁: y = ${a1}x ${b1 >= 0 ? "+" : "−"} ${Math.abs(b1)}`, `L₂: y = ${a2}x ${b2 >= 0 ? "+" : "−"} ${Math.abs(b2)}`], find: "x-coordinate of the crossing", mistake: "Equating slopes instead of equations — slopes are different by design.", verify: `At x = ${nStar}: L₁ y = ${a1 * nStar + b1}, L₂ y = ${a2 * nStar + b2}. Equal ✓`, remember: "Lines cross where their rules agree." });
};

export const bank: Record<string, GenFn> = {
  "eval-poly": evalPoly,
  "find-zero": findZero,
  "mcq-degree": mcqDegree,
  "coeff-read": coeffRead,
  "pattern-nth": patternNth,
  "matchstick-rule": matchRule,
  "table-rule": tableRule,
  "rate-word": rateWord,
  "growth-decay": growthDecay,
  "graph-read": graphRead,
  "line-cross": lineCross,
  "compare-lines": compareLines,
};

export const bankSize: Record<string, number> = {
  "eval-poly": 8 * 9 * 9 + 18 * 24 * 16 + 6 * 18 * 13 + 12 * 18 * 60,   // 21,924
  "find-zero": 9 * 8 + 18 * 16 + 3 * 8 * 7 + (5 * 5 + 6 * 10 + 5 * 6),   // 643
  "mcq-degree": 5 * 18 * 9 * 9 + 4 * 6 * 18 * 18,                       // 10,908
  "coeff-read": 8 * 9 + 18 * 18 + 9 * 18 * 18 * 9 + 12 * 18 * 5,        // 27,702
  "pattern-nth": 3 * 6 * 6 + 16 * 9 + 5 * 10 * 9 + 9 * 5 * 6 * 7,       // 2,574
  "matchstick-rule": 3 * 8 + 3 * 10 + 13 + 3 * 21 * 2,                  // 187
  "table-rule": 4 * 10 * 4 + 12 * 18 * 7 + 5 * 18 * 7 + 5 * 18 * 8,     // 3,166
  "rate-word": 7 * 8 * 9 + 12 * 8 * 5 + 4 * 5 * 9 + 16 * 7 * 5,         // 1,575
  "growth-decay": 11 * 4 * 10 + 5 * 9 * 41 + 7 * 7 + 7 * 4 * 4 * 8,     // 2,905
  "graph-read": 5 * 9 * 9 + 12 * 16 * 2 + 5 * 18 * 5 + 10 * 10 * 8,     // 3,345
  "line-cross": 8 * 12 + 18 * 16 + 3 * 8 * 7 + 5 * 5 + 16 * 51,         // 1,327
  "compare-lines": 7 * 4 * 18 + 6 * 3 * 18 * 4 + 7 * 4 * 18 * 18 + 14 * 6 * 14, // 12,204
};
