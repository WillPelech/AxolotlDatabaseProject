import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import RestaurantList from './pages/RestaurantList';
import './styles.css';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;

// Navigation handling
document.addEventListener('DOMContentLoaded', () => {
    // Handle navigation links
    const navLinks = document.querySelectorAll('a[href^="/"]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const path = link.getAttribute('href');
            navigateTo(path);
        });
    });

    // Handle form submissions
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleFormSubmit(form);
        });
    });

    // Initialize map if on map page
    if (document.querySelector('#map')) {
        initMap();
    }
});

// Navigation function
function navigateTo(path) {
    // In a real application, this would handle client-side routing
    // For now, we'll just log the navigation
    console.log(`Navigating to: ${path}`);
}

// Form submission handler
function handleFormSubmit(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // In a real application, this would send the data to a server
    console.log('Form submitted:', data);
}

// Restaurant card click handler
function handleRestaurantClick(restaurantId) {
    console.log(`Viewing restaurant: ${restaurantId}`);
}

// Map marker click handler
function handleMapMarkerClick(restaurant) {
    console.log(`Selected restaurant on map: ${restaurant.title}`);
}

// Search handler
function handleSearch(query) {
    console.log(`Searching for: ${query}`);
}

// Favorite restaurant handler
function toggleFavorite(restaurantId) {
    console.log(`Toggling favorite for restaurant: ${restaurantId}`);
}

// Sort handler
function handleSort(sortBy) {
    console.log(`Sorting by: ${sortBy}`);
}

// Filter handler
function handleFilter(filterBy) {
    console.log(`Filtering by: ${filterBy}`);
} 