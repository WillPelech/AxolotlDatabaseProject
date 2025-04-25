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
import Reviews from './pages/Reviews';
import MyReviews from './pages/MyReviews';
import AddressManagement from './pages/AddressManagement';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-neutral-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/restaurant/:id" element={<Restaurant />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/manage-restaurants" element={<ManageRestaurants />} />
            <Route path="/create-restaurant" element={<CreateRestaurant />} />
            <Route path="/edit-restaurant/:id" element={<EditRestaurant />} />
            <Route path="/reviews/:restaurantId" element={<Reviews />} />
            <Route path="/my-reviews" element={<MyReviews />} />
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
              path="/restaurant-list"
              element={
                <ProtectedRoute requireRestaurantOwner>
                  <RestaurantList />
                </ProtectedRoute>
              }
            />
            <Route path="/restaurants/:id" element={<Restaurant />} />
            <Route path="/restaurants/:id/reviews" element={<Reviews />} />
            <Route 
              path="/addresses"
              element={
                <ProtectedRoute>
                  <AddressManagement />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
