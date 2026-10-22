import type { Metadata } from "next";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: "Maths Wars — Not Just a Game… It's Your Maths Battlefield!",
  description: "A deeply interactive 3D mathematics learning & practice arena for Class 9. Learn concepts, explore 3D worlds, solve on paper, master every topic. Built on Ganita Manjari (NCERT Class 9) by VidyaSaathy.",
};

export default function WarsLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#070a18] text-zinc-100 antialiased">{children}</div>;
}
