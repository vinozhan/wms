import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import WasteBins from './pages/WasteBins/WasteBins';
import Collections from './pages/Collections/Collections';
import Payments from './pages/Payments/Payments';
import Analytics from './pages/Analytics/Analytics';
import Users from './pages/Users/Users';
import BinRequests from './pages/BinRequests/BinRequests';
import PaytBilling from './pages/PAYT/PaytBilling';
import RoutesPage from './pages/Routes/Routes';
import RouteOptimization from './pages/Routes/RouteOptimization';
import RecyclingCredits from './pages/RecyclingCredits/RecyclingCredits';
import CollectorFeedback from './pages/Collectors/CollectorFeedback';
import EnvironmentalDashboard from './pages/Environmental/EnvironmentalDashboard';
import Settings from './pages/Settings/Settings';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

const HomePage = () => (
  <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Smart Waste Management System
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Revolutionizing urban waste management through digital innovation. 
          Track, manage, and optimize waste collection with our comprehensive platform.
        </p>
        <div className="space-x-4">
          <a
            href="/register"
            className="bg-green-600 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-green-700 transition-colors"
          >
            Get Started
          </a>
          <a
            href="/login"
            className="border border-green-600 text-green-600 px-8 py-3 rounded-md text-lg font-medium hover:bg-green-50 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
      
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center p-6">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Tracking</h3>
          <p className="text-gray-600">Monitor waste levels and collection schedules with RFID and sensor technology.</p>
        </div>
        
        <div className="text-center p-6">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8v6m0-6h.01M12 21.5c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Route Optimization</h3>
          <p className="text-gray-600">Optimize collection routes for maximum efficiency and reduced carbon footprint.</p>
        </div>
        
        <div className="text-center p-6">
          <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics & Reporting</h3>
          <p className="text-gray-600">Comprehensive analytics for better decision making and resource planning.</p>
        </div>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="waste-bins" element={<WasteBins />} />
              <Route path="collections" element={<Collections />} />
              <Route path="routes" element={<RoutesPage />} />
              <Route path="payments" element={<Payments />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="users" element={<Users />} />
              <Route path="bin-requests" element={<BinRequests />} />
              <Route path="payt-billing" element={<PaytBilling />} />
              <Route path="route-optimization" element={<RouteOptimization />} />
              <Route path="recycling-credits" element={<RecyclingCredits />} />
              <Route path="collector-feedback" element={<CollectorFeedback />} />
              <Route path="environmental" element={<EnvironmentalDashboard />} />
              <Route path="profile" element={<div>Profile Page</div>} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;