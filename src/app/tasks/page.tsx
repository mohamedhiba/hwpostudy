import TaskManager from "@/components/TaskManager";
import Navigation from "@/components/Navigation";

export default function TasksPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Study Tasks</h1>
            <p className="text-xl text-gray-600">Manage your study tasks and track your progress.</p>
          </div>
          
          <TaskManager />
        </div>
      </div>
    </main>
  );
} 