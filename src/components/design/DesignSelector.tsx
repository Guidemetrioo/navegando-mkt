'use client';
import { useEffect } from 'react';

/** The selected company template is shared across all pages. */
export function DesignAppearance() {
  useEffect(() => { document.documentElement.dataset.design = 'control'; }, []);
  return null;
}

export function DesignSelector() { return null; }
