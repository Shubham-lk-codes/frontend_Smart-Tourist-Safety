import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GeoFenceTracker = () => {
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [geofenceStatus, setGeofenceStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackingInterval, setTrackingInterval] = useState(null);

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
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Start continuous tracking
  const startTracking = () => {
    setIsTracking(true);
    getCurrentLocation(); // Initial check
    
    const interval = setInterval(() => {
      getCurrentLocation();
    }, 5000); // Check every 5 seconds
    
    setTrackingInterval(interval);
  };

  // Stop tracking
  const stopTracking = () => {
    setIsTracking(false);
    if (trackingInterval) {
      clearInterval(trackingInterval);
      setTrackingInterval(null);
    }
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

  useEffect(() => {
    return () => {
      if (trackingInterval) {
        clearInterval(trackingInterval);
      }
    };
  }, [trackingInterval]);

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Live Location Tracker</h2>
            <p className="text-blue-100 text-sm mt-1">Real-time geofence monitoring</p>
          </div>
          <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`}></div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Control Buttons */}
        <div className="flex space-x-3">
          {!isTracking ? (
            <button
              onClick={startTracking}
              disabled={loading}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start Live Tracking
            </button>
          ) : (
            <button
              onClick={stopTracking}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Stop Tracking
            </button>
          )}
          
          <button
            onClick={getCurrentLocation}
            disabled={loading || isTracking}
            className="px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Location Display */}
        {location.lat && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Current Location</p>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Live</span>
            </div>
            <div className="font-mono text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Latitude:</span>
                <span className="font-bold">{location.lat.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Longitude:</span>
                <span className="font-bold">{location.lng.toFixed(6)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Geofence Status */}
        {geofenceStatus && (
          <div className={`p-4 rounded-lg border-2 ${
            geofenceStatus.inGeofence 
              ? 'bg-green-50 border-green-300' 
              : 'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-3 ${
                  geofenceStatus.inGeofence ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <p className={`text-lg font-bold ${
                  geofenceStatus.inGeofence ? 'text-green-800' : 'text-red-800'
                }`}>
                  {geofenceStatus.inGeofence ? '✅ Within Safe Zone' : '⚠️ Outside Safe Zone'}
                </p>
              </div>
              {isTracking && (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
              )}
            </div>
            
            <p className="text-sm mt-2 ml-7">
              {geofenceStatus.message}
            </p>
            
            {geofenceStatus.boundary && (
              <div className="mt-3 ml-7 p-2 bg-white rounded border">
                <p className="text-xs text-gray-600">Safe Zone:</p>
                <p className="text-sm font-medium">{geofenceStatus.boundary}</p>
              </div>
            )}
          </div>
        )}

        {/* Tracking Status */}
        {isTracking && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800">Live Tracking Active</p>
                <p className="text-xs text-yellow-600">Checking location every 5 seconds</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeoFenceTracker;