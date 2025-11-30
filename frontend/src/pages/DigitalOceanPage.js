import React, { useState, useEffect, useRef } from 'react';
import { servicesAPI } from '../services/api';

const DigitalOceanPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasLoadedRef = useRef(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await servicesAPI.getDigitalOcean();
      setData(response.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('DigitalOcean data fetch error:', err);
      setError(err.message || 'Failed to fetch DigitalOcean data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchData();
    }
  }, []);

  const formatBytes = (bytes) => {
    if (!bytes) return 'N/A';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(2)} KB`;
  };

  const getStatusColor = (status) => {
    if (status === 'active' || status === 'healthy' || status === 'online') return 'text-green-600 bg-green-100';
    if (status === 'warning' || status === 'new') return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getMetricColor = (value, thresholds = { warning: 70, critical: 90 }) => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (value, thresholds = { warning: 70, critical: 90 }) => {
    if (value >= thresholds.critical) return 'bg-red-500';
    if (value >= thresholds.warning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-3xl">☁️</span>
            DigitalOcean
          </h1>
          <p className="text-gray-500 mt-1">Cloud Infrastructure Monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              '🔄'
            )}
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {data && (
        <>
          {/* Droplet Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🖥️ Droplet Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-semibold text-gray-900">{data.droplet?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(data.droplet?.status)}`}>
                  {data.droplet?.status || 'Unknown'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Region</p>
                <p className="font-semibold text-gray-900">{data.droplet?.region || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Size</p>
                <p className="font-semibold text-gray-900">{data.droplet?.size || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Public IP</p>
                <p className="font-mono text-gray-900">{data.droplet?.ip || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Private IP</p>
                <p className="font-mono text-gray-900">{data.droplet?.privateIp || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Image</p>
                <p className="font-semibold text-gray-900">{data.droplet?.image || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-gray-900">{data.droplet?.created ? new Date(data.droplet.created).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Resource Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Resource Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* CPU */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">CPU Usage</span>
                  <span className={`font-bold ${getMetricColor(data.metrics?.cpu || 0)}`}>
                    {data.metrics?.cpu?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(data.metrics?.cpu || 0)}`}
                    style={{ width: `${Math.min(data.metrics?.cpu || 0, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Memory */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Memory Usage</span>
                  <span className={`font-bold ${getMetricColor(data.metrics?.memory || 0)}`}>
                    {data.metrics?.memory?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(data.metrics?.memory || 0)}`}
                    style={{ width: `${Math.min(data.metrics?.memory || 0, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Disk */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Disk Usage</span>
                  <span className={`font-bold ${getMetricColor(data.metrics?.disk || 0)}`}>
                    {data.metrics?.disk?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(data.metrics?.disk || 0)}`}
                    style={{ width: `${Math.min(data.metrics?.disk || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Bandwidth Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📥 Bandwidth Usage</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{formatBytes(data.metrics?.bandwidthIn)}</p>
                  <p className="text-sm text-gray-500">Inbound</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{formatBytes(data.metrics?.bandwidthOut)}</p>
                  <p className="text-sm text-gray-500">Outbound</p>
                </div>
              </div>
            </div>

            {/* Billing Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">💰 Billing Information</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Month-to-date Usage</span>
                  <span className="font-bold text-gray-900">${data.billing?.monthToDateUsage?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Account Balance</span>
                  <span className="font-bold text-green-600">${data.billing?.accountBalance?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Last Payment</span>
                  <span className="text-gray-900">
                    {data.billing?.lastPaymentDate 
                      ? new Date(data.billing.lastPaymentDate).toLocaleDateString() 
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Health Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🏥 Health Checks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg ${data.health?.overall === 'healthy' ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${data.health?.overall === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="font-medium">Overall</span>
                </div>
                <p className={`mt-1 capitalize ${data.health?.overall === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                  {data.health?.overall || 'Unknown'}
                </p>
              </div>
              
              {data.health?.checks && Object.entries(data.health.checks).map(([key, value]) => (
                <div key={key} className={`p-4 rounded-lg ${value ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                  <p className={`mt-1 ${value ? 'text-green-600' : 'text-red-600'}`}>
                    {value ? 'Passing' : 'Failing'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Raw Data (Debug) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Raw API Response</h2>
              <pre className="text-green-400 text-xs overflow-auto max-h-64">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DigitalOceanPage;
