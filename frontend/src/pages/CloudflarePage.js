import React, { useState, useEffect, useRef } from 'react';
import { servicesAPI } from '../services/api';

const CloudflarePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasLoadedRef = useRef(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await servicesAPI.getCloudflare();
      setData(response.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Cloudflare data fetch error:', err);
      setError(err.message || 'Failed to fetch Cloudflare data');
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

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

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
    if (status === 'pending' || status === 'initializing') return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-3xl">🔒</span>
            Cloudflare
          </h1>
          <p className="text-gray-500 mt-1">CDN & Security Analytics</p>
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
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
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
          {/* Zone Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🌐 Zone Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500">Zone Name</p>
                <p className="font-semibold text-gray-900">{data.zone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${data.health?.isHealthy ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                  {data.health?.status || 'Unknown'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Health</p>
                <p className="font-semibold text-gray-900 capitalize">{data.health?.isHealthy ? 'Healthy' : 'Unhealthy'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Checked</p>
                <p className="font-semibold text-gray-900 capitalize">{data.lastChecked ? new Date(data.lastChecked).toLocaleTimeString() : 'N/A'}</p>
              </div>
            </div>
            
            {/* Nameservers */}
            {data.health?.nameServers && data.health.nameServers.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Nameservers</p>
                <div className="flex flex-wrap gap-2">
                  {data.health.nameServers.map((ns, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-200 rounded-full text-sm font-mono text-gray-700">
                      {ns}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Traffic Analytics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📈 Traffic Analytics (Last 24 Hours)</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{formatNumber(data.analytics?.requests)}</p>
                <p className="text-sm text-gray-500">Total Requests</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{formatNumber(data.analytics?.pageViews)}</p>
                <p className="text-sm text-gray-500">Page Views</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{formatNumber(data.analytics?.uniqueVisitors)}</p>
                <p className="text-sm text-gray-500">Unique Visitors</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-3xl font-bold text-orange-600">{formatBytes(data.analytics?.bandwidth)}</p>
                <p className="text-sm text-gray-500">Bandwidth</p>
              </div>
            </div>
          </div>

          {/* Cache Stats and Security */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cache Statistics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">💾 Cache Performance</h2>
              <div className="space-y-4">
                {/* Cache Hit Ratio */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Cache Hit Ratio</span>
                    <span className="font-bold text-green-600">{data.cache?.hitRatio?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-green-500 transition-all duration-300"
                      style={{ width: `${Math.min(data.cache?.hitRatio || 0, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-900">{formatBytes(data.cache?.cachedBandwidth)}</p>
                    <p className="text-xs text-gray-500">Cached Bandwidth</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-900">{formatBytes(data.cache?.uncachedBandwidth)}</p>
                    <p className="text-xs text-gray-500">Uncached Bandwidth</p>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Bandwidth Saved</p>
                  <p className="text-2xl font-bold text-blue-600">{formatBytes(data.cache?.bandwidthSaved)}</p>
                </div>
              </div>
            </div>

            {/* Security Events */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🛡️ Security Overview</h2>
              <div className="space-y-4">
                <div className="text-center p-6 bg-red-50 rounded-lg">
                  <p className="text-4xl font-bold text-red-600">{formatNumber(data.security?.threatsBlocked)}</p>
                  <p className="text-gray-600">Threats Blocked</p>
                </div>
                
                {/* Top Threat Types */}
                {data.security?.topThreats && data.security.topThreats.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Top Threat Types</p>
                    <div className="space-y-2">
                      {data.security.topThreats.map((threat, index) => (
                        <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">{threat.type}</span>
                          <span className="text-sm font-medium text-gray-900">{formatNumber(threat.count)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Top Countries */}
                {data.security?.topCountries && data.security.topCountries.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Top Threat Origins</p>
                    <div className="flex flex-wrap gap-2">
                      {data.security.topCountries.map((country, index) => (
                        <span key={index} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                          {country.code}: {formatNumber(country.count)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DNS Records */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 DNS Records</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{data.dns?.totalRecords || 0}</p>
                <p className="text-sm text-gray-500">Total Records</p>
              </div>
              {data.dns?.byType && Object.entries(data.dns.byType).map(([type, count]) => (
                <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-500">{type} Records</p>
                </div>
              ))}
            </div>
            
            {/* DNS Records List */}
            {data.dns?.records && data.dns.records.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b">
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Content</th>
                      <th className="pb-3 font-medium">Proxied</th>
                      <th className="pb-3 font-medium">TTL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.dns.records.slice(0, 10).map((record, index) => (
                      <tr key={index} className="text-sm">
                        <td className="py-3">
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                            {record.type}
                          </span>
                        </td>
                        <td className="py-3 font-medium text-gray-900">{record.name}</td>
                        <td className="py-3 text-gray-600 font-mono text-xs max-w-xs truncate">
                          {record.content}
                        </td>
                        <td className="py-3">
                          {record.proxied ? (
                            <span className="text-orange-500">☁️ Yes</span>
                          ) : (
                            <span className="text-gray-400">⚪ No</span>
                          )}
                        </td>
                        <td className="py-3 text-gray-500">{record.ttl === 1 ? 'Auto' : record.ttl}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.dns.records.length > 10 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Showing 10 of {data.dns.records.length} records
                  </p>
                )}
              </div>
            )}
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

export default CloudflarePage;
