import React, { useState, useEffect, useRef } from 'react';
import { servicesAPI } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import MetricCard from '../../components/ui/MetricCard';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import AlertBanner from '../../components/ui/AlertBanner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const BusinessKPIs = () => {
  const [woocommerce, setWoocommerce] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasLoadedRef = useRef(false);

  // Simulated revenue data (in real app, fetch from WooCommerce analytics)
  const [revenueHistory] = useState([
    { day: 'Mon', revenue: 1250, orders: 8 },
    { day: 'Tue', revenue: 1680, orders: 12 },
    { day: 'Wed', revenue: 2100, orders: 15 },
    { day: 'Thu', revenue: 1890, orders: 14 },
    { day: 'Fri', revenue: 2450, orders: 18 },
    { day: 'Sat', revenue: 3200, orders: 24 },
    { day: 'Sun', revenue: 2800, orders: 20 },
  ]);

  const [hourlyOrders] = useState([
    { hour: '12am', orders: 1 },
    { hour: '4am', orders: 0 },
    { hour: '8am', orders: 3 },
    { hour: '12pm', orders: 8 },
    { hour: '4pm', orders: 12 },
    { hour: '8pm', orders: 15 },
    { hour: 'Now', orders: 6 },
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await servicesAPI.getWooCommerce();
      setWoocommerce(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch WooCommerce data:', error);
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

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Simulated KPIs
  const todayRevenue = 2800;
  const todayOrders = 20;
  const avgOrderValue = todayRevenue / todayOrders;
  const conversionRate = 3.2;
  const cartAbandonmentRate = 68;

  // Product category distribution
  const categoryData = [
    { name: 'Electronics', value: 35, color: '#6366f1' },
    { name: 'Clothing', value: 28, color: '#8b5cf6' },
    { name: 'Home', value: 22, color: '#10b981' },
    { name: 'Other', value: 15, color: '#f59e0b' },
  ];

  const RefreshButton = () => (
    <button
      onClick={fetchData}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border/50 text-text-secondary hover:text-text-primary hover:border-primary/50 transition-all disabled:opacity-50"
    >
      <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {loading ? 'Refreshing...' : 'Refresh'}
    </button>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-text-secondary text-sm mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="font-medium">
              {entry.name}: {entry.name === 'Revenue' ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout 
      title="Business KPIs" 
      subtitle="WooCommerce sales & analytics"
      actions={<RefreshButton />}
    >
      <div className="space-y-8">
        {/* Store Status */}
        {!woocommerce?.health?.isUp && (
          <AlertBanner
            type="danger"
            title="Store Offline"
            message="WooCommerce API is not responding. Customer checkout may be affected."
          />
        )}

        {/* Hero KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Today's Revenue"
            value={formatCurrency(todayRevenue)}
            status="good"
            icon={<span className="text-xl">💰</span>}
            change="+12%"
            subtitle="vs yesterday"
          />
          <MetricCard
            title="Orders Today"
            value={todayOrders}
            status="good"
            icon={<span className="text-xl">📦</span>}
            change="+8%"
            subtitle="vs yesterday"
          />
          <MetricCard
            title="Avg Order Value"
            value={formatCurrency(avgOrderValue)}
            status="good"
            icon={<span className="text-xl">🎯</span>}
            change="+3%"
            subtitle="vs last week"
          />
          <MetricCard
            title="Conversion Rate"
            value={`${conversionRate}%`}
            status={conversionRate >= 3 ? 'good' : 'warning'}
            icon={<span className="text-xl">📈</span>}
            subtitle="Sessions → Orders"
          />
        </div>

        {/* Store Health Banner */}
        <GlassCard padding="default">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-success to-emerald-600 flex items-center justify-center text-3xl">
                🛒
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">WooCommerce Store</h2>
                <p className="text-text-secondary">{woocommerce?.url || 'Loading...'}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <StatusBadge 
                status={woocommerce?.health?.isUp ? 'online' : 'offline'} 
                size="large"
              />
              <div className="text-right">
                <p className="text-2xl font-bold text-text-primary">{woocommerce?.health?.responseTime || 0}ms</p>
                <p className="text-xs text-text-secondary">API Response</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Revenue */}
          <GlassCard padding="default">
            <h3 className="text-lg font-semibold text-text-primary mb-6">Weekly Revenue</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueHistory}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" />
                  <XAxis dataKey="day" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Revenue"
                    stroke="#10b981" 
                    fill="url(#revenueGradient)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Orders by Hour */}
          <GlassCard padding="default">
            <h3 className="text-lg font-semibold text-text-primary mb-6">Orders Today (Hourly)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyOrders}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" />
                  <XAxis dataKey="hour" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="orders" 
                    name="Orders"
                    fill="#6366f1" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Product & Inventory Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Stats */}
          <GlassCard padding="default">
            <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
              <span>📦</span> Product Inventory
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border/30">
                <span className="text-text-secondary">Total Products</span>
                <span className="text-2xl font-bold text-text-primary">{woocommerce?.products?.total || 0}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/30">
                <span className="text-text-secondary">Published</span>
                <span className="text-success font-bold">{woocommerce?.products?.byStatus?.publish || 0}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/30">
                <span className="text-text-secondary">Draft</span>
                <span className="text-warning font-bold">{woocommerce?.products?.byStatus?.draft || 0}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-text-secondary">Private</span>
                <span className="text-text-primary">{woocommerce?.products?.byStatus?.private || 0}</span>
              </div>
            </div>
          </GlassCard>

          {/* Category Distribution */}
          <GlassCard padding="default">
            <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
              <span>📊</span> Sales by Category
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {categoryData.map((cat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                  <span className="text-xs text-text-secondary">{cat.name} ({cat.value}%)</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Quick Stats */}
          <GlassCard padding="default">
            <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
              <span>🎯</span> Funnel Metrics
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-danger/10 border border-danger/20">
                <p className="text-text-secondary text-sm">Cart Abandonment</p>
                <p className="text-3xl font-bold text-danger">{cartAbandonmentRate}%</p>
              </div>
              <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                <p className="text-text-secondary text-sm">Checkout Success</p>
                <p className="text-3xl font-bold text-success">{100 - cartAbandonmentRate}%</p>
              </div>
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-text-secondary text-sm">Return Rate</p>
                <p className="text-3xl font-bold text-primary">2.5%</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Product Types & Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Types */}
          <GlassCard padding="default">
            <h3 className="text-lg font-semibold text-text-primary mb-6">Product Types</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(woocommerce?.products?.byType || {}).map(([type, count], i) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-border/50 text-center">
                  <p className="text-2xl font-bold text-text-primary">{count}</p>
                  <p className="text-xs text-text-secondary capitalize mt-1">{type}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Top Products */}
          <GlassCard padding="default">
            <h3 className="text-lg font-semibold text-text-primary mb-6">Top Selling Products</h3>
            <div className="space-y-3">
              {[
                { name: 'Premium Widget Pro', sales: 245, revenue: 12250 },
                { name: 'Basic Starter Kit', sales: 189, revenue: 5670 },
                { name: 'Advanced Package', sales: 156, revenue: 15600 },
                { name: 'Essential Bundle', sales: 134, revenue: 6700 },
                { name: 'Pro Upgrade', sales: 98, revenue: 9800 },
              ].map((product, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-text-secondary w-6">{i + 1}</span>
                    <span className="text-text-primary">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-success font-bold">{formatCurrency(product.revenue)}</p>
                    <p className="text-xs text-text-secondary">{product.sales} sold</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* API Health */}
        <GlassCard padding="default">
          <h3 className="text-lg font-semibold text-text-primary mb-6">Store API Health</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-border/50 text-center">
              <StatusBadge status={woocommerce?.health?.productsAvailable ? 'online' : 'offline'} size="small" />
              <p className="text-sm text-text-secondary mt-2">Products API</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-border/50 text-center">
              <StatusBadge status="online" size="small" />
              <p className="text-sm text-text-secondary mt-2">Orders API</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-border/50 text-center">
              <StatusBadge status="online" size="small" />
              <p className="text-sm text-text-secondary mt-2">Customers API</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-border/50 text-center">
              <StatusBadge status="online" size="small" />
              <p className="text-sm text-text-secondary mt-2">Payments API</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
};

export default BusinessKPIs;
