'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          {/* Avatar */}
          <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25">
            <span className="text-3xl font-bold text-white">
              {getInitials(user.name || user.email)}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-navy">{user.name || 'User'}</h1>
          <p className="text-gray-500">{user.email}</p>
        </div>

        {/* Account Info Card */}
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-navy">Account Information</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {/* Name */}
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium text-navy">{user.name || 'Not set'}</p>
              </div>
              <Link
                href="/account/edit"
                className="text-sm text-primary hover:text-primary-dark font-medium"
              >
                Edit
              </Link>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-navy">{user.email}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                user.emailVerification 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {user.emailVerification ? 'Verified' : 'Unverified'}
              </span>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="font-medium text-navy">{user.phone || 'Not set'}</p>
              </div>
              {user.phone && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  user.phoneVerification 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {user.phoneVerification ? 'Verified' : 'Unverified'}
                </span>
              )}
            </div>

            {/* Account ID */}
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div>
                <p className="text-sm text-gray-500">Account ID</p>
                <p className="font-mono text-sm text-navy">{user.$id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Timeline Card */}
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-navy">Account Timeline</h2>
          </div>

          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between p-4">
              <p className="text-sm text-gray-500">Account Created</p>
              <p className="font-medium text-navy">{formatDate(user.$createdAt)}</p>
            </div>
            <div className="flex items-center justify-between p-4">
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-medium text-navy">{formatDate(user.$updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Settings Links Card */}
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-navy">Settings</h2>
          </div>

          <div className="divide-y divide-gray-100">
            <Link
              href="/account/password"
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="font-medium text-navy">Change Password</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/support"
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-medium text-navy">Help & Support</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/terms"
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="font-medium text-navy">Terms of Service</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/privacy"
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="font-medium text-navy">Privacy Policy</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-100/50 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
          </div>

          <div className="p-4">
            <button
              onClick={() => logout()}
              className="w-full mb-3 py-3 px-4 border-2 border-gray-200 text-navy font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Log Out
            </button>
            <Link
              href="/account/delete"
              className="block w-full py-3 px-4 border-2 border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors text-center"
            >
              Delete Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
