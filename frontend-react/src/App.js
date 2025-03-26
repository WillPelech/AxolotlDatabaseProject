import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Restaurant from './pages/Restaurant';
import Profile from './pages/Profile';
import Suggested from './pages/Suggested';
import Map from './pages/Map';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/restaurant/:id" element={<Restaurant />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/suggested" element={<Suggested />} />
            <Route path="/map" element={<Map />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
