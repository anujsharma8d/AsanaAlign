import React from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'

import Home from './pages/Home/Home'
import Yoga from './pages/Yoga/Yoga'
import Tutorials from './pages/Tutorials/Tutorials'
import Login from './pages/Login/Login'
import Progress from './pages/Progress/Progress'
import Profile from './pages/Profile/Profile'

import './App.css'

// Simple protected route component
const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('yoga_user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path='/login'  element={<Login initialMode="login"  />} />
        <Route path='/signup' element={<Login initialMode="signup" />} />
        
        {/* Protected Routes */}
        <Route path='/' element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }/>
        <Route path='/start' element={
          <ProtectedRoute>
            <Yoga />
          </ProtectedRoute>
        } />
        <Route path='/tutorials' element={
          <ProtectedRoute>
            <Tutorials />
          </ProtectedRoute>
        } />
        <Route path='/progress' element={
          <ProtectedRoute>
            <Progress />
          </ProtectedRoute>
        } />
        <Route path='/profile' element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  )
}


