import type { Diff, GenFn, Question } from "@/lib/wars/types";

// ─── MATHS WARS · CHAPTER 5 GENERATOR BANK ─────────────────────────────────
// "I'm Up and Down, and Round and Round" — Circles (Ganita Manjari 5.1–5.8)
// Every answer is computed from real circle theorems, never hard-coded.

// ─── helpers ───────────────────────────────────────────────────────────────
/** Pythagorean triples [a, b, h] with a² + b² = h². In circle problems:
 *  h = radius, a/b = half-chord & distance from centre (either order). */
const TRIPLES: ReadonlyArray<readonly [number, number, number]> = [
  [3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20],
  [7, 24, 25], [15, 20, 25], [10, 24, 26], [20, 21, 29], [18, 24, 30],
  [16, 30, 34], [21, 28, 35], [12, 35, 37], [15, 36, 39], [9, 40, 41],
  [24, 32, 40], [27, 36, 45], [14, 48, 50], [30, 40, 50], [24, 45, 51],
  [20, 48, 52], [28, 45, 53], [33, 44, 55], [36, 48, 60], [11, 60, 61],
  [16, 63, 65], [25, 60, 65], [33, 56, 65], [39, 52, 65], [48, 55, 73],
];

function baseQ(p: Partial<Question> & Pick<Question, "text" | "answer" | "steps" | "concept" | "hint1" | "hint2">): Question {
  return { type: "numeric", diff: 1, ch: 5, sub: "s1", gen: "x", id: "x", ...p };
}

const shuffled = <T,>(arr: readonly T[], r: { next(): number }): T[] => [...arr].sort(() => r.next() - 0.5);

// ─── 1. vocab-mcq ──────────────────────────────────────────────────────────
interface VocabEntry { q: string; ok: string; bad: [string, string, string]; why: string[]; con: string; h1: string; h2: string; m?: string; r?: string }
const VOCAB_MCQ: ReadonlyArray<VocabEntry> = [
  { q: "A chord that passes through the centre of the circle is called", ok: "a diameter", bad: ["a radius", "a secant", "a sector"], why: ["A chord joins two points on the circle.", "If it also passes through the centre, it is the longest possible chord.", "That special chord is the **diameter**."], con: "Circle vocabulary: diameter vs chord", h1: "Which chord is allowed to pass through the centre?", h2: "It is made of two radii joined end to end.", m: "A radius stops at the circle — it is half a diameter, not a chord.", r: "Diameter = the chord through the centre = 2 × radius." },
  { q: "The set (locus) of all points in a plane at a fixed distance from a fixed point is", ok: "a circle", bad: ["a straight line", "a sphere", "a sector"], why: ["The fixed point is the centre; the fixed distance is the radius.", "Every point satisfying 'distance = radius' traces the round curve.", "The locus is a **circle** (a sphere would need 3-D space)."], con: "Definition of a circle as a locus", h1: "Translate 'fixed distance from a fixed point' into centre + radius.", h2: "We live on a flat plane here — think 2-D.", r: "Circle = locus of points equidistant from the centre." },
  { q: "A line segment joining two points on a circle is called", ok: "a chord", bad: ["a radius", "an arc", "a sector"], why: ["Both endpoints lie ON the circle.", "The straight segment between them is a **chord**.", "An arc is curved and follows the rim — not straight."], con: "Circle vocabulary: chord", h1: "Straight segment vs curved rim piece?", h2: "Radius joins centre to circle; this joins circle to circle.", r: "Chord: straight, both ends on the circle." },
  { q: "The region enclosed by an arc and the two radii drawn to its endpoints is", ok: "a sector", bad: ["a segment", "a chord", "a semicircle only"], why: ["Picture a pizza slice: two straight radii plus the curved crust.", "That pizza-slice region is a **sector**.", "A segment uses a chord instead of two radii."], con: "Circle vocabulary: sector vs segment", h1: "Does the boundary use two radii or one chord?", h2: "Pizza slice = sector; crescent-offcut = segment.", m: "Sector needs TWO radii in its boundary; a segment is cut off by a chord.", r: "Radii → sector; chord → segment." },
  { q: "The region enclosed between a chord and an arc of the circle is", ok: "a segment", bad: ["a sector", "a radius", "an annulus"], why: ["A chord cuts the circle into two pieces.", "Each piece (curved arc + straight chord) is a **segment**.", "The minor arc gives the minor segment; the major arc gives the major segment."], con: "Circle vocabulary: segment", h1: "One chord + one arc enclose which region?", h2: "It looks like a circle with a slice shaved off by a straight cut.", r: "Chord + arc = segment (no radii involved)." },
  { q: "Of the two arcs between two points on a circle, the shorter one is", ok: "the minor arc", bad: ["the major arc", "the semicircle", "the chord"], why: ["Two points split the rim into a short way and a long way.", "The short route is the **minor arc**.", "The long route is the major arc; equal halves are semicircles."], con: "Circle vocabulary: minor and major arcs", h1: "'Minor' literally means smaller.", h2: "Which route along the rim is shorter?", r: "Minor arc < semicircle < major arc." },
  { q: "The longest chord of any circle is", ok: "the diameter", bad: ["a radius", "the minor arc", "any chord — they are all equal"], why: ["Distances from the centre shrink as a chord slides away from it.", "Distance zero happens only when the chord passes through the centre.", "So the **diameter** is the greatest chord."], con: "Diameter as the greatest chord", h1: "Which chord sits at distance 0 from the centre?", h2: "The book's Theorem 8: longer chord ⇒ closer to centre.", r: "Diameter = longest chord, distance 0 from centre." },
  { q: "The fixed distance from the centre to any point of the circle is", ok: "the radius", bad: ["the diameter", "a chord", "an arc"], why: ["By definition every circle-point is the same distance from the centre.", "That distance is the **radius**.", "The diameter is twice it."], con: "Definition of radius", h1: "Centre to rim — one step, not two.", h2: "Doubling it would give the diameter.", r: "Radius is the constant centre-to-rim distance." },
  { q: "An angle whose vertex is at the centre of the circle is called", ok: "a central angle", bad: ["an inscribed angle", "a straight angle", "a colloid angle"], why: ["The vertex sits at the centre O, arms along two radii.", "That is the definition of a **central angle**.", "An inscribed angle has its vertex ON the circle instead."], con: "Central vs inscribed angles", h1: "Where is the vertex — centre or rim?", h2: "Central = at centre; inscribed = on the circle.", r: "Vertex at centre ⇒ central angle." },
  { q: "Points that all lie on one common circle are called", ok: "concyclic", bad: ["collinear", "congruent", "concentric"], why: ["'Con-cyclic' = sharing a circle.", "Collinear points share a LINE — and no circle passes through 3 collinear points.", "Concentric describes circles sharing a centre, not points."], con: "Concyclic points (book 5.8)", h1: "The prefix 'cyc' hints at circle.", h2: "Line → collinear; circle → concyclic.", r: "Concyclic points lie on a common circle." },
  { q: "Every line of reflection symmetry of a circle is a", ok: "diameter line", bad: ["tangent line", "chord off-centre", "secant that misses the centre"], why: ["Fold a paper circle so the rims match — the crease passes through the centre.", "A crease through the centre lies along a **diameter**.", "Off-centre folds make the two halves unequal."], con: "Symmetry of the circle", h1: "Fold the circle — where must the crease pass?", h2: "A circle has infinitely many such lines, all through the centre.", r: "Every symmetry line of a circle is a diameter." },
  { q: "Two different circles that share the same centre are called", ok: "concentric circles", bad: ["congruent circles", "concyclic circles", "tangent circles"], why: ["Same centre, different radii.", "'Con-centric' literally means sharing the centre.", "Congruent circles would be copies with equal radii."], con: "Circle vocabulary: concentric", h1: "What does 'centre' suggest in the word?", h2: "Think of a dartboard's rings.", r: "Same centre + different radii = concentric." },
];
const VOCAB_TF: ReadonlyArray<{ q: string; ok: boolean; why: string[]; con: string; h1: string; h2: string; m?: string; r?: string }> = [
  { q: "Every diameter is a chord of the circle.", ok: true, why: ["A diameter joins two points of the circle with a straight segment.", "That is exactly the definition of a chord — just a special one.", "So every diameter is a chord (the longest one)."], con: "Diameter ⊂ chords", h1: "Check the definition of chord.", h2: "Does a diameter have both endpoints on the circle?", r: "All diameters are chords; only one chord is the diameter." },
  { q: "Every chord is a diameter.", ok: false, why: ["A chord is ANY segment joining two circle points.", "Most chords miss the centre entirely.", "Only the chord through the centre is a diameter — so the claim fails."], con: "Chords vs diameter", h1: "Try a short chord near the rim.", h2: "Does it pass through the centre?", m: "The converse trap: 'all diameters are chords' does not reverse.", r: "Diameter is one special chord among infinitely many." },
  { q: "All radii of a circle have equal length.", ok: true, why: ["Every point of the circle is defined to be at one fixed distance from the centre.", "Each radius realises that distance.", "So all radii are equal — the circle's defining property."], con: "Defining property of a circle", h1: "Recall the locus definition.", h2: "The fixed distance IS a radius.", r: "Equal radii are the circle's DNA." },
  { q: "A radius is itself a chord of the circle.", ok: false, why: ["A chord needs BOTH endpoints on the circle.", "A radius has one endpoint at the centre — inside, not on the circle.", "Hence a radius is not a chord."], con: "Radius vs chord", h1: "Where does each segment end?", h2: "Count endpoints on the circle: 2 needed.", r: "Chord: 2 endpoints on circle. Radius: 1." },
  { q: "A circle has only finitely many diameters.", ok: false, why: ["Every line through the centre is a symmetry line.", "There are infinitely many directions through the centre.", "So a circle has infinitely many diameters."], con: "Infinite symmetry of the circle", h1: "How many lines pass through one point?", h2: "Compare with a square's 2 diagonals.", r: "Circle: infinite diameters, infinite symmetry lines." },
  { q: "The centre of a circle lies on the circle itself.", ok: false, why: ["Points ON the circle are exactly one radius away from the centre.", "The centre is distance 0 from itself.", "So the centre is inside, never on, the circle."], con: "Centre vs circle", h1: "Distance from centre to itself?", h2: "Is that equal to the radius?", r: "The centre is the heart, not on the rim." },
  { q: "A semicircle can be regarded as a sector whose central angle is 180°.", ok: true, why: ["A diameter splits the circle into two halves.", "Each half is bounded by two radii (the diameter) and an arc.", "With central angle 180°, a sector IS a semicircle."], con: "Semicircle as a 180° sector", h1: "What is the central angle of a straight line OA–OB?", h2: "180° sector = half the disc.", r: "Semicircle = sector with 180° central angle." },
  { q: "The major arc between two points is longer than the minor arc.", ok: true, why: ["The two arcs together make the whole rim.", "'Major' is defined as the larger piece.", "So major arc > minor arc, always."], con: "Major vs minor arcs", h1: "Major = bigger by definition.", h2: "They share endpoints, differ in length.", r: "Major arc takes the long way round." },
  { q: "A diameter is the longest possible chord.", ok: true, why: ["The perpendicular distance of a chord from the centre controls its length.", "Distance 0 (through the centre) gives the maximum.", "That chord is the diameter — the longest."], con: "Diameter is the greatest chord", h1: "Which chord is closest to the centre?", h2: "Closer chord ⇒ longer chord (Theorem 8).", r: "Push a chord to distance 0 and it becomes the diameter." },
  { q: "Among chords of positive length, there is a smallest one.", ok: false, why: ["Slide a chord towards the rim: it shrinks continuously.", "Its length can be made smaller than any positive bound you choose.", "It only reaches 0 as a limit point — so no smallest positive chord exists."], con: "Chords shrink toward the rim", h1: "What happens to length as the chord nears the rim?", h2: "Distance approaches the radius, length approaches 0 — never attained.", r: "Chord lengths form (0, diameter]: no minimum, one maximum." },
];
const vocabMcq: GenFn = (r, d) => {
  if (d === 4 && r.next() < 0.5) {
    const t = r.pick(VOCAB_TF);
    return baseQ({ diff: d, sub: "s1", type: "tf", text: `True or False: ${t.q}`, answer: t.ok ? "true" : "false", accept: [t.ok ? "t" : "f"], steps: t.why, concept: t.con, hint1: t.h1, hint2: t.h2, mistake: t.m, remember: t.r });
  }
  const t = r.pick(VOCAB_MCQ);
  return baseQ({ diff: d, sub: "s1", type: "mcq", text: `${t.q}?`, choices: shuffled([t.ok, ...t.bad], r), answer: t.ok, steps: t.why, concept: t.con, hint1: t.h1, hint2: t.h2, mistake: t.m, remember: t.r });
};

// ─── 2. vocab-numeric ──────────────────────────────────────────────────────
const vocabNumeric: GenFn = (r, d) => {
  if (d === 1) {
    const rad = r.int(1, 60);
    return baseQ({ diff: d, sub: "s1", text: `The diameter of a circular coin is $${2 * rad}$ mm. What is its radius (in mm)?`, answer: String(rad), given: [`Diameter $= ${2 * rad}$ mm`], find: "Radius", steps: [`Radius is half the diameter: $r = \\frac{d}{2}$.`, `$r = \\frac{${2 * rad}}{2} = ${rad}$ mm.`, `Check: $${rad} \\times 2 = ${2 * rad}$ — two radii rebuild the diameter ✓`], concept: "Radius = diameter ÷ 2", hint1: "The diameter stretches across the full circle.", hint2: "Cut it into two equal radii.", verify: `${rad} × 2 = ${2 * rad} ✓`, remember: "$r = d/2$, always." });
  }
  if (d === 2) {
    const rad = r.int(2, 60);
    if (r.next() < 0.5) {
      return baseQ({ diff: d, sub: "s1", text: `O is the centre of a circle of radius $${rad}$ cm and $P$ is a point on the circle. What is the length of $OP$ (in cm)?`, answer: String(rad), given: [`$P$ on the circle, $r = ${rad}$ cm`], find: "OP", steps: [`$P$ lies on the circle, so its distance from the centre is fixed by definition.`, `That fixed distance is the radius of the circle.`, `So $OP = ${rad}$ cm — and this holds for EVERY point of the circle, not just $P$.`], concept: "Every circle point is one radius from the centre", hint1: "What does it MEAN for P to be on the circle?", hint2: "OP is a radius.", verify: `${rad} is the given radius ✓`, remember: "Centre-to-circle distance is always the radius." });
    }
    return baseQ({ diff: d, sub: "s1", text: `A circle has radius $${rad}$ cm. How long is its longest chord (in cm)?`, answer: String(2 * rad), steps: [`The longest chord is the diameter (it sits at distance 0 from the centre).`, `$d = 2r = 2 \\times ${rad} = ${2 * rad}$ cm.`, `No other chord can beat it: any chord missing the centre pays distance > 0 and loses length.`], concept: "Diameter is the greatest chord", hint1: "Which chord passes through the centre?", hint2: "Double the radius.", verify: `Distance of a diameter from the centre is 0 — the closest, hence longest.`, remember: "Longest chord = diameter = 2r." });
  }
  if (d === 3) {
    let a = r.int(10, 350);
    while (a === 180) a = r.int(10, 350);
    return baseQ({ diff: d, sub: "s1", text: `A minor arc of a circle subtends an angle of $${a}^\\circ$ at the centre. What angle does the corresponding major arc subtend at the centre (in degrees)?`, answer: String(360 - a), given: [`Minor arc central angle $= ${a}^\\circ$`], find: "Major arc central angle", steps: [`The two arcs together complete the full rim: $360^\\circ$ at the centre.`, `Major arc angle $= 360^\\circ - ${a}^\\circ = ${360 - a}^\\circ$.`, `Check: ${a}° + ${360 - a}° = 360° — the rim is fully accounted for ✓`], concept: "Minor + major arc angles make 360°", hint1: "A full turn at the centre is 360°.", hint2: "Subtract the minor arc's share.", verify: `${a} + ${360 - a} = 360 ✓`, remember: "Arc angles at the centre split 360°." });
  }
  const n = r.pick([3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24]);
  return baseQ({ diff: d, sub: "s1", text: `A circular pizza is cut into $${n}$ equal sectors. What is the central angle of each sector (in degrees)?`, answer: String(360 / n), given: [`${n} equal sectors`], find: "Central angle per sector", steps: [`Equal sectors share the full $360^\\circ$ around the centre equally.`, `Each sector: $\\frac{360^\\circ}{${n}} = ${360 / n}^\\circ$.`, `Check: ${n} sectors × ${360 / n}° rebuild the full turn ✓`], concept: "Equal sectors split 360°", hint1: "Total angle at the centre = 360°.", hint2: `Divide 360 by ${n}.`, verify: `${n} × ${360 / n} = 360 ✓`, remember: "Equal slices: 360° ÷ number of slices." });
};

// ─── 3. circle-count ───────────────────────────────────────────────────────
const COUNT_CHOICES: readonly string[] = ["Infinitely many", "Exactly one", "Exactly two", "None"];
const circleCount: GenFn = (r, d) => {
  if (d === 1) {
    const through = r.next() < 0.5 ? "one given point $P$ on the plane" : "two given distinct points $A$ and $B$ on the plane";
    return baseQ({ diff: d, sub: "s2", type: "mcq", text: `How many circles can be drawn passing through ${through}?`, choices: [...COUNT_CHOICES], answer: "Infinitely many", steps: [`Pick any centre you like (not on top of the given point(s)).`, `Choose the radius as the distance from that centre to the required point(s).`, `For one point there is no restriction at all; for two points, any centre on the perpendicular bisector of $AB$ works — and that line has infinitely many points.`, `Either way: infinitely many circles.`], concept: "Circles through 1 or 2 points (book 5.3)", hint1: "Is the centre forced to a single location?", hint2: "For two points the centres slide along one line — how many points does a line hold?", mistake: "Only THREE non-collinear points pin the circle down to one.", remember: "1 or 2 points → infinite circles; 3 non-collinear → unique." });
  }
  if (d === 2) {
    const collinear = r.next() < 0.5;
    return baseQ({ diff: d, sub: "s2", type: "mcq", text: collinear ? "How many circles pass through three given **collinear** points?" : "How many circles pass through three given **non-collinear** points?", choices: [...COUNT_CHOICES], answer: collinear ? "None" : "Exactly one", steps: collinear ? [`Suppose a circle passed through collinear $A$, $B$, $C$.`, `Its centre would be equidistant from $A$, $B$ → on the perpendicular bisector of $AB$.`, `It would also be equidistant from $B$, $C$ → on the perpendicular bisector of $BC$.`, `But for collinear points those two bisectors are parallel — they never meet.`, `No centre exists, so **no circle** can pass through three collinear points.`] : [`The centre must satisfy $OA = OB$ and $OA = OC$.`, `So it lies on the perpendicular bisectors of $AB$ and of $AC$.`, `Non-collinear points make these bisectors intersect in exactly one point $O$.`, `Circle $(O, OA)$ passes through all three — and it is unique.`, `This is Theorem 1: exactly one circle through three non-collinear points.`], concept: "Theorem 1: unique circumcircle of 3 non-collinear points", hint1: "Where must the centre lie relative to each pair of points?", hint2: "Do the two perpendicular bisectors ever meet?", mistake: "A line can cut a circle in at most 2 points — so 3 collinear points can never share one circle.", remember: "Collinear kills the circle; non-collinear gives exactly one." });
  }
  if (d === 3) {
    if (r.next() < 0.5) {
      const k = r.int(1, 30);
      return baseQ({ diff: d, sub: "s2", text: `Two points $A$ and $B$ are $${2 * k}$ cm apart. What is the least possible radius (in cm) of a circle passing through both?`, answer: String(k), given: [`$AB = ${2 * k}$ cm`], find: "Least circumradius", steps: [`Any circle through $A$ and $B$ has its centre on the perpendicular bisector of $AB$.`, `Moving the centre along that line changes the radius; the radius is smallest when the centre sits at the midpoint of $AB$.`, `Then $AB$ is a diameter: $r = \\frac{${2 * k}}{2} = ${k}$ cm.`], concept: "Smallest circle through two points has AB as diameter", hint1: "Slide the centre along the perpendicular bisector and watch $r$.", hint2: "Closest allowed centre = midpoint of AB.", verify: `Any other centre is farther from $A$ than the midpoint is ✓`, remember: "Least radius through A, B = AB/2 (diameter case)." });
    }
    const R = r.int(4, 15);
    const s = r.int(2, 2 * R - 2);
    return baseQ({ diff: d, sub: "s2", text: `Points $A$ and $B$ are $${s}$ cm apart. How many circles of radius exactly $${R}$ cm pass through both $A$ and $B$?`, answer: "2", given: [`$AB = ${s}$ cm`, `Radius $= ${R}$ cm`], find: "Number of circles", steps: [`The centre must be at distance $${R}$ from both $A$ and $B$.`, `So the centre is a point where the circle of radius $${R}$ around $A$ meets the circle of radius $${R}$ around $B$.`, `Since $0 < ${s} < 2 \\times ${R}$, those two circles cross in exactly two points — one on each side of line $AB$.`, `So exactly **2** circles of radius $${R}$ pass through $A$ and $B$.`], concept: "Two equal-radius circles through two points", hint1: "Draw one circle of radius R centred at A and one at B.", hint2: "Two circles intersect in at most 2 points.", mistake: "Don't answer 1 — the centre may sit on EITHER side of line AB.", verify: `${s} < ${2 * R}, so the triangles on both sides exist ✓`, remember: "Fixed radius + 2 points ⇒ 2 mirror-image circles (or 1 if AB = 2r)." });
  }
  if (r.next() < 0.5) {
    return baseQ({ diff: d, sub: "s2", type: "fill", text: `The centres of all circles that pass through two fixed points $A$ and $B$ lie on the ________ of segment $AB$. (Answer in words.)`, answer: "perpendicular bisector", accept: ["the perpendicular bisector", "perpendicular-bisector"], steps: [`A circle through $A$ and $B$ has centre $O$ with $OA = OB$.`, `Points equidistant from $A$ and $B$ form exactly one locus.`, `That locus is the perpendicular bisector of $AB$.`], concept: "Locus of centres of circles through two points", hint1: "Which line is equidistant from two fixed points?", hint2: "It cuts AB at right angles at its midpoint.", remember: "Centres of circles through A, B ⇔ perpendicular bisector of AB." });
  }
  const R = r.int(5, 15);
  return baseQ({ diff: d, sub: "s2", text: `Points $A$ and $B$ are exactly $${2 * R}$ cm apart, and a circle of radius $${R}$ cm passes through both. How many such circles of radius $${R}$ cm exist?`, answer: "1", given: [`$AB = ${2 * R}$ cm`, `Radius $= ${R}$ cm`], find: "Number of circles", steps: [`Here $AB = 2r$, so the only way the centre can be $${R}$ from both ends is to sit at the midpoint of $AB$.`, `Then $AB$ is a diameter of the circle.`, `Any other point of the perpendicular bisector is farther than $${R}$ from $A$.`, `So exactly **1** circle works — the one with $AB$ as diameter.`], concept: "Diameter case: unique circle of radius r through points 2r apart", hint1: "Compare AB with 2r.", hint2: "The centre has no freedom left.", mistake: "This is the boundary case — the usual 'two circles' collapses to one.", verify: `Midpoint is exactly ${R} from both A and B ✓`, remember: "If AB = 2r, the circle through A and B is unique (AB = diameter)." });
};

// ─── 4. circum-triangle ────────────────────────────────────────────────────
const circumTriangle: GenFn = (r, d) => {
  if (d <= 2) {
    const [a, b, h] = r.pick(TRIPLES.filter((t) => t[2] <= (d === 1 ? 25 : 73)));
    if (d === 1) {
      return baseQ({ diff: d, sub: "s2", text: `A right-angled triangle has legs $${a}$ cm and $${b}$ cm. All three vertices lie on a circle. What is the radius of that circle (in cm)?`, answer: String(h / 2), given: [`Legs $${a}$ cm, $${b}$ cm`, "Right angle at C"], find: "Circumradius", steps: [`By Baudhāyana–Pythagoras, the hypotenuse is $\\sqrt{${a}^2 + ${b}^2} = ${h}$ cm.`, `For a right triangle the circumcentre is the midpoint of the hypotenuse.`, `So the circumradius is half the hypotenuse: $\\frac{${h}}{2} = ${h / 2}$ cm.`], concept: "Right triangle: circumradius = hypotenuse / 2", hint1: "First find the hypotenuse.", hint2: "The centre sits at the midpoint of the hypotenuse.", verify: `${h / 2} × 2 = ${h} = hypotenuse ✓`, remember: "Right triangle ⇒ circumcentre on the hypotenuse, R = hyp/2." });
    }
    return baseQ({ diff: d, sub: "s2", text: `A right-angled triangle with legs $${a}$ cm and $${b}$ cm is inscribed in a circle. What is the diameter of that circumcircle (in cm)?`, answer: String(h), given: [`Legs $${a}$ cm, $${b}$ cm`], find: "Circumdiameter", steps: [`Hypotenuse: $\\sqrt{${a}^2 + ${b}^2} = ${h}$ cm.`, `The hypotenuse of an inscribed right triangle subtends 180° at the centre, so it is a **diameter** of the circumcircle.`, `Diameter $= ${h}$ cm.`], concept: "Hypotenuse of an inscribed right triangle is a diameter", hint1: "The angle in a semicircle is 90° — read it backwards.", hint2: "A 90° inscribed angle faces a 180° central angle = diameter.", remember: "Right angle on the circle ⟺ hypotenuse is a diameter." });
  }
  if (d === 3) {
    const kind = r.pick(["acute", "obtuse", "right"] as const);
    let a: number, b: number, c: number;
    if (kind === "acute") { a = r.int(30, 70); b = r.int(Math.max(30, 91 - a), 70); c = 180 - a - b; }
    else if (kind === "obtuse") { a = r.int(20, 50); b = r.int(20, 89 - a); c = 180 - a - b; }
    else { a = r.int(25, 65); c = 90; b = 90 - a; }
    const ans = kind === "acute" ? "Inside the triangle" : kind === "obtuse" ? "Outside the triangle" : "On the triangle, at the midpoint of the hypotenuse";
    return baseQ({ diff: d, sub: "s2", type: "mcq", text: `A triangle has angles $${a}^\\circ$, $${b}^\\circ$ and $${c}^\\circ$. Its circumcentre lies…`, choices: ["Inside the triangle", "Outside the triangle", "On the triangle, at the midpoint of the hypotenuse", "Exactly at the largest-angle vertex"], answer: ans, steps: [`The angles are $${a}^\\circ, ${b}^\\circ, ${c}^\\circ$ — the triangle is ${kind}-angled.`, `Acute triangle → circumcentre inside; obtuse → outside; right → midpoint of the hypotenuse.`, `So here it lies ${ans.toLowerCase()}.`], concept: "Position of the circumcentre by triangle type", hint1: "Look at the biggest angle: below, at, or above 90°?", hint2: "Recall the three pictures from section 5.3.", remember: "Circumcentre: acute → in, right → on, obtuse → out." });
  }
  if (r.next() < 0.5) {
    return baseQ({ diff: d, sub: "s2", type: "mcq", text: "The centre of the unique circle passing through three non-collinear points A, B, C is found at the intersection of…", choices: ["the perpendicular bisectors of AB and BC", "the angle bisectors of the triangle", "the medians of the triangle", "the lines AB and BC"], answer: "the perpendicular bisectors of AB and BC", steps: [`The centre $O$ needs $OA = OB$ — that puts it on the perpendicular bisector of $AB$.`, `It also needs $OA = OC$ — perpendicular bisector of $AC$ (or $OB = OC$: of $BC$).`, `Two such bisectors meet at one point: the circumcentre.`, `Angle bisectors would give the *incentre* — a different centre.`], concept: "Constructing the circumcircle (book 5.3)", hint1: "Which construction guarantees equal distances to two points?", hint2: "It is a bisector of a segment, not of an angle.", mistake: "Angle bisectors meet at the INCENTRE, not the circumcentre.", remember: "Circumcentre = meeting point of perpendicular bisectors." });
  }
  const [, , h] = r.pick(TRIPLES);
  return baseQ({ diff: d, sub: "s2", text: `A right-angled triangle is inscribed in a circle of radius $${h / 2}$ cm. What is the length of its hypotenuse (in cm)?`, answer: String(h), given: [`Circumradius $= ${h / 2}$ cm`, "Right triangle inscribed"], find: "Hypotenuse", steps: [`In a right triangle the circumcentre is the midpoint of the hypotenuse.`, `So hypotenuse $= 2 \\times$ circumradius $= 2 \\times ${h / 2}$.`, `Hypotenuse $= ${h}$ cm — the diameter of the circle IS the hypotenuse.`], concept: "Right triangle: hypotenuse = 2 × circumradius", hint1: "Where is the circumcentre of a right triangle?", hint2: "The radius reaches from that midpoint to a vertex.", verify: `${h}/2 = ${h / 2} = given radius ✓`, remember: "Diameter = hypotenuse for inscribed right triangles." });
};

// ─── 5. chord-dist ─────────────────────────────────────────────────────────
const chordDist: GenFn = (r, d) => {
  const [x, y, R] = r.pick(TRIPLES.filter((t) => t[2] <= (d === 1 ? 25 : 73)));
  const flip = r.sign() === 1;
  const half = flip ? x : y;
  const dist = flip ? y : x;
  const chord = 2 * half;
  if (d <= 2) {
    return baseQ({ diff: d, sub: "s3", text: `A circle of radius $${R}$ cm has a chord at a perpendicular distance of $${dist}$ cm from the centre. Find the length of the chord (in cm).`, answer: String(chord), given: [`Radius $r = ${R}$ cm`, `Distance from centre $d = ${dist}$ cm`], find: "Chord length c", steps: [`Drop the perpendicular from the centre $O$ to the chord $AB$; it meets $AB$ at its midpoint $M$ (Theorem 5).`, `So $AM = MB = \\frac{c}{2}$ and $\\triangle OMA$ is right-angled at $M$.`, `Baudhāyana–Pythagoras: $\\left(\\frac{c}{2}\\right)^2 = r^2 - d^2 = ${R}^2 - ${dist}^2 = ${R * R - dist * dist}$.`, `$\\frac{c}{2} = ${half}$, so $c = ${chord}$ cm.`], concept: "r² = d² + (c/2)² — chord length from distance", hint1: "The perpendicular from the centre bisects the chord.", hint2: "Use $r^2 = d^2 + (c/2)^2$ with the given $r$ and $d$.", mistake: "Halve the chord BEFORE squaring — putting the full chord in the formula is the classic slip.", verify: `${dist}² + ${half}² = ${dist * dist} + ${half * half} = ${R * R} = ${R}² ✓`, remember: "$c = 2\\sqrt{r^2 - d^2}$." });
  }
  if (d === 3) {
    return baseQ({ diff: d, sub: "s3", text: `In a circle of radius $${R}$ cm, a chord measures $${chord}$ cm. Find the perpendicular distance of the chord from the centre (in cm).`, answer: String(dist), given: [`Radius $r = ${R}$ cm`, `Chord $c = ${chord}$ cm`], find: "Distance d from centre", steps: [`The perpendicular from the centre bisects the chord, so each half is $\\frac{${chord}}{2} = ${half}$ cm.`, `Right triangle with hypotenuse $r = ${R}$ and one leg $${half}$:`, `$d = \\sqrt{r^2 - \\left(\\frac{c}{2}\\right)^2} = \\sqrt{${R}^2 - ${half}^2} = \\sqrt{${R * R - half * half}} = ${dist}$ cm.`], concept: "d = √(r² − (c/2)²) — distance from chord length", hint1: "Halve the chord first.", hint2: "The radius is the hypotenuse of the little right triangle.", mistake: "Don't plug the full chord length into Pythagoras — use the half-chord.", verify: `${dist}² + ${half}² = ${R * R} = ${R}² ✓`, remember: "Half-chord, distance, radius form a right triangle." });
  }
  return baseQ({ diff: d, sub: "s3", text: `A circular park of radius $${R}$ m has a straight pathway cutting across it. The pathway (a chord) runs at a perpendicular distance of $${dist}$ m from the park's centre. How long is the pathway (in m)?`, answer: String(chord), given: [`$r = ${R}$ m`, `$d = ${dist}$ m`], find: "Pathway (chord) length", steps: [`Model the pathway as chord $AB$ with midpoint $M$, and the centre as $O$.`, `$OM \\perp AB$ and $OM = ${dist}$, $OA = ${R}$ (radius).`, `$AM^2 = OA^2 - OM^2 = ${R * R} - ${dist * dist} = ${R * R - dist * dist}$, so $AM = ${half}$ m.`, `The full pathway is $AB = 2 \\times ${half} = ${chord}$ m.`], concept: "Chord–distance relation r² = d² + (c/2)²", hint1: "Radius, distance, half-chord make a right triangle.", hint2: "Double the half-chord at the end.", verify: `${dist}² + ${half}² = ${R * R} ✓`, remember: "Word problem or not, it is the same $r^2 = d^2 + (c/2)^2$." });
};

// ─── 6. radius-chord-pyth ──────────────────────────────────────────────────
const radiusChordPyth: GenFn = (r, d) => {
  const [x, y, R] = r.pick(TRIPLES.filter((t) => t[2] <= (d === 1 ? 25 : 73)));
  const flip = r.sign() === 1;
  const half = flip ? x : y;
  const dist = flip ? y : x;
  const chord = 2 * half;
  if (d === 1) {
    return baseQ({ diff: d, sub: "s3", text: `A chord of length $${chord}$ cm lies at a distance of $${dist}$ cm from the centre of its circle. Find the radius of the circle (in cm).`, answer: String(R), given: [`Chord $= ${chord}$ cm`, `Distance $= ${dist}$ cm`], find: "Radius r", steps: [`The perpendicular from the centre splits the chord: half-chord $= \\frac{${chord}}{2} = ${half}$ cm.`, `Radius² = distance² + half-chord²  (right triangle at the midpoint).`, `$r^2 = ${dist}^2 + ${half}^2 = ${dist * dist + half * half}$, so $r = ${R}$ cm.`], concept: "r = √(d² + (c/2)²)", hint1: "Halve the chord, then meet Pythagoras.", hint2: "The radius is the hypotenuse here.", verify: `${dist}² + ${half}² = ${R}² ✓`, remember: "Radius is always the hypotenuse of the half-chord triangle." });
  }
  if (d === 2) {
    return baseQ({ diff: d, sub: "s3", text: `In a circle, a chord $AB$ of length $${chord}$ cm has its midpoint $M$. If $OM = ${dist}$ cm where $O$ is the centre, find $OA$ (the radius) in cm.`, answer: String(R), given: [`$AB = ${chord}$ cm`, `$OM = ${dist}$ cm`], find: "Radius OA", steps: [`$O$ is the centre and $M$ is the chord's midpoint, so $OM \\perp AB$ (line from centre to chord-midpoint is perpendicular).`, `$AM = \\frac{${chord}}{2} = ${half}$ cm.`, `$OA^2 = OM^2 + AM^2 = ${dist * dist} + ${half * half} = ${R * R}$.`, `$OA = ${R}$ cm.`], concept: "Centre–midpoint segment ⊥ chord; Pythagoras gives the radius", hint1: "OM is perpendicular to AB — why?", hint2: "$OA$ is the hypotenuse of right triangle OMA.", remember: "Centre-to-midpoint is perpendicular; radius completes the right triangle." });
  }
  if (d === 3) {
    return baseQ({ diff: d, sub: "s3", text: `The perpendicular from the centre $O$ of a circle meets a chord $AB$ at $M$. Given $AM = ${half}$ cm and $OM = ${dist}$ cm, find the radius of the circle (in cm).`, answer: String(R), given: [`$AM = ${half}$ cm (half the chord)`, `$OM = ${dist}$ cm`], find: "Radius", steps: [`Since $M$ is the foot of the perpendicular, $\\triangle OMA$ is right-angled at $M$.`, `$OA^2 = OM^2 + AM^2 = ${dist}^2 + ${half}^2 = ${R * R}$.`, `Radius $OA = ${R}$ cm.`], concept: "Pythagoras in the half-chord triangle", hint1: "OA is a radius — compute it as a hypotenuse.", hint2: "Square, add, then take the root.", verify: `${dist}² + ${half}² = ${R * R} ✓`, remember: "$r^2 = d^2 + \\left(\\frac{c}{2}\\right)^2$." });
  }
  return baseQ({ diff: d, sub: "s3", text: `A chord of length $${chord}$ cm sits $${dist}$ cm from the centre of a circle. Find the DIAMETER of the circle (in cm).`, answer: String(2 * R), given: [`Chord $= ${chord}$ cm`, `Distance from centre $= ${dist}$ cm`], find: "Diameter", steps: [`Half-chord: $\\frac{${chord}}{2} = ${half}$ cm.`, `Radius: $r = \\sqrt{${dist}^2 + ${half}^2} = \\sqrt{${R * R}} = ${R}$ cm.`, `Diameter $= 2r = ${2 * R}$ cm.`], concept: "Radius from chord data, then double it", hint1: "Find r first with Pythagoras.", hint2: "The question wants 2r, not r.", mistake: "Stop-at-radius is the classic half-answer trap — re-read what is asked.", verify: `Radius ${R} → diameter ${2 * R} ✓`, remember: "Diameter = 2 × the hypotenuse you just computed." });
};

// ─── 7. eq-chords ──────────────────────────────────────────────────────────
const EQ_TF: ReadonlyArray<{ q: string; ok: boolean; why: string[]; h1: string }> = [
  { q: "Two chords of a circle are equal in length. Then they are equidistant from the centre.", ok: true, why: ["Equal chords are rotations of each other about the centre (the circle is rotation-symmetric).", "Rotation preserves perpendicular distance.", "So equal chords are equidistant — Theorem 6."], h1: "Think of rotating one chord onto the other." },
  { q: "Two chords equidistant from the centre have equal lengths.", ok: true, why: ["Distance $d$ and radius $r$ force the half-chord: $\\sqrt{r^2 - d^2}$. Same $d$ ⇒ same half-chord ⇒ same chord.", "This is the converse, Theorem 7.", "True."], h1: "Use r² = d² + (c/2)² with equal d." },
  { q: "A longer chord of a circle is farther from the centre.", ok: false, why: ["From $d^2 = r^2 - (c/2)^2$: bigger $c$ makes $d$ SMALLER.", "Longer chords are closer to the centre (Theorem 8).", "The statement reverses the truth — false."], h1: "Where does the longest chord (diameter) sit?" },
  { q: "Of two unequal chords, the one nearer the centre is the longer one.", ok: true, why: ["$d^2 = r^2 - (c/2)^2$: smaller distance ⇒ larger half-chord.", "So nearer ⇔ longer for unequal chords.", "True by Theorem 8."], h1: "Compare the diameter (distance 0) with any other chord." },
  { q: "Equal chords of a circle subtend equal angles at the centre.", ok: true, why: ["Equal chords give congruent isosceles triangles with the radii (SSS).", "Congruent triangles have equal apex angles.", "True — Theorem 2."], h1: "Draw the two isosceles triangles formed with the centre." },
  { q: "Chords that subtend equal angles at the centre must be equal in length.", ok: true, why: ["Equal central angles + equal radii ⇒ congruent triangles (SAS).", "So the third sides — the chords — are equal.", "True — Theorem 3, the converse of Theorem 2."], h1: "SAS congruence with two radii and the angle." },
];
const EQ_CONFIGS: ReadonlyArray<readonly [number, number, number]> = [
  [5, 6, 8], [10, 12, 16], [13, 10, 24], [15, 18, 24], [17, 16, 30],
  [25, 14, 48], [25, 30, 40], [29, 40, 42], [50, 28, 60], [20, 24, 32],
];
const eqChords: GenFn = (r, d) => {
  if (d === 1) {
    const t = r.pick(EQ_TF);
    return baseQ({ diff: d, sub: "s3", type: "tf", text: `True or False: ${t.q}`, answer: t.ok ? "true" : "false", accept: [t.ok ? "t" : "f"], steps: t.why, concept: "Equal chords ⟺ equidistant from centre (Th 6 & 7)", hint1: t.h1, hint2: "Back it up with r² = d² + (c/2)² where possible.", mistake: "Longer ≠ farther! Longer chords are CLOSER to the centre.", remember: "Equal chords ↔ equal distances; longer chords sit deeper." });
  }
  if (d === 2) {
    const [a, b, R] = r.pick(TRIPLES);
    const flip = r.sign() === 1;
    const chord = 2 * (flip ? a : b);
    const dist = flip ? b : a;
    return baseQ({ diff: d, sub: "s3", text: `In a circle of radius $${R}$ cm, chords $AB$ and $CD$ are equal, each $${chord}$ cm long. If $AB$ lies at a distance of $${dist}$ cm from the centre, how far is $CD$ from the centre (in cm)?`, answer: String(dist), given: [`$AB = CD = ${chord}$ cm`, `Distance of $AB$ $= ${dist}$ cm`, `$r = ${R}$ cm`], find: "Distance of CD from centre", steps: [`Equal chords of a circle are equidistant from the centre (Theorem 6).`, `So the distance of $CD$ equals the distance of $AB$.`, `Answer: $${dist}$ cm. (Check: $\\sqrt{${R}^2 - ${(chord / 2)}^2} = \\sqrt{${R * R - (chord / 2) * (chord / 2)}} = ${dist}$ ✓)`], concept: "Theorem 6: equal chords are equidistant from the centre", hint1: "No computation is even needed — quote the theorem.", hint2: "Or verify with r² = d² + (c/2)².", remember: "Equal chords ⇒ equal distances, no matter where they sit." });
  }
  const [R, c1, c2] = r.pick(EQ_CONFIGS);
  const d1 = Math.sqrt(R * R - (c1 / 2) * (c1 / 2));
  const d2 = Math.sqrt(R * R - (c2 / 2) * (c2 / 2));
  const opposite = d !== 3; // d = 3 → opposite sides, d = 4 → same side
  const gap = opposite ? d1 + d2 : Math.abs(d1 - d2);
  return baseQ({ diff: d, sub: "s3", text: `Two parallel chords of lengths $${c1}$ cm and $${c2}$ cm lie on ${opposite ? "opposite sides" : "the same side"} of the centre of a circle of radius $${R}$ cm. Find the distance between their midpoints (in cm).`, answer: String(gap), given: [`$r = ${R}$ cm`, `Chords $${c1}$ cm and $${c2}$ cm, parallel`, opposite ? "On opposite sides of the centre" : "On the same side of the centre"], find: "Distance between the midpoints", steps: [`Half-chords: $\\frac{${c1}}{2} = ${c1 / 2}$ and $\\frac{${c2}}{2} = ${c2 / 2}$.`, `Distances from the centre: $\\sqrt{${R}^2 - ${c1 / 2}^2} = ${d1}$ cm and $\\sqrt{${R}^2 - ${c2 / 2}^2} = ${d2}$ cm.`, opposite ? `The chords are on opposite sides, so the midpoints are separated by $${d1} + ${d2} = ${gap}$ cm.` : `Both on the same side, so subtract: $|${d1} - ${d2}| = ${gap}$ cm.`], concept: "Parallel chords: perpendicular distances from centre add or subtract", hint1: "Find each chord's distance from the centre first.", hint2: opposite ? "Opposite sides ⇒ distances ADD." : "Same side ⇒ distances SUBTRACT.", mistake: "Adding when the chords are on the same side (or subtracting across the centre) flips the answer — draw the picture!", verify: `Pythagoras: ${d1}² + ${c1 / 2}² = ${R}² ✓`, remember: "Opposite sides → add; same side → subtract." });
};

// ─── 8. chord-farther ──────────────────────────────────────────────────────
const chordFarther: GenFn = (r, d) => {
  if (d <= 3) {
    const R = r.int(8, 45);
    const L1 = r.int(2, 2 * R - 2);
    let L2 = r.int(2, 2 * R - 2);
    while (L2 === L1) L2 = r.int(2, 2 * R - 2);
    const farther = L1 < L2 ? "Chord AB" : "Chord CD";
    const nearer = L1 < L2 ? "Chord CD" : "Chord AB";
    const hi = Math.max(L1, L2), lo = Math.min(L1, L2);
    return baseQ({ diff: d, sub: "s3", type: "mcq", text: `In a circle of radius $${R}$ cm, chord $AB$ has length $${L1}$ cm and chord $CD$ has length $${L2}$ cm. Which chord is farther from the centre?`, choices: [farther, nearer, "They are equidistant from the centre", "It cannot be determined from the given data"], answer: farther, given: [`$r = ${R}$ cm`, `$AB = ${L1}$ cm`, `$CD = ${L2}$ cm`], find: "Which chord is farther", steps: [`Half-chords: $\\frac{${L1}}{2} = ${L1 / 2}$ and $\\frac{${L2}}{2} = ${L2 / 2}$.`, `Distance² from the centre: $d^2 = r^2 - (\\text{half-chord})^2$. The larger half-chord leaves a smaller $d^2$.`, `The longer chord ($${hi}$ cm) has the larger half-chord, so it sits closer; the shorter chord ($${lo}$ cm) is pushed toward the rim.`, `Hence ${farther} — the $${lo}$ cm chord — is farther from the centre.`], concept: "Theorem 8: the longer chord is closer to the centre", hint1: "Compare half-chords, or recall Theorem 8.", hint2: "The diameter (longest chord) has distance 0 — the extreme case.", mistake: "Intuition says longer = farther (longer stick sticks out more) — for chords it is exactly backwards!", verify: `${hi} > ${lo} ⇒ distance(${hi}) < distance(${lo}) ✓`, remember: "Longer chord ⇒ closer to centre; the diameter is the closest of all." });
  }
  const which = r.int(0, 3);
  const items: ReadonlyArray<{ q: string; ok: string; bad: [string, string, string]; why: string[] }> = [
    { q: "The chord nearest to the centre of a circle is", ok: "the diameter", bad: ["the shortest chord", "any chord — all are equally near", "a tangent segment"], why: ["Distance 0 means the chord passes through the centre.", "That chord is the diameter.", "So the nearest chord is the diameter — also the longest."], },
    { q: "As a chord of fixed circle slides from the centre toward the rim, its length…", ok: "decreases continuously", bad: ["increases continuously", "stays the same", "first increases, then decreases"], why: ["Distance $d$ grows from 0 toward $r$.", "Length $c = 2\\sqrt{r^2 - d^2}$ shrinks as $d$ grows.", "So the chord shortens steadily toward 0."], },
    { q: "Two chords subtend equal angles at the centre. Their lengths are…", ok: "equal", bad: ["unequal", "in a 2:1 ratio", "impossible to compare"], why: ["Equal central angles + radii give congruent triangles (SAS).", "The chords are matching third sides.", "So they are equal (Theorem 3)."], },
    { q: "A chord at distance equal to the radius from the centre has length…", ok: "0 (it degenerates to a point)", bad: ["equal to the radius", "equal to the diameter", "$r\\sqrt{2}$"], why: ["$c = 2\\sqrt{r^2 - d^2}$ with $d = r$ gives $c = 2\\sqrt{0} = 0$. ", "The 'chord' collapses to the single tangent point.", "That is the limiting case — no positive-length chord is that far out."], },
  ];
  const t = items[which];
  return baseQ({ diff: d, sub: "s3", type: "mcq", text: t.q, choices: shuffled([t.ok, ...t.bad], r), answer: t.ok, steps: t.why, concept: "Chord–distance extremes and equal-angle chords", hint1: "Lean on c = 2√(r² − d²).", hint2: "Test the extreme cases d = 0 and d = r.", remember: "$d = 0$ → diameter; $d = r$ → a point." });
};

// ─── 9. central-inscribed ──────────────────────────────────────────────────
const centralInscribed: GenFn = (r, d) => {
  if (d === 1) {
    const t = r.int(1, 89);
    return baseQ({ diff: d, sub: "s4", text: `In a circle with centre $O$, an arc subtends $\\angle AOB = ${2 * t}^\\circ$ at the centre. What angle does the same arc subtend at a point $C$ on the remaining part of the circle (in degrees)?`, answer: String(t), given: [`Central angle $\\angle AOB = ${2 * t}^\\circ$`], find: "Inscribed angle ∠ACB", steps: [`The angle at the centre is double the angle at any point of the circle outside the arc (Theorem 9).`, `So $\\angle ACB = \\frac{1}{2} \\angle AOB$.`, `$\\angle ACB = \\frac{${2 * t}^\\circ}{2} = ${t}^\\circ$.`], concept: "Central angle = 2 × inscribed angle (same arc)", hint1: "Centre vs rim: who gets the bigger angle?", hint2: "Halve the central angle.", verify: `${t} × 2 = ${2 * t} ✓`, remember: "At the centre: double. On the rim: half." });
  }
  if (d === 2) {
    const t = r.int(1, 89);
    return baseQ({ diff: d, sub: "s4", text: `An arc of a circle subtends an angle of $${t}^\\circ$ at a point $P$ on the circle. Find the angle it subtends at the centre $O$ (in degrees).`, answer: String(2 * t), given: [`Inscribed angle $= ${t}^\\circ$`], find: "Central angle", steps: [`Central angle $= 2 \\times$ inscribed angle on the same arc (Theorem 9).`, `So $\\angle AOB = 2 \\times ${t}^\\circ$.`, `Central angle $= ${2 * t}^\\circ$.`], concept: "Central angle = 2 × inscribed angle (same arc)", hint1: "Go from rim to centre: double it.", hint2: "The centre sees the arc from closer, with double the sweep.", verify: `${2 * t} ÷ 2 = ${t} ✓`, remember: "Inscribed → central: × 2." });
  }
  if (d === 3) {
    const t = r.int(10, 85);
    return baseQ({ diff: d, sub: "s4", text: `Points $A$ and $B$ lie on a circle with centre $O$, and $C$ is on the major arc $AB$. The inscribed angle $\\angle ACB = ${t}^\\circ$. What is the REFLEX angle $\\angle AOB$ (in degrees)?`, answer: String(360 - 2 * t), given: [`$\\angle ACB = ${t}^\\circ$ (C on the major arc)`], find: "Reflex ∠AOB", steps: [`$C$ on the major arc subtends the MINOR arc $AB$.`, `Minor central angle $\\angle AOB = 2 \\times ${t}^\\circ = ${2 * t}^\\circ$.`, `Reflex angle $= 360^\\circ - ${2 * t}^\\circ = ${360 - 2 * t}^\\circ$.`], concept: "Reflex central angle = 360° − 2 × inscribed angle", hint1: "First double the inscribed angle to get the MINOR central angle.", hint2: "Then subtract from 360°.", mistake: `Reporting the minor angle ${2 * t}° — the question asks for the REFLEX (major) one.`, verify: `${2 * t} + ${360 - 2 * t} = 360 ✓`, remember: "Major arc ↔ reflex central angle = 360° − 2×inscribed." });
  }
  const a = r.int(20, 70);
  return baseQ({ diff: d, sub: "s4", text: `$O$ is the centre of a circle and $AB$ is a chord with $\\angle OAB = ${a}^\\circ$. Point $C$ lies on the major arc $AB$. Find $\\angle ACB$ (in degrees).`, answer: String(90 - a), given: [`$\\angle OAB = ${a}^\\circ$`, "$OA = OB$ (radii)"], find: "∠ACB", steps: [`$\\triangle OAB$ is isosceles: $OA = OB$ are radii, so $\\angle OBA = \\angle OAB = ${a}^\\circ$.`, `Apex angle: $\\angle AOB = 180^\\circ - 2 \\times ${a}^\\circ = ${180 - 2 * a}^\\circ$ (the minor central angle).`, `The inscribed angle on the major arc is half of it: $\\angle ACB = \\frac{${180 - 2 * a}^\\circ}{2} = ${90 - a}^\\circ$.`], concept: "Isosceles triangle + central-angle theorem combined", hint1: "Radii make triangle OAB isosceles — base angles equal.", hint2: "Find ∠AOB first, then halve it.", verify: `(${90 - a}) × 2 + 2 × ${a} = 180 ✓`, remember: "Chord + centre: isosceles triangle, then halve for the rim." });
};

// ─── 10. same-segment ──────────────────────────────────────────────────────
const sameSegment: GenFn = (r, d) => {
  if (d === 1) {
    const t = r.int(5, 175);
    return baseQ({ diff: d, sub: "s4", text: `$A$, $B$, $C$, $D$ lie on a circle, with $C$ and $D$ in the same segment of chord $AB$. If $\\angle ACB = ${t}^\\circ$, find $\\angle ADB$ (in degrees).`, answer: String(t), given: [`$\\angle ACB = ${t}^\\circ$`, "C, D in the same segment"], find: "∠ADB", steps: [`Both angles stand on the same arc $AB$ from the same side.`, `Angles in the same segment of a circle are equal.`, `$\\angle ADB = \\angle ACB = ${t}^\\circ$.`], concept: "Angles in the same segment are equal", hint1: "Same segment ⇒ same arc ⇒ same angle.", hint2: "No computation needed — quote the property.", mistake: "If C and D were on OPPOSITE segments, the angles would add to 180° instead.", verify: "Both subtend the same arc AB ✓", remember: "Same segment, same angle — the circle's signature trick." });
  }
  if (d === 2) {
    const t = r.int(5, 89);
    return baseQ({ diff: d, sub: "s4", text: `Three points $D$, $E$, $F$ lie in the same segment of chord $AB$ on a circle. If $\\angle ADB = ${t}^\\circ$, find $\\angle AEB + \\angle AFB$ (in degrees).`, answer: String(2 * t), given: [`$\\angle ADB = ${t}^\\circ$`, "D, E, F in the same segment"], find: "∠AEB + ∠AFB", steps: [`Each of $\\angle AEB$ and $\\angle AFB$ stands on the same arc as $\\angle ADB$.`, `Angles in the same segment are equal: $\\angle AEB = \\angle AFB = ${t}^\\circ$.`, `Sum $= ${t}^\\circ + ${t}^\\circ = ${2 * t}^\\circ$.`], concept: "Angles in the same segment are equal", hint1: "Every one of the three angles equals the given one.", hint2: "Add two copies of the angle.", remember: "Same segment clones the angle." });
  }
  if (d === 3) {
    const a = r.int(50, 85), b = r.int(50, 85);
    const c = 180 - a - b;
    return baseQ({ diff: d, sub: "s4", text: `$\\triangle ABC$ is inscribed in a circle with centre $O$. If $\\angle BAC = ${a}^\\circ$ and $\\angle ABC = ${b}^\\circ$, find $\\angle AOB$ (in degrees).`, answer: String(2 * c), given: [`$\\angle A = ${a}^\\circ$, $\\angle B = ${b}^\\circ$`], find: "∠AOB (central angle on AB)", steps: [`Third angle of the triangle: $\\angle ACB = 180^\\circ - ${a}^\\circ - ${b}^\\circ = ${c}^\\circ$.`, `$\\angle ACB$ is the inscribed angle standing on arc $AB$.`, `Central angle $\\angle AOB = 2 \\times \\angle ACB = ${2 * c}^\\circ$.`], concept: "Triangle angle sum + central = 2 × inscribed", hint1: "Find ∠C first.", hint2: "∠AOB is the central angle on the same arc AB.", verify: `${c} × 2 = ${2 * c}, and ${2 * c} < 180 so it is the minor angle ✓`, remember: "Inscribed triangle → third angle → double it at the centre." });
  }
  const xx = r.int(5, 175), yy = r.int(20, 80);
  return baseQ({ diff: d, sub: "s4", text: `$A$, $B$, $C$, $D$ are concyclic (in this order on the circle). Given $\\angle ABD = ${xx}^\\circ$ and $\\angle ADB = ${yy}^\\circ$, find $\\angle ACD$ (in degrees).`, answer: String(xx), given: [`$\\angle ABD = ${xx}^\\circ$`, `$\\angle ADB = ${yy}^\\circ$`], find: "∠ACD", steps: [`$\\angle ABD$ is the angle at $B$ subtended by chord $AD$; $\\angle ACD$ is the angle at $C$ subtended by the same chord $AD$.`, `$B$ and $C$ lie in the same segment of chord $AD$.`, `Angles in the same segment are equal: $\\angle ACD = \\angle ABD = ${xx}^\\circ$.`, `(The $${yy}^\\circ$ datum is extra — identify which arc each angle subtends before computing!)`], concept: "Same-segment equality with a distractor angle", hint1: "Which chord do ∠ABD and ∠ACD both look at?", hint2: "Both subtend AD from the same side — the other angle is a decoy.", mistake: "Combining the two given angles blindly (e.g. 180 − sum) ignores WHICH arc each angle subtends.", verify: "∠ACD and ∠ABD both subtend arc AD ✓", remember: "First match each angle to its arc; only then chase." });
};

// ─── 11. semicircle-angle ──────────────────────────────────────────────────
const semicircleAngle: GenFn = (r, d) => {
  if (d === 1) {
    if (r.next() < 0.5) {
      return baseQ({ diff: d, sub: "s4", text: `$AB$ is a diameter of a circle and $C$ is any other point on the circle. What is $\\angle ACB$ in degrees?`, answer: "90", steps: [`The diameter subtends a $180^\\circ$ angle at the centre (a straight angle).`, `An inscribed angle is half the central angle on the same arc.`, `$\\angle ACB = \\frac{180^\\circ}{2} = 90^\\circ$.`], concept: "Angle in a semicircle is a right angle", hint1: "What central angle does a diameter make?", hint2: "Halve 180°.", remember: "Diameter on the circle ⇒ right angle, every time." });
    }
    return baseQ({ diff: d, sub: "s4", type: "tf", text: "True or False: the angle in a semicircle is 45°.", answer: "false", accept: ["f"], steps: ["The diameter subtends 180° at the centre.", "Inscribed angle = half of 180° = 90°.", "So the claim of 45° is false — it is a right angle."], concept: "Angle in a semicircle = 90°", hint1: "Half of the straight angle 180°.", hint2: "Thales' corollary of the central-angle theorem.", remember: "Semicircle angle: 90°, not 45°." });
  }
  if (d === 2) {
    const [a, b, h] = r.pick(TRIPLES);
    const flip = r.sign() === 1;
    const leg1 = flip ? a : b, leg2 = flip ? b : a;
    return baseQ({ diff: d, sub: "s4", text: `$AB$ is a diameter of a circle and $C$ lies on the circle. If $BC = ${leg1}$ cm and $AB = ${h}$ cm, find $AC$ (in cm).`, answer: String(leg2), given: [`$AB = ${h}$ cm (diameter)`, `$BC = ${leg1}$ cm`], find: "AC", steps: [`$AB$ is a diameter ⇒ $\\angle ACB = 90^\\circ$ (angle in a semicircle).`, `So $\\triangle ACB$ is right-angled at $C$ with hypotenuse $AB = ${h}$.`, `$AC = \\sqrt{${h}^2 - ${leg1}^2} = \\sqrt{${h * h - leg1 * leg1}} = ${leg2}$ cm.`], concept: "Angle in a semicircle + Baudhāyana–Pythagoras", hint1: "First conclude the triangle is right-angled.", hint2: "AB is the hypotenuse; subtract the square of the known leg.", mistake: "Treating BC or AC as the hypotenuse — the DIAMETER is the hypotenuse here.", verify: `${leg2}² + ${leg1}² = ${leg2 * leg2 + leg1 * leg1} = ${h}² ✓`, remember: "Semicircle gives the right angle; the diameter plays the hypotenuse." });
  }
  const a = r.int(10, 80);
  return baseQ({ diff: d, sub: "s4", text: `$AB$ is a diameter of a circle and $C$ is on the circle with $\\angle CAB = ${a}^\\circ$. Find $\\angle CBA$ (in degrees).`, answer: String(90 - a), given: [`$\\angle CAB = ${a}^\\circ$`, "AB is a diameter"], find: "∠CBA", steps: [`$\\angle ACB = 90^\\circ$ — the angle in a semicircle.`, `Angle sum of $\\triangle ABC$: $\\angle CBA = 180^\\circ - 90^\\circ - ${a}^\\circ$.`, `$\\angle CBA = ${90 - a}^\\circ$.`], concept: "Semicircle right angle + triangle angle sum", hint1: "The angle at C is fixed at 90°.", hint2: "The two acute angles of a right triangle sum to 90°.", verify: `${a} + ${90 - a} = 90 ✓`, remember: "In a semicircle triangle, the acute angles are complementary." });
};

// ─── 12. cyclic-quad ───────────────────────────────────────────────────────
const cyclicQuad: GenFn = (r, d) => {
  if (d === 1) {
    const a = r.int(5, 175);
    return baseQ({ diff: d, sub: "s4", text: `$ABCD$ is a cyclic quadrilateral with $\\angle A = ${a}^\\circ$. Find $\\angle C$ (in degrees).`, answer: String(180 - a), given: [`$\\angle A = ${a}^\\circ$`, "ABCD cyclic"], find: "∠C", steps: [`In a cyclic quadrilateral, opposite angles are supplementary (Theorem 11).`, `$\\angle A$ and $\\angle C$ are opposite.`, `$\\angle C = 180^\\circ - ${a}^\\circ = ${180 - a}^\\circ$.`], concept: "Cyclic quadrilateral: opposite angles sum to 180°", hint1: "Which pair of angles is opposite?", hint2: "A pairs with C; B pairs with D.", mistake: "Don't pair A with B — those are adjacent, no fixed sum.", verify: `${a} + ${180 - a} = 180 ✓`, remember: "Opposite angles of a cyclic quad: 180° together." });
  }
  if (d === 2) {
    const a = r.int(5, 175), b = r.int(5, 175);
    return baseQ({ diff: d, sub: "s4", text: `$ABCD$ is a cyclic quadrilateral with $\\angle A = ${a}^\\circ$ and $\\angle B = ${b}^\\circ$. Find $\\angle D$ (in degrees).`, answer: String(180 - b), given: [`$\\angle A = ${a}^\\circ$`, `$\\angle B = ${b}^\\circ$`], find: "∠D", steps: [`Opposite pairs are $(A, C)$ and $(B, D)$.`, `$\\angle D$ is opposite to $\\angle B$, not to $\\angle A$.`, `$\\angle D = 180^\\circ - ${b}^\\circ = ${180 - b}^\\circ$.`], concept: "Cyclic quadrilateral: B + D = 180°", hint1: "D's opposite partner is B.", hint2: `∠A = ${a}° only fixes ∠C.`, mistake: "Subtracting ∠A by mistake pairs the wrong vertices — D sits opposite B.", verify: `${b} + ${180 - b} = 180 ✓`, remember: "Match each angle to its OPPOSITE before subtracting." });
  }
  if (d === 3) {
    const k = r.pick([2, 3, 4, 5, 8, 9]);
    return baseQ({ diff: d, sub: "s4", text: `In a cyclic quadrilateral $ABCD$, $\\angle A = ${k} \\, \\angle C$. Find $\\angle C$ (in degrees).`, answer: String(180 / (k + 1)), given: [`$\\angle A = ${k}\\,\\angle C$`, "ABCD cyclic"], find: "∠C", steps: [`Opposite angles: $\\angle A + \\angle C = 180^\\circ$.`, `Substitute $\\angle A = ${k}\\angle C$: $${k}\\angle C + \\angle C = 180^\\circ$.`, `$(${k + 1})\\angle C = 180^\\circ$, so $\\angle C = \\frac{180^\\circ}{${k + 1}} = ${180 / (k + 1)}^\\circ$.`], concept: "Opposite angles supplementary + linear equation", hint1: "Write both opposite angles with one unknown.", hint2: "∠A + ∠C = 180°, with ∠A = k∠C.", verify: `${180 / (k + 1)} × ${k} + ${180 / (k + 1)} = 180 ✓`, remember: "Ratio + 180° ⇒ simple linear equation." });
  }
  const t = r.pick([0, 1, 2, 3]);
  const tfItems: ReadonlyArray<{ q: string; ok: boolean; why: string[] }> = [
    { q: "If two points C and D on the same side of segment AB satisfy ∠ACB = ∠ADB, then A, B, C, D are concyclic.", ok: true, why: ["The circle through A, B, C is unique.", "If D were inside or outside it, ∠ADB would differ from ∠ACB (exterior-angle argument).", "Equality forces D onto that circle — Theorem 10."], },
    { q: "The opposite angles of a cyclic quadrilateral always add to 180°.", ok: true, why: ["Each inscribed angle is half its arc; opposite angles together subtend the full 360° of arcs.", "Half of 360° is 180°.", "True — Theorem 11."], },
    { q: "If a quadrilateral has one pair of opposite angles summing to 180°, it must be cyclic.", ok: true, why: ["The supplementary opposite angles force equal angles in the same segment.", "By the concyclicity test (Theorem 10), all four vertices lie on one circle.", "True — this is the standard test for cyclicity."], },
    { q: "In a cyclic quadrilateral, ADJACENT angles always add to 180°.", ok: false, why: ["The 180° rule applies to OPPOSITE pairs (A+C, B+D).", "Adjacent angles have no fixed sum — e.g. a cyclic quad can have ∠A = 60°, ∠B = 110°.", "False."], },
  ];
  const item = tfItems[t];
  return baseQ({ diff: d, sub: "s4", type: "tf", text: `True or False: ${item.q}`, answer: item.ok ? "true" : "false", accept: [item.ok ? "t" : "f"], steps: item.why, concept: "Concyclicity and cyclic quadrilaterals (book 5.8)", hint1: "Opposite or adjacent — which pair does the theorem talk about?", hint2: "The same-segment equality is the engine behind the test.", remember: "Equal angles in the same segment ⇔ concyclic." });
};

// ─── 13. arc-angle-word ────────────────────────────────────────────────────
const arcAngleWord: GenFn = (r, d) => {
  const t = r.int(10, 85);
  const which = d <= 2 ? r.int(0, 2) : d === 3 ? r.int(0, 4) : r.int(0, 5);
  if (which === 0) {
    return baseQ({ diff: d, sub: "s4", text: `Two watchtowers $A$ and $B$ stand on the boundary of a circular wildlife reserve with centre $O$. From a rest house $C$ on the major arc, the towers appear at an angle $\\angle ACB = ${t}^\\circ$. The warden wants the REFLEX angle $\\angle AOB$ — the long sweep from $A$ to $B$ around the centre. Find it in degrees.`, answer: String(360 - 2 * t), given: [`$\\angle ACB = ${t}^\\circ$ (C on the major arc)`], find: "Reflex ∠AOB", steps: [`$C$ on the major arc subtends the minor arc $AB$.`, `Minor central angle: $\\angle AOB = 2 \\times ${t}^\\circ = ${2 * t}^\\circ$ (central = 2 × inscribed).`, `Reflex angle $= 360^\\circ - ${2 * t}^\\circ = ${360 - 2 * t}^\\circ$.`], concept: "Central-angle theorem + reflex angles", hint1: "Double the inscribed angle for the minor central angle.", hint2: "The reflex angle completes 360°.", verify: `${2 * t} + ${360 - 2 * t} = 360 ✓`, remember: "Rim → centre (×2), then wrap around 360°." });
  }
  if (which === 1) {
    const a = r.int(5, 175);
    return baseQ({ diff: d, sub: "s4", text: `Four fountains $A$, $B$, $C$, $D$ stand on the rim of a circular lake, forming a cyclic quadrilateral in that order. If $\\angle A = ${a}^\\circ$, what is $\\angle C$ (in degrees)?`, answer: String(180 - a), given: [`$\\angle A = ${a}^\\circ$`, "Fountains concyclic"], find: "∠C", steps: [`The fountains lie on one circle ⇒ $ABCD$ is cyclic.`, `Opposite angles of a cyclic quadrilateral sum to $180^\\circ$.`, `$\\angle C = 180^\\circ - ${a}^\\circ = ${180 - a}^\\circ$.`], concept: "Cyclic quadrilateral opposite angles", hint1: "A and C sit opposite each other.", hint2: "Supplementary pair.", remember: "Concyclic corners ⇒ opposite angles make 180°." });
  }
  if (which === 2) {
    const [a, b, h] = r.pick(TRIPLES);
    const flip = r.sign() === 1;
    const leg1 = flip ? a : b, leg2 = flip ? b : a;
    return baseQ({ diff: d, sub: "s4", text: `A round dartboard has diameter $AB = ${h}$ cm. A dart sticks at point $C$ on the rim, and the distance from $C$ to $B$ is $${leg1}$ cm. How far is the dart from $A$ (in cm)?`, answer: String(leg2), given: [`$AB = ${h}$ cm (diameter)`, `$CB = ${leg1}$ cm`], find: "CA", steps: [`$AB$ is a diameter ⇒ $\\angle ACB = 90^\\circ$ (angle in a semicircle).`, `Right triangle with hypotenuse ${h}: $CA = \\sqrt{${h}^2 - ${leg1}^2}$.`, `$CA = \\sqrt{${h * h - leg1 * leg1}} = ${leg2}$ cm.`], concept: "Semicircle right angle + Pythagoras", hint1: "The diameter makes the triangle right-angled.", hint2: "Hypotenuse is the diameter AB.", verify: `${leg1}² + ${leg2}² = ${h}² ✓`, remember: "Diameter on the rim ⇒ 90° ⇒ Pythagoras with AB as hypotenuse." });
  }
  if (which === 3) {
    const [a, b, R] = r.pick(TRIPLES);
    const flip = r.sign() === 1;
    const half = flip ? a : b, dist = flip ? b : a;
    return baseQ({ diff: d, sub: "s4", text: `A circular window of radius $${R}$ cm is decorated with two identical straight ribs $AB$ and $CD$, each $${2 * half}$ cm long. How far is each rib from the centre of the window (in cm)?`, answer: String(dist), given: [`$r = ${R}$ cm`, `$AB = CD = ${2 * half}$ cm`], find: "Distance of each chord from the centre", steps: [`Equal chords are equidistant from the centre (Theorem 6) — so one computation serves both.`, `Half-rib: $${half}$ cm. Right triangle with hypotenuse ${R}:`, `$d = \\sqrt{${R}^2 - ${half}^2} = \\sqrt{${R * R - half * half}} = ${dist}$ cm.`], concept: "Equal chords equidistant + Pythagoras", hint1: "One distance works for both ribs — why?", hint2: "r² = d² + (half-chord)².", verify: `${dist}² + ${half}² = ${R}² ✓`, remember: "Equal chords share one distance — compute once." });
  }
  if (which === 4) {
    const tt = r.int(5, 175);
    return baseQ({ diff: d, sub: "s4", text: `Two friends sit at points $C$ and $D$ on the same arc of a circular fountain, watching gateposts $A$ and $B$ on the opposite rim. If $C$ sees the posts at an angle $\\angle ACB = ${tt}^\\circ$, at what angle does $D$ see them (in degrees)?`, answer: String(tt), given: [`$\\angle ACB = ${tt}^\\circ$`, "C, D on the same arc"], find: "∠ADB", steps: [`$C$ and $D$ lie in the same segment of chord $AB$.`, `Angles in the same segment are equal.`, `$\\angle ADB = ${tt}^\\circ$.`], concept: "Angles in the same segment are equal", hint1: "Same arc, same viewing angle.", hint2: "It is a direct application — no arithmetic needed.", remember: "On one arc, every viewpoint gives the same angle." });
  }
  return baseQ({ diff: d, sub: "s4", text: `On a circular running track with centre $O$, the minor arc $AB$ subtends $\\angle AOB = ${2 * t}^\\circ$ at the centre. Two coaches stand at points $C$ and $D$ on the major arc. Find $\\angle ACB + \\angle ADB$ (in degrees).`, answer: String(2 * t), given: [`$\\angle AOB = ${2 * t}^\\circ$ (minor)`, "C, D on the major arc"], find: "∠ACB + ∠ADB", steps: [`Each inscribed angle is half the central angle on the same (minor) arc: $\\angle ACB = \\angle ADB = \\frac{${2 * t}^\\circ}{2} = ${t}^\\circ$.`, `Same segment ⇒ both angles equal.`, `Sum $= ${t}^\\circ + ${t}^\\circ = ${2 * t}^\\circ$.`], concept: "Central–inscribed + same-segment, chained", hint1: "Compute ONE inscribed angle; the other is its twin.", hint2: "Halve the central angle, then double the result for the sum.", verify: `(${t} + ${t}) = 2 × ${t} ✓`, remember: "Chain the theorems: halve at the rim, clone in the segment." });
};

// ─── bank ──────────────────────────────────────────────────────────────────
export const bank: Record<string, GenFn> = {
  "vocab-mcq": vocabMcq,
  "vocab-numeric": vocabNumeric,
  "circle-count": circleCount,
  "circum-triangle": circumTriangle,
  "chord-dist": chordDist,
  "radius-chord-pyth": radiusChordPyth,
  "eq-chords": eqChords,
  "chord-farther": chordFarther,
  "central-inscribed": centralInscribed,
  "same-segment": sameSegment,
  "semicircle-angle": semicircleAngle,
  "cyclic-quad": cyclicQuad,
  "arc-angle-word": arcAngleWord,
};

// Honest distinct-question parameter spaces per generator.
export const bankSize: Record<string, number> = {
  // 12 definition MCQs + 10 true/false statements
  "vocab-mcq": 12 + 10,
  // 60 diameters + 59×2 (OP / longest chord) + 341 arc angles + 12 sector splits
  "vocab-numeric": 60 + 59 * 2 + 341 + 12,
  // 4 scenario MCQs + 30 least-radius + 192 two-circle counts + 1 locus fill + 11 diameter cases
  "circle-count": 4 + 30 + 192 + 1 + 11,
  // 8 small triples + 31 triples (diameter ask) + 3136 angle triples + 4 construction MCQs
  "circum-triangle": 8 + 31 + 3136 + 4,
  // triples × chord/distance orientation × (find chord / find distance / story)
  "chord-dist": 8 * 2 + 31 * 2 + 31 * 2 + 31 * 2,
  // triples × orientation × (radius / midpoint / perpendicular / diameter asks)
  "radius-chord-pyth": 8 * 2 + 31 * 2 + 31 * 2 + 31 * 2,
  // 6 TF + 31×2 equal-chord distances + 10 configs × 2 orders × 2 sides
  "eq-chords": 6 + 31 * 2 + 20 * 2,
  // Σ_{r=8}^{45} C(2r-3, 2) distinct chord pairs + 4 concept MCQs
  "chord-farther": 55689 + 4,
  // 89 central→inscribed + 89 inscribed→central + 76 reflex + 51 isosceles
  "central-inscribed": 89 + 89 + 76 + 51,
  // 171 clone + 85 sum + 1296 triangle-at-centre + 171×61 two-angle
  "same-segment": 171 + 85 + 1296 + 171 * 61,
  // 2 core + 31×2 triple legs + 71 complementary acute angles
  "semicircle-angle": 2 + 31 * 2 + 71,
  // 171 single + 171×171 three-angle + 6 ratios + 4 concyclic TF
  "cyclic-quad": 171 + 171 * 171 + 6 + 4,
  // 6 story templates
  "arc-angle-word": 76 + 171 + 31 + 31 + 171 + 76,
};
