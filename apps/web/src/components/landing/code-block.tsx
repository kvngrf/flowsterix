"use client";

import { highlight } from "sugar-high";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CodeBlock({
  code,
  language = "tsx",
  showLineNumbers = false,
  className = "",
}: {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const html = highlight(code);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");

  return (
    <div className={`relative group ${className}`}>
      <button
        onClick={copyToClipboard}
        className="absolute top-3 right-3 p-2 rounded-md bg-zinc-800 hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Copy code"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-zinc-400" />
        )}
      </button>
      <pre className="overflow-x-auto p-4 rounded-lg bg-[var(--bg-code)] text-sm leading-relaxed">
        {showLineNumbers ? (
          <code className="flex">
            <span className="select-none pr-4 text-zinc-600 text-right min-w-[2rem]">
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </span>
            <span
              dangerouslySetInnerHTML={{ __html: html }}
              data-highlighted-code
              data-language={language}
            />
          </code>
        ) : (
          <code
            dangerouslySetInnerHTML={{ __html: html }}
            data-highlighted-code
            data-language={language}
          />
        )}
      </pre>
    </div>
  );
}
