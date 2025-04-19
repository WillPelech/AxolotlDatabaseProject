import React, { useState, useEffect } from 'react';
import { restaurantApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

function Map() {
  // const addressMap = new Map();
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [error, setError] = useState(null);
  const [reviewRestaurants, setReviewRestaurants] = useState([]);
  const { user } = useAuth();
  let sampleMarkers = [
    {
      position: {lat: 0, lng: 0},
          title: "",
          rating: 0,
    }
  ];
  useEffect(() => {
    // Initialize Google Maps
    const fetchReviewedRestaurants = async () => {
      try{
        const data = await restaurantApi.getReviewedRestaurants(user.accountId);
        setReviewRestaurants(data.restaurants);
        console.log(data.restaurants)
      } catch (err) {
        setError(err.message);
      };
      console.log(reviewRestaurants);
      reviewRestaurants.forEach(async function(r) {
        const Geocoder = new window.google.maps.Geocoder();
        const coord = await Geocoder.geocode({address:r.Address})
        // console.log(coord.results[0].navigation_points[0].location)
        r.long = coord.results[0].navigation_points[0].location.longitude;
        r.lat = coord.results[0].navigation_points[0].location.latitude;
        console.log(`latitude: ${r.lat} longitude: ${r.long}`);
        // sampleMarkers.push({
        //   position: {lat: r.lat, lng: r.long},
        //   title: r.RestaurantName,
        //   rating: r.Rating,
        // })
      });
    }

    // const getRestaurantLongLat = async (array) => {
    //   array.forEach(async function(r) {
    //     const Geocoder = new window.google.maps.Geocoder();
    //     const coord = await Geocoder.geocode({address:r.Address})
    //     console.log(r.Address)
    //   });
    // }
    fetchReviewedRestaurants();
    const initMap = () => {
      try {
        const mapOptions = {
          center: { lat: 40.7128, lng: -74.0060 }, // New York City coordinates
          zoom: 13,
        };
        const mapElement = document.getElementById('map');
        const newMap = new window.google.maps.Map(mapElement, mapOptions);
        setMap(newMap);

        // Add sample NYC restaurant markers
        // let sampleMarkers = [
        //   {
        //     position: { lat: 40.7580, lng: -73.9855 }, // Times Square
        //     title: 'Times Square Bistro',
        //     rating: 4.5,
        //     price: '$$$',
        //   },
        //   {
        //     position: { lat: 40.7527, lng: -73.9772 }, // Grand Central
        //     title: 'Grand Central Deli',
        //     rating: 4.2,
        //     price: '$$',
        //   },
        //   {
        //     position: { lat: 40.7614, lng: -73.9776 }, // Rockefeller Center
        //     title: 'Rockefeller Cafe',
        //     rating: 4.7,
        //     price: '$$$',
        //   },
        //   {
        //     position: { lat: 40.7484, lng: -73.9857 }, // Empire State Building
        //     title: 'Empire State Restaurant',
        //     rating: 4.3,
        //     price: '$$$',
        //   }
        // ];
        // reviewRestaurants.forEach(function(r){
        //   sampleMarkers.push({
        //     position: {lat: r.lat, lng: r.long},
        //     title: r.RestaurantName,
        //     rating: r.Rating,
        //   })
        // })

        const newMarkers = sampleMarkers.map((marker) => {
          const googleMarker = new window.google.maps.Marker({
            position: marker.position,
            map: newMap,
            title: marker.title,
          });

          // Add info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <h3 class="font-semibold">${marker.title}</h3>
                <p class="text-sm">Rating: ${marker.rating} ★</p>
                <p class="text-sm">Price: ${marker.price}</p>
              </div>
            `,
          });

          googleMarker.addListener('click', () => {
            infoWindow.open(newMap, googleMarker);
          });

          return googleMarker;
        });

        setMarkers(newMarkers);
      } catch (err) {
        setError('Failed to initialize map. Please check your API key and try again.');
        console.error('Map initialization error:', err);
      }
    };

    // Load Google Maps script
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

    // Cleanup
    return () => {
      markers.forEach((marker) => marker.setMap(null));
      setMarkers([]);
    };
  }, []);

   // will get list of restaurant objects using sql db

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
            {/* Restaurant List */}
            {reviewRestaurants.map(restaurant =>(
              <div className="border-b pb-4">
              <h3 className="font-semibold">{restaurant.RestaurantName}</h3>
              <p className="text-sm text-gray-600">Rating: {restaurant.Rating} ★</p>
              <p className="text-sm text-gray-500">Location: {restaurant.Address}/</p>
              <Link to={`/restaurant/${restaurant.RestaurantID}`} className="view-button">
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