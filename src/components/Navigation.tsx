'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiClock, FiCheckSquare, FiAward, FiUser, FiLogOut, FiLogIn, FiMoon } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';

// Define a typed user interface
interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  totalStudyTime?: number;
  totalTasksDone?: number;
  isGuest?: boolean;
}

export default function Navigation() {
  const pathname = usePathname();
  // Use our custom auth hook
  const { user, status, isAuthenticated, isGuest, signOut } = useAuth();
  
  const isActive = (path: string) => pathname === path;
  
  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-purple-500">
                StudyTogether
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/') 
                    ? 'border-purple-500 text-gray-100' 
                    : 'border-transparent text-gray-300 hover:border-gray-500 hover:text-gray-100'
                }`}
              >
                <FiClock className="mr-1" /> Timer
              </Link>
              <Link
                href="/tasks"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/tasks') 
                    ? 'border-purple-500 text-gray-100' 
                    : 'border-transparent text-gray-300 hover:border-gray-500 hover:text-gray-100'
                }`}
              >
                <FiCheckSquare className="mr-1" /> Tasks
              </Link>
              <Link
                href="/leaderboard"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/leaderboard') 
                    ? 'border-purple-500 text-gray-100' 
                    : 'border-transparent text-gray-300 hover:border-gray-500 hover:text-gray-100'
                }`}
              >
                <FiAward className="mr-1" /> Leaderboard
              </Link>
              <Link
                href="/friends"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/friends') 
                    ? 'border-purple-500 text-gray-100' 
                    : 'border-transparent text-gray-300 hover:border-gray-500 hover:text-gray-100'
                }`}
              >
                <FiUser className="mr-1" /> Friends
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-300 hidden md:inline">
                  {user?.name} {isGuest && "(Guest)"}
                </span>
                
                <button
                  onClick={() => signOut()}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600"
                >
                  <FiLogOut className="mr-1" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                <FiLogIn className="mr-1" /> Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile navigation */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/') 
                ? 'border-purple-500 text-purple-400 bg-gray-700' 
                : 'border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-500 hover:text-gray-100'
            }`}
          >
            <FiClock className="inline mr-1" /> Timer
          </Link>
          <Link
            href="/tasks"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/tasks') 
                ? 'border-purple-500 text-purple-400 bg-gray-700' 
                : 'border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-500 hover:text-gray-100'
            }`}
          >
            <FiCheckSquare className="inline mr-1" /> Tasks
          </Link>
          <Link
            href="/leaderboard"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/leaderboard') 
                ? 'border-purple-500 text-purple-400 bg-gray-700' 
                : 'border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-500 hover:text-gray-100'
            }`}
          >
            <FiAward className="inline mr-1" /> Leaderboard
          </Link>
          <Link
            href="/friends"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/friends') 
                ? 'border-purple-500 text-purple-400 bg-gray-700' 
                : 'border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-500 hover:text-gray-100'
            }`}
          >
            <FiUser className="inline mr-1" /> Friends
          </Link>
        </div>
      </div>
    </nav>
  );
} 