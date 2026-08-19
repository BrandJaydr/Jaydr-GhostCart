'use client';

import { ToastProvider as HeroToastProvider, addToast } from '@heroui/react';
import type { ReactNode } from 'react';

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <HeroToastProvider placement="bottom-right" />
      {children}
    </>
  );
}

export function useToast() {
  return {
    success: (title: string, description?: string) => {
      addToast({
        title,
        description,
        color: 'success',
        severity: 'success',
      });
    },
    error: (title: string, description?: string) => {
      addToast({
        title,
        description,
        color: 'danger',
        severity: 'danger',
      });
    },
    warning: (title: string, description?: string) => {
      addToast({
        title,
        description,
        color: 'warning',
        severity: 'warning',
      });
    },
    info: (title: string, description?: string) => {
      addToast({
        title,
        description,
        color: 'primary',
        severity: 'default',
      });
    },
  };
}
