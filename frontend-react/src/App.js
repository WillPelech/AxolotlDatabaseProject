import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Restaurant from './pages/Restaurant';
import Profile from './pages/Profile';
import RestaurantList from './components/RestaurantList';
import Suggested from './pages/Suggested';
import Map from './pages/Map';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/restaurant/:id" element={<Restaurant />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/suggested" element={<Suggested />} />
              <Route path="/map" element={<Map />} />
              <Route
                path="/manage"
                element={
                  <ProtectedRoute>
                    <RestaurantList />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
