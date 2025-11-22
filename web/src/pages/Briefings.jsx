import React from 'react';
import { FileText, Mail, Download } from 'lucide-react';

const Briefings = () => {
  const briefings = [
    {
      id: '1',
      type: 'morning',
      date: '2024-01-15',
      title: 'Morning Briefing - January 15, 2024',
      delivered: true,
    },
    {
      id: '2',
      type: 'eod',
      date: '2024-01-14',
      title: 'End of Day Summary - January 14, 2024',
      delivered: true,
    },
    {
      id: '3',
      type: 'weekly',
      date: '2024-01-12',
      title: 'Weekly Digest - Week of January 8-12, 2024',
      delivered: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FileText />
          Briefings
        </h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition">
          <Mail size={18} />
          Email Preferences
        </button>
      </div>

      <div className="grid gap-4">
        {briefings.map((briefing) => (
          <div
            key={briefing.id}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {briefing.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {briefing.type === 'morning' && '7:00 AM IST'}
                  {briefing.type === 'eod' && '6:30 PM IST'}
                  {briefing.type === 'weekly' && 'Friday 5:00 PM IST'}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <Download size={18} />
                </button>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center">
                  ✓ Delivered
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Briefings;
