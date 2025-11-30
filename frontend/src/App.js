import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

import Layout from './components/Layout';
import Login from './pages/Login';
import Overview from './pages/Overview';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Layout>
                    <Overview />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard/services"
              element={
                <PrivateRoute>
                  <Layout>
                    <Services />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard/services/:service"
              element={
                <PrivateRoute>
                  <Layout>
                    <ServiceDetail />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard/analytics"
              element={
                <PrivateRoute>
                  <Layout>
                    <Analytics />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard/alerts"
              element={
                <PrivateRoute>
                  <Layout>
                    <Alerts />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <PrivateRoute>
                  <Layout>
                    <Settings />
                  </Layout>
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
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
