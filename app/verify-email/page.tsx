'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { account } from '@/lib/appwrite';

type Status = 'verifying' | 'success' | 'error';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') ?? '';
  const secret = searchParams.get('secret') ?? '';
  const [status, setStatus] = useState<Status>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  const verify = useCallback(async () => {
    if (!userId || !secret) {
      setErrorMessage('Invalid verification link. Please check your email and try again.');
      setStatus('error');
      return;
    }

    try {
      await account.updateVerification(userId, secret);
      setStatus('success');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred.';

      if (message.includes('expired') || message.includes('Invalid token')) {
        setErrorMessage('This verification link has expired. Please request a new one from your profile in the app.');
      } else if (message.includes('already') || message.includes('used')) {
        setErrorMessage('This link has already been used. Your email may already be verified.');
      } else {
        setErrorMessage(message);
      }
      setStatus('error');
    }
  }, [userId, secret]);

  useEffect(() => {
    verify();
  }, [verify]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
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
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-100/50 p-8 text-center">
          {/* Verifying State */}
          {status === 'verifying' && (
            <>
              <div className="flex justify-center mb-5">
                <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
              </div>
              <h1 className="text-xl font-bold text-navy mb-2">Verifying your email...</h1>
              <p className="text-gray-500 text-sm">
                Please wait while we confirm your email address.
              </p>
            </>
          )}

          {/* Success State */}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-8 h-8 text-green-500"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-navy mb-2">Email Verified!</h1>
              <p className="text-gray-500 text-sm mb-6">
                Your email address has been successfully verified. You can now create event listings.
              </p>
              <Link
                href="/account"
                className="block w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-primary/25 text-center"
              >
                Go to Profile
              </Link>
            </>
          )}

          {/* Error State */}
          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-8 h-8 text-red-500"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-navy mb-2">Verification Failed</h1>
              <p className="text-gray-500 text-sm mb-6">{errorMessage}</p>
              <Link
                href="/"
                className="block w-full py-3 px-4 border-2 border-gray-200 text-navy font-semibold rounded-xl hover:bg-gray-50 transition-colors text-center"
              >
                Go Home
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
