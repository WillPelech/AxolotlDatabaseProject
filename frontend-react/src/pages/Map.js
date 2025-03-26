import React, { useState, useEffect } from 'react';
import { GOOGLE_MAPS_API_KEY } from '../config';

function Map() {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize Google Maps
    const initMap = () => {
      try {
        const mapOptions = {
          center: { lat: 37.7749, lng: -122.4194 }, // San Francisco coordinates
          zoom: 13,
        };

        const mapElement = document.getElementById('map');
        const newMap = new window.google.maps.Map(mapElement, mapOptions);
        setMap(newMap);

        // Add sample markers
        const sampleMarkers = [
          {
            position: { lat: 37.7749, lng: -122.4194 },
            title: 'Restaurant 1',
            rating: 4.5,
            price: '$$$',
          },
          {
            position: { lat: 37.7833, lng: -122.4167 },
            title: 'Restaurant 2',
            rating: 4.2,
            price: '$$',
          },
          // Add more markers as needed
        ];

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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
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
          <h2 className="text-xl font-bold mb-4">Nearby Restaurants</h2>
          <div className="space-y-4">
            {/* Restaurant List */}
            <div className="border-b pb-4">
              <h3 className="font-semibold">Restaurant 1</h3>
              <p className="text-sm text-gray-600">Rating: 4.5 ★</p>
              <p className="text-sm text-gray-600">Price: $$$</p>
              <p className="text-sm text-gray-500">Distance: 0.2 miles</p>
            </div>
            <div className="border-b pb-4">
              <h3 className="font-semibold">Restaurant 2</h3>
              <p className="text-sm text-gray-600">Rating: 4.2 ★</p>
              <p className="text-sm text-gray-600">Price: $$</p>
              <p className="text-sm text-gray-500">Distance: 0.4 miles</p>
            </div>
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