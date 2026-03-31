'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { authApi } from '@/lib/api/auth';
import { ActivityHeart, BarChart01, Shield01, Lock01 } from '@untitled-ui/icons-react';

function FloatingInput({
  label,
  type = 'text',
  value,
  onChange,
  id,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  id: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const filled = value.length > 0;

  return (
    <div className="group relative">
      <input
        ref={inputRef}
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        placeholder=" "
        className="peer w-full rounded-xl border border-card-border bg-background px-4 pt-5 pb-2 text-[15px]
                   text-foreground outline-none transition-all duration-200
                   placeholder:text-transparent
                   focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-4 transition-all duration-200
                    ${filled
                      ? 'top-1.5 text-[11px] font-medium text-primary'
                      : 'top-1/2 -translate-y-1/2 text-[15px] text-muted'
                    }
                    peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[11px]
                    peer-focus:font-medium peer-focus:text-primary`}
      >
        {label}
      </label>
    </div>
  );
}

function Logo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-label="Health Tracker logo"
    >
      <path
        d="M24 42s-18-10.2-18-22.2C6 12.6 11.4 8 17.4 8c3.6 0 5.4 1.8 6.6 3.6C25.2 9.8 27 8 30.6 8 36.6 8 42 12.6 42 19.8 42 31.8 24 42 24 42z"
        fill="url(#heartGrad)"
        opacity="0.9"
      />
      <path
        d="M4 24h8l2-6 3 12 3-10 2 4h4l2-5 3 10 2-5h11"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.95"
      />
      <defs>
        <linearGradient id="heartGrad" x1="6" y1="8" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c3aed" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  delay: string;
}) {
  return (
    <div
      className="flex items-start gap-4 opacity-0 animate-[fadeSlideUp_0.5s_ease_forwards]"
      style={{ animationDelay: delay }}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
        <Icon className="h-5 w-5 text-white/90" />
      </div>
      <div>
        <p className="text-[15px] font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-white/60">{desc}</p>
      </div>
    </div>
  );
}

const ROTATING_WORDS = ['quantified.', 'optimized.', 'simplified.', 'empowered.', 'visualized.'];

function RotatingWord() {
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % ROTATING_WORDS.length);
        setShow(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`inline-block transition-all duration-400 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
      style={{
        background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        filter: 'drop-shadow(0 0 20px rgba(124, 58, 237, 0.5))',
      }}
    >
      {ROTATING_WORDS[index]}
    </span>
  );
}

function BackendStatus({ status }: { status: 'checking' | 'offline' | 'online' }) {
  if (status === 'online') return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-[13px] text-yellow-200">
      <svg className="h-4 w-4 shrink-0 animate-spin text-yellow-400" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
        <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span>
        {status === 'checking'
          ? 'Connecting to server...'
          : 'Server is waking up — this takes about 2 minutes on the free tier. Please wait...'}
      </span>
    </div>
  );
}

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'offline' | 'online'>('checking');
  const { setAuth, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('auth_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9147';

    async function checkBackend() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        // Any response (even 401) means the backend is up
        if (!cancelled) setBackendStatus('online');
      } catch {
        if (!cancelled) {
          setBackendStatus('offline');
          // Retry every 10 seconds
          setTimeout(checkBackend, 10000);
        }
      }
    }

    checkBackend();
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = isRegister
        ? await authApi.register(username, password)
        : await authApi.login(username, password);
      setAuth(response);
      router.push(isRegister ? '/onboarding' : '/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
  };

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes meshShift {
          0%, 100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
      `}</style>

      <div
        className={`flex min-h-screen transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
      >
        <div
          className="relative hidden w-[52%] flex-col justify-between overflow-hidden p-12 lg:flex"
        >
          <img
            src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80&auto=format"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 80% 60% at 20% 80%, rgba(124,58,237,0.65), transparent),
                radial-gradient(ellipse 70% 50% at 80% 20%, rgba(167,139,250,0.45), transparent),
                linear-gradient(135deg, rgba(24,0,46,0.92) 0%, rgba(15,7,32,0.88) 40%, rgba(10,10,15,0.85) 100%)
              `,
            }}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <Logo className="h-10 w-10 drop-shadow-lg" />
              <span className="text-[22px] font-bold tracking-tight text-white">
                Health Tracker
              </span>
            </div>
          </div>

          <div className="relative z-10 -mt-8 space-y-10">
            <div>
              <h2
                className="text-[40px] font-bold leading-[1.1] tracking-tight text-white opacity-0
                           animate-[fadeSlideUp_0.6s_ease_forwards]"
                style={{ animationDelay: '0.15s' }}
              >
                Your health,
                <br />
                <RotatingWord />
              </h2>
              <p
                className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/50 opacity-0
                           animate-[fadeSlideUp_0.5s_ease_forwards]"
                style={{ animationDelay: '0.35s' }}
              >
                Track workouts, nutrition, and wellness in one place.
                Actionable insights powered by your data.
              </p>
            </div>

            <div className="space-y-5">
              <Feature
                icon={ActivityHeart}
                title="Track everything in one place"
                desc="Workouts, nutrition, sleep, vitals, therapeutics, habits, body metrics, and journal — all in one dashboard."
                delay="0.5s"
              />
              <Feature
                icon={BarChart01}
                title="AI-powered nutrition analysis"
                desc="Snap a photo of your meal or describe it — OpenAI Vision breaks down every calorie and macro instantly."
                delay="0.65s"
              />
              <Feature
                icon={Shield01}
                title="Private and secure by design"
                desc="Your data is encrypted at rest. Connect Google Drive to store photos, medical records, and journal PDFs on your personal Drive."
                delay="0.8s"
              />
            </div>
          </div>

          <p className="relative z-10 text-[12px] text-white/25">
            &copy; {new Date().getFullYear()} Health Tracker | <a href="https://mdcran.com" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition-colors">by MDCran</a>
          </p>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12 lg:px-16">
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <Logo className="h-9 w-9" />
            <span className="text-xl font-bold tracking-tight text-foreground">
              Health Tracker
            </span>
          </div>

          <div className="w-full max-w-[380px]">
            <div
              className="mb-8 opacity-0 animate-[fadeSlideUp_0.5s_ease_forwards]"
              style={{ animationDelay: '0.1s' }}
            >
              <h1 className="text-[26px] font-bold tracking-tight text-foreground">
                {isRegister ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="mt-1.5 text-[15px] text-muted">
                {isRegister
                  ? 'Start your health journey today.'
                  : 'Sign in to continue to your dashboard.'}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 opacity-0 animate-[fadeSlideUp_0.5s_ease_forwards]"
              style={{ animationDelay: '0.2s' }}
            >
              <BackendStatus status={backendStatus} />

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-danger/10 px-4 py-3 text-[13px] font-medium text-danger">
                  <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 fill-current">
                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zM8 11.5A.75.75 0 118 10a.75.75 0 010 1.5z" />
                  </svg>
                  {error}
                </div>
              )}

              <FloatingInput
                id="username"
                label="Username"
                value={username}
                onChange={setUsername}
              />

              <FloatingInput
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
              />

              <button
                type="submit"
                disabled={loading || backendStatus !== 'online'}
                className="relative w-full overflow-hidden rounded-xl bg-primary px-4 py-3 text-[15px]
                           font-semibold text-white shadow-lg shadow-primary/20
                           transition-all duration-200
                           hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30
                           active:scale-[0.98]
                           disabled:pointer-events-none disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                      <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    {isRegister ? 'Creating account...' : 'Signing in...'}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Lock01 className="h-4 w-4" />
                    {isRegister ? 'Create Account' : 'Sign In'}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-4 py-1">
                <div className="h-px flex-1 bg-card-border" />
                <span className="text-[12px] font-medium uppercase tracking-wider text-muted-light">or</span>
                <div className="h-px flex-1 bg-card-border" />
              </div>

              <p className="text-center text-[14px] text-muted">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-semibold text-primary transition-colors hover:text-primary-dark"
                >
                  {isRegister ? 'Sign in' : 'Create one'}
                </button>
              </p>

              <p className="text-center text-[11px] text-muted-light leading-relaxed">
                By signing up, you agree to our{' '}
                <a href="/legal/terms" className="text-primary hover:text-primary-dark transition-colors underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/legal/privacy" className="text-primary hover:text-primary-dark transition-colors underline">
                  Privacy Policy
                </a>.
              </p>
            </form>

            <div
              className="mt-8 flex justify-center opacity-0 animate-[fadeSlideUp_0.5s_ease_forwards]"
              style={{ animationDelay: '0.4s' }}
            >
              <div
                className="flex items-center gap-2 rounded-full border border-card-border
                           bg-card-bg px-4 py-2 shadow-sm"
              >
                <div className="relative flex h-5 w-5 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/30" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                </div>
                <span className="text-[12px] font-medium tracking-wide text-muted">
                  Powered by AI
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
