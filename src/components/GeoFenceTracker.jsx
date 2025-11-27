import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GeoFenceTracker = () => {
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [geofenceStatus, setGeofenceStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = 'http://localhost:3000/api/geo';

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        checkGeofenceStatus(latitude, longitude);
      },
      (err) => {
        setError('Error getting location: ' + err.message);
        setLoading(false);
      }
    );
  };

  // Check geofence status
  const checkGeofenceStatus = async (lat, lng) => {
    try {
      const response = await axios.get(`${API_BASE}/check`, {
        params: { lat, lng }
      });
      setGeofenceStatus(response.data);
      setError('');
    } catch (err) {
      setError('Error checking geofence status: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get all boundaries
  const getBoundaries = async () => {
    try {
      const response = await axios.get(`${API_BASE}/boundaries`);
      console.log('Boundaries:', response.data);
    } catch (err) {
      console.error('Error fetching boundaries:', err);
    }
  };

  useEffect(() => {
    getBoundaries();
  }, []);

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Geo Fence Tracker</h2>
      
      <div className="space-y-4">
        <button
          onClick={getCurrentLocation}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
        >
          {loading ? 'Checking Location...' : 'Check Current Location'}
        </button>

        {location.lat && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Current Location:</p>
            <p className="font-mono text-sm">
              Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
            </p>
          </div>
        )}

        {geofenceStatus && (
          <div className={`p-4 rounded-lg ${
            geofenceStatus.inGeofence 
              ? 'bg-green-100 border border-green-300' 
              : 'bg-red-100 border border-red-300'
          }`}>
            <p className={`font-semibold ${
              geofenceStatus.inGeofence ? 'text-green-800' : 'text-red-800'
            }`}>
              {geofenceStatus.inGeofence ? '✅ Safe' : '⚠️ Outside Safe Zone'}
            </p>
            <p className="text-sm mt-1">
              {geofenceStatus.message}
            </p>
            {geofenceStatus.boundary && (
              <p className="text-xs mt-1">Boundary: {geofenceStatus.boundary}</p>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default GeoFenceTracker;