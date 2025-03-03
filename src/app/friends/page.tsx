import FriendManager from "@/components/FriendManager";
import Navigation from "@/components/Navigation";

export default function FriendsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Study Friends</h1>
            <p className="text-xl text-gray-600">Connect with friends to study together and stay motivated.</p>
          </div>
          
          <FriendManager />
        </div>
      </div>
    </main>
  );
} 