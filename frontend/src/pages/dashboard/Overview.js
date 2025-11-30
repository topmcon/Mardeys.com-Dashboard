import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { servicesAPI } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import MetricCard from '../../components/ui/MetricCard';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import ProgressGauge from '../../components/ui/ProgressGauge';
import AlertBanner from '../../components/ui/AlertBanner';

const NewOverview = () => {
  const [servicesData, setServicesData] = useState({
    wordpress: null,
    woocommerce: null,
    digitalocean: null,
    cloudflare: null
  });
  const [loading, setLoading] = useState(true);
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

      const newData = { wordpress: null, woocommerce: null, digitalocean: null, cloudflare: null };

      if (results[0].status === 'fulfilled') newData.wordpress = results[0].value.data;
      if (results[1].status === 'fulfilled') newData.woocommerce = results[1].value.data;
      if (results[2].status === 'fulfilled') newData.digitalocean = results[2].value.data;
      if (results[3].status === 'fulfilled') newData.cloudflare = results[3].value.data;

      setServicesData(newData);
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
    if (value === null || value === undefined) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Calculate overall system health
  const getSystemHealth = () => {
    let healthy = 0;
    let total = 0;

    if (servicesData.wordpress) {
      total++;
      if (servicesData.wordpress?.health?.isUp) healthy++;
    }
    if (servicesData.woocommerce) {
      total++;
      if (servicesData.woocommerce?.health?.isUp) healthy++;
    }
    if (servicesData.digitalocean) {
      total++;
      if (servicesData.digitalocean?.health?.isHealthy) healthy++;
    }
    if (servicesData.cloudflare) {
      total++;
      if (servicesData.cloudflare?.health?.isHealthy) healthy++;
    }

    return total > 0 ? Math.round((healthy / total) * 100) : 0;
  };

  const healthScore = getSystemHealth();

  const RefreshButton = () => (
    <button
      onClick={fetchAllData}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border/50 text-text-secondary hover:text-text-primary hover:border-primary/50 transition-all disabled:opacity-50"
    >
      <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {loading ? 'Refreshing...' : 'Refresh'}
    </button>
  );

  if (loading && !servicesData.wordpress) {
    return (
      <DashboardLayout title="Loading..." subtitle="Fetching system data">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="System Overview" 
      subtitle={lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : 'Real-time monitoring'}
      actions={<RefreshButton />}
    >
      <div className="space-y-8">
        {/* System Health Hero */}
        <GlassCard padding="large" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-600/10" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm font-medium mb-2">SYSTEM HEALTH SCORE</p>
              <div className="flex items-baseline gap-4">
                <span className="text-7xl font-bold bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {healthScore}%
                </span>
                <StatusBadge 
                  status={healthScore === 100 ? 'healthy' : healthScore >= 75 ? 'warning' : 'critical'} 
                  size="large"
                />
              </div>
              <p className="text-text-secondary mt-4">
                {healthScore === 100 
                  ? '✨ All systems operational - Your infrastructure is running perfectly' 
                  : healthScore >= 75 
                    ? '⚠️ Some services need attention' 
                    : '🚨 Critical issues detected - Immediate action required'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-text-secondary text-sm mb-2">Active Services</p>
              <p className="text-5xl font-bold text-text-primary">4</p>
              <p className="text-text-secondary text-sm mt-2">of 4 monitored</p>
            </div>
          </div>
        </GlassCard>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Website Response"
            value={servicesData.wordpress?.health?.responseTime ? `${servicesData.wordpress.health.responseTime}ms` : 'N/A'}
            status={servicesData.wordpress?.health?.isUp ? 'good' : 'danger'}
            icon={<span className="text-xl">🌐</span>}
            subtitle="server.mardeys.com"
            onClick={() => navigate('/dashboard/website')}
          />
          <MetricCard
            title="Orders Today"
            value={servicesData.woocommerce?.orders?.totalOrders || '0'}
            status={servicesData.woocommerce?.health?.isUp ? 'good' : 'warning'}
            icon={<span className="text-xl">📦</span>}
            subtitle="Last 24 hours"
            onClick={() => navigate('/dashboard/kpis')}
          />
          <MetricCard
            title="Server Status"
            value={servicesData.digitalocean?.droplet?.status === 'active' ? 'Active' : 'Unknown'}
            status={servicesData.digitalocean?.health?.isHealthy ? 'good' : 'danger'}
            icon={<span className="text-xl">🖥️</span>}
            subtitle={servicesData.digitalocean?.droplet?.name || 'DigitalOcean'}
            onClick={() => navigate('/dashboard/server')}
          />
          <MetricCard
            title="CDN Requests"
            value={formatNumber(servicesData.cloudflare?.analytics?.requests)}
            status={servicesData.cloudflare?.health?.isHealthy ? 'good' : 'warning'}
            icon={<span className="text-xl">🔒</span>}
            subtitle="Cloudflare (24h)"
            onClick={() => navigate('/dashboard/website')}
          />
        </div>

        {/* Services Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Infrastructure Status */}
          <GlassCard padding="default">
            <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
              <span>🏗️</span> Infrastructure Status
            </h3>
            <div className="space-y-4">
              {/* WordPress */}
              <div 
                onClick={() => navigate('/dashboard/website')}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">🌐</span>
                  <div>
                    <p className="font-medium text-text-primary">WordPress</p>
                    <p className="text-sm text-text-secondary">server.mardeys.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-text-secondary text-sm">
                    {servicesData.wordpress?.health?.responseTime}ms
                  </span>
                  <StatusBadge 
                    status={servicesData.wordpress?.health?.isUp ? 'online' : 'offline'} 
                    size="small"
                  />
                </div>
              </div>

              {/* WooCommerce */}
              <div 
                onClick={() => navigate('/dashboard/kpis')}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">🛒</span>
                  <div>
                    <p className="font-medium text-text-primary">WooCommerce</p>
                    <p className="text-sm text-text-secondary">E-commerce store</p>
                  </div>
                </div>
                <StatusBadge 
                  status={servicesData.woocommerce?.health?.isUp ? 'online' : 'offline'} 
                  size="small"
                />
              </div>

              {/* DigitalOcean */}
              <div 
                onClick={() => navigate('/dashboard/server')}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">☁️</span>
                  <div>
                    <p className="font-medium text-text-primary">DigitalOcean</p>
                    <p className="text-sm text-text-secondary">{servicesData.digitalocean?.droplet?.region || 'Ubuntu Droplet'}</p>
                  </div>
                </div>
                <StatusBadge 
                  status={servicesData.digitalocean?.health?.isHealthy ? 'active' : 'offline'} 
                  size="small"
                />
              </div>

              {/* Cloudflare */}
              <div 
                onClick={() => navigate('/dashboard/website')}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <p className="font-medium text-text-primary">Cloudflare</p>
                    <p className="text-sm text-text-secondary">{servicesData.cloudflare?.zone || 'CDN & Security'}</p>
                  </div>
                </div>
                <StatusBadge 
                  status={servicesData.cloudflare?.health?.isHealthy ? 'active' : 'offline'} 
                  size="small"
                />
              </div>
            </div>
          </GlassCard>

          {/* Server Resources */}
          <GlassCard padding="default">
            <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
              <span>📊</span> Server Resources
            </h3>
            <div className="space-y-6">
              <ProgressGauge 
                value={servicesData.digitalocean?.metrics?.cpu || 0} 
                label="CPU Usage"
                status="auto"
              />
              <ProgressGauge 
                value={servicesData.digitalocean?.metrics?.memory || 0} 
                label="Memory Usage"
                status="auto"
              />
              <ProgressGauge 
                value={servicesData.digitalocean?.metrics?.disk || 0} 
                label="Disk Usage"
                status="auto"
              />
            </div>

            {/* Server Info */}
            <div className="mt-6 pt-6 border-t border-border/30 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-secondary">Droplet Size</p>
                <p className="text-text-primary font-medium">{servicesData.digitalocean?.droplet?.size || 'N/A'}</p>
              </div>
              <div>
                <p className="text-text-secondary">vCPUs</p>
                <p className="text-text-primary font-medium">{servicesData.digitalocean?.droplet?.vcpus || 'N/A'}</p>
              </div>
              <div>
                <p className="text-text-secondary">Memory</p>
                <p className="text-text-primary font-medium">{servicesData.digitalocean?.droplet?.memory ? `${servicesData.digitalocean.droplet.memory / 1024} GB` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-text-secondary">Disk</p>
                <p className="text-text-primary font-medium">{servicesData.digitalocean?.droplet?.disk ? `${servicesData.digitalocean.droplet.disk} GB` : 'N/A'}</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Alerts Section */}
        {(servicesData.woocommerce?.products?.lowStock > 0 || 
          servicesData.woocommerce?.products?.outOfStock > 0 ||
          servicesData.wordpress?.plugins?.needsUpdate > 0) && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary">Active Alerts</h3>
            
            {servicesData.woocommerce?.products?.outOfStock > 0 && (
              <AlertBanner
                type="danger"
                title="Out of Stock Products"
                message={`${servicesData.woocommerce.products.outOfStock} products are out of stock and cannot be purchased.`}
                action="View Products"
                onAction={() => navigate('/dashboard/kpis')}
              />
            )}

            {servicesData.woocommerce?.products?.lowStock > 0 && (
              <AlertBanner
                type="warning"
                title="Low Stock Warning"
                message={`${servicesData.woocommerce.products.lowStock} products have low inventory levels.`}
                action="View Inventory"
                onAction={() => navigate('/dashboard/kpis')}
              />
            )}

            {servicesData.wordpress?.plugins?.needsUpdate > 0 && (
              <AlertBanner
                type="info"
                title="Plugin Updates Available"
                message={`${servicesData.wordpress.plugins.needsUpdate} WordPress plugins have updates available.`}
                action="View Details"
                onAction={() => navigate('/dashboard/website')}
              />
            )}
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard 
            padding="default" 
            className="text-center cursor-pointer group"
            onClick={() => navigate('/dashboard/website')}
          >
            <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">🌐</span>
            <p className="font-medium text-text-primary">Website Health</p>
            <p className="text-xs text-text-secondary mt-1">Uptime & Performance</p>
          </GlassCard>
          
          <GlassCard 
            padding="default" 
            className="text-center cursor-pointer group"
            onClick={() => navigate('/dashboard/server')}
          >
            <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">🖥️</span>
            <p className="font-medium text-text-primary">Server Health</p>
            <p className="text-xs text-text-secondary mt-1">Droplet Metrics</p>
          </GlassCard>
          
          <GlassCard 
            padding="default" 
            className="text-center cursor-pointer group"
            onClick={() => navigate('/dashboard/services')}
          >
            <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">⚡</span>
            <p className="font-medium text-text-primary">API Services</p>
            <p className="text-xs text-text-secondary mt-1">Render Backend</p>
          </GlassCard>
          
          <GlassCard 
            padding="default" 
            className="text-center cursor-pointer group"
            onClick={() => navigate('/dashboard/kpis')}
          >
            <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">💰</span>
            <p className="font-medium text-text-primary">Business KPIs</p>
            <p className="text-xs text-text-secondary mt-1">Revenue & Orders</p>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewOverview;
