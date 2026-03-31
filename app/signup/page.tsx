'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import {
  validateName,
  validateEmail,
  validatePassword,
  sanitizeName,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from '@/lib/validation';

const RATE_LIMIT_KEY = 'signup';
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const { signup } = useAuth();
  const router = useRouter();
  const { executeRecaptcha } = useGoogleReCaptcha();

  // Countdown timer for rate limit lockout
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side rate limit check
    const rl = checkRateLimit(RATE_LIMIT_KEY);
    if (rl.blocked) {
      setCooldown(rl.remainingSeconds);
      setError(`Too many attempts. Please wait ${rl.remainingSeconds} seconds.`);
      return;
    }

    // Validate all inputs
    const cleanName = sanitizeName(name);
    const nameError = validateName(cleanName);
    if (nameError) { setError(nameError); return; }

    const emailError = validateEmail(email);
    if (emailError) { setError(emailError); return; }

    const passwordError = validatePassword(password);
    if (passwordError) { setError(passwordError); return; }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // reCAPTCHA verification
    if (RECAPTCHA_SITE_KEY && executeRecaptcha) {
      try {
        const token = await executeRecaptcha('signup');
        if (!token) {
          setError('CAPTCHA verification failed. Please try again.');
          return;
        }
        // Token is generated — server-side validation can be added later
        // via an API route that calls Google's siteverify endpoint.
        // For now the invisible challenge provides bot deterrence.
      } catch {
        setError('CAPTCHA verification failed. Please try again.');
        return;
      }
    }

    setLoading(true);

    try {
      await signup(email, password, cleanName);
      resetRateLimit(RATE_LIMIT_KEY);
      router.push('/account');
    } catch (err: unknown) {
      recordFailedAttempt(RATE_LIMIT_KEY);
      const rlAfter = checkRateLimit(RATE_LIMIT_KEY);
      if (rlAfter.blocked) {
        setCooldown(rlAfter.remainingSeconds);
      }
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [name, email, password, confirmPassword, signup, router, executeRecaptcha]);

  const isDisabled = loading || cooldown > 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/logo.png"
              alt="Smashing Wallets"
              width={80}
              height={80}
              className="mx-auto mb-4"
            />
          </Link>
          <h1 className="text-2xl font-bold text-navy">Create your account</h1>
          <p className="text-gray-500 mt-2">Start discovering affordable events</p>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-100/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-navy mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                autoComplete="name"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-navy mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-400 mt-1">Must be at least 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-navy mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isDisabled}
              className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </span>
              ) : cooldown > 0 ? (
                `Try again in ${cooldown}s`
              ) : (
                'Create Account'
              )}
            </button>

            <p className="text-xs text-gray-400 text-center">
              By creating an account, you agree to our{' '}
              <Link href="/terms-of-service" className="text-primary hover:text-primary-dark">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy-policy" className="text-primary hover:text-primary-dark">
                Privacy Policy
              </Link>
            </p>
          </form>
        </div>

        {/* Login link */}
        <p className="text-center mt-8 text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-primary-dark font-medium transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  // Wrap in reCAPTCHA provider only if site key is configured
  if (RECAPTCHA_SITE_KEY) {
    return (
      <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
        <SignupForm />
      </GoogleReCaptchaProvider>
    );
  }

  return <SignupForm />;
}
