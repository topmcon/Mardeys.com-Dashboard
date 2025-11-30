import React, { useState, useEffect, useRef } from 'react';
import { servicesAPI } from '../services/api';

const WooCommercePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasLoadedRef = useRef(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await servicesAPI.getWooCommerce();
      setData(response.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('WooCommerce data fetch error:', err);
      setError(err.message || 'Failed to fetch WooCommerce data');
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

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getStatusColor = (status) => {
    if (status === 'healthy' || status === 'operational' || status === 'online' || status === 'completed') return 'text-green-600 bg-green-100';
    if (status === 'warning' || status === 'degraded' || status === 'processing' || status === 'pending') return 'text-yellow-600 bg-yellow-100';
    if (status === 'on-hold') return 'text-blue-600 bg-blue-100';
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-3xl">🛒</span>
            WooCommerce
          </h1>
          <p className="text-gray-500 mt-1">E-commerce Store Analytics</p>
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
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
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
          {/* Health Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Store Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${data.health?.isUp ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`font-semibold capitalize ${data.health?.isUp ? 'text-green-600' : 'text-red-600'}`}>
                    {data.health?.isUp ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Response Time</p>
                <p className="font-semibold text-gray-900">{data.health?.responseTime ? data.health.responseTime + 'ms' : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Products Available</p>
                <p className="font-medium text-gray-900 text-sm">{data.health?.productsAvailable ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Order Statistics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📦 Order Statistics (Last 24 Hours)</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{data.orders?.last24Hours || 0}</p>
                <p className="text-sm text-gray-500">Orders Today</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{formatCurrency(data.orders?.revenue24Hours)}</p>
                <p className="text-sm text-gray-500">Revenue Today</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{formatCurrency(data.orders?.averageOrderValue)}</p>
                <p className="text-sm text-gray-500">Avg Order Value</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-3xl font-bold text-orange-600">{data.orders?.totalOrders || 0}</p>
                <p className="text-sm text-gray-500">Total Orders</p>
              </div>
            </div>
          </div>

          {/* Products and Customers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📦 Product Inventory</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">{data.products?.total || 0}</p>
                  <p className="text-sm text-gray-500">Total Products</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-3xl font-bold text-yellow-600">{data.products?.lowStock || 0}</p>
                  <p className="text-sm text-gray-500">Low Stock</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">{data.products?.outOfStock || 0}</p>
                  <p className="text-sm text-gray-500">Out of Stock</p>
                </div>
              </div>
              
              {/* Stock Alert */}
              {(data.products?.lowStock > 0 || data.products?.outOfStock > 0) && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ {data.products?.lowStock + data.products?.outOfStock} products need attention
                  </p>
                </div>
              )}
            </div>

            {/* Customer Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">👥 Customer Overview</h2>
              <div className="text-center p-6 bg-indigo-50 rounded-lg">
                <p className="text-5xl font-bold text-indigo-600">{data.customers?.total || 0}</p>
                <p className="text-gray-500 mt-2">Total Customers</p>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Data Source</span>
                  <span className="text-sm text-gray-500">WooCommerce Store API</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🕐 Recent Orders</h2>
            {data.recentActivity && data.recentActivity.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b">
                      <th className="pb-3 font-medium">Order ID</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Total</th>
                      <th className="pb-3 font-medium">Items</th>
                      <th className="pb-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.recentActivity.map((order, index) => (
                      <tr key={index} className="text-sm">
                        <td className="py-3 font-medium text-gray-900">#{order.id}</td>
                        <td className="py-3">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-900">{formatCurrency(order.total)}</td>
                        <td className="py-3 text-gray-600">{order.items} items</td>
                        <td className="py-3 text-gray-500">{new Date(order.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recent orders to display</p>
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

export default WooCommercePage;
