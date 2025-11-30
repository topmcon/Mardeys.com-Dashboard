import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { servicesAPI } from '../services/api';

const Overview = () => {
  const [servicesData, setServicesData] = useState({
    wordpress: null,
    woocommerce: null,
    digitalocean: null,
    cloudflare: null
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasLoadedRef = useRef(false);
  const navigate = useNavigate();

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const results = await Promise.allSettled([
        servicesAPI.getWordPress(),
        servicesAPI.getWooCommerce(),
        servicesAPI.getDigitalOcean(),
        servicesAPI.getCloudflare()
      ]);

      const newErrors = {};
      const newData = { wordpress: null, woocommerce: null, digitalocean: null, cloudflare: null };

      if (results[0].status === 'fulfilled') {
        newData.wordpress = results[0].value.data;
      } else {
        newErrors.wordpress = results[0].reason?.message || 'Failed to fetch';
      }

      if (results[1].status === 'fulfilled') {
        newData.woocommerce = results[1].value.data;
      } else {
        newErrors.woocommerce = results[1].reason?.message || 'Failed to fetch';
      }

      if (results[2].status === 'fulfilled') {
        newData.digitalocean = results[2].value.data;
      } else {
        newErrors.digitalocean = results[2].reason?.message || 'Failed to fetch';
      }

      if (results[3].status === 'fulfilled') {
        newData.cloudflare = results[3].value.data;
      } else {
        newErrors.cloudflare = results[3].reason?.message || 'Failed to fetch';
      }

      setServicesData(newData);
      setErrors(newErrors);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchAllData();
    }
  }, []);

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    if (num >= 1000000) return \`\${(num / 1000000).toFixed(1)}M\`;
    if (num >= 1000) return \`\${(num / 1000).toFixed(1)}K\`;
    return num.toString();
  };

  // Calculate overall health
  const calculateOverallHealth = () => {
    let healthy = 0;
    let total = 0;

    if (servicesData.wordpress?.health?.status === 'healthy') healthy++;
    if (servicesData.wordpress) total++;

    if (servicesData.woocommerce?.health?.status === 'healthy') healthy++;
    if (servicesData.woocommerce) total++;

    if (servicesData.digitalocean?.droplet?.status === 'active') healthy++;
    if (servicesData.digitalocean) total++;

    if (servicesData.cloudflare?.zone?.status === 'active') healthy++;
    if (servicesData.cloudflare) total++;

    return total > 0 ? Math.round((healthy / total) * 100) : 0;
  };

  const healthScore = calculateOverallHealth();

  if (loading && !servicesData.wordpress && !servicesData.woocommerce) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">All services at a glance</p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              '🔄'
            )}
            Refresh All
          </button>
        </div>
      </div>

      {/* Overall Health Score */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">System Health Score</p>
            <p className="text-5xl font-bold mt-1">{healthScore}%</p>
            <p className="text-blue-100 mt-2">
              {healthScore === 100 ? '✅ All systems operational' : 
               healthScore >= 75 ? '⚠️ Some services need attention' :
               '🚨 Critical issues detected'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Active Services</p>
            <p className="text-4xl font-bold">4</p>
          </div>
        </div>
      </div>

      {/* Services Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* WordPress Card */}
        <div 
          onClick={() => navigate('/dashboard/wordpress')}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">🌐</span>
            <div className={\`w-3 h-3 rounded-full \${
              servicesData.wordpress?.health?.status === 'healthy' ? 'bg-green-500' : 
              errors.wordpress ? 'bg-red-500' : 'bg-gray-300'
            }\`}></div>
          </div>
          <h3 className="font-semibold text-gray-900">WordPress</h3>
          <p className="text-sm text-gray-500 mt-1">
            {servicesData.wordpress?.health?.responseTime || 'N/A'}
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Plugins</span>
              <span className="font-medium">{servicesData.wordpress?.plugins?.active || 0} active</span>
            </div>
          </div>
        </div>

        {/* WooCommerce Card */}
        <div 
          onClick={() => navigate('/dashboard/woocommerce')}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">🛒</span>
            <div className={\`w-3 h-3 rounded-full \${
              servicesData.woocommerce?.health?.status === 'healthy' ? 'bg-green-500' : 
              errors.woocommerce ? 'bg-red-500' : 'bg-gray-300'
            }\`}></div>
          </div>
          <h3 className="font-semibold text-gray-900">WooCommerce</h3>
          <p className="text-sm text-gray-500 mt-1">
            {servicesData.woocommerce?.orders?.last24Hours || 0} orders today
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Revenue</span>
              <span className="font-medium text-green-600">
                {formatCurrency(servicesData.woocommerce?.orders?.revenue24Hours)}
              </span>
            </div>
          </div>
        </div>

        {/* DigitalOcean Card */}
        <div 
          onClick={() => navigate('/dashboard/digitalocean')}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">☁️</span>
            <div className={\`w-3 h-3 rounded-full \${
              servicesData.digitalocean?.droplet?.status === 'active' ? 'bg-green-500' : 
              errors.digitalocean ? 'bg-red-500' : 'bg-gray-300'
            }\`}></div>
          </div>
          <h3 className="font-semibold text-gray-900">DigitalOcean</h3>
          <p className="text-sm text-gray-500 mt-1">
            {servicesData.digitalocean?.droplet?.name || 'N/A'}
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">CPU</span>
              <span className={\`font-medium \${
                (servicesData.digitalocean?.metrics?.cpu || 0) > 70 ? 'text-yellow-600' : 'text-green-600'
              }\`}>
                {servicesData.digitalocean?.metrics?.cpu?.toFixed(1) || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Cloudflare Card */}
        <div 
          onClick={() => navigate('/dashboard/cloudflare')}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">🔒</span>
            <div className={\`w-3 h-3 rounded-full \${
              servicesData.cloudflare?.zone?.status === 'active' ? 'bg-green-500' : 
              errors.cloudflare ? 'bg-red-500' : 'bg-gray-300'
            }\`}></div>
          </div>
          <h3 className="font-semibold text-gray-900">Cloudflare</h3>
          <p className="text-sm text-gray-500 mt-1">
            {servicesData.cloudflare?.zone?.name || 'N/A'}
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Requests</span>
              <span className="font-medium">
                {formatNumber(servicesData.cloudflare?.analytics?.requests)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* E-commerce Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">📦 E-commerce Today</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Orders</span>
              <span className="text-2xl font-bold text-gray-900">
                {servicesData.woocommerce?.orders?.last24Hours || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Revenue</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(servicesData.woocommerce?.orders?.revenue24Hours)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Avg Order</span>
              <span className="text-lg font-semibold text-gray-700">
                {formatCurrency(servicesData.woocommerce?.orders?.averageOrderValue)}
              </span>
            </div>
          </div>
        </div>

        {/* Server Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">🖥️ Server Resources</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">CPU</span>
                <span className="font-medium">{servicesData.digitalocean?.metrics?.cpu?.toFixed(1) || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={\`h-2 rounded-full \${
                    (servicesData.digitalocean?.metrics?.cpu || 0) > 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }\`}
                  style={{ width: \`\${Math.min(servicesData.digitalocean?.metrics?.cpu || 0, 100)}%\` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Memory</span>
                <span className="font-medium">{servicesData.digitalocean?.metrics?.memory?.toFixed(1) || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={\`h-2 rounded-full \${
                    (servicesData.digitalocean?.metrics?.memory || 0) > 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }\`}
                  style={{ width: \`\${Math.min(servicesData.digitalocean?.metrics?.memory || 0, 100)}%\` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Disk</span>
                <span className="font-medium">{servicesData.digitalocean?.metrics?.disk?.toFixed(1) || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={\`h-2 rounded-full \${
                    (servicesData.digitalocean?.metrics?.disk || 0) > 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }\`}
                  style={{ width: \`\${Math.min(servicesData.digitalocean?.metrics?.disk || 0, 100)}%\` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">🛡️ Security (24h)</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Threats Blocked</span>
              <span className="text-2xl font-bold text-red-600">
                {formatNumber(servicesData.cloudflare?.security?.threatsBlocked)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Total Requests</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatNumber(servicesData.cloudflare?.analytics?.requests)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Cache Hit Rate</span>
              <span className="text-lg font-semibold text-green-600">
                {servicesData.cloudflare?.cache?.hitRatio?.toFixed(1) || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Alerts */}
      {(servicesData.woocommerce?.products?.lowStock > 0 || servicesData.woocommerce?.products?.outOfStock > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-semibold text-yellow-800 flex items-center gap-2">
            <span>⚠️</span> Inventory Alerts
          </h3>
          <p className="text-yellow-700 mt-2">
            {servicesData.woocommerce?.products?.lowStock || 0} products are low on stock, 
            {servicesData.woocommerce?.products?.outOfStock || 0} are out of stock.
          </p>
          <button 
            onClick={() => navigate('/dashboard/woocommerce')}
            className="mt-3 text-sm text-yellow-800 font-medium hover:underline"
          >
            View WooCommerce Details →
          </button>
        </div>
      )}

      {/* Plugin Updates */}
      {servicesData.wordpress?.plugins?.needsUpdate > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-800 flex items-center gap-2">
            <span>🔄</span> Plugin Updates Available
          </h3>
          <p className="text-blue-700 mt-2">
            {servicesData.wordpress.plugins.needsUpdate} WordPress plugins have updates available.
          </p>
          <button 
            onClick={() => navigate('/dashboard/wordpress')}
            className="mt-3 text-sm text-blue-800 font-medium hover:underline"
          >
            View WordPress Details →
          </button>
        </div>
      )}

      {/* Errors Section */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-semibold text-red-800 mb-2">⚠️ Service Errors</h3>
          <ul className="space-y-1">
            {Object.entries(errors).map(([service, error]) => (
              <li key={service} className="text-red-700 text-sm">
                <strong className="capitalize">{service}:</strong> {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Overview;
