'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiUser, FiMail, FiLock, FiLogIn, FiUserPlus } from 'react-icons/fi';

// Create a separate component for the auth form to handle search params
function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authType, setAuthType] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Check for error params from NextAuth
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'CredentialsSignin':
          setError('Invalid email or password');
          break;
        case 'Callback':
          setError('Authentication failed');
          break;
        case 'OAuthAccountNotLinked':
          setError('Email already used with a different provider');
          break;
        default:
          setError('An error occurred during authentication');
      }
    }
  }, [searchParams]);
  
  const toggleAuthType = () => {
    setAuthType(prev => prev === 'login' ? 'register' : 'login');
    setError(null);
  };
  
  // Function to handle guest sign-in without API calls
  const handleGuestSignIn = () => {
    setIsLoading(true);
    
    try {
      // Generate a unique guest ID
      const guestId = 'guest-' + Math.random().toString(36).substring(2, 15);
      
      // Store guest user data in localStorage for client-side only auth
      const guestUser = {
        id: guestId,
        name: 'Guest User',
        email: 'guest@example.com',
        isGuest: true,
        totalStudyTime: 0,
        totalTasksDone: 0
      };
      
      localStorage.setItem('guestUser', JSON.stringify(guestUser));
      
      // Set a cookie to indicate guest mode for middleware
      document.cookie = 'isGuest=true; path=/; max-age=86400'; // 24 hours
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Error setting up guest mode:', error);
      setError('Failed to set up guest mode. Please try again.');
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      if (authType === 'login') {
        // Handle login
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });
        
        if (result?.error) {
          setError('Invalid email or password');
          setIsLoading(false);
          return;
        }
        
        router.push('/');
      } else {
        // Handle registration
        if (!name || !email || !password) {
          setError('All fields are required');
          setIsLoading(false);
          return;
        }
        
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          setError(data.message || 'Registration failed');
          setIsLoading(false);
          return;
        }
        
        // Auto login after successful registration
        const signInResult = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });
        
        if (signInResult?.error) {
          setError('Registration successful, but login failed. Please try logging in.');
          setIsLoading(false);
          return;
        }
        
        router.push('/');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-xl">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-purple-500">
            StudyTogether
          </h1>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">
            {authType === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            {authType === 'login' 
              ? "Don't have an account? " 
              : "Already have an account? "}
            <button
              onClick={toggleAuthType}
              className="font-medium text-purple-400 hover:text-purple-300"
            >
              {authType === 'login' ? 'Register' : 'Sign in'}
            </button>
          </p>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-900/30 border border-red-700 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-400">Error</h3>
                <div className="mt-2 text-sm text-red-300">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {authType === 'register' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                  Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10"
                    placeholder="Full name"
                  />
                </div>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10"
                  placeholder="Email address"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={authType === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 placeholder-gray-400 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10"
                  placeholder="Password"
                />
              </div>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-800 disabled:text-gray-300 transition-colors"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {authType === 'login' ? (
                  <FiLogIn className="h-5 w-5 text-purple-400 group-hover:text-purple-300" />
                ) : (
                  <FiUserPlus className="h-5 w-5 text-purple-400 group-hover:text-purple-300" />
                )}
              </span>
              {isLoading
                ? 'Loading...'
                : authType === 'login'
                ? 'Sign in'
                : 'Register'}
            </button>
          </div>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={handleGuestSignIn}
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-gray-700 rounded-md shadow-sm bg-gray-700 text-sm font-medium text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-colors"
            >
              <FiUser className="h-5 w-5 mr-2" /> Continue as guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with suspense boundary
export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
} 