import React, { useState, useEffect } from 'react';

function Map() {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize Google Maps
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
        const sampleMarkers = [
          {
            position: { lat: 40.7580, lng: -73.9855 }, // Times Square
            title: 'Times Square Bistro',
            rating: 4.5,
            price: '$$$',
          },
          {
            position: { lat: 40.7527, lng: -73.9772 }, // Grand Central
            title: 'Grand Central Deli',
            rating: 4.2,
            price: '$$',
          },
          {
            position: { lat: 40.7614, lng: -73.9776 }, // Rockefeller Center
            title: 'Rockefeller Cafe',
            rating: 4.7,
            price: '$$$',
          },
          {
            position: { lat: 40.7484, lng: -73.9857 }, // Empire State Building
            title: 'Empire State Restaurant',
            rating: 4.3,
            price: '$$$',
          }
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
            <div className="border-b pb-4">
              <h3 className="font-semibold">Times Square Bistro</h3>
              <p className="text-sm text-gray-600">Rating: 4.5 ★</p>
              <p className="text-sm text-gray-600">Price: $$$</p>
              <p className="text-sm text-gray-500">Location: Times Square</p>
            </div>
            <div className="border-b pb-4">
              <h3 className="font-semibold">Grand Central Deli</h3>
              <p className="text-sm text-gray-600">Rating: 4.2 ★</p>
              <p className="text-sm text-gray-600">Price: $$</p>
              <p className="text-sm text-gray-500">Location: Grand Central</p>
            </div>
            <div className="border-b pb-4">
              <h3 className="font-semibold">Rockefeller Cafe</h3>
              <p className="text-sm text-gray-600">Rating: 4.7 ★</p>
              <p className="text-sm text-gray-600">Price: $$$</p>
              <p className="text-sm text-gray-500">Location: Rockefeller Center</p>
            </div>
            <div className="border-b pb-4">
              <h3 className="font-semibold">Empire State Restaurant</h3>
              <p className="text-sm text-gray-600">Rating: 4.3 ★</p>
              <p className="text-sm text-gray-600">Price: $$$</p>
              <p className="text-sm text-gray-500">Location: Empire State Building</p>
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