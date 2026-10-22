import type { GenFn, Question } from "@/lib/wars/types";

// ─── CH8 · Predicting What Comes Next — generator bank ────────────────────
// 12 generators over 4 subtopics: s1 patterns · s2 AP · s3 sums · s4 GP/wild

// ─── helpers ───────────────────────────────────────────────────────────────
const ordinal = (n: number): string => {
  const r10 = n % 10, r100 = n % 100;
  if (r100 >= 11 && r100 <= 13) return `${n}th`;
  return `${n}${r10 === 1 ? "st" : r10 === 2 ? "nd" : r10 === 3 ? "rd" : "th"}`;
};
const dec = (x: number, k = 3) => String(Math.round(x * 10 ** k) / 10 ** k);
const signed = (x: number) => (x < 0 ? `(${x})` : `${x}`);
const inr = (n: number): string => {
  const s = String(Math.round(n));
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  const parts: string[] = [];
  while (rest.length > 2) { parts.unshift(rest.slice(-2)); rest = rest.slice(0, -2); }
  if (rest) parts.unshift(rest);
  return `${parts.join(",")},${last3}`;
};

function baseQ(p: Partial<Question> & Pick<Question, "text" | "answer" | "steps" | "concept" | "hint1" | "hint2">): Question {
  return { type: "numeric", diff: 1, ch: 8, sub: "s1", gen: "x", id: "x", ...p };
}

// ─── 1. next-term (s1) ─────────────────────────────────────────────────────
const nextTerm: GenFn = (r, d) => {
  let terms: number[] = [], ans = 0, why = "";
  if (d === 1) {
    const a = r.int(2, 60), dd = r.pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    for (let i = 0; i < 5; i++) terms.push(a + i * dd);
    ans = a + 5 * dd;
    why = `each jump adds the same $${dd}$ — an arithmetic pattern.`;
  } else if (d === 2) {
    const k = r.int(0, 2);
    if (k === 0) {
      const a = r.int(2, 9), rr = r.pick([2, 3, 4, 5]);
      for (let i = 0; i < 4; i++) terms.push(a * rr ** i);
      ans = a * rr ** 4;
      why = `each term is multiplied by $${rr}$ — a geometric pattern.`;
    } else if (k === 1) {
      const s = r.int(1, 4);
      for (let i = 0; i < 5; i++) terms.push((s + i) ** 2);
      ans = (s + 5) ** 2;
      why = `these are perfect squares: $${s}^2, ${s + 1}^2, \\ldots$`;
    } else {
      const s = r.int(1, 4);
      for (let i = 0; i < 5; i++) { const n = s + i; terms.push((n * (n + 1)) / 2); }
      ans = ((s + 5) * (s + 6)) / 2;
      why = "these are triangular numbers $\\frac{n(n+1)}{2}$.";
    }
  } else if (d === 3) {
    const k = r.int(0, 2);
    if (k === 0) {
      const a = r.int(1, 8);
      terms = [a, a + 2, a + 6, a + 12, a + 20];
      ans = a + 30;
      why = "the gaps themselves grow: $+2, +4, +6, +8$, so the next gap is $+10$.";
    } else if (k === 1) {
      const a = r.int(2, 7), rr = r.pick([-2, -3]);
      for (let i = 0; i < 4; i++) terms.push(a * rr ** i);
      ans = a * rr ** 4;
      why = "the signs alternate: the hidden rule multiplies by $${rr}$.";
    } else {
      const a = r.pick([80, 160, 240, 320, 480, 640]);
      terms = [a, a / 2, a / 4, a / 8];
      ans = a / 16;
      why = "each term is half of the previous one — the pattern shrinks.";
    }
  } else {
    if (r.int(0, 1) === 0) {
      const u = r.int(1, 5);
      let t = u; terms = [t];
      for (let i = 0; i < 3; i++) { t = 2 * t + 1; terms.push(t); }
      const p1 = 2 * t + 1, p2 = 2 * p1 + 1;
      const correct = `${p1}, ${p2}`;
      const choices = [...new Set([correct, `${p1 + 1}, ${p2 + 1}`, `${p1 + 2}, ${p2 + 2}`, `${p1 + 8}, ${p2 + 8}`])];
      return baseQ({
        type: "mcq",
        text: `A sequence is built by a machine rule: *double, then add 1*. It begins $${terms.join(", ")}, \\ldots$ What are the next two terms?`,
        choices,
        answer: correct,
        steps: [
          "The machine rule is: $t_{n} = 2t_{n-1} + 1$ — a recursive rule.",
          `Apply it once: $2 \\times ${t} + 1 = ${p1}$.`,
          `Apply it again: $2 \\times ${p1} + 1 = ${p2}$.`,
          `So the next two terms are $${p1}$ and $${p2}$: the pair $${correct}$.`,
        ],
        concept: "Recursive pattern rules (each term built from the previous one)",
        hint1: "Find how each shown term is produced from the one before it.",
        hint2: "Double the last term, add 1 — then do it again for the second term.",
        mistake: "The rule is ×2 **then** +1. Doing $2(t+1)$ instead shifts every term.",
        remember: "Machine rules must be applied in order — once per new term.",
      });
    }
    const a = r.int(1, 9);
    terms = [a, a + 3, a + 9, a + 21, a + 45];
    const p1 = a + 93, p2 = a + 189;
    const correct = `${p1}, ${p2}`;
    const choices = [...new Set([correct, `${p1 + 2}, ${p2 + 4}`, `${p1 - 6}, ${p2 - 12}`, `${a + 69}, ${a + 117}`])];
    return baseQ({
      type: "mcq",
      text: `The gaps between terms double every time: $${terms.join(", ")}, \\ldots$ What are the next two terms?`,
      choices,
      answer: correct,
      steps: [
        "Read the gaps: $+3, +6, +12, +24$ — each gap doubles.",
        "So the next gaps are $48$ and then $96$.",
        `Next term: $${a + 45} + 48 = ${p1}$.`,
        `Term after: $${p1} + 96 = ${p2}$. The pair is $${correct}$.`,
      ],
      concept: "Second-level patterns (gaps that themselves follow a rule)",
      hint1: "Subtract consecutive terms and look at THAT list.",
      hint2: "The gap list doubles — continue it twice.",
      mistake: "Don't reuse the last gap $24$; the gaps grow too.",
      remember: "When a sequence looks irregular, study the sequence of gaps.",
    });
  }
  return baseQ({
    text: `What is the next term of the sequence $${terms.join(", ")}, \\ldots$?`,
    answer: String(ans),
    steps: [
      "Compare each term with the one before it and record the rule.",
      `The rule: ${why}`,
      `Applying the rule to the last term $${terms[terms.length - 1]}$ gives $${ans}$.`,
    ],
    concept: "Term-to-term pattern rules for sequences",
    hint1: "Subtract (or divide) consecutive terms — what stays the same?",
    hint2: why,
    mistake: "Check the rule on EVERY consecutive pair — one coincidence is not a rule.",
    remember: "First check + and −; if gaps change, check × and ÷.",
  });
};

// ─── 2. explicit-rule (s1) ─────────────────────────────────────────────────
const explicitRule: GenFn = (r, d) => {
  if (d <= 2) {
    const p = r.int(2, 9), q = r.nz(-9, 9);
    const n = d === 1 ? r.int(3, 8) : r.int(9, 20);
    const ans = p * n + q;
    const qp = q >= 0 ? `+ ${q}` : `- ${Math.abs(q)}`;
    return baseQ({
      sub: "s1",
      text: `A sequence has explicit rule $t_n = ${p}n ${qp}$ for $n \\ge 1$. Find $t_{${n}}$.`,
      answer: String(ans),
      steps: [
        "An explicit rule computes term $n$ directly — no earlier terms needed.",
        `Substitute $n = ${n}$: $t_{${n}} = ${p} \\times ${n} ${qp}$.`,
        `$= ${p * n} ${qp} = ${ans}$.`,
      ],
      concept: "Evaluating the explicit (nth-term) rule of a sequence",
      hint1: "Explicit rule = plug the term number straight into the formula.",
      hint2: `First work out $${p} \\times ${n}$, then ${q >= 0 ? "add" : "subtract"} $${Math.abs(q)}$.`,
      mistake: "$t_6$ means substitute $n = 6$ — it is not six times something.",
      remember: "An explicit rule finds ANY term without listing the others.",
    });
  }
  if (d === 3) {
    const b = r.nz(-4, 4), c = r.nz(-3, 6), n = r.int(4, 12);
    const ans = n * n + b * n + c;
    const bs = b > 0 ? `+ ${b === 1 ? "" : b}n` : `- ${b === -1 ? "" : Math.abs(b)}n`;
    const cs = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
    return baseQ({
      sub: "s1",
      text: `A sequence has explicit rule $t_n = n^2 ${bs} ${cs}$ for $n \\ge 1$. Find $t_{${n}}$.`,
      answer: String(ans),
      steps: [
        `Substitute $n = ${n}$ into $t_n = n^2 ${bs} ${cs}$.`,
        `$${n}^2 = ${n * n}$ and $${Math.abs(b)} \\times ${n} = ${Math.abs(b) * n}$.`,
        `Combine: $${n * n} ${b * n >= 0 ? "+" : "-"} ${Math.abs(b * n)} ${c >= 0 ? "+" : "-"} ${Math.abs(c)} = ${ans}$.`,
      ],
      concept: "Evaluating quadratic explicit rules",
      hint1: "Powers first (BODMAS): compute $n^2$ before touching the rest.",
      hint2: `Work out $${n}^2$ and $${Math.abs(b)} \\times ${n}$ separately, then combine all three pieces.`,
      mistake: "Substitute $n$ everywhere it appears — here it appears twice ($n^2$ and $n$).",
      remember: "Squared rules grow fast: $t_{12}$ can already be in the hundreds.",
    });
  }
  const p = r.pick([3, 4, 5, 6, 7]), q = r.nz(-6, 8), k = r.int(4, 20);
  const isTerm = r.next() < 0.5;
  const m = isTerm ? p * k + q : p * k + q + r.int(1, p - 1);
  const qs = q >= 0 ? `+ ${q}` : `- ${Math.abs(q)}`;
  return baseQ({
    sub: "s1",
    type: "tf",
    text: `True or False: $${m}$ is a term of the sequence $t_n = ${p}n ${qs}$ for $n \\ge 1$.`,
    answer: isTerm ? "true" : "false",
    steps: [
      `If $${m}$ is a term, then $${p}n ${qs} = ${m}$ for some whole number $n$.`,
      `So we need $( ${m} ${q >= 0 ? "-" : "+"} ${Math.abs(q)} ) \\div ${p}$ to be a whole number: $${m - q} \\div ${p}$.`,
      isTerm
        ? `$${m - q} \\div ${p} = ${k}$ — a whole number, so $t_{${k}} = ${m}$. The statement is **true**.`
        : `$${m - q}$ is **not** divisible by $${p}$ (remainder $${(m - q) % p}$), so no such $n$ exists. The statement is **false**.`,
    ],
    concept: "Testing membership of a sequence using its explicit rule",
    hint1: "Solve the equation $pn + q = m$ for $n$.",
    hint2: "n must be a whole number ≥ 1 — otherwise m is not a term.",
    mistake: "A decimal or negative $n$ does NOT count: terms only exist for whole-number $n$.",
    verify: isTerm ? `Direct check: $t_{${k}} = ${p} \\times ${k} ${qs} = ${m}$ ✓` : `Nearest term $t_{${k}} = ${p * k + q}$, and the next one is $${p * (k + 1) + q}$ — $${m}$ falls in between.`,
    remember: "m is a term of $pn+q$ exactly when $(m - q)$ is divisible by $p$.",
  });
};

// ─── 3. recursive-eval (s1) ────────────────────────────────────────────────
const recursiveEval: GenFn = (r, d) => {
  if (d === 1) {
    const a = r.int(1, 9), dd = r.int(2, 9), k = r.int(4, 5);
    const terms: number[] = [a];
    for (let i = 2; i <= k; i++) terms.push(a + (i - 1) * dd);
    return baseQ({
      sub: "s1",
      text: `A sequence is defined by $t_1 = ${a}$ and $t_n = t_{n-1} + ${dd}$ for $n \\ge 2$. Find $t_{${k}}$.`,
      answer: String(terms[k - 1]),
      steps: [
        `Start from the seed: $t_1 = ${a}$.`,
        ...terms.slice(1).map((t, i) => `Step ${i + 2}: $t_{${i + 2}} = t_{${i + 1}} + ${dd} = ${terms[i]} + ${dd} = ${t}$.`),
        `So $t_{${k}} = ${terms[k - 1]}$.`,
      ],
      concept: "Computing terms from a recursive rule",
      hint1: "A recursive rule needs the previous term — build the sequence one term at a time.",
      hint2: "Add the step size repeatedly, starting from the seed $t_1$.",
      mistake: "Don't jump straight to $t_{\\text{anything}}$ — each term depends on the one before.",
      remember: "Recursive rule = seed + a rule that walks forward.",
    });
  }
  if (d === 2) {
    const a = r.int(2, 6), rr = r.int(2, 4), k = r.int(4, 5);
    const terms: number[] = [a];
    for (let i = 2; i <= k; i++) terms.push(a * rr ** (i - 1));
    return baseQ({
      sub: "s1",
      text: `A sequence is defined by $t_1 = ${a}$ and $t_n = ${rr}\\,t_{n-1}$ for $n \\ge 2$. Find $t_{${k}}$.`,
      answer: String(terms[k - 1]),
      steps: [
        `Seed: $t_1 = ${a}$.`,
        ...terms.slice(1).map((t, i) => `Step ${i + 2}: $t_{${i + 2}} = ${rr} \\times ${terms[i]} = ${t}$.`),
        `So $t_{${k}} = ${terms[k - 1]}$.`,
      ],
      concept: "Recursive rules that multiply (geometric growth)",
      hint1: "Here the rule multiplies instead of adding.",
      hint2: `Keep multiplying by $${rr}$, starting from $${a}$.`,
      mistake: "Multiplying $k$ times overshoots — from $t_1$ to $t_4$ is only 3 multiplications.",
      remember: "Multiply-recursion grows much faster than add-recursion.",
    });
  }
  if (d === 3) {
    const p = r.int(2, 4), q = r.int(1, 9), a = r.int(1, 5), k = r.int(4, 5);
    const terms: number[] = [a];
    for (let i = 2; i <= k; i++) terms.push(p * terms[i - 2] + q);
    return baseQ({
      sub: "s1",
      text: `A sequence is defined by $t_1 = ${a}$ and $t_n = ${p}t_{n-1} + ${q}$ for $n \\ge 2$. Find $t_{${k}}$.`,
      answer: String(terms[k - 1]),
      steps: [
        `Seed: $t_1 = ${a}$.`,
        ...terms.slice(1).map((t, i) => `Step ${i + 2}: $t_{${i + 2}} = ${p} \\times ${terms[i]} + ${q} = ${t}$.`),
        `So $t_{${k}} = ${terms[k - 1]}$.`,
      ],
      concept: "Mixed recursive rules (multiply then add)",
      hint1: "Do exactly what the rule says, one term at a time.",
      hint2: `Each step: multiply the previous term by $${p}$, then add $${q}$.`,
      mistake: "The rule applies to the NEW term each time, not always to the seed.",
      verify: `Substitute back: $${p} \\times ${terms[k - 2]} + ${q} = ${terms[k - 1]}$ ✓`,
      remember: "Book Example 3: $u_1 = 1$, $u_n = 2u_{n-1} + 3$ gives $1, 5, 13, 29, \\ldots$",
    });
  }
  const a = r.pick([2, 3]);
  const terms: number[] = [a];
  let t = a;
  for (let i = 0; i < 3; i++) { t = t * t - 1; terms.push(t); }
  return baseQ({
    sub: "s1",
    text: `A sequence is defined by $t_1 = ${a}$ and $t_n = t_{n-1}^2 - 1$ for $n \\ge 2$. Find $t_4$.`,
    answer: String(t),
    steps: [
      `Seed: $t_1 = ${a}$.`,
      `Step 2: $t_2 = ${a}^2 - 1 = ${terms[1]}$.`,
      `Step 3: $t_3 = ${terms[1]}^2 - 1 = ${terms[2]}$.`,
      `Step 4: $t_4 = ${terms[2]}^2 - 1 = ${terms[3]}$.`,
    ],
    concept: "Recursive rules that square the previous term",
    hint1: "Square first, then subtract 1 — for each new term.",
    hint2: `From $t_1 = ${a}$: compute $t_2$, then feed THAT back in for $t_3$, and so on.`,
    mistake: "Squaring explodes quickly — write every step down, don't skip.",
    remember: "Recursive rules can grow violently: squaring beats doubling very soon.",
  });
};

// ─── 4. ap-nth (s2) ────────────────────────────────────────────────────────
const apNth: GenFn = (r, d) => {
  if (d === 1) {
    const a = r.int(1, 30), dd = r.int(2, 12), n = r.int(6, 15);
    const ans = a + (n - 1) * dd;
    return baseQ({
      sub: "s2",
      text: `Find the ${ordinal(n)} term of the arithmetic progression $${a},\\ ${a + dd},\\ ${a + 2 * dd},\\ ${a + 3 * dd},\\ \\ldots$`,
      answer: String(ans),
      steps: [
        `Identify: first term $a = ${a}$, common difference $d = ${a + dd} - ${a} = ${dd}$.`,
        `Use the nth-term formula: $a_n = a + (n-1)d$.`,
        `$a_{${n}} = ${a} + (${n} - 1) \\times ${dd} = ${a} + ${(n - 1) * dd} = ${ans}$.`,
      ],
      concept: "nth term of an AP: aₙ = a + (n − 1)d",
      hint1: "The nth term is the first term plus (n − 1) jumps of size d.",
      hint2: `From $${a}$, take $${n - 1}$ jumps of $${dd}$.`,
      mistake: "The 10th term needs only **9** jumps: $a + 9d$, not $a + 10d$.",
      verify: `Listing forward from $${a}$ by $${dd}$s, term $${n}$ is indeed $${ans}$.`,
      remember: "$a_n = a + (n-1)d$ — the engine of every AP question.",
    });
  }
  if (d === 2) {
    const a = r.int(1, 25), dd = r.int(2, 10), k = r.int(8, 25);
    const m = a + (k - 1) * dd;
    return baseQ({
      sub: "s2",
      text: `Which term of the arithmetic progression $${a},\\ ${a + dd},\\ ${a + 2 * dd},\\ \\ldots$ is $${m}$?`,
      answer: String(k),
      steps: [
        `Set up the equation $a + (n-1)d = ${m}$ with $a = ${a}$ and $d = ${dd}$.`,
        `$${a} + (n-1) \\times ${dd} = ${m} \\Rightarrow (n-1) \\times ${dd} = ${m - a}$.`,
        `$n - 1 = ${m - a} \\div ${dd} = ${(m - a) / dd}$, so $n = ${k}$.`,
        `Answer: $${m}$ is the ${ordinal(k)} term.`,
      ],
      concept: "Finding the term number n from aₙ = a + (n − 1)d",
      hint1: "Turn the question into an equation and solve for n.",
      hint2: `Isolate $(n-1)$: subtract $${a}$ from $${m}$, then divide by $${dd}$.`,
      mistake: "Forgetting the final +1: n − 1 is the number of jumps, n is the term number.",
      verify: `$a_{${k}} = ${a} + ${k - 1} \\times ${dd} = ${m}$ ✓`,
      remember: "$n = \\dfrac{a_n - a}{d} + 1$.",
    });
  }
  if (d === 3) {
    const dd = r.int(2, 12), a = r.int(-15, 20);
    const p = r.int(2, 5), q = p + r.pick([3, 4, 6]), ridx = q + r.int(2, 16);
    const x = a + (p - 1) * dd, y = a + (q - 1) * dd, ans = a + (ridx - 1) * dd;
    return baseQ({
      sub: "s2",
      text: `In an AP, the ${ordinal(p)} term is $${x}$ and the ${ordinal(q)} term is $${y}$. Find the ${ordinal(ridx)} term.`,
      answer: String(ans),
      steps: [
        `Between the ${ordinal(p)} and ${ordinal(q)} terms there are $${q} - ${p} = ${q - p}$ steps of size $d$.`,
        `$d = \\frac{${y} - ${signed(x)}}{${q - p}} = \\frac{${y - x}}{${q - p}} = ${dd}$.`,
        `Recover $a$: $a = ${x} - (${p} - 1) \\times ${dd} = ${a}$.`,
        `$a_{${ridx}} = ${a} + (${ridx} - 1) \\times ${dd} = ${a} + ${(ridx - 1) * dd} = ${ans}$.`,
      ],
      concept: "Building an AP from two known terms (solving for a and d)",
      hint1: "Two terms give two equations: subtract them to eliminate a and get d.",
      hint2: "Once d is known, walk back to a, then jump to the requested term.",
      given: [`$t_{${p}} = ${x}$`, `$t_{${q}} = ${y}$`],
      find: `The ${ordinal(ridx)} term $a_{${ridx}}$`,
      mistake: "Divide the difference by the term-number gap, not by the count of terms listed.",
      remember: "$d = \\dfrac{t_q - t_p}{q - p}$ for any two terms of an AP.",
    });
  }
  if (r.int(0, 1) === 0) {
    const fee = r.pick([50, 100, 150, 200, 250, 300, 400]), perkm = r.pick([12, 15, 20, 25, 40]), km = r.int(8, 25);
    const fare = fee + perkm * km;
    return baseQ({
      sub: "s2",
      diff: 4,
      text: `A taxi company charges a fixed booking fee of ₹${inr(fee)} plus ₹${perkm} per kilometre travelled. What is the total fare for a journey of ${km} km?`,
      answer: String(fare),
      steps: [
        `Fares for $1, 2, 3, \\ldots$ km form the sequence $${fee + perkm},\\ ${fee + 2 * perkm},\\ ${fee + 3 * perkm},\\ \\ldots$ — an AP with $d = ${perkm}$.`,
        `First term $a = ${fee + perkm}$ (fee + first km).`,
        `Fare for ${km} km $= a + (${km} - 1)d = ${fee + perkm} + ${km - 1} \\times ${perkm} = ${fee + perkm} + ${(km - 1) * perkm} = ${fare}$.`,
        `Equivalently: fare $= \\text{fee} + \\text{rate} \\times \\text{km} = ${fee} + ${perkm} \\times ${km} = ${fare}$.`,
      ],
      concept: "Modelling fixed-fee + per-unit costs as an AP (Book Example 5)",
      hint1: "Write the fare for 1 km, 2 km, 3 km — spot the AP.",
      hint2: `Each extra km adds exactly ₹${perkm}.`,
      given: [`Booking fee: ₹${inr(fee)}`, `Rate: ₹${perkm} per km`],
      find: `Total fare for ${km} km`,
      mistake: "The booking fee is charged once — it is not ₹" + inr(fee) + " *per* km.",
      verify: `AP check: $t_1 + (${km}-1)d = ${fee + perkm} + ${(km - 1) * perkm} = ${fare}$ ✓`,
      remember: "Fixed fee = shift of the AP; per-unit rate = common difference.",
    });
  }
  const start = r.pick([200000, 300000, 400000, 500000]), inc = r.pick([10000, 15000, 20000, 25000]), N = r.int(8, 15);
  const sal = start + (N - 1) * inc;
  return baseQ({
    sub: "s2",
    diff: 4,
    text: `Harish starts work at an annual salary of ₹${inr(start)} and receives an increment of ₹${inr(inc)} every year. What is his annual salary in the ${ordinal(N)} year of service?`,
    answer: String(sal),
    steps: [
      `Yearly salaries: ₹${inr(start)}, ₹${inr(start + inc)}, ₹${inr(start + 2 * inc)}, \\ldots — an AP with $a = ${start}$ and $d = ${inc}$.`,
      `The ${ordinal(N)} year is the ${ordinal(N)} term: use $a_n = a + (n-1)d$.`,
      `$a_{${N}} = ${start} + (${N} - 1) \\times ${inc} = ${start} + ${(N - 1) * inc} = ${sal}$.`,
      `Salary in the ${ordinal(N)} year: ₹${inr(sal)}.`,
    ],
    concept: "Modelling salary increments as an AP (Book Exercise 8.2 Q6)",
    hint1: "Year 1 salary is the first term of the AP.",
    hint2: `The ${ordinal(N)} year needs $${N - 1}$ increments, not $${N}$.`,
    given: [`Starting salary: ₹${inr(start)}`, `Yearly increment: ₹${inr(inc)}`],
    find: `Salary in the ${ordinal(N)} year`,
    mistake: "In the 1st year there is no increment yet — increments counted = year − 1.",
    verify: `Reverse walk: $${sal} - ${N - 1} \\times ${inc} = ${start}$ = starting salary ✓`,
    remember: "Salary in year n = starting salary + (n − 1) × increment.",
  });
};

// ─── 5. ap-find-d (s2) ─────────────────────────────────────────────────────
const apFindD: GenFn = (r, d) => {
  if (d <= 2) {
    const a = r.int(-20, 30), dd = r.nz(-12, 12);
    const p = d === 1 ? 3 : 2;
    const q = d === 1 ? 4 : p + r.int(2, 4);
    const x = a + (p - 1) * dd, y = a + (q - 1) * dd;
    return baseQ({
      sub: "s2",
      diff: d,
      text: `In an AP, $t_{${p}} = ${x}$ and $t_{${q}} = ${y}$. Find the common difference $d$.`,
      answer: String(dd),
      steps: [
        `Going from $t_{${p}}$ to $t_{${q}}$ takes $${q} - ${p} = ${q - p}$ steps, each of size $d$.`,
        `$d = \\frac{t_{${q}} - t_{${p}}}{${q - p}} = \\frac{${y} - ${signed(x)}}{${q - p}} = \\frac{${y - x}}{${q - p}} = ${dd}$.`,
        `Check: $t_{${p}} + ${q - p} \\times ${dd} = ${x} + ${(q - p) * dd} = ${y}$ ✓`,
      ],
      concept: "Common difference from two known terms",
      hint1: "d is the size of ONE step — divide the total change by the number of steps.",
      hint2: `Total change $= ${y} - ${signed(x)} = ${y - x}$ over $${q - p}$ steps.`,
      mistake: `Dividing by the wrong gap: between $t_{${p}}$ and $t_{${q}}$ there are $${q - p}$ steps, not $${q - p + 1}$.`,
      remember: "$d = (t_q - t_p) \\div (q - p)$ — count the steps, not the terms.",
    });
  }
  if (d === 3) {
    const a = r.int(-40, 40), dd = r.nz(-15, 15);
    const p = r.int(2, 4), q = p + r.pick([5, 7, 8]);
    const x = a + (p - 1) * dd, y = a + (q - 1) * dd;
    return baseQ({
      sub: "s2",
      diff: 3,
      text: `In an AP, $t_{${p}} = ${x}$ and $t_{${q}} = ${y}$. Find the common difference $d$. (Watch the signs!)`,
      answer: String(dd),
      steps: [
        `Steps between: $${q} - ${p} = ${q - p}$.`,
        `$d = \\frac{${y} - ${signed(x)}}{${q - p}} = \\frac{${y - x}}{${q - p}} = ${dd}$.`,
        `Sanity check: $d$ is ${dd > 0 ? "positive, so the AP rises" : "negative, so the AP falls"} — matching $t_{${p}}$ ${dd > 0 ? "<" : ">"} $t_{${q}}$ ✓`,
      ],
      concept: "Common difference from distant terms (negative d allowed)",
      hint1: "A falling AP simply has a negative d.",
      hint2: `Subtract carefully: $${y} - ${signed(x)}$, then divide by $${q - p}$.`,
      mistake: "Sign slips: $a - (-b) = a + b$. Use brackets when subtracting negatives.",
      remember: "d carries the direction of the AP: positive climbs, negative falls.",
    });
  }
  const a = r.int(-25, 25), dd = r.nz(-10, 10), p = r.int(2, 6);
  const x = a + (p - 1) * dd;
  return baseQ({
    sub: "s2",
    diff: 4,
    text: `In an AP, the ${ordinal(p)} term is $${x}$ and the common difference is $d = ${dd}$. Find the first term $a$.`,
    answer: String(a),
    steps: [
      `The ${ordinal(p)} term is $a + (${p} - 1)d$, i.e. $a + ${(p - 1) * dd}$.`,
      `So $a + ${(p - 1) * dd} = ${x}$.`,
      `$a = ${x} - ${signed((p - 1) * dd)} = ${a}$.`,
    ],
    concept: "Working backwards in an AP from a known term",
    hint1: "Use $t_p = a + (p-1)d$ and solve for a.",
    hint2: `Subtract $${(p - 1) * dd}$ (that's $${p - 1}$ jumps) from $${x}$.`,
    given: [`$t_{${p}} = ${x}$`, `$d = ${dd}$`],
    find: "The first term $a$",
    mistake: "Walk back $(p-1)$ jumps, not $p$ jumps — $t_p$ already includes $p-1$ steps from $a$.",
    verify: `Forward check: $a + (${p}-1) \\times ${dd} = ${a} + ${(p - 1) * dd} = ${x}$ ✓`,
    remember: "$a = t_p - (p-1)d$ — rewind the AP.",
  });
};

// ─── 6. ap-missing (s2) ────────────────────────────────────────────────────
const apMissing: GenFn = (r, d) => {
  if (d === 1) {
    const dd = r.int(2, 12), x = r.int(-10, 30);
    const y = x + 2 * dd, mid = x + dd;
    return baseQ({
      sub: "s2",
      diff: 1,
      text: `Three consecutive terms of an AP are $${x}$, $?$ and $${y}$. Find the missing middle term.`,
      answer: String(mid),
      steps: [
        "The middle term of an AP is the mean (average) of its neighbours.",
        `$? = \\frac{${x} + ${y}}{2} = \\frac{${x + y}}{2} = ${mid}$.`,
        `Check the steps: $${mid} - ${x} = ${dd}$ and $${y} - ${mid} = ${dd}$ ✓`,
      ],
      concept: "Arithmetic mean fills a missing middle term",
      hint1: "The middle term sits exactly halfway between its neighbours.",
      hint2: "Add the two visible terms and halve the total.",
      mistake: "Halving only works for the MIDDLE term — a term two places away needs d first.",
      remember: "In an AP, each term is the average of the terms on either side.",
    });
  }
  if (d === 2) {
    const a = r.int(-10, 25), dd = r.int(2, 10);
    const t = [a, a + dd, a + 2 * dd, a + 3 * dd];
    const idx = r.int(1, 2);
    const shown = t.map((v, i) => (i === idx ? "?" : String(v))).join(",\\ ");
    return baseQ({
      sub: "s2",
      diff: 2,
      text: `The four numbers $${shown}$ are consecutive terms of an AP, in order. Find the missing term.`,
      answer: String(t[idx]),
      steps: [
        `Two neighbouring visible terms: $${idx === 1 ? `${t[0]} \\to ${t[2]}` : `${t[1]} \\to ${t[3]}`}$.`,
        idx === 1
          ? `That span covers $2$ steps: $d = \\frac{${t[2]} - ${signed(t[0])}}{2} = ${dd}$.`
          : `That span covers $2$ steps: $d = \\frac{${t[3]} - ${signed(t[1])}}{2} = ${dd}$.`,
        `Missing term $= ${idx === 1 ? t[0] : t[1]} + ${dd} = ${t[idx]}$.`,
        `Full AP: $${t.join(",\\ ")}$ — every step is $${dd}$ ✓`,
      ],
      concept: "Finding a missing term from the AP structure",
      hint1: "Find two visible terms that are an even number of steps apart.",
      hint2: "Total gap ÷ number of steps = d; then step forward once.",
      mistake: "The visible gap may be 2 or 3 steps wide — divide by the step count, not by 2 blindly.",
      remember: "Gap between tₙ and tₙ₊ₖ is exactly k·d.",
    });
  }
  if (d === 3) {
    const a = r.int(-15, 25), dd = r.int(2, 9), which = r.int(0, 1);
    const t = [a, a + dd, a + 2 * dd, a + 3 * dd];
    return which === 0
      ? baseQ({
          sub: "s2",
          diff: 3,
          text: `The pattern $?,\\ ${t[1]},\\ ?,\\ ${t[3]}$ is an AP with two hidden terms. Find the **first** term of the AP.`,
          answer: String(t[0]),
          steps: [
            `The visible terms $${t[1]}$ and $${t[3]}$ are $2$ steps apart.`,
            `$d = \\frac{${t[3]} - ${signed(t[1])}}{2} = \\frac{${2 * dd}}{2} = ${dd}$.`,
            `First term $= ${t[1]} - ${dd} = ${t[0]}$.`,
            `Sanity: $${t[0]} + ${dd} = ${t[1]}$ and $${t[1]} + ${dd} = ${t[2]}$ ✓`,
          ],
          concept: "Reconstructing an AP from alternate terms",
          hint1: "Alternate terms are exactly 2d apart.",
          hint2: `So $2d = ${t[3]} - ${signed(t[1])} = ${2 * dd}$, giving $d = ${dd}$.`,
          mistake: "$t_4 - t_2 = 2d$, not $d$ — two steps were taken.",
          remember: "Every second term forms its own mini-AP with difference 2d.",
        })
      : baseQ({
          sub: "s2",
          diff: 3,
          text: `The pattern $${t[0]},\\ ?,\\ ${t[2]},\\ ?$ is an AP with two hidden terms. Find the **last** (fourth) term.`,
          answer: String(t[3]),
          steps: [
            `Visible terms $${t[0]}$ and $${t[2]}$ are $2$ steps apart, so $2d = ${t[2]} - ${signed(t[0])} = ${2 * dd}$ and $d = ${dd}$.`,
            `Second term $= ${t[0]} + ${dd} = ${t[1]}$ (hidden).`,
            `Fourth term $= ${t[2]} + ${dd} = ${t[3]}$.`,
            `Full AP: $${t.join(",\\ ")}$ ✓`,
          ],
          concept: "Reconstructing an AP from alternate terms",
          hint1: "First find d from the two visible terms (they are 2 steps apart).",
          hint2: `Then one more step of $${dd}$ beyond $${t[2]}$ gives the fourth term.`,
          mistake: "Don't assume the visible gap is d — check how many steps it spans.",
          remember: "Fill missing terms by walking with d, not by guessing.",
        });
  }
  const k = r.pick([3, 4, 5]), dd = r.int(2, 9), x = r.int(-8, 25);
  const y = x + (k + 1) * dd, last = y - dd;
  return baseQ({
    sub: "s2",
    diff: 4,
    text: `${k} numbers are inserted between $${x}$ and $${y}$ so that the whole list forms an AP. Find the **last** inserted number.`,
    answer: String(last),
    steps: [
      `With ${k} insertions, the journey from $${x}$ to $${y}$ takes $${k} + 1 = ${k + 1}$ steps.`,
      `$d = \\frac{${y} - ${signed(x)}}{${k + 1}} = \\frac{${y - x}}{${k + 1}} = ${dd}$.`,
      `The last inserted number sits one step before $${y}$: $\\;${y} - ${dd} = ${last}$.`,
      `Check: $${last} + ${dd} = ${y}$ ✓`,
    ],
    concept: "Inserting n terms between two numbers of an AP",
    hint1: "Count the total number of equal steps between the two endpoints.",
    hint2: `${k} inserted numbers create $${k + 1}$ gaps — divide the full span by $${k + 1}$.`,
    given: [`Endpoints: $${x}$ and $${y}$`, `Inserted numbers: ${k}`],
    find: "The last inserted number",
    mistake: "The span is divided into $n+1$ gaps, not $n$ — inserting 3 numbers means 4 steps.",
    verify: `First inserted: $${x + dd}$; stepping ${k} times lands on $${x + k * dd} = ${last}$ ✓`,
    remember: "n inserted terms ⇔ (n + 1) equal gaps.",
  });
};

// ─── 7. sum-naturals (s3) ──────────────────────────────────────────────────
const sumNaturals: GenFn = (r, d) => {
  if (d <= 2) {
    const n = d === 1 ? r.int(5, 20) : r.int(21, 120);
    const ans = (n * (n + 1)) / 2;
    return baseQ({
      sub: "s3",
      diff: d,
      text: `Find the sum of the first $${n}$ natural numbers: $1 + 2 + 3 + \\cdots + ${n}$.`,
      answer: String(ans),
      steps: [
        `Write the sum forwards and backwards: $S = 1 + 2 + \\cdots + ${n}$ and $S = ${n} + ${n - 1} + \\cdots + 1$ (the Gauss trick).`,
        `Each column pairs to $${n + 1}$, and there are $${n}$ columns: $2S = ${n} \\times ${n + 1} = ${n * (n + 1)}$.`,
        `$S = \\frac{${n}(${n} + 1)}{2} = \\frac{${n * (n + 1)}}{2} = ${ans}$.`,
      ],
      concept: "Gauss pairing: sum of first n naturals = n(n+1)/2 (Āryabhaṭa, Āryabhaṭīya 2.19)",
      hint1: "Pair the first and last numbers: $1 + ${n} = ${n + 1}$.",
      hint2: `How many such pairs? Use $S = \\frac{n(n+1)}{2}$.`,
      mistake: "Using $\\frac{n(n-1)}{2}$ drops one pair — it must be $n(n+1)$.",
      verify: `Rough check: average $\\approx \\frac{${n} + 1}{2}$, times $${n}$ terms $\\approx ${ans}$ ✓`,
      remember: "$1 + 2 + \\cdots + n = \\frac{n(n+1)}{2}$ — no calculators needed.",
    });
  }
  if (d === 3) {
    const m = r.int(15, 120), span = r.int(10, 150), n = m + span;
    const Sn = (n * (n + 1)) / 2, Sm = ((m - 1) * m) / 2, ans = Sn - Sm;
    return baseQ({
      sub: "s3",
      diff: 3,
      text: `Find the sum $${m} + ${m + 1} + ${m + 2} + \\cdots + ${n}$.`,
      answer: String(ans),
      steps: [
        `A range sum is the difference of two triangle sums: $\\sum_{k=${m}}^{${n}} k = S_{${n}} - S_{${m - 1}}$.`,
        `$S_{${n}} = \\frac{${n} \\times ${n + 1}}{2} = ${Sn}$.`,
        `$S_{${m - 1}} = \\frac{${m - 1} \\times ${m}}{2} = ${Sm}$.`,
        `Answer: $${Sn} - ${Sm} = ${ans}$.`,
      ],
      concept: "Range sums via Sₙ − Sₐ₋₁",
      hint1: "Sum 1 to n, then remove the part you don't want (1 to m − 1).",
      hint2: `Compute $S_{${n}}$ and $S_{${m - 1}}$ with $\\frac{n(n+1)}{2}$, then subtract.`,
      mistake: "Subtracting $S_m$ instead of $S_{m-1}$ wrongly deletes the term $${m}$ itself.",
      verify: `Average trick: $\\frac{${m} + ${n}}{2} \\times ${span} = ${ans}$ ✓`,
      remember: "Sum from a to b = S_b − S_{a−1}. (Book: 25 + … + 58 = S₅₈ − S₂₄.)",
    });
  }
  const kk = r.pick([2, 3, 4, 5, 6, 7, 8, 9]), n = r.int(8, 20);
  const ans = (kk * n * (n + 1)) / 2;
  return baseQ({
    sub: "s3",
    diff: 4,
    text: `Find the sum of the first $${n}$ multiples of $${kk}$: $${kk} + ${2 * kk} + ${3 * kk} + \\cdots + ${n * kk}$.`,
    answer: String(ans),
    steps: [
      `Factor out $${kk}$: the sum is $${kk}(1 + 2 + \\cdots + ${n})$.`,
      `Use the Gauss formula: $1 + 2 + \\cdots + ${n} = \\frac{${n} \\times ${n + 1}}{2} = ${(n * (n + 1)) / 2}$.`,
      `Multiply back: $${kk} \\times ${(n * (n + 1)) / 2} = ${ans}$.`,
    ],
    concept: "Sums of multiples: k(1 + 2 + … + n) = k·n(n+1)/2",
    hint1: "Every term is divisible by k — pull the k outside the bracket.",
    hint2: `What remains is $1 + 2 + \\cdots + ${n}$ — a classic Gauss sum.`,
    mistake: "Adding k n times by hand — factoring first collapses the work.",
    verify: `First + last over 2, times count: $\\frac{${kk} + ${n * kk}}{2} \\times ${n} = ${ans}$ ✓`,
    remember: "Multiples of k sum to k × (triangular number).",
  });
};

// ─── 8. sum-odd (s3) ───────────────────────────────────────────────────────
const sumOdd: GenFn = (r, d) => {
  if (d === 1) {
    const n = r.int(4, 12), ans = n * n;
    return baseQ({
      sub: "s3",
      diff: 1,
      text: `Find the sum of the first $${n}$ odd numbers: $1 + 3 + 5 + \\cdots + ${2 * n - 1}$.`,
      answer: String(ans),
      steps: [
        "Sum of the first n odd numbers is always a perfect square: $1 = 1^2$, $1+3 = 2^2$, $1+3+5 = 3^2$, …",
        `Here $n = ${n}$, so the sum is $${n}^2$.`,
        `$${n}^2 = ${ans}$.`,
      ],
      concept: "Sum of first n odd numbers = n²",
      hint1: "Add them one by one and watch the totals: 1, 4, 9, 16, …",
      hint2: "The running total after n odd numbers is n².",
      mistake: "The last odd number is $2n - 1$, not $2n + 1$.",
      remember: "$1 + 3 + 5 + \\cdots + (2n-1) = n^2$ — square numbers hide inside odd numbers.",
    });
  }
  if (d === 2) {
    if (r.int(0, 1) === 0) {
      const n = r.int(13, 30), ans = n * n;
      return baseQ({
        sub: "s3",
        diff: 2,
        text: `Without adding term by term, find $1 + 3 + 5 + \\cdots + ${2 * n - 1}$ (the first $${n}$ odd numbers).`,
        answer: String(ans),
        steps: [
          `The sum of the first $${n}$ odd numbers is $${n}^2$ — no addition needed.`,
          `$${n}^2 = ${ans}$.`,
          `Sanity: the last term is $2(${n}) - 1 = ${2 * n - 1}$, so we indeed stopped at the ${ordinal(n)} odd number.`,
        ],
        concept: "Sum of first n odd numbers = n²",
        hint1: "Count how many odd numbers are listed.",
        hint2: `The count is $${n}$ — so the answer is $${n}$ squared.`,
        mistake: "Squaring the LAST TERM instead of the COUNT: $(2n-1)^2$ is far too big.",
        remember: "The answer is (number of terms)², not (last term)².",
      });
    }
    const n = r.int(8, 25), ans = n * (n + 1);
    return baseQ({
      sub: "s3",
      diff: 2,
      text: `Find the sum of the first $${n}$ even numbers: $2 + 4 + 6 + \\cdots + ${2 * n}$.`,
      answer: String(ans),
      steps: [
        `Factor out 2: $2 + 4 + \\cdots + ${2 * n} = 2(1 + 2 + \\cdots + ${n})$.`,
        `Gauss: $1 + 2 + \\cdots + ${n} = \\frac{${n}(${n}+1)}{2} = ${(n * (n + 1)) / 2}$.`,
        `So the sum is $2 \\times ${(n * (n + 1)) / 2} = ${n} \\times ${n + 1} = ${ans}$.`,
      ],
      concept: "Sum of first n even numbers = n(n + 1)",
      hint1: "Even numbers are just 2 × (naturals).",
      hint2: `Use $2 \\times \\frac{n(n+1)}{2} = n(n+1)$.`,
      mistake: "Odds give $n^2$ but evens give $n(n+1)$ — don't mix the two shortcuts.",
      remember: "Evens: $n(n+1)$. Odds: $n^2$.",
    });
  }
  const m = r.int(2, 15), k = m + r.int(3, 20);
  const lo = 2 * (m + 1) - 1, hi = 2 * k - 1, ans = k * k - m * m;
  return baseQ({
    sub: "s3",
    diff: 3,
    text: `Find the sum of the odd numbers from $${lo}$ to $${hi}$ (inclusive).`,
    answer: String(ans),
    steps: [
      `These are the odd numbers from the ${ordinal(m + 1)} to the ${ordinal(k)}: that is $${k - m}$ of them.`,
      `Sum of first ${k} odd numbers $= ${k}^2 = ${k * k}$; sum of first ${m} $= ${m}^2 = ${m * m}$.`,
      `Subtract: $${k * k} - ${m * m} = ${ans}$.`,
    ],
    concept: "Sums of odd-number runs via k² − m²",
    hint1: "Take the sum of ALL odds up to the last one, then remove the prefix you don't want.",
    hint2: `Answer $= ${k}^2 - ${m}^2$.`,
    mistake: `The odd number $${lo}$ is the $( ${m} + 1 )$-th odd number — the prefix to remove has $${m}$ terms, not $${m + 1}$.`,
    verify: `Count check: $${k - m}$ odd numbers, average $\\frac{${lo} + ${hi}}{2}$, product $= ${ans}$ ✓`,
    remember: "Odd run from a to b = (position of b)² − (position of a − 1)².",
  });
  return sumOddHard(r, d);
};

// d4 for sum-odd: minimal count whose square-sum first exceeds X
const sumOddHard: GenFn = (r, _d) => {
  const n0 = r.int(6, 25);
  const X = (n0 - 1) ** 2 + r.int(1, 2 * n0 - 2);
  return baseQ({
    sub: "s3",
    diff: 4,
    text: `How many odd numbers, starting from $1$, must be added together for the sum to first exceed $${X}$?`,
    answer: String(n0),
    steps: [
      "After n odd numbers the running total is exactly $n^2$.",
      `So we need the smallest $n$ with $n^2 > ${X}$.`,
      `$(${n0 - 1})^2 = ${(n0 - 1) * (n0 - 1)} \\le ${X}$ but $${n0}^2 = ${n0 * n0} > ${X}$.`,
      `The ${ordinal(n0)} odd number pushes the total past $${X}$: answer $${n0}$.`,
    ],
    concept: "Inverting n² to count how many odd numbers are needed",
    hint1: "Running totals of odd numbers are 1, 4, 9, 16, … — perfect squares.",
    hint2: `Find the first perfect square bigger than $${X}$.`,
    given: [`Target: sum must exceed ${X}`],
    find: "How many odd numbers are needed",
    mistake: "$n^2 > X$ needs STRICTLY bigger — if $X$ is itself a square you need one more odd number.",
    verify: `After ${n0 - 1} odds the total is only $${(n0 - 1) * (n0 - 1)} \\le ${X}$; after ${n0} odds it is $${n0 * n0} > ${X}$ ✓`,
    remember: "Odd-sum questions are square questions in disguise.",
  });
};

// ─── 9. ap-sum-word (s3) ───────────────────────────────────────────────────
const apSumWord: GenFn = (r, d) => {
  if (d === 1) {
    const n = r.int(6, 15), ans = (n * (n + 1)) / 2;
    return baseQ({
      sub: "s3",
      diff: 1,
      text: `A child builds a marble triangle: $1$ marble in the first row, $2$ in the second, $3$ in the third, and so on for $${n}$ rows. How many marbles are used in total?`,
      answer: String(ans),
      steps: [
        `Total marbles $= 1 + 2 + 3 + \\cdots + ${n}$.`,
        `Gauss pairing gives $\\frac{${n}(${n} + 1)}{2}$.`,
        `$= \\frac{${n * (n + 1)}}{2} = ${ans}$ marbles.`,
      ],
      concept: "Triangular numbers in real arrangements (Book Exercise 8.2 Q7)",
      hint1: "The rows form the sum 1 + 2 + … + n.",
      hint2: `Apply $\\frac{n(n+1)}{2}$ with $n = ${n}$.`,
      given: [`Row k contains k marbles`, `Number of rows: ${n}`],
      find: "Total marbles",
      mistake: "The formula is for CONSECUTIVE counts starting at 1 — starting elsewhere needs the AP sum.",
      remember: "Stacked rows 1, 2, 3, … always total to a triangular number.",
    });
  }
  if (d === 2) {
    const a = r.int(8, 20), dd = r.int(2, 4), n = r.int(6, 12);
    const ans = (n * (2 * a + (n - 1) * dd)) / 2;
    return baseQ({
      sub: "s3",
      diff: 2,
      text: `A theatre's first row has $${a}$ seats and each row behind it has $${dd}$ more seats than the row in front. If there are $${n}$ rows, how many seats are there in total?`,
      answer: String(ans),
      steps: [
        `Row counts form an AP: $${a}, ${a + dd}, ${a + 2 * dd}, \\ldots$ with $a = ${a}$, $d = ${dd}$.`,
        `AP sum: $S_n = \\frac{n}{2}\\big(2a + (n-1)d\\big)$.`,
        `$S_{${n}} = \\frac{${n}}{2}\\big(2 \\times ${a} + ${n - 1} \\times ${dd}\\big) = \\frac{${n}}{2} \\times ${2 * a + (n - 1) * dd} = ${ans}$.`,
      ],
      concept: "AP sum formula Sₙ = n/2 (2a + (n − 1)d)",
      hint1: "First + last over 2, times the number of rows, also works.",
      hint2: `Last row has $${a + (n - 1) * dd}$ seats — try $\\frac{n(a + \\text{last})}{2}$.`,
      given: [`First row: ${a} seats`, `Each row: +${dd} seats`, `Rows: ${n}`],
      find: "Total seats",
      mistake: "$2a + (n-1)d$ is the (first + last) pair — don't forget the factor 2 on $a$.",
      remember: "$S_n = \\frac{n}{2}(2a + (n-1)d)$ = n × (average row).",
    });
  }
  if (d === 3) {
    const a = r.pick([50, 75, 100, 125, 150]), dd = r.pick([25, 50, 75, 100]), n = r.int(10, 26);
    const ans = (n * (2 * a + (n - 1) * dd)) / 2;
    return baseQ({
      sub: "s3",
      diff: 3,
      text: `Meera saves ₹${a} in the first week and increases her weekly saving by ₹${dd} every week. How much has she saved in total after $${n}$ weeks?`,
      answer: String(ans),
      steps: [
        `Weekly savings: $${a}, ${a + dd}, ${a + 2 * dd}, \\ldots$ — an AP with $a = ${a}$, $d = ${dd}$.`,
        `Total after $${n}$ weeks: $S_{${n}} = \\frac{${n}}{2}\\big(2 \\times ${a} + (${n} - 1) \\times ${dd}\\big)$.`,
        `$= \\frac{${n}}{2} \\times ${2 * a + (n - 1) * dd} = ${ans}$.`,
        `Meera has saved ₹${inr(ans)} in ${n} weeks.`,
      ],
      concept: "Growing savings modelled as an AP sum",
      hint1: "The savings form an AP — total = AP sum, not rate × weeks.",
      hint2: `Use $S_n = \\frac{n}{2}(2a + (n-1)d)$.`,
      given: [`Week 1 saving: ₹${a}`, `Weekly increase: ₹${dd}`, `Weeks: ${n}`],
      find: "Total saved",
      mistake: "A flat-rate estimate ($n \\times$ first week) ignores the growth and undercounts badly.",
      verify: `Average weekly saving $= \\frac{${a} + ${a + (n - 1) * dd}}{2} = ${(2 * a + (n - 1) * dd) / 2}$; times $${n}$ gives $${ans}$ ✓`,
      remember: "Rising savings = AP sum: n × (average week).",
    });
  }
  const n = r.int(5, 10), a = r.int(6, 15), dd = r.int(2, 5);
  const S = (n * (2 * a + (n - 1) * dd)) / 2;
  const Sprev = ((n - 1) * (2 * a + (n - 2) * dd)) / 2;
  return baseQ({
    sub: "s3",
    diff: 4,
    text: `A theatre's first row has $${a}$ seats and every row behind has $${dd}$ more seats than the row in front. The theatre has exactly $${S}$ seats. How many rows does it have?`,
    answer: String(n),
    steps: [
      `If there are $r$ rows, the total is $\\frac{r}{2}\\big(2 \\times ${a} + (r-1) \\times ${dd}\\big)$, which must equal $${S}$.`,
      `Test $r = ${n - 1}$: $\\frac{${n - 1}}{2} \\times ${2 * a + (n - 2) * dd} = ${Sprev}$ — too few seats.`,
      `Test $r = ${n}$: $\\frac{${n}}{2} \\times ${2 * a + (n - 1) * dd} = ${S}$ — exact match ✓`,
      `The theatre has $${n}$ rows.`,
    ],
    concept: "Inverting the AP sum formula (solve for n by inspection)",
    hint1: "Total = r/2 × (2a + (r−1)d). Try small values of r.",
    hint2: `Estimate the average row: $${S} \\div r \\approx ${Math.round(S / n)}$ seats — near row $${n}$.`,
    given: [`First row: ${a} seats`, `Row increase: ${d}`, `Total seats: ${S}`],
    find: "Number of rows",
    mistake: "Testing $r$ only once isn't checking — confirm the neighbouring r gives the wrong total.",
    remember: "AP-sum inversions are solved by testing r — totals jump by whole rows.",
  });
};

// ─── 10. gp-nth (s4) ───────────────────────────────────────────────────────
const gpNth: GenFn = (r, d) => {
  if (d === 1) {
    const a = r.int(2, 6), rr = r.pick([2, 3, 5]), n = r.int(4, 6);
    const ans = a * rr ** (n - 1);
    return baseQ({
      sub: "s4",
      diff: 1,
      text: `Find the ${ordinal(n)} term of the geometric progression $${a},\\ ${a * rr},\\ ${a * rr ** 2},\\ ${a * rr ** 3},\\ \\ldots$`,
      answer: String(ans),
      steps: [
        `Each term is multiplied by $${rr}$: the common ratio is $r = ${rr}$.`,
        `nth term of a GP: $b_n = a r^{\\,n-1}$.`,
        `$b_{${n}} = ${a} \\times ${rr}^{${n - 1}} = ${a} \\times ${rr ** (n - 1)} = ${ans}$.`,
      ],
      concept: "nth term of a GP: bₙ = a·rⁿ⁻¹",
      hint1: "Find r by dividing any term by the one before it.",
      hint2: `The ${ordinal(n)} term needs $${n - 1}$ multiplications by $${rr}$.`,
      mistake: "$b_n = a r^{n-1}$, not $a r^n$ — the first term is $r^0 = 1$ times $a$.",
      remember: "In a GP you multiply; the exponent counts the jumps.",
    });
  }
  if (d === 2) {
    const a = r.int(2, 5), rr = r.pick([2, 3]), k = r.int(6, 10);
    const X = a * rr ** (k - 1);
    return baseQ({
      sub: "s4",
      diff: 2,
      text: `Which term of the geometric progression $${a},\\ ${a * rr},\\ ${a * rr ** 2},\\ \\ldots$ is $${X}$?`,
      answer: String(k),
      steps: [
        `Here $a = ${a}$ and $r = ${rr}$. Set $a r^{\\,n-1} = ${X}$.`,
        `$${rr}^{\\,n-1} = \\frac{${X}}{${a}} = ${X / a} = ${rr}^{${k - 1}}$.`,
        `So $n - 1 = ${k - 1}$ and $n = ${k}$.`,
        `Answer: $${X}$ is the ${ordinal(k)} term.`,
      ],
      concept: "Finding the term number in a GP",
      hint1: "Divide the target by the first term — what power of r is it?",
      hint2: `Match exponents: $${rr}^{n-1} = ${rr}^{${k - 1}}$.`,
      mistake: "Exponents count jumps: $n - 1$ matches the power, then add 1.",
      verify: `$b_{${k}} = ${a} \\times ${rr}^{${k - 1}} = ${X}$ ✓`,
      remember: "In a GP, equal ratio steps = equal exponent steps.",
    });
  }
  if (d === 3) {
    const a = r.int(2, 5), rr = r.pick([-2, -3]), n = r.int(5, 8);
    const ans = a * rr ** (n - 1);
    const list = [0, 1, 2].map((i) => a * rr ** i).join(",\\ ");
    return baseQ({
      sub: "s4",
      diff: 3,
      text: `A geometric progression begins $${list},\\ \\ldots$ Find its ${ordinal(n)} term.`,
      answer: String(ans),
      steps: [
        `Ratio: $r = \\frac{${a * rr}}{${signed(a)}} = ${rr}$ — negative, so signs alternate.`,
        `$b_n = a r^{\\,n-1} = ${signed(a)} \\times (${rr})^{\\,n-1}$.`,
        `$(${rr})^{${n - 1}} = ${rr ** (n - 1)}$ (${n - 1} is ${Number.isInteger(n - 1) && (n - 1) % 2 === 0 ? "even, so the result is positive" : "odd, so the result keeps the negative sign"}).`,
        `$b_{${n}} = ${ans}$.`,
      ],
      concept: "GP with negative common ratio (alternating signs)",
      hint1: "A negative ratio flips the sign at every step.",
      hint2: `Even powers of a negative number are positive; odd powers stay negative.`,
      mistake: "Forgetting the bracket: $-2^4 = -16$ but $(-2)^4 = 16$ — always bracket a negative base.",
      remember: "Negative r ⇒ the GP zig-zags above and below zero.",
    });
  }
  if (r.int(0, 1) === 0) {
    const h = r.pick([24, 32, 40, 48, 60, 80]);
    const pf = r.pick([[0.5, "\\frac{1}{2}"], [0.75, "\\frac{3}{4}"], [0.6, "\\frac{3}{5}"], [0.8, "\\frac{4}{5}"]] as [number, string][]);
    const k = r.int(3, 5);
    const v = h * pf[0] ** k;
    return baseQ({
      sub: "s4",
      diff: 4,
      text: `A ball is dropped from a height of $${h}$ ft. After each bounce it rises to $${pf[1]}$ of its previous height. To what height (in ft) does it rise after the ${ordinal(k)} bounce? (Answer as a decimal.)`,
      answer: dec(v, 2),
      tol: 0.011,
      steps: [
        `Heights form a GP: $${dec(h * pf[0], 4)},\\ ${dec(h * pf[0] ** 2, 4)},\\ ${dec(h * pf[0] ** 3, 4)},\\ \\ldots$ with ratio $${pf[1]}$.`,
        `After the ${ordinal(k)} bounce: $h \\times ${pf[1]}^{${k}} = ${h} \\times ${dec(pf[0] ** k, 6)}$.`,
        `$= ${dec(v, 4)} \\approx ${dec(v, 2)}$ ft.`,
      ],
      concept: "Bouncing-ball heights as a GP (Book Example, §8.6)",
      hint1: "Each bounce multiplies the height by the rebound fraction.",
      hint2: `After k bounces the height is $h \\times ${pf[1]}^{\\,k}$.`,
      given: [`Drop height: ${h} ft`, `Rebound ratio: ${pf[1]}`],
      find: `Height after bounce ${k}`,
      mistake: "The drop height itself is not bounce 1 — bounce 1 is the FIRST rebound.",
      verify: `Step-by-step: ${[1, 2, 3].map((i) => dec(h * pf[0] ** i, 3)).join(" → ")} ft for bounces 1–3 ✓`,
      remember: "Rebound GPs shrink forever but never quite reach zero.",
    });
  }
  const a = r.int(2, 6), n = r.int(5, 10);
  const ans = a * 2 ** (n - 1);
  return baseQ({
    sub: "s4",
    diff: 4,
    text: `A growing pattern of green squares starts with $${a}$ squares at Stage 1, and the count **doubles** at every later stage (as in Fig. 8.6 of the book). How many green squares are there at Stage $${n}$?`,
    answer: String(ans),
    steps: [
      `The counts form a GP: $${a},\\ ${2 * a},\\ ${4 * a},\\ \\ldots$ with $r = 2$.`,
      `$b_n = a \\cdot 2^{\\,n-1}$.`,
      `$b_{${n}} = ${a} \\times 2^{${n - 1}} = ${a} \\times ${2 ** (n - 1)} = ${ans}$.`,
    ],
    concept: "Doubling patterns as GPs with r = 2",
    hint1: "Doubling = common ratio 2.",
    hint2: `Stage $${n}$ is $${n - 1}$ doublings after Stage 1.`,
    mistake: "$2^n$ starts counting from Stage 1 with one extra doubling — Stage 1 is just $a$.",
    remember: "Doubling from stage 1: bₙ = a·2ⁿ⁻¹.",
  });
};

// ─── 11. sierpinski (s4) ───────────────────────────────────────────────────
const sierpinski: GenFn = (r, d) => {
  if (d <= 2) {
    const k = d === 1 ? r.int(1, 4) : r.int(5, 8);
    const ans = 3 ** k;
    return baseQ({
      sub: "s4",
      diff: d,
      text: `In the Sierpiński triangle, Stage 0 is a single black triangle, and cutting out the middle of each black triangle triples the count at every stage (Stages 0, 1, 2, … have $1, 3, 9, \\ldots$ black triangles). How many black triangles are there at Stage $${k}$?`,
      answer: String(ans),
      steps: [
        "Each stage multiplies the number of black triangles by 3 — counts follow $3^k$.",
        `Stage $${k}$: $3^{${k}}$ = 1 multiplied by 3, $${k}$ times $= ${ans}$.`,
        `Answer: $${ans}$ black triangles.`,
      ],
      concept: "Sierpiński triangle counts: 3^k at stage k",
      hint1: "The count is a GP with first term 1 and ratio 3.",
      hint2: `Stage $${k}$ means multiplying 1 by three, $${k}$ times.`,
      mistake: "Stage 0 already has 1 triangle — don't start counting from Stage 1.",
      remember: "Sierpiński black triangles: $3^k$; holes appear as $1 + 3 + 9 + \\cdots$.",
    });
  }
  if (d === 3) {
    const k = r.int(3, 7), ans = (3 ** k - 1) / 2;
    return baseQ({
      sub: "s4",
      diff: 3,
      text: `When a black triangle of the Sierpiński triangle is notched, it leaves one white "hole" triangle behind. How many white holes in total have appeared by Stage $${k}$?`,
      answer: String(ans),
      steps: [
        "Holes appear in batches: 1 at Stage 1, then 3 more at Stage 2, then 9, …",
        `Total holes by Stage $${k}$: $1 + 3 + 9 + \\cdots + 3^{${k - 1}}$.`,
        `Geometric sum: $\\frac{3^{${k}} - 1}{2} = \\frac{${3 ** k} - 1}{2} = ${ans}$.`,
      ],
      concept: "Holes in the Sierpiński triangle: (3^k − 1)/2",
      hint1: "Count hole-batches, not triangles: 1, then 3, then 9, …",
      hint2: `The sum $1 + 3 + \\cdots + 3^{k-1}$ equals $\\frac{3^k - 1}{2}$.`,
      mistake: "Holes accumulate — don't report only the newest batch $3^{k-1}$.",
      remember: "Holes by stage k: (3^k − 1)/2; black triangles: 3^k.",
    });
  }
  if (r.int(0, 1) === 0) {
    const k = r.int(2, 5), num = 3 ** k, den = 4 ** k;
    return baseQ({
      sub: "s4",
      diff: 4,
      text: `At every stage of the Sierpiński triangle, the black area becomes $\\frac{3}{4}$ of what it was. What fraction of the original area is still black at Stage $${k}$? (Answer as a fraction like a/b.)`,
      answer: `${num}/${den}`,
      steps: [
        "Black area is a GP with ratio $\\frac{3}{4}$: Stage 0 keeps $1$, Stage 1 keeps $\\frac{3}{4}$, …",
        `Stage $${k}$ keeps $\\left(\\frac{3}{4}\\right)^{${k}} = \\frac{3^{${k}}}{4^{${k}}} = \\frac{${num}}{${den}}$.`,
        `So $\\frac{${num}}{${den}}$ of the original area remains black.`,
      ],
      concept: "Sierpiński area decay: (3/4)^k",
      hint1: "Multiply the kept fraction once per stage.",
      hint2: `Raise both 3 and 4 to the power $${k}$.`,
      mistake: "The kept fraction shrinks (3/4 < 1) — a growing fraction like $\\frac{3^k}{4}$ is impossible.",
      remember: "Triangles: 3^k more, but area: only (3/4)^k left — the fractal eats its own area!",
    });
  }
  const k = r.int(1, 4), num = 8 ** k, den = 9 ** k;
  return baseQ({
    sub: "s4",
    diff: 4,
    text: `The Sierpiński carpet starts as a square split into $3 \\times 3 = 9$ smaller squares with the centre removed; the same cut is repeated on every remaining square. What fraction of the original square remains at Stage $${k}$? (Answer as a fraction like a/b.)`,
    answer: `${num}/${den}`,
    steps: [
      "Each cut keeps 8 of every 9 squares: the kept fraction is $\\frac{8}{9}$ per stage.",
      `Stage $${k}$ keeps $\\left(\\frac{8}{9}\\right)^{${k}} = \\frac{8^{${k}}}{9^{${k}}} = \\frac{${num}}{${den}}$.`,
      `So $\\frac{${num}}{${den}}$ of the original square survives.`,
    ],
    concept: "Sierpiński carpet: 8^k squares, (8/9)^k area",
    hint1: "9 squares per block, 1 removed — 8 survive each round.",
    hint2: `Kept fraction per stage is $\\frac{8}{9}$; raise it to the power $${k}$.`,
    mistake: "Counting 8 kept squares at stage k as $8k$, not $8^k$ — the removal repeats on survivors too.",
    remember: "Carpet: squares 8^k, area (8/9)^k — a cousin of the triangle's 3^k and (3/4)^k.",
  });
};

// ─── 12. virahanka (s4) ────────────────────────────────────────────────────
const virahanka: GenFn = (r, d) => {
  const V = (n: number): number => {
    let a = 1, b = 2;
    if (n === 1) return 1;
    for (let i = 3; i <= n; i++) { const c = a + b; a = b; b = c; }
    return b;
  };
  if (d === 1) {
    const k = r.int(5, 8);
    const list: number[] = [];
    for (let i = 1; i <= k; i++) list.push(V(i));
    return baseQ({
      sub: "s4",
      diff: 1,
      text: `The Virahānka–Fibonacci sequence begins $${list.join(",\\ ")},\\ \\ldots$ — each term is the sum of the previous two. What is the next term?`,
      answer: String(V(k + 1)),
      steps: [
        "Rule: $V_n = V_{n-1} + V_{n-2}$ — add the last two terms.",
        `Last two shown: $${list[k - 2]}$ and $${list[k - 1]}$.`,
        `Next term: $${list[k - 2]} + ${list[k - 1]} = ${V(k + 1)}$.`,
      ],
      concept: "Virahānka–Fibonacci recursion: each term = sum of previous two",
      hint1: "Look backwards, not forwards: which two numbers made the last term?",
      hint2: "Add the final two visible terms.",
      mistake: "Adding only the last term to itself, or skipping a term, breaks the recursion.",
      remember: "Virahānka (7th cent. CE) found it in poetry — before Fibonacci (c. 1200 CE)!",
    });
  }
  if (d === 2) {
    const k = r.int(9, 12);
    const list: number[] = [];
    for (let i = 1; i <= 4; i++) list.push(V(i));
    return baseQ({
      sub: "s4",
      diff: 2,
      text: `The Virahānka sequence is defined by $V_1 = 1$, $V_2 = 2$ and $V_n = V_{n-1} + V_{n-2}$ for $n \\ge 3$ (it starts $${list.join(",\\ ")},\\ \\ldots$). Find $V_{${k}}$.`,
      answer: String(V(k)),
      steps: [
        "Build upward from the seeds, each time adding the previous two terms.",
        `Continue: $${[5, 6, 7, 8].map((i) => `V_{${i}} = ${V(i)}`).join(",\\ ")},\\ \\ldots$`,
        `$V_{${k}} = ${V(k)}$.`,
      ],
      concept: "Iterating a two-term recursive rule",
      hint1: "You must compute every term in order — two-term rules can't be jumped over.",
      hint2: `Keep a running pair (previous, current) until you reach $V_{${k}}$.`,
      mistake: "Two-term recursion needs TWO seeds — starting from a single value is not enough.",
      remember: "$1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, \\ldots$",
    });
  }
  if (d === 3) {
    const s1 = r.int(2, 5), s2 = s1 + r.int(1, 4), k = r.int(7, 9);
    const t: number[] = [s1, s2];
    for (let i = 3; i <= k; i++) t.push(t[i - 2] + t[i - 3]);
    return baseQ({
      sub: "s4",
      diff: 3,
      text: `A two-term recursive sequence has $t_1 = ${s1}$, $t_2 = ${s2}$ and $t_n = t_{n-1} + t_{n-2}$ for $n \\ge 3$. Find $t_{${k}}$.`,
      answer: String(t[k - 1]),
      steps: [
        `Seeds: $t_1 = ${s1}$, $t_2 = ${s2}$.`,
        ...t.slice(2, 5).map((v, i) => `Step ${i + 3}: $t_{${i + 3}} = ${t[i + 1]} + ${t[i]} = ${v}$.`),
        ...(k > 5 ? [`... and so on: $t_6 = ${t[4]} + ${t[3]} = ${t[5]}$, continuing in the same way up to $t_{${k}}$.`] : []),
        `So $t_{${k}} = ${t[k - 1]}$.`,
      ],
      concept: "Virahanka-style recursion with custom seeds",
      hint1: "Same rule as Virahānka, different starting pair.",
      hint2: "Each new term: add the two terms immediately before it.",
      mistake: "Custom seeds change EVERY later term — don't recite the standard sequence.",
      remember: "The rule is the skeleton; the seeds are the DNA.",
    });
  }
  const n = r.int(5, 9), ans = V(n);
  return baseQ({
    sub: "s4",
    diff: 4,
    text: `In Virahānka's metre problem, a line of $${n}$ beats is filled with short syllables ($1$ beat) and long syllables ($2$ beats). The number of different rhythms is the Virahanka number $V_{${n}}$ (with $V_1 = 1$, $V_2 = 2$). How many rhythms are possible?`,
    answer: String(ans),
    steps: [
      "A line ending short has $V_{n-1}$ endings; ending long has $V_{n-2}$ — so $V_n = V_{n-1} + V_{n-2}$.",
      `Fill the table upward: $${[1, 2, 3].map((i) => `V_{${i}} = ${V(i)}`).join(",\\ ")}, \\ldots, V_{${n}} = ${ans}$.`,
      n >= 6 ? `Key step: $V_{${n}} = V_{${n - 1}} + V_{${n - 2}} = ${V(n - 1)} + ${V(n - 2)} = ${ans}$.` : `Directly: $V_{${n}} = V_{${n - 1}} + V_{${n - 2}} = ${V(n - 1)} + ${V(n - 2)} = ${ans}$.`,
      `Answer: $V_{${n}} = ${ans}$ rhythms.`,
    ],
    concept: "Virahanka numbers count 1-and-2 beat rhythm patterns",
    hint1: "Count lines of $n-1$ beats (end short) plus lines of $n-2$ beats (end long).",
    hint2: "Fill the table up to n step by step — each entry needs the previous two.",
    given: [`Beats to fill: ${n}`, `Syllables: short = 1 beat, long = 2 beats`],
    find: `Number of rhythms for ${n} beats`,
    mistake: "For n beats you need $V_n$, not $V_{n-1}$ — check the indexing against $V_1 = 1$, $V_2 = 2$.",
    verify: `Brute force at $n = ${Math.min(n, 5)}$: the count $${V(Math.min(n, 5))}$ matches the table ✓`,
    remember: "Poetry metres, stair climbs and rabbit pairs all speak Virahanka–Fibonacci.",
  });
};

// ─── exports ───────────────────────────────────────────────────────────────
export const bank: Record<string, GenFn> = {
  "next-term": nextTerm,
  "explicit-rule": explicitRule,
  "recursive-eval": recursiveEval,
  "ap-nth": apNth,
  "ap-find-d": apFindD,
  "ap-missing": apMissing,
  "sum-naturals": sumNaturals,
  "sum-odd": sumOdd,
  "sum-odd-hard": sumOddHard,
  "ap-sum-word": apSumWord,
  "gp-nth": gpNth,
  "sierpinski": sierpinski,
  "virahanka": virahanka,
};

// Honest distinct-parameter-space per generator (branch sums).
export const bankSize: Record<string, number> = {
  "next-term": 59 * 12 + (8 * 4 + 4 + 4) + (8 + 2 * 6 + 6) + (5 + 9),
  "explicit-rule": 8 * 18 * 6 + 8 * 18 * 12 + 8 * 9 * 9 + 5 * 14 * 17 * 2,
  "recursive-eval": 9 * 8 * 2 + 5 * 3 * 2 + 3 * 9 * 5 * 2 + 2,
  "ap-nth": 30 * 11 * 10 + 25 * 9 * 18 + 11 * 36 * 4 * 3 * 15 + 7 * 5 * 18 + 4 * 4 * 8,
  "ap-find-d": 51 * 24 + 51 * 24 * 3 + 81 * 30 * 3 + 51 * 20 * 5,
  "ap-missing": 41 * 11 + 36 * 9 * 2 + 41 * 8 * 2 + 3 * 8 * 34,
  "sum-naturals": 16 + 100 + 106 * 141 + 8 * 13,
  "sum-odd": 9 + 36 + 14 * 18 + 580,
  "sum-odd-hard": 580,
  "ap-sum-word": 10 + 13 * 3 * 7 + 5 * 4 * 17 + 6 * 10 * 4,
  "gp-nth": 5 * 3 * 3 + 4 * 2 * 5 + 4 * 2 * 4 + (6 * 4 * 3 + 5 * 6),
  "sierpinski": 4 + 4 + 5 + 8,
  "virahanka": 4 + 4 + 4 * 4 * 3 + 5,
};
