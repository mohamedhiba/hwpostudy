'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FiPlus, FiCheck, FiX, FiCalendar, FiTrash2 } from 'react-icons/fi';
import type { Session } from 'next-auth';

interface Task {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  createdAt: string;
  completedAt?: string;
}

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

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  // Use type assertion for the session
  const { data: session, status } = useSession() as { 
    data: ExtendedSession | null;
    status: "loading" | "authenticated" | "unauthenticated";
  };

  // Load tasks when component mounts
  useEffect(() => {
    const fetchTasks = async () => {
      if (!session?.user?.id) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/tasks?userId=${session.user.id}`);
        
        if (response.ok) {
          const data = await response.json();
          setTasks(data);
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTasks();
  }, [session?.user?.id]);

  // Add a new task
  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTask.trim() || !session?.user?.id) return;
    
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          title: newTask,
          description: newDescription || undefined,
        }),
      });
      
      if (response.ok) {
        const newTask = await response.json();
        setTasks(prev => [...prev, newTask]);
        setNewTask('');
        setNewDescription('');
      }
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  // Toggle task completion status
  const toggleTaskCompletion = async (taskId: string) => {
    if (!session?.user.id) return;
    
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;
    
    const task = tasks[taskIndex];
    const newStatus = !task.isCompleted;
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isCompleted: newStatus,
          userId: session.user.id,
        }),
      });
      
      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(prev => 
          prev.map(t => t.id === taskId ? updatedTask : t)
        );
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // Delete a task
  const deleteTask = async (taskId: string) => {
    if (!session?.user?.id || !window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id }),
      });
      
      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return <div className="text-center p-4 text-gray-300">Loading tasks...</div>;
  }

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-xl max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 text-purple-400">Study Tasks</h2>
      
      {/* Add Task Form */}
      <form onSubmit={addTask} className="mb-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="What do you need to study?"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
            required
          />
        </div>
        <div className="mb-4">
          <textarea
            placeholder="Description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 min-h-[80px]"
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg flex items-center justify-center transition-colors"
        >
          <FiPlus className="mr-2" /> Add Task
        </button>
      </form>
      
      {/* Task List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-center text-gray-400 py-4">No tasks yet. Add a task to get started!</p>
        ) : (
          tasks.map(task => (
            <div 
              key={task.id} 
              className={`p-4 border rounded-lg ${
                task.isCompleted 
                  ? 'bg-gray-700/50 border-gray-600' 
                  : 'bg-gray-700 border-gray-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleTaskCompletion(task.id)}
                  className={`flex-shrink-0 mt-1 w-6 h-6 rounded-full border flex items-center justify-center ${
                    task.isCompleted 
                      ? 'bg-green-600 border-green-700 text-white' 
                      : 'border-gray-500 hover:border-purple-500'
                  }`}
                >
                  {task.isCompleted && <FiCheck size={14} />}
                </button>
                <div className="flex-grow">
                  <h3 className={`font-medium ${task.isCompleted ? 'line-through text-gray-400' : 'text-white'}`}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className={`mt-1 text-sm ${task.isCompleted ? 'text-gray-500' : 'text-gray-300'}`}>
                      {task.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <FiCalendar className="mr-1" />
                    {task.isCompleted 
                      ? `Completed ${task.completedAt ? formatDate(task.completedAt) : ''}` 
                      : `Created ${formatDate(task.createdAt)}`}
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-gray-400 hover:text-red-500 focus:outline-none transition-colors"
                  aria-label="Delete task"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 