import type { ChapterContent } from "@/lib/wars/types";
import { bank, bankSize } from "./ch03.gen";

export const chapter: ChapterContent = {
  num: 3,
  title: "The World of Numbers",
  world: "Number Realm",
  worldId: "number-realm",
  emoji: "🔢",
  color: "#fbbf24",
  grad: ["#f59e0b", "#f97316"],
  blurb: "From counting stones to irrational mysteries — explore the full family of numbers on an infinite line.",
  boss: { title: "The Infinity Gate", desc: "Six hybrid number-challenges guard the gate. Only a true Number Knight passes." },
  bank,
  bankSize,
  subtopics: [
    {
      id: "s1",
      title: "Integers & the Number Line",
      objectives: [
        "Move fluently along the number line in both directions",
        "Apply sign rules for adding, subtracting, multiplying and dividing integers",
        "Use absolute value as distance",
      ],
      viz: { kind: "numberline", config: { mode: "integers" } },
      gens: [
        { id: "int-ops", label: "Integer operations" },
        { id: "abs-ops", label: "Absolute value" },
        { id: "numline-betw", label: "Points between integers" },
      ],
      slides: [
        { k: "hook", title: "The Elevator Problem", body: "An elevator starts at floor $-2$ (two levels underground), rises 7 floors, then drops 3. Mathematicians once refused negative numbers — merchants in debt proved them wrong. Where does the elevator end up?" },
        { k: "explore", title: "Walk the Line", body: "Drag the marker along the number line. Adding a positive moves you <b>right</b>; adding a negative moves you <b>left</b>. Watch how $-4 + 9$ and $3 + (-8)$ unfold as journeys." },
        { k: "predict", title: "Predict First!", body: "Without calculating: $(-7) \\times (-8)$ will be…", options: ["Negative", "Positive", "Zero"], correct: 1, why: "Two negatives multiply to a positive: $(-7)\\times(-8) = 56$. Sign rules: same signs → positive." },
        { k: "explain", title: "The Rules of the Realm", html: "Every integer lives at a fixed address on the number line.<br/><br/><b>Addition</b> = walking: $-4 + 9$ means “start at $-4$, walk 9 right”.<br/><b>Sign rules:</b> $(+)\\times(+) = +$, $(-)\\times(-) = +$, opposite signs give $-$.<br/><b>Absolute value</b> $|x|$ is the <i>distance</i> from 0 — never negative: $|-5| = 5$.<br/><br/>Division follows the same sign rules as multiplication, and $0$ changes everything it touches by remaining $0$." },
        { k: "example", title: "Worked Example", steps: ["Evaluate $(-12) \\times 3 + |-8|.", "$(-12) \\times 3 = -36$ (opposite signs → negative).", "$|-8| = 8$ (distance from zero).", "Combine: $-36 + 8 = -28$.", "Answer: $-28$."] },
        { k: "mistake", title: "Trap Alarm", body: "$|a - b|$ is <b>not</b> $|a| - |b|$. Try $a=3, b=5$: the left side is $2$, the right side is $-2$. Simplify <i>inside</i> the bars first — always." },
        { k: "check", title: "Quick Check", body: "What is $|{-9}| + |{4}|$?", options: ["5", "13", "-13", "-5"], correct: 1, why: "$|-9| = 9$ and $|4| = 4$, so $9 + 4 = 13$." },
      ],
    },
    {
      id: "s2",
      title: "Fractions, Decimals & Rationals",
      objectives: [
        "Convert freely between fractions and decimals",
        "Predict whether a decimal terminates or recurs",
        "Convert recurring decimals back into exact fractions",
      ],
      prereq: ["s1"],
      viz: { kind: "numberline", config: { mode: "rationals" } },
      gens: [
        { id: "frac-dec", label: "Fraction ↔ decimal" },
        { id: "dec-order", label: "Ordering rationals" },
        { id: "dens-rat", label: "Density of rationals" },
      ],
      slides: [
        { k: "hook", title: "The 1/3 Surprise", body: "Type $1 \\div 3$ on a calculator: $0.3333\\ldots$ forever. Yet three of these “endless” numbers make exactly $1$. How can something infinite be so finite?" },
        { k: "explore", title: "Zoom Into Fractions", body: "Switch the lab to rational mode and place $\frac{1}{2}, \frac{3}{4}, \frac{5}{8}$ between the integers. Every fraction has a precise home — and between any two of them hides another." },
        { k: "predict", title: "Predict First!", body: "The decimal expansion of $\frac{7}{8}$ will be…", options: ["Terminating", "Recurring (never-ending)", "Impossible to know"], correct: 0, why: "$8 = 2^3$ — only prime factor 2, so it terminates: $\frac{7}{8} = 0.875$." },
        { k: "explain", title: "The Terminator Test", html: "A fraction in <b>lowest terms</b> terminates <b>iff</b> its denominator has no prime factors except $2$ and $5$.<br/><br/>$\\frac{7}{20}$: $20 = 2^2 \\times 5$ → terminates ($0.35$).<br/>$\\frac{5}{12}$: $12 = 2^2 \\times 3$ → the 3 forces recurrence ($0.41\\overline{6}$).<br/><br/><b>Rescue trick for recurring decimals:</b> if $x = 0.\\overline{7}$ then $10x = 7.\\overline{7}$, so $9x = 7$ and $x = \\frac{7}{9}$." },
        { k: "example", title: "Worked Example", steps: ["Convert $0.\\overline{27}$ to a fraction.", "Let $x = 0.272727\\ldots$", "Multiply by 100: $100x = 27.2727\\ldots$", "Subtract: $100x - x = 27$, so $99x = 27$.", "$x = \\frac{27}{99} = \\frac{3}{11}$. Answer: $\\frac{3}{11}$."] },
        { k: "mistake", title: "Trap Alarm", body: "Comparing $0.9$ with $0.12$ by “digit count” is a trap. $0.9 > 0.12$. Convert to a common form — fractions or equal-length decimals — before comparing." },
        { k: "check", title: "Quick Check", body: "Which terminates?", options: ["$\\frac{5}{12}$", "$\\frac{3}{40}$", "$\\frac{1}{7}$", "$\\frac{2}{15}$"], correct: 1, why: "$40 = 2^3 \\times 5$ — only 2s and 5s, so $\\frac{3}{40} = 0.075$ terminates." },
      ],
    },
    {
      id: "s3",
      title: "Irrationals & Surds",
      objectives: [
        "Explain why √2 is irrational (not a ratio of integers)",
        "Locate surds between consecutive integers",
        "Simplify surds by extracting perfect-square factors",
      ],
      prereq: ["s2"],
      viz: { kind: "numberline", config: { mode: "surds" } },
      gens: [
        { id: "sqrt-between", label: "Locating surds" },
        { id: "sqrt-simplify", label: "Simplifying surds" },
        { id: "rat-or-irrat", label: "Rational or irrational?" },
      ],
      slides: [
        { k: "hook", title: "The Death of a Belief", body: "Legend says the Pythagoreans drowned Hippasus for revealing that the diagonal of a unit square has <b>no fraction</b> for a length. $\\sqrt{2} = 1.41421356\\ldots$ — the digits never repeat, never end." },
        { k: "explore", title: "Hunt the Surd", body: "In surd mode, drop $\\sqrt{2}, \\sqrt{5}, \\sqrt{10}$ onto the line. Each one sneaks between two consecutive integers — pin them down by squaring their neighbours." },
        { k: "predict", title: "Predict First!", body: "$\\sqrt{50}$ simplified is…", options: ["$2\\sqrt{5}$", "$5\\sqrt{2}$", "$25\\sqrt{2}$", "$\\sqrt{5}\\sqrt{10}$ (fully simplified)"], correct: 1, why: "$50 = 25 \\times 2$, so $\\sqrt{50} = \\sqrt{25}\\sqrt{2} = 5\\sqrt{2}$." },
        { k: "explain", title: "Taming Square Roots", html: "<b>Locating:</b> $4 < 7 < 9 \\Rightarrow 2 < \\sqrt{7} < 3$.<br/><b>Simplifying:</b> pull out the largest perfect square: $\\sqrt{72} = \\sqrt{36 \\times 2} = 6\\sqrt{2}$.<br/><b>Adding like surds:</b> $6\\sqrt{2} + 3\\sqrt{2} = 9\\sqrt{2}$ — coefficients add, the surd stays.<br/><br/>An irrational number is one that <i>cannot</i> be written as $\\frac{p}{q}$. Its decimal neither terminates nor repeats." },
        { k: "example", title: "Worked Example", steps: ["Simplify $\\sqrt{108} + \\sqrt{12}$.", "$108 = 36 \\times 3 \\Rightarrow \\sqrt{108} = 6\\sqrt{3}$.", "$12 = 4 \\times 3 \\Rightarrow \\sqrt{12} = 2\\sqrt{3}$.", "Add like surds: $6\\sqrt{3} + 2\\sqrt{3} = 8\\sqrt{3}$.", "Answer: $8\\sqrt{3}$ ≈ 13.856."] },
        { k: "mistake", title: "Trap Alarm", body: "$\\sqrt{a} + \\sqrt{b} \\ne \\sqrt{a+b}$. Proof by counterexample: $\\sqrt{9} + \\sqrt{16} = 7$ but $\\sqrt{25} = 5$. Simplify <i>before</i> you combine." },
        { k: "check", title: "Quick Check", body: "Between which consecutive integers does $\\sqrt{40}$ lie?", options: ["5 and 6", "6 and 7", "7 and 8", "20 and 21"], correct: 1, why: "$6^2 = 36 < 40 < 49 = 7^2$, so $6 < \\sqrt{40} < 7$." },
      ],
    },
    {
      id: "s4",
      title: "Real Numbers & Cyclic Patterns",
      objectives: [
        "Assemble the complete real-number family tree",
        "Exploit digit cycles in powers of integers",
        "Uncover repeating structure inside decimal expansions",
      ],
      prereq: ["s3"],
      viz: { kind: "numberline", config: { mode: "reals" } },
      gens: [
        { id: "cyc-digit", label: "Last-digit cycles" },
        { id: "frac-dec", label: "Decimal structures" },
        { id: "dec-order", label: "Mixed comparison" },
      ],
      slides: [
        { k: "hook", title: "The 7 Clock", body: "Compute last digits of $7, 7^2, 7^3, \\ldots$: they cycle $7, 9, 3, 1, 7, 9, 3, 1\\ldots$ forever. Without a calculator — what is the last digit of $7^{2024}$?" },
        { k: "explore", title: "Cycle Detector", body: "In reals mode, march through powers and watch last digits light up in loops. Then watch $\\frac{1}{7} = 0.\\overline{142857}$ — its digits ride the same kind of carousel." },
        { k: "predict", title: "Predict First!", body: "The last digit of $4^{35}$ is…", options: ["4", "2", "6", "8"], correct: 0, why: "Powers of 4 cycle $4, 6, 4, 6\\ldots$ Odd exponents land on 4." },
        { k: "explain", title: "Riding the Cycle", html: "Last digits of powers repeat with a fixed <b>cycle length</b> $L$. To find the last digit of $b^e$: compute $r = (e-1) \\bmod L$, then the digit is at position $r+1$ of the cycle.<br/><br/><b>The real number family:</b> Reals = Rationals (integers ⊂ rationals) ∪ Irrationals.<br/>Every rational decimal terminates or recurs; every irrational does neither. There is no third kind — the line is complete." },
        { k: "example", title: "Worked Example", steps: ["Find the last digit of $3^{47}$.", "Last digits of powers of 3: $3, 9, 7, 1$ then repeat — $L = 4$.", "$(47 - 1) \\bmod 4 = 0$, so we take position 1 of the cycle.", "Position 1 is $3$. Last digit of $3^{47}$ is $3$."] },
        { k: "mistake", title: "Trap Alarm", body: "Using $e \\bmod L$ directly instead of $(e-1) \\bmod L$ shifts the cycle by one. Check with a small case: $3^1$ has last digit 3 — position 1, not position 2." },
        { k: "check", title: "Quick Check", body: "$\\frac{22}{7}$ vs $\\pi$: which statement is true?", options: ["Both are irrational", "Both equal 3.14 exactly", "$\\frac{22}{7}$ is rational, $\\pi$ is not", "$\\pi$ is rational"], correct: 2, why: "$\\frac{22}{7}$ is a fraction (rational, recurring decimal); $\\pi$'s digits never repeat. They're just close cousins ≈ 3.1429 vs 3.1416." },
      ],
    },
  ],
};

