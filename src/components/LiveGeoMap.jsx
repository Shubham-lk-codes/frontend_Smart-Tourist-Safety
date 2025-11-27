import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LiveGeoMap = () => {
  const [boundaries, setBoundaries] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [status, setStatus] = useState('');

  const API_BASE = 'http://localhost:3000/api/geo';

  // Mock map visualization (in real app, use Google Maps or Leaflet)
  const MockMap = () => (
    <div className="w-full h-64 bg-blue-50 border-2 border-blue-200 rounded-lg relative overflow-hidden">
      {/* Boundaries */}
      {boundaries.map((boundary, index) => (
        <div
          key={index}
          className="absolute w-32 h-32 bg-green-200 border-2 border-green-500 rounded-full opacity-60"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-green-800">
            {boundary.name}
          </div>
        </div>
      ))}
      
      {/* User Location */}
      {userLocation && (
        <div
          className="absolute w-6 h-6 bg-red-500 border-2 border-white rounded-full shadow-lg"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold bg-white px-1 rounded">
            You
          </div>
        </div>
      )}
    </div>
  );

  const trackLiveLocation = () => {
    if (!navigator.geolocation) {
      setStatus('Geolocation not supported');
      return;
    }

    setStatus('Tracking live location...');

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        try {
          const response = await axios.get(`${API_BASE}/check`, {
            params: { lat: latitude, lng: longitude }
          });
          setStatus(response.data.message);
        } catch (err) {
          setStatus('Error checking geofence');
        }
      },
      (err) => {
        setStatus('Error: ' + err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  };

  useEffect(() => {
    // Fetch boundaries
    const fetchBoundaries = async () => {
      try {
        const response = await axios.get(`${API_BASE}/boundaries`);
        setBoundaries(response.data.boundaries || []);
      } catch (err) {
        console.error('Error fetching boundaries:', err);
      }
    };

    fetchBoundaries();
  }, []);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Live Geo Map</h2>
      
      <div className="space-y-4">
        <button
          onClick={trackLiveLocation}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          Start Live Tracking
        </button>

        <div className="text-center text-sm text-gray-600 font-medium">
          {status}
        </div>

        <MockMap />

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Safe Zones:</h3>
          <div className="space-y-2">
            {boundaries.map((boundary, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">{boundary.name}</span>
                <span className="text-xs text-gray-500">
                  ({boundary.center.lat.toFixed(4)}, {boundary.center.lng.toFixed(4)})
                </span>
              </div>
            ))}
          </div>
        </div>

        {userLocation && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Your Position:</p>
            <p className="font-mono text-xs">
              Lat: {userLocation.lat.toFixed(6)}, Lng: {userLocation.lng.toFixed(6)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveGeoMap;