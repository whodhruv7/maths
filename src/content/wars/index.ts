import type { ChapterContent } from "@/lib/wars/types";
import { chapter as ch01 } from "./ch01";
import { chapter as ch02 } from "./ch02";
import { chapter as ch03 } from "./ch03";
import { chapter as ch04 } from "./ch04";
import { chapter as ch05 } from "./ch05";
import { chapter as ch06 } from "./ch06";
import { chapter as ch07 } from "./ch07";
import { chapter as ch08 } from "./ch08";

// Maths Wars curriculum registry — Ganita Manjari Class 9 (8 chapters).
export const CHAPTERS: ChapterContent[] = [ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08].sort((a, b) => a.num - b.num);
