'use client';

import { useState, useEffect } from 'react';
import { Key, ShieldCheck, X } from 'lucide-react';
import { getGatewaySecretKey, setGatewaySecretKey } from '../lib/api';

interface KeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyModal({ isOpen, onClose }: KeyModalProps) {
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKey(getGatewaySecretKey());
      setSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setGatewaySecretKey(key);
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d021b]/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl border border-white/20 bg-[#1a0833]/90 p-6 shadow-[0_16px_50px_rgba(107,36,155,0.4)] backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-white/15 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 text-purple-300">
              <Key className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-white">Gateway Secret Key</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-violet-300/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="py-4 text-sm text-violet-200/80">
          <p>
            Configure your client-side Gateway Secret Key for direct authenticated requests to
            protected endpoints (e.g. Sandbox simulator dispatches).
          </p>
          <div className="mt-4">
            <label className="mb-1.5 ml-1 block text-xs font-mono uppercase tracking-wider text-violet-300">
              Bearer Token
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="gw_sec_live_..."
              className="w-full rounded-full border border-white/25 bg-white/[0.12] px-4 py-2.5 font-mono text-sm text-white placeholder:text-white/40 focus:border-white/50 focus:bg-white/[0.2] focus:outline-none focus:ring-4 focus:ring-violet-400/25"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3 border-t border-white/15 pt-4">
          <button
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm text-violet-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-sm font-bold text-[#230b42] shadow-[0_0_18px_rgba(255,255,255,0.4)] transition-all hover:bg-white/95 active:scale-95"
          >
            {saved ? (
              <>
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Saved!
              </>
            ) : (
              'Save Key'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
