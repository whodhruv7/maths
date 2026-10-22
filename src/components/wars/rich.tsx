"use client";
import katex from "katex";
import { useMemo } from "react";

export function Tex({ tex, block = false, className = "" }: { tex: string; block?: boolean; className?: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { throwOnError: false, displayMode: block, output: "html" });
    } catch {
      return tex;
    }
  }, [tex, block]);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Renders prose containing $...$ LaTeX segments and simple <b>/<br/> HTML. */
export function Rich({ text, className = "" }: { text: string; className?: string }) {
  const parts = useMemo(() => {
    const out: { t: "tex" | "html"; v: string; block?: boolean }[] = [];
    const re = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push({ t: "html", v: text.slice(last, m.index) });
      if (m[1] !== undefined) out.push({ t: "tex", v: m[1], block: true });
      else out.push({ t: "tex", v: m[2] });
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push({ t: "html", v: text.slice(last) });
    return out;
  }, [text]);
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.t === "tex" ? (
          <Tex key={i} tex={p.v} block={p.block} />
        ) : (
          <span key={i} dangerouslySetInnerHTML={{ __html: p.v }} />
        )
      )}
    </span>
  );
}
