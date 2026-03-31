'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'cookie_consent_accepted';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(STORAGE_KEY);
      if (!accepted) {
        setVisible(true);
      }
    } catch {
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[90] p-4">
      <div className="mx-auto max-w-xl rounded-xl border border-card-border bg-card-bg shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] leading-relaxed text-muted">
            We use local storage to keep you signed in. No tracking cookies.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/legal/privacy"
              className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-primary hover:text-primary-dark transition-colors"
            >
              Learn More
            </Link>
            <button
              onClick={handleAccept}
              className="rounded-lg bg-primary px-4 py-1.5 text-[13px] font-medium text-white hover:bg-primary-dark transition-colors"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
