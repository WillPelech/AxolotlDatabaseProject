import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Restaurant from './pages/Restaurant';
import Profile from './pages/Profile';
import Suggested from './pages/Suggested';
import Map from './pages/Map';
import RestaurantList from './components/RestaurantList';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CreateRestaurant from './pages/CreateRestaurant';
import ManageRestaurants from './pages/ManageRestaurants';
import EditRestaurant from './pages/EditRestaurant';
import Orders from './pages/Orders';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <div className="container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/restaurant/:id" element={<Restaurant />} />
              <Route path="/suggested" element={<Suggested />} />
              <Route path="/map" element={<Map />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-restaurant"
                element={
                  <ProtectedRoute requireRestaurantOwner>
                    <CreateRestaurant />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-restaurants"
                element={
                  <ProtectedRoute requireRestaurantOwner>
                    <ManageRestaurants />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit-restaurant/:id"
                element={
                  <ProtectedRoute requireRestaurantOwner>
                    <EditRestaurant />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/restaurant-list"
                element={
                  <ProtectedRoute requireRestaurantOwner>
                    <RestaurantList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
