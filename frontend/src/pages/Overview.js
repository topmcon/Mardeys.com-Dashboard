import React, { useState, useEffect, useRef } from 'react';
import { dashboardAPI, metricsAPI, alertsAPI } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import StatCard from '../components/StatCard';
import ServiceStatusCard from '../components/ServiceStatusCard';
import AlertCard from '../components/AlertCard';

const Overview = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const hasLoadedRef = useRef(false);

  const loadDashboardData = async () => {
    // Prevent multiple loads using ref
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    
    try {
      const [overviewRes, alertsRes, metricsRes] = await Promise.all([
        dashboardAPI.getOverview(),
        alertsAPI.getAlerts({ status: 'active', limit: 5 }),
        metricsAPI.getMetrics({ hours: 24, limit: 20 })
      ]);

      setOverview(overviewRes.data);
      setActiveAlerts(alertsRes.data.alerts);
      
      // Process metrics for charts
      const processedMetrics = processMetricsForCharts(metricsRes.data.metrics);
      setChartData(processedMetrics);
    } catch (error) {
      console.error('Dashboard data error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency - run ONCE on mount only

  const processMetricsForCharts = (metricsData) => {
    // Group by timestamp and aggregate response times
    const grouped = {};
    metricsData.forEach(metric => {
      const time = new Date(metric.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      if (!grouped[time]) {
        grouped[time] = { time, wordpress: 0, woocommerce: 0, count: {} };
      }
      if (metric.type === 'wordpress' && metric.data.responseTime) {
        grouped[time].wordpress = metric.data.responseTime;
      }
      if (metric.type === 'woocommerce' && metric.data.responseTime) {
        grouped[time].woocommerce = metric.data.responseTime;
      }
    });
    
    return Object.values(grouped).slice(-12); // Last 12 data points
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await alertsAPI.acknowledgeAlert(alertId);
      // Reload page to refresh data
      window.location.reload();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const getHealthScoreColor = (score) => {
    if (score >= 90) return 'green';
    if (score >= 70) return 'yellow';
    if (score >= 50) return 'orange';
    return 'red';
  };

  const getServiceStatus = (serviceType) => {
    const metric = overview?.metrics?.find(m => m._id?.type === serviceType);
    return metric?.latestStatus || 'unknown';
  };

  const getServiceValue = (serviceType) => {
    const metric = overview?.metrics?.find(m => m._id?.type === serviceType);
    const data = metric?.latestData;
    
    switch (serviceType) {
      case 'wordpress':
        return data?.responseTime ? `${data.responseTime}ms` : 'N/A';
      case 'woocommerce':
        return data?.productsAvailable ? '✓ Active' : 'N/A';
      case 'digitalocean':
        return data?.status === 'active' ? 'Active' : 'N/A';
      case 'cloudflare':
        return data?.status === 'active' ? 'Active' : 'N/A';
      default:
        return 'N/A';
    }
  };

  const getServiceMetric = (serviceType) => {
    switch (serviceType) {
      case 'wordpress':
        return 'Site Performance';
      case 'woocommerce':
        return 'Store Status';
      case 'digitalocean':
        return 'Server Status';
      case 'cloudflare':
        return 'DNS & CDN';
      default:
        return 'Status';
    }
  };

  const getServiceResponseTime = (serviceType) => {
    const metric = overview?.metrics?.find(m => m._id?.type === serviceType);
    return metric?.latestData?.responseTime ? `${metric.latestData.responseTime}ms` : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">System Overview</h1>
            <p className="text-gray-600">
              Real-time monitoring for your e-commerce infrastructure
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Last updated</p>
            <p className="text-sm font-medium text-gray-900">
              {overview?.timestamp ? formatDistanceToNow(new Date(overview.timestamp), { addSuffix: true }) : 'Just now'}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="System Health Score"
          value={`${overview?.healthScore || 0}%`}
          color={getHealthScoreColor(overview?.healthScore || 0)}
          icon={
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          }
          subtitle="All systems operational"
        />
        
        <StatCard
          title="Active Alerts"
          value={overview?.activeAlerts || 0}
          color={overview?.activeAlerts > 0 ? 'red' : 'green'}
          icon={
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          }
          subtitle={overview?.activeAlerts > 0 ? 'Requires attention' : 'No issues'}
        />

        <StatCard
          title="Services Online"
          value={`${overview?.metrics?.filter(m => m.latestStatus === 'normal').length || 0}/${overview?.metrics?.length || 4}`}
          color="blue"
          icon={
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
          }
          subtitle="Monitoring 4 services"
        />

        <StatCard
          title="Avg Response Time"
          value={`${Math.round(overview?.metrics?.reduce((acc, m) => acc + (m.latestData?.responseTime || 0), 0) / (overview?.metrics?.length || 1))}ms`}
          color="purple"
          icon={
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          }
          subtitle="Across all services"
        />
      </div>

      {/* Service Status Cards */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Service Status</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {['wordpress', 'woocommerce', 'digitalocean', 'cloudflare'].map((service) => (
            <ServiceStatusCard
              key={service}
              service={service}
              status={getServiceStatus(service) === 'normal' ? 'healthy' : getServiceStatus(service) === 'warning' ? 'warning' : 'critical'}
              metric={getServiceMetric(service)}
              value={getServiceValue(service)}
              responseTime={getServiceResponseTime(service)}
            />
          ))}
        </div>
      </div>

      {/* Performance Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Response Time Trends (Last 24 Hours)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorWp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorWc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="wordpress" stroke="#3b82f6" fillOpacity={1} fill="url(#colorWp)" strokeWidth={2} name="WordPress" />
              <Area type="monotone" dataKey="woocommerce" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorWc)" strokeWidth={2} name="WooCommerce" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Active Alerts</h2>
            <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
              {activeAlerts.length} Active
            </span>
          </div>
          <div className="space-y-4">
            {activeAlerts.map((alert) => (
              <AlertCard
                key={alert._id}
                alert={alert}
                onAcknowledge={handleAcknowledgeAlert}
              />
            ))}
          </div>
        </div>
      )}

      {activeAlerts.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All Clear!</h3>
          <p className="text-gray-600">No active alerts. Your system is running smoothly.</p>
        </div>
      )}
    </div>
  );
};

export default Overview;
