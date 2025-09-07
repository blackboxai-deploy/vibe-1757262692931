'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      // User is authenticated, redirect to dashboard
      router.push('/dashboard');
    } else {
      // User is not authenticated, redirect to login
      router.push('/auth/login');
    }
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-xl">CRM</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Enterprise Sales CRM
        </h1>
        <p className="text-gray-600 mb-6">
          Multi-tenant, Cloud-native Sales Management Platform
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}