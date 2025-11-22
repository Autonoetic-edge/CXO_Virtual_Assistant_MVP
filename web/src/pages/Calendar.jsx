import React, { useState } from 'react';
import { Calendar as CalendarIcon, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    toast.info('Syncing calendars...');
    setTimeout(() => {
      setLoading(false);
      toast.success('Calendars synced successfully');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarIcon />
          Calendar
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleSync}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Sync
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition">
            <Plus size={18} />
            New Event
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-20 text-gray-500">
          <CalendarIcon size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg">Calendar view will be implemented with react-big-calendar</p>
          <p className="text-sm mt-2">
            Connect your Google Calendar or Outlook to see your events here
          </p>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
