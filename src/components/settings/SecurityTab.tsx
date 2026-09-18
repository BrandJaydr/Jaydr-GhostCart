'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react';

function PasswordStrengthBar({ password }: { password: string }) {
  const score = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const label = score <= 1 ? 'Weak' : score <= 3 ? 'Fair' : 'Strong';
  const color =
    score <= 1 ? 'bg-red-500' : score <= 3 ? 'bg-amber-400' : 'bg-emerald-500';
  const textColor =
    score <= 1 ? 'text-red-500' : score <= 3 ? 'text-amber-500' : 'text-emerald-600';
  const width = `${Math.min(100, (score / 5) * 100)}%`;

  if (!password) return null;

  return (
    <div className="space-y-1 mt-1.5">
      <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width }}
        />
      </div>
      <p className={`text-xs font-medium ${textColor}`}>{label}</p>
    </div>
  );
}

export function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setError('Current password is incorrect.');
        } else {
          setError(data.error ?? 'Failed to change password.');
        }
      } else {
        setSaved(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setSaved(false), 4000);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Security</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Change your password to keep your account secure.
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Password changed successfully. Use your new password next time you sign in.</span>
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-surface border-2 border-border rounded-2xl p-6 shadow-sm space-y-5"
      >
        <h3 className="font-semibold text-foreground">Change Password</h3>

        {/* Current Password */}
        <div className="space-y-1.5">
          <label htmlFor="settings-current-pw" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Current Password
          </label>
          <div className="relative">
            <input
              id="settings-current-pw"
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              autoComplete="current-password"
              required
              className="w-full bg-background border-2 border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              aria-label={showCurrent ? 'Hide password' : 'Show password'}
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <label htmlFor="settings-new-pw" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            New Password
          </label>
          <div className="relative">
            <input
              id="settings-new-pw"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full bg-background border-2 border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              aria-label={showNew ? 'Hide password' : 'Show password'}
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <PasswordStrengthBar password={newPassword} />
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label htmlFor="settings-confirm-pw" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Confirm New Password
          </label>
          <input
            id="settings-confirm-pw"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your new password"
            autoComplete="new-password"
            required
            className={`w-full bg-background border-2 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition ${
              confirmPassword && confirmPassword !== newPassword
                ? 'border-red-400'
                : 'border-border'
            }`}
          />
          {confirmPassword && confirmPassword !== newPassword && (
            <p className="text-xs text-red-500">Passwords do not match.</p>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <button
            type="submit"
            disabled={saving || !currentPassword || !newPassword || newPassword !== confirmPassword}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
