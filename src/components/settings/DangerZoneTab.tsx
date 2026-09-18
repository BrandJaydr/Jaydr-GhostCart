'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { LogOut, AlertTriangle } from 'lucide-react';

export function DangerZoneTab() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ callbackUrl: '/sign-in' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-red-600">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          These actions are permanent or affect all of your active sessions.
        </p>
      </div>

      {/* Sign out all sessions */}
      <div className="bg-surface border-2 border-red-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 flex-shrink-0">
            <LogOut className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Sign Out</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              End your current session and return to the sign-in page.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex-shrink-0 px-4 py-2 bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </div>

      {/* Future: Account deletion placeholder */}
      <div className="bg-surface border-2 border-border rounded-2xl p-6 shadow-sm opacity-60">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-muted/40 flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Delete Account</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <button
            type="button"
            disabled
            className="flex-shrink-0 px-4 py-2 bg-muted/30 text-muted-foreground text-sm font-semibold rounded-xl cursor-not-allowed"
          >
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
}
