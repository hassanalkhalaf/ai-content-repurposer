import { Fragment, ReactNode } from "react";

/**
 * Deliberately minimal markdown renderer covering exactly what our blog
 * prompt is instructed to produce: H2/H3 headings, paragraphs, and
 * bullet/numbered lists. Not a general-purpose markdown parser.
 */
export function renderMarkdownLite(markdown: string): ReactNode[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  let listBuffer: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let key = 0;

  function flushList() {
    if (listBuffer.length === 0 || !listType) return;
    const items = listBuffer.map((item, i) => (
      <li key={i} className="leading-relaxed">
        {inline(item)}
      </li>
    ));
    nodes.push(
      listType === "ul" ? (
        <ul key={key++} className="my-3 list-disc space-y-1 pl-5 text-ink-soft">
          {items}
        </ul>
      ) : (
        <ol key={key++} className="my-3 list-decimal space-y-1 pl-5 text-ink-soft">
          {items}
        </ol>
      )
    );
    listBuffer = [];
    listType = null;
  }

  function inline(text: string): ReactNode {
    // bold **text**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-ink">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <Fragment key={i}>{part}</Fragment>;
    });
  }

  for (const raw of lines) {
    const line = raw.trim();

    if (line.startsWith("### ")) {
      flushList();
      nodes.push(
        <h3 key={key++} className="mt-5 mb-1.5 font-display text-base font-semibold text-ink">
          {inline(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      nodes.push(
        <h2
          key={key++}
          className="mt-7 mb-2 font-display text-lg font-semibold tracking-tight text-ink first:mt-0"
        >
          {inline(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      if (listType !== "ul") flushList();
      listType = "ul";
      listBuffer.push(line.replace(/^[-*]\s+/, ""));
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      if (listType !== "ol") flushList();
      listType = "ol";
      listBuffer.push(line.replace(/^\d+\.\s+/, ""));
      continue;
    }
    if (line.length === 0) {
      flushList();
      continue;
    }

    flushList();
    nodes.push(
      <p key={key++} className="my-2.5 leading-relaxed text-ink-soft">
        {inline(line)}
      </p>
    );
  }

  flushList();
  return nodes;
}
