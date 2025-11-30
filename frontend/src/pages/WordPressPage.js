import React, { useState, useEffect, useRef } from 'react';
import { servicesAPI } from '../services/api';

const WordPressPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasLoadedRef = useRef(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await servicesAPI.getWordPress();
      setData(response.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('WordPress data fetch error:', err);
      setError(err.message || 'Failed to fetch WordPress data');
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

  const getStatusColor = (status) => {
    if (status === 'healthy' || status === 'operational' || status === 'online') return 'text-green-600 bg-green-100';
    if (status === 'warning' || status === 'degraded') return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusDot = (status) => {
    if (status === 'healthy' || status === 'operational' || status === 'online') return 'bg-green-500';
    if (status === 'warning' || status === 'degraded') return 'bg-yellow-500';
    return 'bg-red-500';
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
            <span className="text-3xl">🌐</span>
            WordPress
          </h1>
          <p className="text-gray-500 mt-1">server.mardeys.com</p>
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
          {/* Health Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Site Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${getStatusDot(data.health?.status)}`}></div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`font-semibold capitalize ${data.health?.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                    {data.health?.status || 'Unknown'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Response Time</p>
                <p className="font-semibold text-gray-900">{data.health?.responseTime || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">API Status</p>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(data.health?.apiStatus)}`}>
                  {data.health?.apiStatus || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">PHP Version</span>
                  <span className="font-medium text-gray-900">{data.systemInfo?.php_version || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">WordPress Version</span>
                  <span className="font-medium text-gray-900">{data.systemInfo?.wp_version || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">WooCommerce Version</span>
                  <span className="font-medium text-gray-900">{data.systemInfo?.wc_version || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Database Version</span>
                  <span className="font-medium text-gray-900">{data.systemInfo?.database_version || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Max Upload Size</span>
                  <span className="font-medium text-gray-900">{data.systemInfo?.max_upload_size || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Plugin Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Plugin Status</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">{data.plugins?.total || 0}</p>
                  <p className="text-sm text-gray-500">Total Plugins</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{data.plugins?.active || 0}</p>
                  <p className="text-sm text-gray-500">Active</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-3xl font-bold text-yellow-600">{data.plugins?.needsUpdate || 0}</p>
                  <p className="text-sm text-gray-500">Updates Available</p>
                </div>
              </div>
              
              {data.plugins?.list && data.plugins.list.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Active Plugins</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {data.plugins.list.map((plugin, index) => (
                      <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg text-sm">
                        <span className="text-gray-700">{plugin.name}</span>
                        <span className="text-gray-500 text-xs">{plugin.version}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

export default WordPressPage;
