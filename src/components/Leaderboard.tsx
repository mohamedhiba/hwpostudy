'use client';

import { useState, useEffect } from 'react';
import { FiClock, FiCheckSquare, FiAward, FiUserCheck } from 'react-icons/fi';
import Link from 'next/link';
import { useAuth, GuestUser, NextAuthUser } from '@/hooks/useAuth';

interface LeaderboardUser {
  id: string;
  name: string;
  image?: string;
  totalStudyTime: number;
  totalTasksDone: number;
  isFriend: boolean;
}

export default function Leaderboard() {
  const { user: currentUser, status, isAuthenticated, isGuest } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboardType, setLeaderboardType] = useState<'studyTime' | 'tasksDone'>('studyTime');
  const [leaderboardScope, setLeaderboardScope] = useState<'global' | 'friends'>('global');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!isAuthenticated || !currentUser?.id) {
        return;
      }
      
      try {
        setIsLoading(true);
        
        if (isGuest) {
          const mockUsers: LeaderboardUser[] = [
            {
              id: 'user-1',
              name: 'Alex Studious',
              totalStudyTime: 1240,
              totalTasksDone: 42,
              isFriend: false
            },
            {
              id: 'user-2',
              name: 'Sam Productive',
              totalStudyTime: 980,
              totalTasksDone: 37,
              isFriend: false
            },
            {
              id: currentUser.id,
              name: currentUser.name || 'Guest User',
              totalStudyTime: currentUser.totalStudyTime || 0,
              totalTasksDone: currentUser.totalTasksDone || 0,
              isFriend: false
            },
            {
              id: 'user-3',
              name: 'Jamie Learner',
              totalStudyTime: 760,
              totalTasksDone: 29,
              isFriend: false
            },
            {
              id: 'user-4',
              name: 'Taylor Focus',
              totalStudyTime: 620,
              totalTasksDone: 24,
              isFriend: false
            }
          ];
          
          mockUsers.sort((a, b) => 
            leaderboardType === 'studyTime' 
              ? b.totalStudyTime - a.totalStudyTime 
              : b.totalTasksDone - a.totalTasksDone
          );
          
          setUsers(mockUsers);
          setIsLoading(false);
          return;
        }
        
        const response = await fetch(
          `/api/leaderboard?type=${leaderboardType}&scope=${leaderboardScope}&userId=${currentUser.id}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          console.error('Failed to load leaderboard:', await response.text());
        }
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [leaderboardType, leaderboardScope, currentUser?.id, isAuthenticated, isGuest]);

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getUserRankStyles = (index: number) => {
    const rankStyles = {
      medal: '',
      text: 'text-gray-900'
    };
    
    if (index === 0) {
      rankStyles.medal = '🥇';
      rankStyles.text = 'text-yellow-600 font-bold';
    } else if (index === 1) {
      rankStyles.medal = '🥈';
      rankStyles.text = 'text-gray-500 font-bold';
    } else if (index === 2) {
      rankStyles.medal = '🥉';
      rankStyles.text = 'text-amber-600 font-bold';
    } else {
      rankStyles.medal = `${index + 1}`;
    }
    
    return rankStyles;
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Leaderboard</h3>
        
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setLeaderboardType('studyTime')}
            className={`px-3 py-1 text-sm rounded-full ${
              leaderboardType === 'studyTime' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Study Time
          </button>
          <button
            onClick={() => setLeaderboardType('tasksDone')}
            className={`px-3 py-1 text-sm rounded-full ${
              leaderboardType === 'tasksDone' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Tasks Completed
          </button>
          
          <div className="ml-auto">
            <button
              onClick={() => setLeaderboardScope('global')}
              className={`px-3 py-1 text-sm rounded-full ${
                leaderboardScope === 'global' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Global
            </button>
            <button
              onClick={() => setLeaderboardScope('friends')}
              className={`px-3 py-1 text-sm rounded-full ml-1 ${
                leaderboardScope === 'friends' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Friends
            </button>
          </div>
        </div>
      </div>
      
      {status === 'loading' ? (
        <div className="px-4 py-12 text-center">
          <p className="text-gray-500">Loading leaderboard...</p>
        </div>
      ) : status === 'unauthenticated' ? (
        <div className="px-4 py-12 text-center">
          <p className="text-gray-500 mb-4">Sign in to view the leaderboard</p>
          <Link href="/auth" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
            Sign In
          </Link>
        </div>
      ) : isLoading ? (
        <div className="px-4 py-12 text-center">
          <p className="text-gray-500">Loading leaderboard...</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {users.map((user, index) => {
            const styles = getUserRankStyles(index);
            
            return (
              <li key={user.id} className="py-4 px-4 flex items-center gap-3">
                <div className="flex-shrink-0 w-8 text-center font-bold">
                  {styles.medal}
                </div>
                
                <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden">
                  {user.image ? (
                    <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-purple-600 text-white text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="flex-grow">
                  <h3 className={`font-medium ${styles.text}`}>
                    {user.name}
                    {user.id === currentUser?.id && ' (You)'}
                    {user.isFriend && user.id !== currentUser?.id && ' (Friend)'}
                  </h3>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-lg text-purple-600">
                    {leaderboardType === 'studyTime' 
                      ? formatStudyTime(user.totalStudyTime)
                      : user.totalTasksDone}
                  </p>
                  <p className="text-xs text-gray-500">
                    {leaderboardType === 'studyTime' ? 'Study time' : 'Tasks completed'}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}