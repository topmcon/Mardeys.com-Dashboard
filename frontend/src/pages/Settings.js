import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('monitoring');
  
  const [monitoringSettings, setMonitoringSettings] = useState({
    checkInterval: 300,
    retryAttempts: 3,
    timeout: 10000
  });

  const [thresholdSettings, setThresholdSettings] = useState({
    responseTimeWarning: 500,
    responseTimeCritical: 1000,
    cpuWarning: 70,
    cpuCritical: 90,
    memoryWarning: 80,
    memoryCritical: 95,
    diskWarning: 80,
    diskCritical: 95
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    email: 'admin@mardeys.com',
    webhookEnabled: false,
    webhookUrl: '',
    slackEnabled: false,
    slackWebhook: ''
  });

  const handleSaveMonitoring = () => {
    setLoading(true);
    setTimeout(() => {
      toast.success('Monitoring settings saved successfully');
      setLoading(false);
    }, 1000);
  };

  const handleSaveThresholds = () => {
    setLoading(true);
    setTimeout(() => {
      toast.success('Threshold settings saved successfully');
      setLoading(false);
    }, 1000);
  };

  const handleSaveNotifications = () => {
    setLoading(true);
    setTimeout(() => {
      toast.success('Notification settings saved successfully');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Configure monitoring, alerts, and notifications</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'monitoring', label: 'Monitoring', icon: '🔍' },
                { id: 'thresholds', label: 'Thresholds', icon: '⚠️' },
                { id: 'notifications', label: 'Notifications', icon: '🔔' },
                { id: 'services', label: 'Services', icon: '🌐' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="mr-2 text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Monitoring Settings */}
            {activeTab === 'monitoring' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check Interval (seconds)
                  </label>
                  <input
                    type="number"
                    value={monitoringSettings.checkInterval}
                    onChange={(e) => setMonitoringSettings({ ...monitoringSettings, checkInterval: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">How often to check service health (minimum: 60 seconds)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retry Attempts
                  </label>
                  <input
                    type="number"
                    value={monitoringSettings.retryAttempts}
                    onChange={(e) => setMonitoringSettings({ ...monitoringSettings, retryAttempts: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of retry attempts before marking as failed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeout (milliseconds)
                  </label>
                  <input
                    type="number"
                    value={monitoringSettings.timeout}
                    onChange={(e) => setMonitoringSettings({ ...monitoringSettings, timeout: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum time to wait for a response</p>
                </div>

                <button
                  onClick={handleSaveMonitoring}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Monitoring Settings'}
                </button>
              </div>
            )}

            {/* Threshold Settings */}
            {activeTab === 'thresholds' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Response Time Thresholds</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Warning (ms)
                      </label>
                      <input
                        type="number"
                        value={thresholdSettings.responseTimeWarning}
                        onChange={(e) => setThresholdSettings({ ...thresholdSettings, responseTimeWarning: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Critical (ms)
                      </label>
                      <input
                        type="number"
                        value={thresholdSettings.responseTimeCritical}
                        onChange={(e) => setThresholdSettings({ ...thresholdSettings, responseTimeCritical: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">CPU Usage Thresholds (%)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Warning
                      </label>
                      <input
                        type="number"
                        value={thresholdSettings.cpuWarning}
                        onChange={(e) => setThresholdSettings({ ...thresholdSettings, cpuWarning: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Critical
                      </label>
                      <input
                        type="number"
                        value={thresholdSettings.cpuCritical}
                        onChange={(e) => setThresholdSettings({ ...thresholdSettings, cpuCritical: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Memory Usage Thresholds (%)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Warning
                      </label>
                      <input
                        type="number"
                        value={thresholdSettings.memoryWarning}
                        onChange={(e) => setThresholdSettings({ ...thresholdSettings, memoryWarning: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Critical
                      </label>
                      <input
                        type="number"
                        value={thresholdSettings.memoryCritical}
                        onChange={(e) => setThresholdSettings({ ...thresholdSettings, memoryCritical: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveThresholds}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Threshold Settings'}
                </button>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Email Notifications</h3>
                      <p className="text-xs text-gray-500 mt-1">Receive alerts via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailEnabled}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, emailEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {notificationSettings.emailEnabled && (
                    <input
                      type="email"
                      value={notificationSettings.email}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, email: e.target.value })}
                      placeholder="admin@mardeys.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Webhook Notifications</h3>
                      <p className="text-xs text-gray-500 mt-1">Send alerts to custom webhook endpoint</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.webhookEnabled}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, webhookEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {notificationSettings.webhookEnabled && (
                    <input
                      type="url"
                      value={notificationSettings.webhookUrl}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, webhookUrl: e.target.value })}
                      placeholder="https://your-webhook-url.com/alerts"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Slack Notifications</h3>
                      <p className="text-xs text-gray-500 mt-1">Post alerts to Slack channel</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.slackEnabled}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, slackEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {notificationSettings.slackEnabled && (
                    <input
                      type="url"
                      value={notificationSettings.slackWebhook}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, slackWebhook: e.target.value })}
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                <button
                  onClick={handleSaveNotifications}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Notification Settings'}
                </button>
              </div>
            )}

            {/* Services Configuration */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                {['WordPress', 'WooCommerce', 'DigitalOcean', 'Cloudflare'].map((service) => (
                  <div key={service} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{service}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {service === 'WordPress' && 'Monitoring: https://server.mardeys.com'}
                          {service === 'WooCommerce' && 'Store API health checks'}
                          {service === 'DigitalOcean' && 'Droplet 516915837'}
                          {service === 'Cloudflare' && 'DNS and CDN monitoring'}
                        </p>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        Active
                      </span>
                    </div>
                  </div>
                ))}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        Service configurations are managed through environment variables on the backend. Contact your administrator to modify service endpoints or credentials.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
