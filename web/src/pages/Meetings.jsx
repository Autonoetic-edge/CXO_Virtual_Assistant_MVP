import React, { useState } from 'react';
import { Users, Clock, MapPin, FileText } from 'lucide-react';

const Meetings = () => {
  const [meetings] = useState([
    {
      id: '1',
      title: 'Q4 Budget Review',
      start_time: '2024-01-15T10:00:00',
      end_time: '2024-01-15T11:30:00',
      location: 'Conference Room A',
      preparation_status: 'not_prepared',
      attendee_count: 8,
    },
    {
      id: '2',
      title: 'Board Meeting',
      start_time: '2024-01-19T14:00:00',
      end_time: '2024-01-19T16:00:00',
      location: 'Zoom',
      preparation_status: 'in_progress',
      attendee_count: 12,
    },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'prepared':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'prepared':
        return '✓ Prepared';
      case 'in_progress':
        return '⏳ In Progress';
      default:
        return '⚠ Not Prepared';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Users />
          Meetings
        </h1>
      </div>

      <div className="grid gap-4">
        {meetings.map((meeting) => (
          <div
            key={meeting.id}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {meeting.title}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock size={16} />
                    {new Date(meeting.start_time).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={16} />
                    {meeting.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={16} />
                    {meeting.attendee_count} attendees
                  </span>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  meeting.preparation_status
                )}`}
              >
                {getStatusText(meeting.preparation_status)}
              </span>
            </div>

            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition text-sm">
                <FileText size={16} />
                View Preparation
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
                Add Notes
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Meetings;
