import React, { useState, useEffect, useRef } from 'react';
import { metricsAPI } from '../services/api';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [metrics, setMetrics] = useState([]);
  const hasLoadedRef = useRef({});

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const loadAnalytics = async () => {
    if (hasLoadedRef.current[timeRange]) return;
    hasLoadedRef.current[timeRange] = true;
    
    setLoading(false);
    
    // Use mock data - API calls disabled
    setMetrics({ wordpress: [], woocommerce: [] });
  };

  const getPerformanceData = () => {
    if (!metrics.wordpress || !metrics.woocommerce) return [];
    
    const wpMap = new Map();
    metrics.wordpress.forEach(m => {
      const time = format(new Date(m.timestamp), 'MMM dd HH:mm');
      wpMap.set(time, m.data?.responseTime || 0);
    });

    const wcMap = new Map();
    metrics.woocommerce.forEach(m => {
      const time = format(new Date(m.timestamp), 'MMM dd HH:mm');
      wcMap.set(time, m.data?.responseTime || 0);
    });

    const allTimes = [...new Set([...wpMap.keys(), ...wcMap.keys()])].sort();
    
    return allTimes.slice(-50).map(time => ({
      time,
      wordpress: wpMap.get(time) || 0,
      woocommerce: wcMap.get(time) || 0
    }));
  };

  const getUptimeData = () => {
    if (!metrics.wordpress || !metrics.woocommerce) return [];
    
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const wpDayMetrics = metrics.wordpress.filter(m => {
        const time = new Date(m.timestamp);
        return time >= dayStart && time <= dayEnd;
      });

      const wcDayMetrics = metrics.woocommerce.filter(m => {
        const time = new Date(m.timestamp);
        return time >= dayStart && time <= dayEnd;
      });

      const wpUptime = wpDayMetrics.length > 0
        ? (wpDayMetrics.filter(m => m.status === 'normal').length / wpDayMetrics.length) * 100
        : 100;

      const wcUptime = wcDayMetrics.length > 0
        ? (wcDayMetrics.filter(m => m.status === 'normal').length / wcDayMetrics.length) * 100
        : 100;

      data.push({
        date: format(day, 'MMM dd'),
        wordpress: parseFloat(wpUptime.toFixed(2)),
        woocommerce: parseFloat(wcUptime.toFixed(2))
      });
    }

    return data;
  };

  const getErrorRateData = () => {
    if (!metrics.wordpress || !metrics.woocommerce) return [];
    
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const wpDayMetrics = metrics.wordpress.filter(m => {
        const time = new Date(m.timestamp);
        return time >= dayStart && time <= dayEnd;
      });

      const wcDayMetrics = metrics.woocommerce.filter(m => {
        const time = new Date(m.timestamp);
        return time >= dayStart && time <= dayEnd;
      });

      const wpErrors = wpDayMetrics.filter(m => m.status !== 'normal').length;
      const wcErrors = wcDayMetrics.filter(m => m.status !== 'normal').length;

      data.push({
        date: format(day, 'MMM dd'),
        wordpress: wpErrors,
        woocommerce: wcErrors
      });
    }

    return data;
  };

  const calculateAverageResponseTime = (serviceMetrics) => {
    if (!serviceMetrics || serviceMetrics.length === 0) return 0;
    const sum = serviceMetrics.reduce((acc, m) => acc + (m.data?.responseTime || 0), 0);
    return Math.round(sum / serviceMetrics.length);
  };

  const calculateUptime = (serviceMetrics) => {
    if (!serviceMetrics || serviceMetrics.length === 0) return 100;
    const healthy = serviceMetrics.filter(m => m.status === 'normal').length;
    return ((healthy / serviceMetrics.length) * 100).toFixed(2);
  };

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
              <p className="text-gray-600">Historical performance and trends analysis</p>
            </div>
            <div className="flex items-center space-x-2">
              {['24h', '7d', '30d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    timeRange === range
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {range === '24h' ? 'Last 24 Hours' : range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm font-medium text-gray-600 mb-2">WordPress Uptime</p>
            <p className="text-3xl font-bold text-green-600">
              {calculateUptime(metrics.wordpress)}%
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Avg: {calculateAverageResponseTime(metrics.wordpress)}ms
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm font-medium text-gray-600 mb-2">WooCommerce Uptime</p>
            <p className="text-3xl font-bold text-purple-600">
              {calculateUptime(metrics.woocommerce)}%
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Avg: {calculateAverageResponseTime(metrics.woocommerce)}ms
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm font-medium text-gray-600 mb-2">Total Checks</p>
            <p className="text-3xl font-bold text-blue-600">
              {(metrics.wordpress?.length || 0) + (metrics.woocommerce?.length || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-2">All services combined</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm font-medium text-gray-600 mb-2">Error Rate</p>
            <p className="text-3xl font-bold text-red-600">
              {(((metrics.wordpress?.filter(m => m.status !== 'normal').length || 0) + 
                 (metrics.woocommerce?.filter(m => m.status !== 'normal').length || 0)) / 
                ((metrics.wordpress?.length || 1) + (metrics.woocommerce?.length || 1)) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-2">Failed health checks</p>
          </div>
        </div>

        {/* Performance Comparison */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Response Time Comparison</h2>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={getPerformanceData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="wordpress" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
                name="WordPress"
              />
              <Line 
                type="monotone" 
                dataKey="woocommerce" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={false}
                name="WooCommerce"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Uptime Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Daily Uptime Percentage</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={getUptimeData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} domain={[90, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value) => `${value}%`}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="wordpress" 
                stroke="#3b82f6" 
                fill="#3b82f6"
                fillOpacity={0.2}
                name="WordPress"
              />
              <Area 
                type="monotone" 
                dataKey="woocommerce" 
                stroke="#8b5cf6" 
                fill="#8b5cf6"
                fillOpacity={0.2}
                name="WooCommerce"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Error Rate Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Daily Error Count</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getErrorRateData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="wordpress" fill="#3b82f6" radius={[8, 8, 0, 0]} name="WordPress" />
              <Bar dataKey="woocommerce" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="WooCommerce" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
