import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  hashPassword,
  createPasswordResetToken,
  verifyPasswordResetToken,
} from '@/lib/auth/password';
import { SignupSchema, ForgotPasswordSchema, ResetPasswordSchema } from '@/lib/validation/schemas';

describe('hashPassword', () => {
  it('returns the sha256:<salt>:<digest> format with a unique salt per call', () => {
    const a = hashPassword('S3cure!Pass');
    const b = hashPassword('S3cure!Pass');
    expect(a).toMatch(/^sha256:[a-f0-9]{32}:[a-f0-9]{64}$/);
    expect(a).not.toBe(b);

    const [, salt, digest] = a.split(':');
    const expected = crypto
      .createHash('sha256')
      .update(salt + 'S3cure!Pass')
      .digest('hex');
    expect(digest).toBe(expected);
  });
});

describe('password reset token', () => {
  it('round-trips a valid token back to the user id', () => {
    const { token } = createPasswordResetToken('user-123');
    expect(verifyPasswordResetToken(token)).toBe('user-123');
  });

  it('rejects a tampered token', () => {
    const { token } = createPasswordResetToken('user-123');
    const tampered = token.slice(0, -2) + (token.endsWith('aa') ? 'bb' : 'aa');
    expect(verifyPasswordResetToken(tampered)).toBeNull();
  });

  it('rejects garbage input', () => {
    expect(verifyPasswordResetToken('not-a-token')).toBeNull();
  });
});

describe('auth schemas', () => {
  it('accepts a valid signup payload', () => {
    const parsed = SignupSchema.parse({ email: 'a@b.co', password: '12345678', name: 'A' });
    expect(parsed.email).toBe('a@b.co');
  });

  it('rejects short passwords on signup', () => {
    expect(SignupSchema.safeParse({ email: 'a@b.co', password: 'short' }).success).toBe(false);
  });

  it('rejects invalid emails on forgot-password', () => {
    expect(ForgotPasswordSchema.safeParse({ email: 'nope' }).success).toBe(false);
  });

  it('requires a token on reset-password', () => {
    expect(ResetPasswordSchema.safeParse({ password: '12345678' }).success).toBe(false);
  });
});