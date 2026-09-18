'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User, Camera, CheckCircle2, Loader2 } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  tenantId: string;
  createdAt: string;
  lastLogin: string | null;
}

export function AccountTab() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.success) {
          setProfile(data.data);
          setName(data.data.name ?? '');
        }
      } catch {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to save changes.');
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Avatar: use initials from name or email
  const initials = (() => {
    const src = name || profile?.email || session?.user?.email || '';
    const parts = src.split(/[@.\s]/);
    return parts
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  })();

  const roleLabel = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : 'Owner';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Account</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Update your display name and view your account information.
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Profile updated successfully.</span>
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-surface border-2 border-border rounded-2xl p-6 shadow-sm space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
              <span className="text-xl font-bold text-primary">{initials || <User className="w-7 h-7" />}</span>
            </div>
            <button
              type="button"
              disabled
              title="Avatar upload coming soon"
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-surface cursor-not-allowed opacity-60"
            >
              <Camera className="w-3 h-3 text-white" />
            </button>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{name || 'No name set'}</p>
            <p className="text-xs text-muted-foreground">{profile?.email ?? session?.user?.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Avatar upload — coming soon</p>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Full Name */}
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="settings-name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Display Name
            </label>
            <input
              id="settings-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              maxLength={100}
              className="w-full bg-background border-2 border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition"
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Email Address
              </label>
              <span className="text-xs text-muted-foreground italic">Read-only</span>
            </div>
            <input
              type="email"
              value={profile?.email ?? session?.user?.email ?? ''}
              readOnly
              className="w-full bg-muted/20 border-2 border-border rounded-xl px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">To change your email, contact your admin.</p>
          </div>

          {/* Role (read-only) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Role
            </label>
            <div className="flex items-center gap-2 bg-muted/20 border-2 border-border rounded-xl px-4 py-2.5">
              <span className="text-sm text-foreground font-medium">{roleLabel}</span>
              <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Member since */}
        {profile?.createdAt && (
          <p className="text-xs text-muted-foreground">
            Member since{' '}
            {new Date(profile.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}

        {/* Save */}
        <div className="flex justify-end pt-2 border-t border-border">
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
