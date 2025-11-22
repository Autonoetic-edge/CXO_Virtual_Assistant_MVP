import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Calendar, Globe } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-toastify';

const Settings = () => {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState({
    timezone: user?.timezone || 'Asia/Kolkata',
    language: user?.language || 'en',
    work_hours_start: user?.work_hours_start || '09:00',
    work_hours_end: user?.work_hours_end || '19:00',
    email_notifications: true,
    slack_notifications: true,
    briefing_times: {
      morning: '07:00',
      midday: '12:00',
      eod: '18:30',
    },
  });

  const handleSave = async (e) => {
    e.preventDefault();
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon />
          Settings
        </h1>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <User size={20} />
            Profile
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                defaultValue={user?.first_name}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                defaultValue={user?.last_name}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Work Hours */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar size={20} />
            Work Hours
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={settings.work_hours_start}
                onChange={(e) =>
                  setSettings({ ...settings, work_hours_start: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={settings.work_hours_end}
                onChange={(e) =>
                  setSettings({ ...settings, work_hours_end: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Timezone & Language */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Globe size={20} />
            Localization
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) =>
                  setSettings({ ...settings, timezone: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={settings.language}
                onChange={(e) =>
                  setSettings({ ...settings, language: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Bell size={20} />
            Notifications
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.email_notifications}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    email_notifications: e.target.checked,
                  })
                }
                className="w-5 h-5 text-primary rounded focus:ring-primary"
              />
              <span className="text-gray-700">Email Notifications</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.slack_notifications}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    slack_notifications: e.target.checked,
                  })
                }
                className="w-5 h-5 text-primary rounded focus:ring-primary"
              />
              <span className="text-gray-700">Slack Notifications</span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition font-medium"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
