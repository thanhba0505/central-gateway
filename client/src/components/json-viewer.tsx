'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface JsonViewerProps {
  data: unknown;
  maxHeight?: string;
}

export function JsonViewer({ data, maxHeight = 'max-h-96' }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);

  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 flex items-center gap-1 rounded border border-slate-800 bg-slate-900/90 px-2 py-1 text-[11px] text-slate-400 hover:border-slate-700 hover:text-white transition-colors"
      >
        {copied ? (
          <>
            <Check className="h-3 w-3 text-emerald-400" />
            <span className="text-emerald-400">Copied</span>
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" />
            <span>Copy</span>
          </>
        )}
      </button>
      <pre className={`overflow-x-auto text-slate-300 font-mono ${maxHeight}`}>{jsonString}</pre>
    </div>
  );
}
