import React, { useState, useEffect, useCallback } from 'react';
import { alertsAPI } from '../services/api';
import { toast } from 'react-toastify';
import AlertCard from '../components/AlertCard';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays } from 'date-fns';

const Alerts = () => {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  const loadAlerts = useCallback(async () => {
    try {
      const response = await alertsAPI.getAlerts({ limit: 100 });
      setAlerts(response.data.alerts);
    } catch (error) {
      toast.error('Failed to load alerts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, [loadAlerts]);

  const handleAcknowledge = async (alertId) => {
    try {
      await alertsAPI.acknowledgeAlert(alertId);
      toast.success('Alert acknowledged');
      loadAlerts();
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await alertsAPI.resolveAlert(alertId);
      toast.success('Alert resolved');
      loadAlerts();
    } catch (error) {
      toast.error('Failed to resolve alert');
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'active' ? !alert.acknowledged && !alert.resolved :
      filter === 'acknowledged' ? alert.acknowledged && !alert.resolved :
      filter === 'resolved' ? alert.resolved : true;

    const matchesSearch = 
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.service.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = 
      selectedSeverity === 'all' ? true : alert.severity === selectedSeverity;

    return matchesFilter && matchesSearch && matchesSeverity;
  });

  const getAlertStats = () => {
    return {
      active: alerts.filter(a => !a.acknowledged && !a.resolved).length,
      acknowledged: alerts.filter(a => a.acknowledged && !a.resolved).length,
      resolved: alerts.filter(a => a.resolved).length,
      total: alerts.length
    };
  };

  const getSeverityData = () => {
    const severityCounts = {
      info: alerts.filter(a => a.severity === 'info' && !a.resolved).length,
      warning: alerts.filter(a => a.severity === 'warning' && !a.resolved).length,
      error: alerts.filter(a => a.severity === 'error' && !a.resolved).length,
      critical: alerts.filter(a => a.severity === 'critical' && !a.resolved).length
    };

    return [
      { name: 'Info', value: severityCounts.info, color: '#3b82f6' },
      { name: 'Warning', value: severityCounts.warning, color: '#f59e0b' },
      { name: 'Error', value: severityCounts.error, color: '#f97316' },
      { name: 'Critical', value: severityCounts.critical, color: '#ef4444' }
    ].filter(item => item.value > 0);
  };

  const getServiceData = () => {
    const services = ['wordpress', 'woocommerce', 'digitalocean', 'cloudflare'];
    return services.map(service => ({
      service: service.charAt(0).toUpperCase() + service.slice(1),
      count: alerts.filter(a => a.service === service && !a.resolved).length
    }));
  };

  const getTrendData = () => {
    const days = 7;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayAlerts = alerts.filter(a => {
        const alertDate = new Date(a.timestamp);
        return alertDate.toDateString() === day.toDateString();
      });

      data.push({
        date: format(day, 'MMM dd'),
        count: dayAlerts.length
      });
    }

    return data;
  };

  const stats = getAlertStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Alerts & Incidents</h1>
          <p className="text-gray-600">Monitor and manage system alerts</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm font-medium text-gray-600 mb-2">Active Alerts</p>
            <p className="text-3xl font-bold text-red-600">{stats.active}</p>
            <p className="text-xs text-gray-500 mt-2">Require attention</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm font-medium text-gray-600 mb-2">Acknowledged</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.acknowledged}</p>
            <p className="text-xs text-gray-500 mt-2">Being handled</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm font-medium text-gray-600 mb-2">Resolved</p>
            <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
            <p className="text-xs text-gray-500 mt-2">Last 7 days</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm font-medium text-gray-600 mb-2">MTTR</p>
            <p className="text-3xl font-bold text-blue-600">
              {alerts.filter(a => a.resolved && a.resolvedAt).length > 0
                ? Math.round(
                    alerts
                      .filter(a => a.resolved && a.resolvedAt)
                      .reduce((acc, a) => {
                        const diff = new Date(a.resolvedAt) - new Date(a.timestamp);
                        return acc + diff;
                      }, 0) /
                      alerts.filter(a => a.resolved && a.resolvedAt).length /
                      1000 /
                      60
                  )
                : 0}m
            </p>
            <p className="text-xs text-gray-500 mt-2">Mean time to resolve</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Active Alerts by Severity</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={getSeverityData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getSeverityData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Alerts by Service</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={getServiceData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="service" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-2">
              {['all', 'active', 'acknowledged', 'resolved'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
                    filter === f
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No alerts found</h3>
              <p className="text-gray-600">
                {filter === 'active' ? 'All systems are running smoothly!' : 'No alerts match your filters.'}
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <AlertCard
                key={alert._id}
                alert={alert}
                onAcknowledge={() => handleAcknowledge(alert._id)}
                onResolve={() => handleResolve(alert._id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;
