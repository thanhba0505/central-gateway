import { Activity, Bell, CheckCircle2, Database, ShieldCheck, Terminal } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 font-mono text-lg font-bold text-white shadow-lg shadow-cyan-500/20">
              G
            </div>
            <div>
              <span className="font-semibold tracking-tight text-white">Central Gateway</span>
              <span className="ml-2 rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-xs text-cyan-400">
                v0.1.0
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Gateway Operational
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Ecosystem Platform Hub
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Real-time notification routing, multi-project channel mapping, and shared infrastructure
            control.
          </p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">Active Services</span>
              <Activity className="h-4 w-4 text-cyan-400" />
            </div>
            <p className="mt-3 font-mono text-2xl font-bold text-white">2 Services</p>
            <p className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Server & Client Healthy
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">
                Connected Projects
              </span>
              <Terminal className="h-4 w-4 text-blue-400" />
            </div>
            <p className="mt-3 font-mono text-2xl font-bold text-white">1 Project</p>
            <p className="mt-1 text-xs text-slate-400 font-mono">wonderlab</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">Mapped Channels</span>
              <Bell className="h-4 w-4 text-purple-400" />
            </div>
            <p className="mt-3 font-mono text-2xl font-bold text-white">5 Channels</p>
            <p className="mt-1 text-xs text-slate-400">Deploy, CI, Git, Feedback, Moderation</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">Database Engine</span>
              <Database className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="mt-3 font-mono text-2xl font-bold text-white">Neon PostgreSQL</p>
            <p className="mt-1 text-xs text-emerald-400">AWS Oregon Serverless Pooler</p>
          </div>
        </div>

        {/* Connected Projects Table */}
        <div className="mt-10 rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
          <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
            <h2 className="font-semibold text-white text-base">Connected Ecosystem Projects</h2>
            <span className="text-xs text-slate-400 font-mono">1 Registered</span>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-800/80 bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-sm">
                  W
                </div>
                <div>
                  <h3 className="font-medium text-white text-sm">Wonderlab Platform</h3>
                  <p className="text-xs text-slate-400">Interactive science & logic simulations</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500 font-mono">
        ThanhBa Ecosystem — Central Gateway Control Plane
      </footer>
    </div>
  );
}
