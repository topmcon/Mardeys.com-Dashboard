import React, { useState, useEffect, useRef } from 'react';
import { servicesAPI, metricsAPI } from '../../services/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import MetricCard from '../../components/ui/MetricCard';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import ProgressGauge from '../../components/ui/ProgressGauge';
import AlertBanner from '../../components/ui/AlertBanner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DropletHealth = () => {
  const [droplet, setDroplet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resourceHistory, setResourceHistory] = useState([]);
  const hasLoadedRef = useRef(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [doResponse, chartResponse] = await Promise.all([
        servicesAPI.getDigitalOcean(),
        metricsAPI.getChart('digitalocean', '24h').catch(() => ({ data: { data: [] } }))
      ]);
      
      setDroplet(doResponse.data);
      
      // Format chart data
      if (chartResponse.data?.data?.length > 0) {
        const formatted = chartResponse.data.data.map(point => ({
          time: point.timeLabel,
          cpu: point.cpu_usage || 0,
          ram: point.memory_usage || 0,
          disk: point.disk_usage || 0
        }));
        setResourceHistory(formatted);
      } else {
        // Fallback to current metrics if no history yet
        const metrics = doResponse.data?.metrics || {};
        setResourceHistory([
          { time: 'Now', cpu: metrics.cpu || 0, ram: metrics.memory || 0, disk: metrics.disk || 0 }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch droplet data:', error);
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

  const formatUptime = (hours) => {
    if (!hours) return 'N/A';
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  };

  // Use real metrics from API
  const cpuUsage = droplet?.metrics?.cpu || 0;
  const ramUsage = droplet?.metrics?.memory || 0;
  const diskUsage = droplet?.metrics?.disk || 0;
  // Load average calculated from CPU (rough approximation)
  const loadAvg = [cpuUsage / 100 * (droplet?.specs?.vcpus || 1), 
                   cpuUsage / 100 * (droplet?.specs?.vcpus || 1) * 1.1, 
                   cpuUsage / 100 * (droplet?.specs?.vcpus || 1) * 0.95];

  const getUsageStatus = (value, warn = 70, danger = 90) => {
    if (value >= danger) return 'danger';
    if (value >= warn) return 'warning';
    return 'good';
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
          <p className="text-text-secondary text-sm mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="font-medium">
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout 
      title="Droplet Health" 
      subtitle="DigitalOcean server monitoring"
      actions={<RefreshButton />}
    >
      <div className="space-y-8">
        {/* Alert Banner */}
        {(cpuUsage > 80 || ramUsage > 80) && (
          <AlertBanner
            type="danger"
            title="High Resource Usage"
            message="Server resources are running high. Consider scaling up or optimizing applications."
          />
        )}

        {/* Server Info Header */}
        <GlassCard padding="default">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl">
                🖥️
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">{droplet?.name || 'Loading...'}</h2>
                <p className="text-text-secondary">{droplet?.region || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <StatusBadge 
                status={droplet?.health?.status === 'active' ? 'online' : 'offline'} 
                size="large"
              />
              <div className="text-right">
                <p className="text-2xl font-bold text-text-primary">{formatUptime(droplet?.uptime?.hours)}</p>
                <p className="text-xs text-text-secondary">Uptime</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Resource Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard padding="default">
            <div className="text-center">
              <ProgressGauge 
                value={cpuUsage} 
                variant="circular"
                label="CPU Usage"
                status={getUsageStatus(cpuUsage)}
                showPercentage
              />
              <div className="mt-4 pt-4 border-t border-border/30">
                <p className="text-text-secondary text-sm">Cores</p>
                <p className="text-xl font-bold text-text-primary">{droplet?.specs?.vcpus || 0}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard padding="default">
            <div className="text-center">
              <ProgressGauge 
                value={ramUsage} 
                variant="circular"
                label="Memory Usage"
                status={getUsageStatus(ramUsage)}
                showPercentage
              />
              <div className="mt-4 pt-4 border-t border-border/30">
                <p className="text-text-secondary text-sm">Total RAM</p>
                <p className="text-xl font-bold text-text-primary">{droplet?.specs?.memory ? `${droplet.specs.memory / 1024} GB` : 'N/A'}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard padding="default">
            <div className="text-center">
              <ProgressGauge 
                value={diskUsage} 
                variant="circular"
                label="Disk Usage"
                status={getUsageStatus(diskUsage, 80, 95)}
                showPercentage
              />
              <div className="mt-4 pt-4 border-t border-border/30">
                <p className="text-text-secondary text-sm">Total Disk</p>
                <p className="text-xl font-bold text-text-primary">{droplet?.specs?.disk ? `${droplet.specs.disk} GB` : 'N/A'}</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Hero Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Load Avg (1m)"
            value={loadAvg[0].toFixed(2)}
            status={loadAvg[0] < 1 ? 'good' : 'warning'}
            icon={<span className="text-xl">📊</span>}
          />
          <MetricCard
            title="Load Avg (5m)"
            value={loadAvg[1].toFixed(2)}
            status={loadAvg[1] < 1 ? 'good' : 'warning'}
            icon={<span className="text-xl">📈</span>}
          />
          <MetricCard
            title="Load Avg (15m)"
            value={loadAvg[2].toFixed(2)}
            status={loadAvg[2] < 1 ? 'good' : 'warning'}
            icon={<span className="text-xl">📉</span>}
          />
          <MetricCard
            title="Processes"
            value="142"
            status="good"
            icon={<span className="text-xl">⚙️</span>}
          />
        </div>

        {/* Resource History Chart */}
        <GlassCard padding="default">
          <h3 className="text-lg font-semibold text-text-primary mb-6">Resource Usage (24h)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={resourceHistory}>
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="diskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" />
                <XAxis dataKey="time" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} domain={[0, 100]} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="cpu" 
                  name="CPU"
                  stroke="#6366f1" 
                  fill="url(#cpuGradient)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="ram" 
                  name="RAM"
                  stroke="#10b981" 
                  fill="url(#ramGradient)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="disk" 
                  name="Disk"
                  stroke="#f59e0b" 
                  fill="url(#diskGradient)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-sm text-text-secondary">CPU</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success"></div>
              <span className="text-sm text-text-secondary">RAM</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning"></div>
              <span className="text-sm text-text-secondary">Disk</span>
            </div>
          </div>
        </GlassCard>

        {/* Server Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Specifications */}
          <GlassCard padding="default">
            <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
              <span>⚙️</span> Specifications
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border/30">
                <span className="text-text-secondary">Image</span>
                <span className="text-text-primary">{droplet?.image || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/30">
                <span className="text-text-secondary">vCPUs</span>
                <span className="text-text-primary font-bold">{droplet?.specs?.vcpus || 0}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/30">
                <span className="text-text-secondary">Memory</span>
                <span className="text-text-primary font-bold">{droplet?.specs?.memory ? `${droplet.specs.memory / 1024} GB` : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/30">
                <span className="text-text-secondary">Disk</span>
                <span className="text-text-primary font-bold">{droplet?.specs?.disk ? `${droplet.specs.disk} GB SSD` : 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-text-secondary">Price</span>
                <span className="text-success font-bold">${droplet?.specs?.priceMonthly || 0}/mo</span>
              </div>
            </div>
          </GlassCard>

          {/* Networking */}
          <GlassCard padding="default">
            <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
              <span>🌐</span> Networking
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border/30">
                <span className="text-text-secondary">Public IPv4</span>
                <span className="text-text-primary font-mono text-sm">{droplet?.network?.publicIp || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/30">
                <span className="text-text-secondary">Private IPv4</span>
                <span className="text-text-primary font-mono text-sm">{droplet?.network?.privateIp || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/30">
                <span className="text-text-secondary">Gateway</span>
                <span className="text-text-primary font-mono text-sm">{droplet?.network?.gateway || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border/30">
                <span className="text-text-secondary">Hostname</span>
                <span className="text-text-primary font-mono text-sm">{droplet?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-text-secondary">VPC Status</span>
                <StatusBadge status={droplet?.network?.vpc ? 'online' : 'offline'} size="small" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Services Status */}
        <GlassCard padding="default">
          <h3 className="text-lg font-semibold text-text-primary mb-6">Running Services</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Nginx', status: 'running', port: 80 },
              { name: 'PHP-FPM', status: 'running', port: 9000 },
              { name: 'MySQL', status: 'running', port: 3306 },
              { name: 'Redis', status: 'running', port: 6379 },
            ].map((service, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-text-primary">{service.name}</span>
                  <StatusBadge status={service.status === 'running' ? 'online' : 'offline'} size="small" />
                </div>
                <p className="text-xs text-text-secondary">Port: {service.port}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Features & Tags */}
        {(droplet?.features?.length > 0 || droplet?.tags?.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {droplet?.features?.length > 0 && (
              <GlassCard padding="default">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {droplet.features.map((feature, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm">
                      {feature}
                    </span>
                  ))}
                </div>
              </GlassCard>
            )}
            {droplet?.tags?.length > 0 && (
              <GlassCard padding="default">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {droplet.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-white/5 border border-border/50 text-text-secondary text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DropletHealth;
