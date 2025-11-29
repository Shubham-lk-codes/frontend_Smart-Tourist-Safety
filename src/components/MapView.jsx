import React, { useState, useEffect } from 'react';

const MapView = ({ geofences }) => {
  const [currentLocation, setCurrentLocation] = useState(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
      },
      (err) => {
        alert('Error getting location: ' + err.message);
      }
    );
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Map Overview</h2>
            <p className="text-gray-600">Visual representation of all safe zones</p>
          </div>
          <button
            onClick={getCurrentLocation}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            My Location
          </button>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="h-96 bg-gradient-to-br from-blue-100 to-green-100 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Interactive Map</h3>
            <p className="text-gray-600 max-w-md">
              This would display an interactive map with all geofences visualized.
              Integration with Google Maps or Leaflet would go here.
            </p>
          </div>
        </div>

        {/* Sample geofence markers */}
        {geofences.map((geofence, index) => (
          <div
            key={geofence._id}
            className="absolute w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold"
            style={{
              left: `${20 + (index * 15)}%`,
              top: `${30 + (index * 10)}%`,
              animation: 'pulse 2s infinite'
            }}
          >
            {index + 1}
          </div>
        ))}

        {/* Current location marker */}
        {currentLocation && (
          <div
            className="absolute w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-gray-700">Safe Zones</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
            <span className="text-gray-700">Your Location</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-700">Active Tracking</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;