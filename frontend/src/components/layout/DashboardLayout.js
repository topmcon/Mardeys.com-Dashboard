import React from 'react';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children, title, subtitle, actions }) => {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-pink-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="ml-72 min-h-screen relative">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/60 backdrop-blur-xl border-b border-border/30">
          <div className="flex items-center justify-between px-8 py-5">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
              {subtitle && (
                <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {actions}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
