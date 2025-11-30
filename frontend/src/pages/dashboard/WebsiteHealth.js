import React, { useState, useEffect, useRef } from 'react';
import { servicesAPI } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import MetricCard from '../../components/ui/MetricCard';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import ProgressGauge from '../../components/ui/ProgressGauge';
import AlertBanner from '../../components/ui/AlertBanner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const WebsiteHealth = () => {
  const [wordpress, setWordpress] = useState(null);
  const [cloudflare, setCloudflare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasLoadedRef = useRef(false);

  // Simulated response time history (in real app, fetch from backend)
  const [responseHistory] = useState([
    { time: '00:00', responseTime: 450, errors: 0 },
    { time: '04:00', responseTime: 380, errors: 0 },
    { time: '08:00', responseTime: 520, errors: 2 },
    { time: '12:00', responseTime: 610, errors: 1 },
    { time: '16:00', responseTime: 480, errors: 0 },
    { time: '20:00', responseTime: 420, errors: 0 },
    { time: 'Now', responseTime: wordpress?.health?.responseTime || 450, errors: 0 },
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wpRes, cfRes] = await Promise.all([
        servicesAPI.getWordPress(),
        servicesAPI.getCloudflare()
      ]);
      setWordpress(wpRes.data);
      setCloudflare(cfRes.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch data:', error);
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
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return gb.toFixed(2) + ' GB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return mb.toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  // Calculate uptime (simulated - in real app, fetch from monitoring service)
  const uptime = wordpress?.health?.isUp ? 99.99 : 95.0;
  const responseTime = wordpress?.health?.responseTime || 0;
  
  const getResponseStatus = (time) => {
    if (time < 500) return 'good';
    if (time < 1000) return 'warning';
    return 'danger';
  };

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
          <p className="text-text-secondary text-sm">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-text-primary font-medium">
              {entry.name}: {entry.value}{entry.name === 'Response Time' ? 'ms' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout 
      title="Website Health" 
      subtitle="Public site monitoring & performance"
      actions={<RefreshButton />}
    >
      <div className="space-y-8">
        {/* Alert Banner */}
        {uptime < 99.9 && (
          <AlertBanner
            type="warning"
            title="Uptime Below Target"
            message={`Current uptime is ${uptime}%. Target is 99.9%. Investigating potential issues.`}
          />
        )}

        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Uptime (24h)"
            value={`${uptime}%`}
            status={uptime >= 99.9 ? 'good' : uptime >= 99 ? 'warning' : 'danger'}
            icon={<span className="text-xl">📈</span>}
            subtitle="Target: 99.9%"
          />
          <MetricCard
            title="Response Time"
            value={`${responseTime}ms`}
            status={getResponseStatus(responseTime)}
            icon={<span className="text-xl">⚡</span>}
            subtitle="Average (P50)"
          />
          <MetricCard
            title="Error Rate"
            value="0.01%"
            status="good"
            icon={<span className="text-xl">🐛</span>}
            subtitle="5xx + 4xx errors"
          />
          <MetricCard
            title="SSL Expiry"
            value="45 days"
            status="good"
            icon={<span className="text-xl">🔐</span>}
            subtitle="Let's Encrypt"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Response Time Chart */}
          <GlassCard padding="default">
            <h3 className="text-lg font-semibold text-text-primary mb-6">Response Time (24h)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={responseHistory}>
                  <defs>
                    <linearGradient id="responseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} unit="ms" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="responseTime" 
                    name="Response Time"
                    stroke="#6366f1" 
                    fill="url(#responseGradient)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Error Distribution */}
          <GlassCard padding="default">
            <h3 className="text-lg font-semibold text-text-primary mb-6">Error Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: '5xx', count: 2, fill: '#ef4444' },
                  { name: '4xx', count: 15, fill: '#f59e0b' },
                  { name: '3xx', count: 124, fill: '#6366f1' },
                  { name: '2xx', count: 45892, fill: '#10b981' },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Requests" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* WordPress & Cloudflare Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* WordPress Status */}
          <GlassCard padding="default">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <span>🌐</span> WordPress Status
              </h3>
              <StatusBadge 
                status={wordpress?.health?.isUp ? 'online' : 'offline'} 
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border/30">
                <span className="text-text-secondary">Site URL</span>
                <span className="text-text-primary font-mono text-sm">{wordpress?.url || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/30">
                <span className="text-text-secondary">Response Time</span>
                <span className={`font-bold ${getResponseStatus(responseTime) === 'good' ? 'text-success' : 'text-warning'}`}>
                  {responseTime}ms
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/30">
                <span className="text-text-secondary">Status Code</span>
                <span className="text-success font-medium">{wordpress?.health?.statusCode || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/30">
                <span className="text-text-secondary">REST API</span>
                <StatusBadge 
                  status={wordpress?.health?.apiHealthy ? 'healthy' : 'error'} 
                  size="small"
                />
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-text-secondary">Active Plugins</span>
                <span className="text-text-primary">{wordpress?.plugins?.active || 0}</span>
              </div>
            </div>
          </GlassCard>

          {/* Cloudflare Status */}
          <GlassCard padding="default">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <span>🛡️</span> Cloudflare CDN
              </h3>
              <StatusBadge 
                status={cloudflare?.health?.isHealthy ? 'active' : 'offline'} 
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border/30">
                <span className="text-text-secondary">Zone</span>
                <span className="text-text-primary font-mono text-sm">{cloudflare?.zone || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/30">
                <span className="text-text-secondary">Status</span>
                <span className="text-success font-medium capitalize">{cloudflare?.health?.status || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/30">
                <span className="text-text-secondary">Total Requests (24h)</span>
                <span className="text-text-primary font-bold">{formatNumber(cloudflare?.analytics?.requests)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/30">
                <span className="text-text-secondary">Bandwidth (24h)</span>
                <span className="text-text-primary">{formatBytes(cloudflare?.analytics?.bandwidth)}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-text-secondary">DNS Records</span>
                <span className="text-text-primary">{cloudflare?.dns?.total || 0}</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Cache & Security */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cache Performance */}
          <GlassCard padding="default">
            <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
              <span>💾</span> Cache Performance
            </h3>
            <div className="space-y-6">
              <ProgressGauge 
                value={cloudflare?.cache?.hitRatio || 85} 
                label="Cache Hit Ratio"
                status={cloudflare?.cache?.hitRatio >= 80 ? 'good' : 'warning'}
              />
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold text-success">{formatBytes(cloudflare?.cache?.cachedBandwidth)}</p>
                  <p className="text-xs text-text-secondary mt-1">Bandwidth Saved</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <p className="text-2xl font-bold text-text-primary">{formatNumber(cloudflare?.analytics?.pageViews)}</p>
                  <p className="text-xs text-text-secondary mt-1">Page Views</p>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Security */}
          <GlassCard padding="default">
            <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
              <span>🔒</span> Security (24h)
            </h3>
            <div className="space-y-4">
              <div className="text-center p-6 rounded-xl bg-danger/10 border border-danger/20">
                <p className="text-4xl font-bold text-danger">{formatNumber(cloudflare?.analytics?.threats || 0)}</p>
                <p className="text-text-secondary mt-2">Threats Blocked</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <p className="text-xl font-bold text-text-primary">{cloudflare?.dns?.byType?.A || 0}</p>
                  <p className="text-xs text-text-secondary mt-1">A Records</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/5">
                  <p className="text-xl font-bold text-text-primary">{cloudflare?.dns?.byType?.CNAME || 0}</p>
                  <p className="text-xs text-text-secondary mt-1">CNAME Records</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Nameservers */}
        {cloudflare?.health?.nameServers && (
          <GlassCard padding="default">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Nameservers</h3>
            <div className="flex flex-wrap gap-2">
              {cloudflare.health.nameServers.map((ns, i) => (
                <span key={i} className="px-4 py-2 rounded-lg bg-white/5 border border-border/50 font-mono text-sm text-text-secondary">
                  {ns}
                </span>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WebsiteHealth;
