import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const Sidebar = ({ collapsed = false }) => {
  const location = useLocation();

  const navItems = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: '📊', 
      path: '/dashboard',
      description: 'System overview'
    },
    { 
      id: 'website', 
      label: 'Website Health', 
      icon: '🌐', 
      path: '/dashboard/website',
      description: 'Public site monitoring',
      badge: null
    },
    { 
      id: 'droplet', 
      label: 'Server', 
      icon: '🖥️', 
      path: '/dashboard/droplet',
      description: 'DigitalOcean Droplet'
    },
    { 
      id: 'kpis', 
      label: 'Business KPIs', 
      icon: '💰', 
      path: '/dashboard/business',
      description: 'Revenue & orders'
    },
    { 
      id: 'divider',
      type: 'divider'
    },
    { 
      id: 'alerts', 
      label: 'Alerts', 
      icon: '🔔', 
      path: '/dashboard/alerts',
      description: 'Notifications'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: '⚙️', 
      path: '/dashboard/settings',
      description: 'Configuration'
    },
  ];

  return (
    <aside className={`
      fixed left-0 top-0 h-full z-40
      ${collapsed ? 'w-20' : 'w-72'}
      bg-background/80 backdrop-blur-2xl
      border-r border-border/50
      transition-all duration-300
    `}>
      {/* Logo */}
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-glow">
            M
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Mardeys Monitor
              </h1>
              <p className="text-xs text-text-secondary">Real-time Dashboard</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          if (item.type === 'divider') {
            return <div key={item.id} className="my-4 border-t border-border/30" />;
          }

          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-primary/20 text-primary border border-primary/30' 
                  : 'text-text-secondary hover:bg-white/5 hover:text-text-primary border border-transparent'
                }
              `}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
              )}
              
              <span className="text-xl">{item.icon}</span>
              
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <span className="font-medium block">{item.label}</span>
                  <span className="text-xs text-text-secondary/70 block truncate">
                    {item.description}
                  </span>
                </div>
              )}

              {item.badge && !collapsed && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-danger/20 text-danger border border-danger/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/30">
        <div className={`
          flex items-center gap-3 px-4 py-3 rounded-xl
          bg-success/10 border border-success/20
        `}>
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          {!collapsed && (
            <div className="flex-1">
              <p className="text-success text-sm font-medium">All Systems Online</p>
              <p className="text-xs text-text-secondary">Last check: just now</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
