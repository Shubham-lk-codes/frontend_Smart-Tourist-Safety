import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const LiveGeoMap = () => {
  const [boundaries, setBoundaries] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [status, setStatus] = useState('Click Start Tracking to begin');
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef(null);

  const API_BASE = 'http://localhost:3000/api/geo';

  // Mock map visualization
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
          className="absolute w-6 h-6 bg-red-500 border-2 border-white rounded-full shadow-lg animate-pulse"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold bg-white px-1 rounded shadow">
            You
          </div>
        </div>
      )}
    </div>
  );

  const startLiveTracking = () => {
    if (!navigator.geolocation) {
      setStatus('Geolocation not supported');
      return;
    }

    setIsTracking(true);
    setStatus('Tracking live location...');

    // Clear previous watch if exists
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { lat: latitude, lng: longitude };
        setUserLocation(newLocation);

        try {
          const response = await axios.get(`${API_BASE}/check`, {
            params: { lat: latitude, lng: longitude }
          });
          setStatus(`${response.data.message} | Last update: ${new Date().toLocaleTimeString()}`);
        } catch (err) {
          setStatus('Error checking geofence');
          console.error('Geofence check error:', err);
        }
      },
      (err) => {
        setStatus('Error: ' + err.message);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        distanceFilter: 1 // Update every 1 meter movement
      }
    );
  };

  const stopLiveTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setStatus('Tracking stopped');
  };

  useEffect(() => {
    // Fetch boundaries on component mount
    const fetchBoundaries = async () => {
      try {
        const response = await axios.get(`${API_BASE}/boundaries`);
        setBoundaries(response.data.boundaries || []);
      } catch (err) {
        console.error('Error fetching boundaries:', err);
      }
    };

    fetchBoundaries();

    // Cleanup on unmount
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Live Geo Tracking</h2>
      
      <div className="space-y-4">
        <div className="flex space-x-2">
          <button
            onClick={startLiveTracking}
            disabled={isTracking}
            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Start Live Tracking
          </button>
          
          <button
            onClick={stopLiveTracking}
            disabled={!isTracking}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Stop Tracking
          </button>
        </div>

        <div className={`text-center text-sm font-medium p-2 rounded ${
          status.includes('within') ? 'bg-green-100 text-green-800' : 
          status.includes('outside') ? 'bg-yellow-100 text-yellow-800' : 
          'bg-blue-100 text-blue-800'
        }`}>
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
                <span className="text-xs text-gray-400">- {boundary.radius}m radius</span>
              </div>
            ))}
          </div>
        </div>

        {userLocation && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600 font-semibold">Your Live Position:</p>
            <p className="font-mono text-xs mt-1">
              Lat: {userLocation.lat.toFixed(6)}
            </p>
            <p className="font-mono text-xs">
              Lng: {userLocation.lng.toFixed(6)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Updating in real-time...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveGeoMap;