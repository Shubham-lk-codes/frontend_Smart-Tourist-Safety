import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GeoFenceTracker from '../components/GeoFenceTracker';
import LiveGeoMap from '../components/LiveGeoMap';
import SafetyMap from '../components/SafetyMap';

function Tourist() {
  const [panicStatus, setPanicStatus] = useState(false);
  const [location, setLocation] = useState(null);
  const [socket, setSocket] = useState(null);

  // WebSocket connection setup
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000');
    
    ws.onopen = () => {
      console.log('WebSocket Connected');
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'panic_alert_ack') {
        alert('Help is on the way! Authorities have been notified.');
      }
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          return { latitude, longitude };
        },
        (error) => {
          console.error('Error getting location:', error);
          return null;
        }
      );
    }
  };

  // Panic Button Handler
  const handlePanicButton = async () => {
    const currentLocation = location || getCurrentLocation();
    
    if (!currentLocation) {
      alert('Unable to get your location. Please enable location services.');
      return;
    }

    setPanicStatus(true);
    
    // Send panic alert via WebSocket
    if (socket && socket.readyState === WebSocket.OPEN) {
      const panicData = {
        type: 'panic_alert',
        userId: 'tourist_' + Date.now(),
        location: currentLocation,
        timestamp: new Date().toISOString(),
        emergency: true
      };
      socket.send(JSON.stringify(panicData));
    }

    // Also send to backend API
    try {
      const response = await fetch('http://localhost:3000/api/panic-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'tourist_' + Date.now(),
          location: currentLocation,
          timestamp: new Date().toISOString(),
          emergencyType: 'general'
        })
      });

      if (response.ok) {
        console.log('Panic alert sent successfully');
      }
    } catch (error) {
      console.error('Error sending panic alert:', error);
    }

    // Auto reset after 30 seconds
    setTimeout(() => {
      setPanicStatus(false);
    }, 30000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Panic Button */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Tourist Safety Dashboard</h2>
            
            {/* Panic Button */}
            <button
              onClick={handlePanicButton}
              disabled={panicStatus}
              className={`px-6 py-3 rounded-full font-bold text-white text-lg shadow-lg transform transition-all duration-200 ${
                panicStatus 
                  ? 'bg-red-600 animate-pulse scale-110' 
                  : 'bg-red-500 hover:bg-red-600 hover:scale-105'
              }`}
            >
              {panicStatus ? 'HELP IS COMING!' : '🚨 EMERGENCY'}
            </button>
          </div>

          {/* Navigation */}
          <nav className="mt-4">
            <div className="flex space-x-4">
              <a 
                href="/tourist/tracker" 
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition duration-200"
              >
                📍 Location Tracker
              </a>
              <a 
                href="/tourist/map" 
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition duration-200"
              >
                🗺️ Live Map
              </a>
              <a 
                href="/tourist/safety-map" 
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition duration-200"
              >
                🛡️ Safety Map
              </a>
            </div>
          </nav>
        </div>
      </div>

      {/* Emergency Status */}
      {panicStatus && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-red-500">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="font-bold">Emergency Alert Sent!</p>
              <p className="text-sm">Police and rescue team have been notified. Stay calm and wait for help.</p>
            </div>
          </div>
        </div>
      )}

      {/* Nested Routes */}
      <div className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/tourist/tracker" replace />} />
          <Route path="/tracker" element={<GeoFenceTracker />} />
          <Route path="/map" element={<LiveGeoMap />} />
          <Route path="/safety-map" element={<SafetyMap />} />
        </Routes>
      </div>
    </div>
  );
}

export default Tourist;