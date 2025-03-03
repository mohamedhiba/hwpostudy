'use client';

import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Define guest user type with required fields
export interface GuestUser {
  id: string;
  name: string;
  email: string;
  isGuest: boolean;
  totalStudyTime?: number;
  totalTasksDone?: number;
}

// Define NextAuth user type
export interface NextAuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  totalStudyTime?: number;
  totalTasksDone?: number;
}

// Custom hook for authentication that supports both NextAuth and guest mode
export function useAuth() {
  const { data: session, status } = useSession();
  const [guestUser, setGuestUser] = useState<GuestUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  // Check localStorage for guest user on client-side
  useEffect(() => {
    const checkGuestUser = () => {
      try {
        const storedUser = localStorage.getItem('guestUser');
        if (storedUser) {
          setGuestUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error checking guest user:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    checkGuestUser();
  }, []);

  // Custom sign out function that handles both NextAuth and guest sessions
  const signOut = async () => {
    if (guestUser) {
      // Clear guest user data
      localStorage.removeItem('guestUser');
      // Clear guest cookie
      document.cookie = 'isGuest=; path=/; max-age=0';
      setGuestUser(null);
      router.push('/auth');
      return;
    }
    
    // Use NextAuth signOut for regular users
    await nextAuthSignOut({ redirect: false });
    router.push('/auth');
  };

  // Get the user from session with type assertion to ensure id is present
  const sessionUser = session?.user as NextAuthUser | undefined;

  // Combined authentication status
  const user = sessionUser || guestUser;
  const isAuthenticated = !!user;
  const isGuest = !!guestUser;
  const authStatus = status === 'loading' || !isLoaded 
    ? 'loading' 
    : isAuthenticated 
      ? 'authenticated' 
      : 'unauthenticated';

  return {
    user,
    isAuthenticated,
    isGuest,
    status: authStatus,
    signOut,
  };
} 