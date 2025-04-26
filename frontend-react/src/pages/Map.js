import React, { useState, useEffect } from 'react';
import { restaurantApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

function Map() {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [error, setError] = useState(null);
  const [reviewRestaurants, setReviewRestaurants] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchReviewedRestaurants = async () => {
      try {
        if (!user || !user.accountId) {
          console.log('No user logged in or missing accountId, skipping fetch');
          return;
        }
        const data = await restaurantApi.getReviewedRestaurants(user.accountId);
        setReviewRestaurants(data.restaurants);
      } catch (err) {
        setError(err.message);
      }
    };

    if (user && user.accountId) {
      fetchReviewedRestaurants();
    }
  }, [user?.accountId]);

  useEffect(() => {
    const initMap = () => {
      try {
        const mapOptions = {
          center: { lat: 40.7128, lng: -74.0060 }, // New York City coordinates
          zoom: 13,
        };
        const mapElement = document.getElementById('map');
        const newMap = new window.google.maps.Map(mapElement, mapOptions);
        setMap(newMap);
      } catch (err) {
        setError('Failed to initialize map. Please check your API key and try again.');
        console.error('Map initialization error:', err);
      }
    };

    if (window.google && window.google.maps) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = () => {
        setError('Failed to load Google Maps. Please check your API key and try again.');
        console.error('Google Maps script loading error');
      };
      document.head.appendChild(script);
    }

    return () => {
      markers.forEach((marker) => marker.setMap(null));
      setMarkers([]);
    };
  }, []);

  useEffect(() => {
    const fetchGeocodes = async () => {
      if (!map || reviewRestaurants.length === 0) return;

      const Geocoder = new window.google.maps.Geocoder();
      
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));
      setMarkers([]);

      const newMarkers = await Promise.all(
        reviewRestaurants.map(async (r) => {
          try {
            const response = await Geocoder.geocode({ address: r.Address });
            const location = response.results[0].geometry.location;
            
            const marker = new window.google.maps.Marker({
              position: { lat: location.lat(), lng: location.lng() },
              map: map,
              title: r.RestaurantName,
            });

            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div class="p-2">
                  <h3 class="font-semibold">${r.RestaurantName}</h3>
                  <p class="text-sm">Rating: ${r.Rating} ★</p>
                  <p class="text-sm">Location: ${r.Address}</p>
                  <a href="/restaurant/${r.RestaurantID}" class="text-blue-500 hover:underline">View Details</a>
                </div>
              `,
            });

            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });

            return marker;
          } catch (error) {
            console.error(`Failed to geocode address for ${r.RestaurantName}:`, error);
            return null;
          }
        })
      );

      // Filter out any null markers (failed geocoding) and set the new markers
      setMarkers(newMarkers.filter(marker => marker !== null));
    };

    fetchGeocodes();
  }, [map, reviewRestaurants]);

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Please make sure you have a valid Google Maps API key configured.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">NYC Restaurants</h2>
          <div className="space-y-4">
            {reviewRestaurants.map(restaurant => (
              <div key={restaurant.RestaurantID} className="border-b pb-4">
                <h3 className="font-semibold">{restaurant.RestaurantName}</h3>
                <p className="text-sm text-gray-600">Rating: {restaurant.Rating} ★</p>
                <p className="text-sm text-gray-500">Location: {restaurant.Address}</p>
                <Link to={`/restaurant/${restaurant.RestaurantID}`} className="text-blue-500 hover:underline">
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <div id="map" className="w-full h-full"></div>
      </div>
    </div>
  );
}

export default Map; 