import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  TrendingUp,
  CheckCircle,
  Bell,
  Sparkles,
  RefreshCw,
  ChevronRight,
  ListTodo,
  Brain,
} from 'lucide-react';
import VoiceInput from '../components/VoiceInput';
import { useAuthStore } from '../store/authStore';
import { workflowService } from '../services/workflowService';
import { taskService } from '../services/taskService';
import { reminderService } from '../services/reminderService';
import { memoryService } from '../services/memoryService';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [workflow, setWorkflow] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [upcomingMemories, setUpcomingMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [workflowRes, tasksRes, remindersRes, memoriesRes] = await Promise.allSettled([
        workflowService.getTodayWorkflow(),
        taskService.getToday(),
        reminderService.getUpcoming(24),
        memoryService.getUpcomingReminders(7),
      ]);

      if (workflowRes.status === 'fulfilled') {
        setWorkflow(workflowRes.value.data);
      }
      if (tasksRes.status === 'fulfilled') {
        setTodayTasks(tasksRes.value.data || []);
      }
      if (remindersRes.status === 'fulfilled') {
        setUpcomingReminders(remindersRes.value.data || []);
      }
      if (memoriesRes.status === 'fulfilled') {
        setUpcomingMemories(memoriesRes.value.data || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed!');
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      // Check if it's a "remember" command
      if (query.toLowerCase().startsWith('remember ') || query.toLowerCase().includes('remember that')) {
        await memoryService.remember(query);
        toast.success('Got it! I\'ll remember that.');
      } else {
        toast.info(`Processing: "${query}"`);
      }
      setQuery('');
    } catch (error) {
      toast.error('Failed to process request');
    }
  };

  const handleVoiceTranscript = (transcript) => {
    setQuery(transcript);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const content = workflow?.content;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {getGreeting()}, {user?.first_name}!
          </h1>
          <p className="text-gray-600 mt-1">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-primary transition"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Voice/Text Query Input */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4">
          <form onSubmit={handleQuerySubmit} className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <Brain
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything or say 'Remember...' to save a memory"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition"
            >
              Go
            </button>
          </form>
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            onListeningChange={(isListening) => {
              if (isListening) {
                toast.info('Listening... Speak now');
              }
            }}
          />
        </div>
      </div>

      {/* Daily Briefing Summary */}
      {content && (
        <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg p-6 border border-primary-100">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <Sparkles className="text-primary" size={24} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg text-gray-800">{content.greeting}</h2>
              <p className="text-gray-600 mt-1">{content.summary}</p>
              {content.motivationalMessage && (
                <p className="text-primary mt-3 italic">💡 {content.motivationalMessage}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <ListTodo className="text-primary" size={20} />
              Today's Tasks ({todayTasks.length})
            </h2>
            <Link to="/tasks" className="text-primary text-sm hover:underline flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="p-4">
            {todayTasks.length > 0 ? (
              <div className="space-y-3">
                {todayTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:border-primary transition"
                  >
                    <div
                      className={`w-4 h-4 rounded-full ${
                        task.status === 'completed'
                          ? 'bg-green-500'
                          : task.priority === 'urgent'
                          ? 'bg-red-500'
                          : task.priority === 'high'
                          ? 'bg-orange-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <div className="flex-1">
                      <p className={task.status === 'completed' ? 'line-through text-gray-400' : ''}>
                        {task.title}
                      </p>
                      {task.due_time && (
                        <p className="text-xs text-gray-500">{task.due_time}</p>
                      )}
                    </div>
                    {task.status === 'completed' && (
                      <CheckCircle size={16} className="text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No tasks for today. Enjoy!</p>
            )}
          </div>
        </div>

        {/* Upcoming Reminders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Bell className="text-primary" size={20} />
              Upcoming Reminders ({upcomingReminders.length})
            </h2>
          </div>
          <div className="p-4">
            {upcomingReminders.length > 0 ? (
              <div className="space-y-3">
                {upcomingReminders.slice(0, 5).map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg"
                  >
                    <Clock size={18} className="text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{reminder.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(reminder.remind_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No upcoming reminders</p>
            )}
          </div>
        </div>

        {/* Events from Workflow */}
        {content?.events && content.events.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <CalendarIcon className="text-primary" size={20} />
                Today's Events ({content.events.length})
              </h2>
              <Link to="/calendar" className="text-primary text-sm hover:underline flex items-center gap-1">
                View all <ChevronRight size={14} />
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {content.events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:border-primary transition"
                >
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-gray-400" />
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(event.start_time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        {event.location && ` • ${event.location}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Important Dates (from Memories) */}
        {upcomingMemories.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold flex items-center gap-2">
                <AlertCircle className="text-primary" size={20} />
                Coming Up (Don't Forget!)
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {upcomingMemories.slice(0, 5).map((memory) => (
                <div
                  key={memory.id}
                  className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-100 rounded-lg"
                >
                  <span className="text-xl">
                    {memory.memory_type === 'birthday'
                      ? '🎂'
                      : memory.memory_type === 'anniversary'
                      ? '💍'
                      : '📌'}
                  </span>
                  <div>
                    <p className="font-medium text-gray-800">{memory.title}</p>
                    {memory.reminder_date && (
                      <p className="text-sm text-gray-500">
                        {new Date(memory.reminder_date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Items */}
      {content?.actionItems && content.actionItems.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="text-primary" size={20} />
            Recommended Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {content.actionItems.map((item, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 rounded-lg border-l-4 border-primary"
              >
                <p className="text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Tasks Today</p>
          <p className="text-2xl font-bold text-primary">{todayTasks.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {todayTasks.filter((t) => t.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Reminders</p>
          <p className="text-2xl font-bold text-amber-600">{upcomingReminders.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Events</p>
          <p className="text-2xl font-bold text-purple-600">{content?.events?.length || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
