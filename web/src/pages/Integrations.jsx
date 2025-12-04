import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Link, CheckCircle, XCircle, RefreshCw, Trash2, Settings,
  ExternalLink, AlertCircle
} from 'lucide-react';
import { integrationService } from '../services/integrationService';

const INTEGRATION_CONFIGS = {
  notion: {
    name: 'Notion',
    description: 'Sync tasks and notes from your Notion workspace',
    icon: '📝',
    color: 'bg-gray-900',
    fields: [
      { key: 'api_key', label: 'Notion Integration Token', type: 'password', placeholder: 'secret_...' },
    ],
    helpUrl: 'https://www.notion.so/my-integrations',
    helpText: 'Create an integration at notion.so/my-integrations and copy the Internal Integration Token',
  },
  trello: {
    name: 'Trello',
    description: 'Sync cards and boards from Trello',
    icon: '📋',
    color: 'bg-blue-600',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'text', placeholder: 'Your Trello API key' },
      { key: 'api_token', label: 'API Token', type: 'password', placeholder: 'Your Trello token' },
    ],
    helpUrl: 'https://trello.com/power-ups/admin',
    helpText: 'Get your API key from trello.com/power-ups/admin, then generate a token',
  },
  google_calendar: {
    name: 'Google Calendar',
    description: 'Sync events from Google Calendar',
    icon: '📅',
    color: 'bg-blue-500',
    fields: [],
    oauth: true,
    helpText: 'Connect with your Google account',
  },
};

const Integrations = () => {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState({});
  const [showConfig, setShowConfig] = useState(null);
  const [configValues, setConfigValues] = useState({});

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const response = await integrationService.getIntegrations();
      setIntegrations(response.data || []);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIntegrationStatus = (type) => {
    return integrations.find((i) => i.integration_type === type);
  };

  const handleConnect = async (type) => {
    const config = INTEGRATION_CONFIGS[type];

    if (config.oauth) {
      toast.info('OAuth integration coming soon!');
      return;
    }

    setShowConfig(type);
    setConfigValues({});
  };

  const handleSaveConfig = async (type) => {
    const config = INTEGRATION_CONFIGS[type];

    // Validate fields
    for (const field of config.fields) {
      if (!configValues[field.key]) {
        toast.error(`Please enter ${field.label}`);
        return;
      }
    }

    try {
      if (type === 'notion') {
        await integrationService.connectNotion(configValues.api_key);
      } else if (type === 'trello') {
        await integrationService.connectTrello(configValues.api_key, configValues.api_token);
      }

      toast.success(`${config.name} connected successfully!`);
      setShowConfig(null);
      setConfigValues({});
      loadIntegrations();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to connect integration');
    }
  };

  const handleSync = async (type) => {
    setSyncing({ ...syncing, [type]: true });

    try {
      if (type === 'notion') {
        const result = await integrationService.syncNotion();
        toast.success(`Synced ${result.data?.synced || 0} items from Notion`);
      } else if (type === 'trello') {
        const result = await integrationService.syncTrello();
        toast.success(`Synced ${result.data?.synced || 0} items from Trello`);
      }
      loadIntegrations();
    } catch (error) {
      toast.error('Sync failed. Please check your credentials.');
    } finally {
      setSyncing({ ...syncing, [type]: false });
    }
  };

  const handleDisconnect = async (type) => {
    if (!confirm(`Disconnect ${INTEGRATION_CONFIGS[type].name}?`)) return;

    try {
      await integrationService.deleteIntegration(type);
      toast.success('Integration disconnected');
      loadIntegrations();
    } catch (error) {
      toast.error('Failed to disconnect integration');
    }
  };

  const handleToggle = async (type) => {
    try {
      const result = await integrationService.toggleIntegration(type);
      toast.success(result.data?.is_active ? 'Integration enabled' : 'Integration disabled');
      loadIntegrations();
    } catch (error) {
      toast.error('Failed to toggle integration');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading integrations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600 mt-2">Connect your favorite tools to sync tasks and data</p>
      </div>

      {/* Integration Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(INTEGRATION_CONFIGS).map(([type, config]) => {
          const status = getIntegrationStatus(type);
          const isConnected = !!status;
          const isActive = status?.is_active;
          const isSyncing = syncing[type];

          return (
            <div
              key={type}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden transition ${
                isConnected ? 'border-green-200' : 'border-gray-200'
              }`}
            >
              {/* Header */}
              <div className={`p-4 ${config.color} text-white flex items-center gap-3`}>
                <span className="text-3xl">{config.icon}</span>
                <div>
                  <h3 className="font-semibold text-lg">{config.name}</h3>
                  {isConnected && (
                    <span className="text-sm opacity-90 flex items-center gap-1">
                      <CheckCircle size={14} />
                      Connected
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                <p className="text-gray-600 text-sm mb-4">{config.description}</p>

                {isConnected ? (
                  <div className="space-y-3">
                    {/* Status */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Status</span>
                      <span
                        className={`flex items-center gap-1 ${
                          status.validation_status === 'valid' ? 'text-green-600' : 'text-yellow-600'
                        }`}
                      >
                        {status.validation_status === 'valid' ? (
                          <CheckCircle size={14} />
                        ) : (
                          <AlertCircle size={14} />
                        )}
                        {status.validation_status}
                      </span>
                    </div>

                    {status.last_sync_at && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Last Sync</span>
                        <span className="text-gray-700">
                          {new Date(status.last_sync_at).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {status.workspace_name && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Workspace</span>
                        <span className="text-gray-700">{status.workspace_name}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleSync(type)}
                        disabled={isSyncing}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition"
                      >
                        <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                      </button>

                      <button
                        onClick={() => handleToggle(type)}
                        className={`p-2 rounded-lg transition ${
                          isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title={isActive ? 'Disable' : 'Enable'}
                      >
                        {isActive ? <CheckCircle size={18} /> : <XCircle size={18} />}
                      </button>

                      <button
                        onClick={() => handleDisconnect(type)}
                        className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                        title="Disconnect"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleConnect(type)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition"
                    >
                      <Link size={16} />
                      Connect
                    </button>

                    {config.helpUrl && (
                      <a
                        href={config.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 text-sm text-primary hover:underline"
                      >
                        Get credentials
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Modal */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span className="text-2xl">{INTEGRATION_CONFIGS[showConfig].icon}</span>
                Connect {INTEGRATION_CONFIGS[showConfig].name}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {INTEGRATION_CONFIGS[showConfig].helpText && (
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm">
                  {INTEGRATION_CONFIGS[showConfig].helpText}
                </div>
              )}

              {INTEGRATION_CONFIGS[showConfig].fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={configValues[field.key] || ''}
                    onChange={(e) =>
                      setConfigValues({ ...configValues, [field.key]: e.target.value })
                    }
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              ))}

              {INTEGRATION_CONFIGS[showConfig].helpUrl && (
                <a
                  href={INTEGRATION_CONFIGS[showConfig].helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  How to get your credentials
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfig(null);
                  setConfigValues({});
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveConfig(showConfig)}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;
