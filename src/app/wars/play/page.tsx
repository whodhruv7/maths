import GameShell from "@/components/wars/GameShell";

export const dynamic = "force-static";

export default async function PlayPage({ searchParams }: { searchParams: Promise<{ ch?: string; view?: string }> }) {
  const sp = await searchParams;
  const ch = sp.ch ? parseInt(sp.ch, 10) : undefined;
  return <GameShell initialCh={Number.isFinite(ch) ? ch : undefined} initialView={sp.view} />;
}
