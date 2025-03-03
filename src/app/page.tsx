export const dynamic = 'force-static';

import PomodoroTimer from "@/components/PomodoroTimer";
import Leaderboard from "@/components/Leaderboard";
import Navigation from "@/components/Navigation";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Study Together, Achieve More</h1>
          <p className="text-xl text-gray-600">Track your study time, manage tasks, and compete with friends.</p>
        </div>

        <div className="flex flex-col lg:flex-row lg:space-x-8 lg:items-start">
          <div className="lg:w-3/5 mb-12 lg:mb-0 lg:flex lg:justify-center">
            <PomodoroTimer />
          </div>
          
          <div className="lg:w-2/5">
            <Leaderboard />
          </div>
        </div>
      </div>
    </main>
  );
}
