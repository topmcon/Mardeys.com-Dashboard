import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

// New Professional Dashboard Pages
import Overview from './pages/dashboard/Overview';
import WebsiteHealth from './pages/dashboard/WebsiteHealth';
import DropletHealth from './pages/dashboard/DropletHealth';
import BusinessKPIs from './pages/dashboard/BusinessKPIs';

// Legacy pages (keeping for compatibility)
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Demo mode - always authenticated
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Main Dashboard Routes */}
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Overview />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard/overview"
              element={
                <PrivateRoute>
                  <Overview />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard/website"
              element={
                <PrivateRoute>
                  <WebsiteHealth />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard/droplet"
              element={
                <PrivateRoute>
                  <DropletHealth />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard/business"
              element={
                <PrivateRoute>
                  <BusinessKPIs />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard/alerts"
              element={
                <PrivateRoute>
                  <Alerts />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
