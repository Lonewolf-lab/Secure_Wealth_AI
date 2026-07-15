import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Services from './components/Services'
import Testimonials from './components/Testimonials'
import Footer from './components/Footer'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import { useAuth } from './context/AuthContext'
import './App.css'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen" style={loadingStyles}>
        <div className="spinner"></div>
        <p>Securing connection...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Landing Page Layout
const LandingPage = () => (
  <>
    <Navbar />
    <main>
      <Hero />
      <Services />
      <Testimonials />
    </main>
    <Footer />
  </>
);

function App() {
  return (
    <div className="app-container">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/login" 
          element={
            <>
              <Navbar />
              <Login />
              <Footer />
            </>
          } 
        />
        <Route 
          path="/register" 
          element={
            <>
              <Navbar />
              <Register />
              <Footer />
            </>
          } 
        />

        {/* Protected Dashboard Routes */}
        <Route 
          path="/dashboard/*" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Fallback Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

const loadingStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100vh',
  backgroundColor: '#050505',
  color: '#00ff88',
  fontFamily: 'Inter, sans-serif'
};

export default App
