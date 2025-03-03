'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FiUserPlus, FiUserX, FiSearch, FiCheck, FiX } from 'react-icons/fi';
import type { Session } from 'next-auth';

// Define a typed session to use in our component
interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    totalStudyTime: number;
    totalTasksDone: number;
  }
}

interface Friend {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  isRequester: boolean;
}

// Create a custom toast notification function
function useCustomToast() {
  const [notifications, setNotifications] = useState<{
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    visible: boolean;
  }[]>([]);
  
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, visible: true }]);
    
    // Automatically hide after 3 seconds
    setTimeout(() => {
      setNotifications(prev => 
        prev.map(toast => toast.id === id ? { ...toast, visible: false } : toast)
      );
      
      // Remove from array after fade out
      setTimeout(() => {
        setNotifications(prev => prev.filter(toast => toast.id !== id));
      }, 300);
    }, 3000);
  };
  
  return { notifications, showToast };
}

export default function FriendManager() {
  // Use type assertion for the session
  const { data: session, status } = useSession() as { 
    data: ExtendedSession | null;
    status: "loading" | "authenticated" | "unauthenticated";
  };
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; email: string; image?: string | null }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  // Use our custom toast implementation
  const { notifications, showToast } = useCustomToast();

  // Define fetchFriends function outside useEffect so it can be reused
  const fetchFriends = async () => {
    if (!session?.user?.id) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/friends?userId=${session?.user?.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      showToast('Failed to load friends', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load friends when component mounts
  useEffect(() => {
    fetchFriends();
  }, [session?.user?.id]);

  // Search for users
  const searchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim() || !session?.user?.id) return;
    
    try {
      setIsSearching(true);
      const response = await fetch(`/api/users/search?term=${encodeURIComponent(searchTerm)}&userId=${session?.user?.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Send friend request
  const sendFriendRequest = async (userId: string) => {
    if (!session?.user.id) return;
    
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: session.user.id,
          addresseeId: userId,
        }),
      });
      
      if (response.ok) {
        const newFriend = await response.json();
        setFriends(prev => [...prev, newFriend]);
        setSearchResults(prev => prev.filter(user => user.id !== userId));
        // Show success notification
        showToast("Friend request sent successfully");
      } else {
        // Handle non-ok responses
        const errorText = await response.text();
        
        if (response.status === 409) {
          // Already sent a request
          showToast("You've already sent a friend request to this user", "warning");
          
          // Refresh the friends list to show the existing request
          fetchFriends();
          
          // Remove from search results since there's already a request
          setSearchResults(prev => prev.filter(user => user.id !== userId));
        } else {
          // Other errors
          showToast("Failed to send friend request", "error");
        }
      }
    } catch (error) {
      console.error('Failed to send friend request:', error);
      showToast("An unexpected error occurred", "error");
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (friendshipId: string) => {
    if (!session?.user.id) return;
    
    try {
      const response = await fetch(`/api/friends/${friendshipId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id }),
      });
      
      if (response.ok) {
        const updatedFriend = await response.json();
        setFriends(prev => 
          prev.map(friend => 
            friend.id === updatedFriend.id ? updatedFriend : friend
          )
        );
      }
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    }
  };

  // Reject friend request
  const rejectFriendRequest = async (friendshipId: string) => {
    if (!session?.user.id) return;
    
    try {
      const response = await fetch(`/api/friends/${friendshipId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id }),
      });
      
      if (response.ok) {
        const updatedFriend = await response.json();
        setFriends(prev => 
          prev.map(friend => 
            friend.id === updatedFriend.id ? updatedFriend : friend
          )
        );
      }
    } catch (error) {
      console.error('Failed to reject friend request:', error);
    }
  };

  // Remove friend
  const removeFriend = async (friendshipId: string) => {
    if (!session?.user.id || !window.confirm('Are you sure you want to remove this friend?')) return;
    
    try {
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id }),
      });
      
      if (response.ok) {
        setFriends(prev => prev.filter(friend => friend.id !== friendshipId));
      }
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading friends...</div>;
  }

  // Filter lists
  const pendingRequests = friends.filter(f => f.status === 'PENDING' && !f.isRequester);
  const sentRequests = friends.filter(f => f.status === 'PENDING' && f.isRequester);
  const acceptedFriends = friends.filter(f => f.status === 'ACCEPTED');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search for new friends */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold mb-4">Find Friends</h2>
        
        <form onSubmit={searchUsers} className="mb-6">
          <div className="flex">
            <input
              type="text"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-r-lg transition-colors flex items-center"
              disabled={isSearching}
            >
              <FiSearch className="mr-1" />
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-3 mt-4">
            <h3 className="font-medium text-gray-700">Search Results</h3>
            {searchResults.map(user => (
              <div 
                key={user.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                    {user.image ? (
                      <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{user.name}</h4>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => sendFriendRequest(user.id)}
                  className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md transition-colors"
                >
                  <FiUserPlus size={16} />
                  Add Friend
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Pending Friend Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold mb-4">Friend Requests ({pendingRequests.length})</h2>
          <div className="space-y-3">
            {pendingRequests.map(friend => (
              <div 
                key={friend.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                    {friend.image ? (
                      <img src={friend.image} alt={friend.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-lg">
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{friend.name}</h4>
                    <p className="text-sm text-gray-500">{friend.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptFriendRequest(friend.id)}
                    className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md transition-colors"
                  >
                    <FiCheck size={16} />
                    Accept
                  </button>
                  <button
                    onClick={() => rejectFriendRequest(friend.id)}
                    className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md transition-colors"
                  >
                    <FiX size={16} />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Sent Friend Requests */}
      {sentRequests.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold mb-4">Sent Requests ({sentRequests.length})</h2>
          <div className="space-y-3">
            {sentRequests.map(friend => (
              <div 
                key={friend.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                    {friend.image ? (
                      <img src={friend.image} alt={friend.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-lg">
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{friend.name}</h4>
                    <p className="text-sm text-gray-500">{friend.email}</p>
                    <p className="text-xs text-gray-400">Pending approval</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFriend(friend.id)}
                  className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-md transition-colors"
                >
                  <FiX size={16} />
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Friends List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Friends ({acceptedFriends.length})</h2>
        {acceptedFriends.length === 0 ? (
          <p className="text-center text-gray-500 py-4">You don&apos;t have any friends yet. Search for users to add as friends!</p>
        ) : (
          <div className="space-y-3">
            {acceptedFriends.map(friend => (
              <div 
                key={friend.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                    {friend.image ? (
                      <img src={friend.image} alt={friend.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-lg">
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{friend.name}</h4>
                    <p className="text-sm text-gray-500">{friend.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFriend(friend.id)}
                  className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <FiUserX size={18} />
                  <span className="hidden sm:inline">Remove</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 