'use client';

export function LogoIcon({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 35.5C20 35.5 4 26 4 14.5C4 10.5 7.5 7 11.5 7C14.5 7 17.2 8.8 19 11.5C19.4 10.8 20 9.5 20 9.5C20 9.5 20.6 10.8 21 11.5C22.8 8.8 25.5 7 28.5 7C32.5 7 36 10.5 36 14.5C36 26 20 35.5 20 35.5Z"
        fill="url(#heartGrad)"
        opacity="0.9"
      />
      <path
        d="M4 20H12L14.5 14L17 26L20 12L23 26L25.5 14L28 20H36"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <defs>
        <linearGradient id="heartGrad" x1="4" y1="7" x2="36" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--primary-dark)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LogoMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-7 w-7', md: 'h-9 w-9', lg: 'h-12 w-12' };
  const paddings = { sm: 'p-1', md: 'p-1.5', lg: 'p-2' };

  return (
    <div className={`${paddings[size]} rounded-xl bg-gradient-to-br from-primary to-primary-dark shadow-md`}
      style={{ boxShadow: 'var(--shadow-glow)' }}>
      <LogoIcon className={sizes[size]} />
    </div>
  );
}

export function LogoFull({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const textSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' };

  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <div>
        <span className={`${textSizes[size]} font-bold tracking-tight text-foreground`}>
          Health Tracker
        </span>
      </div>
    </div>
  );
}
