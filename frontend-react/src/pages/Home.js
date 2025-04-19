import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Home.css';

const Home = () => {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFrontPageRestaurants = async () => {
      try {
        const response = await fetch('http://localhost:5000//api/restaurants/front-page');
        if (!response.ok) {
          throw new Error('Failed to fetch restaurants');
        }
        const data = await response.json();
        console.log(data)
        setRestaurants(data);
      } catch (err) {
        console.error('Error fetching restaurants:', err);
        setError('Failed to load featured restaurants');
      } finally {
        setLoading(false);
      }
    };

    fetchFrontPageRestaurants();
  }, []);

  return (
    <div className="home-container">
      <div className="welcome-section">
        <h1>Welcome to FoodHub</h1>
        <p>Discover the best restaurants in your area</p>
      </div>

      {loading ? (
        <div className="loading">Loading featured restaurants...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : restaurants.length === 0 ? (
        <div className="no-restaurants">
          <p>No featured restaurants available at the moment.</p>
        </div>
      ) : (
        <div className="featured-restaurants">
          <h2>Featured Restaurants</h2>
          <div className="restaurant-grid">
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="restaurant-card">
                <h3>{restaurant.name}</h3>
                <p>Category: {restaurant.description}</p>
                <p>Rating: {restaurant.rating || 'No ratings yet'}</p>
                <p>Push Points: {restaurant.PushPoints}</p>
                <Link to={`/restaurant/${restaurant.id}`} className="view-button">
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home; 