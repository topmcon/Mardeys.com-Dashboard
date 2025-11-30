import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { metricsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatDistanceToNow } from 'date-fns';

const ServiceDetail = () => {
  const { service } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState([]);
  const [stats, setStats] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    loadServiceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, timeRange]);

  const loadServiceData = async () => {
    try {
      const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 1;
      const [metricsRes, statsRes] = await Promise.all([
        metricsAPI.getMetrics({ type: service, hours, limit: 50 }),
        metricsAPI.getStats({ type: service, period: timeRange })
      ]);

      setMetrics(metricsRes.data.metrics);
      setStats(statsRes.data);
    } catch (error) {
      toast.error(`Failed to load ${service} data`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceConfig = (serviceName) => {
    const configs = {
      wordpress: {
        title: 'WordPress',
        icon: '🌐',
        color: '#3b82f6',
        metrics: ['responseTime', 'status'],
        description: 'WordPress site monitoring and performance'
      },
      woocommerce: {
        title: 'WooCommerce',
        icon: '🛒',
        color: '#8b5cf6',
        metrics: ['productsAvailable', 'responseTime'],
        description: 'WooCommerce store API health and availability'
      },
      digitalocean: {
        title: 'DigitalOcean',
        icon: '☁️',
        color: '#0080ff',
        metrics: ['status', 'cpu', 'memory'],
        description: 'Server infrastructure monitoring'
      },
      cloudflare: {
        title: 'Cloudflare',
        icon: '🔒',
        color: '#f38020',
        metrics: ['status', 'traffic'],
        description: 'DNS, CDN, and security monitoring'
      }
    };
    return configs[serviceName] || configs.wordpress;
  };

  const config = getServiceConfig(service);

  const getChartData = () => {
    return metrics.map(m => ({
      time: new Date(m.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      responseTime: m.data?.responseTime || 0,
      value: m.value || 0
    })).reverse();
  };

  const getRecentChecks = () => {
    return metrics.slice(0, 20).map(m => ({
      timestamp: m.timestamp,
      status: m.status,
      responseTime: m.data?.responseTime,
      value: m.value
    }));
  };

  const calculateUptime = () => {
    if (!metrics.length) return 100;
    const healthy = metrics.filter(m => m.status === 'normal').length;
    return ((healthy / metrics.length) * 100).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-6">
        <button
          onClick={() => navigate('/dashboard/services')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 text-sm font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All Services
        </button>

        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Services</h2>
        <nav className="space-y-1">
          {['wordpress', 'woocommerce', 'digitalocean', 'cloudflare'].map((s) => {
            const sConfig = getServiceConfig(s);
            return (
              <button
                key={s}
                onClick={() => navigate(`/dashboard/services/${s}`)}
                className={`
                  w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${service === s
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <span className="mr-3 text-lg">{sConfig.icon}</span>
                {sConfig.title}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{config.icon}</div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{config.title} Monitoring</h1>
                  <p className="text-gray-600 mt-1">{config.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {['1h', '24h', '7d'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      timeRange === range
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm font-medium text-gray-600 mb-2">Current Status</p>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  metrics[0]?.status === 'normal' ? 'bg-green-500' : 'bg-red-500'
                } animate-pulse`}></div>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics[0]?.status === 'normal' ? 'Healthy' : 'Issues'}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm font-medium text-gray-600 mb-2">Uptime ({timeRange})</p>
              <p className="text-2xl font-bold text-gray-900">{calculateUptime()}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.filter(m => m.status === 'normal').length} / {metrics.length} checks
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm font-medium text-gray-600 mb-2">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(metrics.reduce((acc, m) => acc + (m.data?.responseTime || 0), 0) / metrics.length)}ms
              </p>
              <p className="text-xs text-gray-500 mt-1">Last {metrics.length} checks</p>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Response Time Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" stroke="#9ca3af" style={{ fontSize: '12px' }} />
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
                <Line 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke={config.color} 
                  strokeWidth={2}
                  dot={{ fill: config.color, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Response Time (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Checks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Health Checks</h2>
            <div className="space-y-2">
              {getRecentChecks().map((check, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      check.status === 'normal' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm text-gray-600">
                      {formatDistanceToNow(new Date(check.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    {check.responseTime && (
                      <span className="text-sm font-medium text-gray-900">
                        {check.responseTime}ms
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      check.status === 'normal'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {check.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
