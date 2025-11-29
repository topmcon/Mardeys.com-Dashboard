import React, { useState, useEffect } from 'react';
import { dashboardAPI, metricsAPI, alertsAPI, connectWebSocket } from '../services/api';
import { toast } from 'react-toastify';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    loadDashboardData();
    
    // Connect to WebSocket for real-time updates
    const ws = connectWebSocket(handleWebSocketMessage);
    
    // Refresh data every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    
    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, []);

  const handleWebSocketMessage = (message) => {
    if (message.type === 'new_alert') {
      toast.warning(`New Alert: ${message.data.title}`);
      loadDashboardData();
    } else if (message.type === 'health_check' || message.type === 'metrics_update') {
      loadDashboardData();
    }
  };

  const loadDashboardData = async () => {
    try {
      const [overviewRes, alertsRes, metricsRes] = await Promise.all([
        dashboardAPI.getOverview(),
        alertsAPI.getAlerts({ status: 'active', limit: 10 }),
        metricsAPI.getLatest()
      ]);

      setOverview(overviewRes.data);
      setActiveAlerts(alertsRes.data.alerts);
      setMetrics(metricsRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await alertsAPI.acknowledgeAlert(alertId);
      toast.success('Alert acknowledged');
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const getHealthScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-600">
          Real-time monitoring for your e-commerce platform
        </p>
      </div>

      {/* Health Score & Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`rounded-full p-3 ${getHealthScoreColor(overview?.healthScore || 0)}`}>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    System Health Score
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {overview?.healthScore || 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-full p-3 bg-red-100 text-red-600">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Alerts
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {overview?.activeAlerts || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-full p-3 bg-orange-100 text-orange-600">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Warnings
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {overview?.alertSummary?.warning || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-full p-3 bg-red-100 text-red-600">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Critical Issues
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {overview?.alertSummary?.critical || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Active Alerts</h2>
        </div>
        <div className="px-6 py-4">
          {activeAlerts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No active alerts</p>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <div
                  key={alert._id}
                  className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">{alert.source}</span>
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {alert.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{alert.message}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {alert.status === 'active' && (
                    <button
                      onClick={() => handleAcknowledgeAlert(alert._id)}
                      className="ml-4 px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Service Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Service Status</h2>
          <div className="space-y-3">
            {['wordpress', 'woocommerce', 'digitalocean', 'cloudflare'].map((service) => {
              const status = overview?.metrics?.find(m => m._id.type === service)?.latestStatus || 'unknown';
              const statusColor = status === 'normal' ? 'bg-green-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-red-500';
              
              return (
                <div key={service} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${statusColor} mr-3`}></div>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {service}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 capitalize">{status}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last Health Check</span>
              <span className="text-sm font-medium text-gray-900">
                {overview?.timestamp ? formatDistanceToNow(new Date(overview.timestamp), { addSuffix: true }) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Metrics Tracked</span>
              <span className="text-sm font-medium text-gray-900">
                {overview?.metrics?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
