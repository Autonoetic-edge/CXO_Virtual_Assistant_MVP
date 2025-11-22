import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  TrendingUp,
  Mic,
  Search,
} from 'lucide-react';
import VoiceInput from '../components/VoiceInput';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBriefing();
  }, []);

  const fetchBriefing = async () => {
    try {
      setLoading(true);
      // This will be implemented when briefing endpoints are ready
      const mockBriefing = {
        date: new Date().toISOString().split('T')[0],
        priorities: [
          'Prepare for Q4 Budget Review at 10:00 AM',
          'Review marketing budget request ($500K)',
          'Finalize Board Meeting presentation (Friday 2 PM)',
        ],
        schedule: {
          total_meetings: 5,
          meetings: [
            {
              id: '1',
              title: 'Team Standup',
              start_time: '2024-01-15T09:30:00',
              preparation_status: 'prepared',
            },
            {
              id: '2',
              title: 'Q4 Budget Review',
              start_time: '2024-01-15T10:00:00',
              preparation_status: 'not_prepared',
            },
          ],
        },
        alerts: [
          {
            type: 'warning',
            message: '2 meetings need preparation',
          },
        ],
        stats: {
          open_approvals: 3,
        },
      };
      setBriefing(mockBriefing);
    } catch (error) {
      console.error('Error fetching briefing:', error);
      toast.error('Failed to load briefing');
    } finally {
      setLoading(false);
    }
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      toast.info(`Processing query: "${query}"`);
      setQuery('');
    } catch (error) {
      toast.error('Failed to process query');
    }
  };

  const handleVoiceTranscript = (transcript) => {
    setQuery(transcript);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Good morning, {user?.first_name}!
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

      {/* Voice/Text Query Input */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4">
          <form onSubmit={handleQuerySubmit} className="flex-1 flex gap-2">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask me anything... (e.g., 'What meetings do I have tomorrow?')"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition"
            >
              Ask
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

      {/* Alerts */}
      {briefing?.alerts && briefing.alerts.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
          <div className="flex items-start">
            <AlertCircle className="text-amber-400 mt-0.5" size={20} />
            <div className="ml-3">
              {briefing.alerts.map((alert, index) => (
                <p key={index} className="text-amber-800">
                  {alert.message}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Priorities */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="text-primary" />
          Top 3 Priorities
        </h2>
        {briefing?.priorities ? (
          <ol className="space-y-2">
            {briefing.priorities.map((priority, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="font-bold text-primary">{index + 1}.</span>
                <span>{priority}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-gray-500">Loading priorities...</p>
        )}
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <CalendarIcon className="text-primary" />
          Today's Schedule ({briefing?.schedule?.total_meetings || 0} meetings)
        </h2>
        {briefing?.schedule?.meetings && briefing.schedule.meetings.length > 0 ? (
          <div className="space-y-3">
            {briefing.schedule.meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-primary transition"
              >
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-gray-400" />
                  <div>
                    <p className="font-medium">{meeting.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(meeting.start_time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    meeting.preparation_status === 'prepared'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {meeting.preparation_status === 'prepared'
                    ? '✓ Prepared'
                    : '⚠ Needs Prep'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No meetings scheduled for today</p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Open Approvals</p>
              <p className="text-2xl font-bold text-primary">
                {briefing?.stats?.open_approvals || 0}
              </p>
            </div>
            <div className="p-3 bg-primary-50 rounded-lg">
              <AlertCircle className="text-primary" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Revenue MTD</p>
              <p className="text-2xl font-bold text-primary">
                {briefing?.stats?.revenue_mtd || '$2.3M'}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Burn Rate</p>
              <p className="text-2xl font-bold text-primary">
                {briefing?.stats?.burn_rate || '$180K/day'}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <Clock className="text-amber-600" size={24} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
