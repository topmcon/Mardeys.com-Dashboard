import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const TopBar = ({ title, subtitle, actions }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left - Title */}
        <div>
          <h1 className="text-xl font-bold text-text-primary">{title}</h1>
          {subtitle && (
            <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Right - Actions & User */}
        <div className="flex items-center gap-4">
          {/* Custom actions */}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}

          {/* Refresh button */}
          <button className="p-2 rounded-lg bg-card border border-border/50 text-text-secondary hover:text-text-primary hover:border-border-hover transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg bg-card border border-border/50 text-text-secondary hover:text-text-primary hover:border-border-hover transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-xs flex items-center justify-center">
              2
            </span>
          </button>

          {/* User menu */}
          <div className="flex items-center gap-3 pl-4 border-l border-border/30">
            <div className="text-right">
              <p className="text-sm font-medium text-text-primary">{user?.username || 'Admin'}</p>
              <p className="text-xs text-text-secondary">{user?.email || 'admin@mardeys.com'}</p>
            </div>
            <button 
              onClick={logout}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-600/20 border border-primary/30 flex items-center justify-center text-primary hover:scale-105 transition-transform"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
