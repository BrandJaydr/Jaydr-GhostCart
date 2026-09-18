'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Terminal, Shield, CheckCircle2, Bug } from 'lucide-react';

export function DeveloperTab() {
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  const [logLevel, setLogLevel] = useState('debug');
  const [verboseTracing, setVerboseTracing] = useState(true);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    setDevModeEnabled(localStorage.getItem('gc_dev_mode') === 'true');
    setLogLevel(localStorage.getItem('gc_log_level') || 'debug');
    setVerboseTracing(localStorage.getItem('gc_verbose_tracing') !== 'false');
  }, []);

  const triggerSaved = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  };

  const handleToggleDevMode = () => {
    const next = !devModeEnabled;
    setDevModeEnabled(next);
    localStorage.setItem('gc_dev_mode', String(next));
    window.dispatchEvent(new Event('gc_dev_mode_changed'));
    triggerSaved();
  };

  const handleLogLevelChange = (level: string) => {
    setLogLevel(level);
    localStorage.setItem('gc_log_level', level);
    triggerSaved();
  };

  const handleVerboseToggle = () => {
    const next = !verboseTracing;
    setVerboseTracing(next);
    localStorage.setItem('gc_verbose_tracing', String(next));
    triggerSaved();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Developer Tools</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Unlock real-time scraper traces, BullMQ queue telemetry, and low-level debugging consoles.
        </p>
      </div>

      {savedMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Developer preferences updated.</span>
        </div>
      )}

      {/* Dev Mode Toggle Card */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-5" style={{ borderWidth: '2px' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${devModeEnabled ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/10 text-muted-foreground'}`}>
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                Developer Mode
                {devModeEnabled && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    Active
                  </span>
                )}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Stream diagnostic events to the Developer Logs console.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleDevMode}
            className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
              devModeEnabled
                ? 'bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20'
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            {devModeEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>

        {devModeEnabled ? (
          <div className="pt-4 border-t border-border space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Telemetry Verbosity
                </label>
                <select
                  value={logLevel}
                  onChange={(e) => handleLogLevelChange(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"
                >
                  <option value="debug">DEBUG — All events</option>
                  <option value="info">INFO — Standard operations</option>
                  <option value="warn">WARN — Degradations only</option>
                  <option value="error">ERROR — Failures only</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Verbose Scraper Diagnostics
                </label>
                <button
                  type="button"
                  onClick={handleVerboseToggle}
                  className="flex items-center justify-between w-full p-2.5 bg-background border border-border rounded-xl cursor-pointer hover:border-primary transition-colors text-sm text-foreground"
                >
                  <span>Record regex &amp; selector parsing traces</span>
                  <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${verboseTracing ? 'bg-primary border-primary' : 'border-border'}`}>
                    {verboseTracing && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-xl">
              <div className="flex items-center gap-3">
                <Bug className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">Telemetry is streaming to the Developer Logs console.</span>
              </div>
              <Link
                href="/settings/logs"
                className="flex-shrink-0 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5" />
                Open Logs
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-muted/30 rounded-xl border border-border flex items-center gap-3 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span>Enable Developer Mode to expose live diagnostic consoles, scraper response streams, and correlation traces.</span>
          </div>
        )}
      </div>
    </div>
  );
}
