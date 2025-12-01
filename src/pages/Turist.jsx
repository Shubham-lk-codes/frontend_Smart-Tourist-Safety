import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import GeoFenceTracker from '../components/GeoFenceTracker';
import LiveGeoMap from '../components/LiveGeoMap';
import SafetyMap from '../components/SafetyMap';
import GeofenceList from '../components/GeofenceList';

function Tourist() {
  const [panicStatus, setPanicStatus] = useState(false);
  const [location, setLocation] = useState(null);
  const [socket, setSocket] = useState(null);
  const [emergencySent, setEmergencySent] = useState(false);
  const [emergencyDetails, setEmergencyDetails] = useState(null);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const socketRef = useRef(null);
  const navigate = useNavigate();

  // WebSocket connection setup
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(`ws://${window.location.hostname}:3000`);
        
        ws.onopen = () => {
          console.log('🔗 Tourist WebSocket Connected');
          setSocketStatus('connected');
          setSocket(ws);
          socketRef.current = ws;
          
          // Identify as tourist user
          ws.send(JSON.stringify({
            type: 'identify_user',
            userType: 'tourist'
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 Tourist received:', data.type);

            switch (data.type) {
              case 'panic_acknowledged':
                setEmergencyDetails(prev => ({
                  ...prev,
                  acknowledged: true,
                  acknowledgedBy: data.acknowledgedBy,
                  acknowledgedAt: data.timestamp
                }));
                break;
                
              case 'emergency_acknowledged_by_authority':
                alert('✅ Police have acknowledged your emergency and are on the way!');
                break;
                
              case 'connection_established':
                console.log('✅ WebSocket connection established');
                break;
                
              case 'pong':
                // Handle ping-pong for connection health
                break;
                
              default:
                console.log('Received:', data);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = (event) => {
          console.log('🔴 Tourist WebSocket Disconnected');
          setSocketStatus('disconnected');
          socketRef.current = null;
          
          // Auto-reconnect after 3 seconds
          setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            connectWebSocket();
          }, 3000);
        };

        ws.onerror = (error) => {
          console.error('💥 Tourist WebSocket error:', error);
          setSocketStatus('error');
        };

      } catch (error) {
        console.error('💥 Failed to create WebSocket:', error);
        setSocketStatus('error');
      }
    };

    connectWebSocket();

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Get current location with better error handling
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          setLocation(locationData);
          resolve(locationData);
        },
        (error) => {
          console.error('Error getting location:', error);
          
          // Default location (Delhi) if permission denied
          const defaultLocation = {
            latitude: 28.6139,
            longitude: 77.2090,
            accuracy: 1000,
            timestamp: new Date().toISOString()
          };
          setLocation(defaultLocation);
          resolve(defaultLocation);
        },
        options
      );
    });
  };

  // Panic Button Handler - Updated with proper backend integration
  const handlePanicButton = async () => {
    if (panicStatus) {
      alert('Emergency already sent. Help is on the way!');
      return;
    }

    setPanicStatus(true);
    setEmergencySent(false);

    try {
      // Get current location
      const currentLocation = await getCurrentLocation();
      
      const userId = `tourist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const emergencyData = {
        userId: userId,
        location: currentLocation,
        timestamp: new Date().toISOString(),
        emergencyType: 'general',
        message: 'Need immediate help!'
      };

      // Store emergency details for display
      setEmergencyDetails({
        id: `emergency_${Date.now()}`,
        userId: userId,
        location: currentLocation,
        timestamp: new Date().toISOString(),
        status: 'active',
        acknowledged: false
      });

      // Send via WebSocket (real-time)
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        const panicData = {
          type: 'panic_alert',
          data: {
            userId: userId,
            location: currentLocation,
            timestamp: new Date().toISOString(),
            emergencyType: 'general',
            message: 'Need immediate help!'
          }
        };
        socketRef.current.send(JSON.stringify(panicData));
        console.log('📡 Emergency sent via WebSocket');
      } else {
        console.warn('WebSocket not connected, sending via HTTP only');
      }

      // Send via HTTP POST to backend API
      const response = await fetch('http://localhost:3000/api/emergencies/panic-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emergencyData)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Emergency alert sent successfully:', result);
        setEmergencySent(true);
        
        // Show success message
        alert(`🚨 Emergency Alert Sent!\nAlert ID: ${result.alertId}\nPolice have been notified. Stay calm and wait for help.`);
        
        // Update emergency details with server ID
        setEmergencyDetails(prev => ({
          ...prev,
          id: result.alertId,
          serverResponse: result
        }));
      } else {
        throw new Error(result.error || 'Failed to send emergency alert');
      }

    } catch (error) {
      console.error('❌ Error sending panic alert:', error);
      alert(`Failed to send emergency alert: ${error.message}\nPlease try again or call emergency services directly.`);
      
      // Reset panic status on error
      setTimeout(() => {
        setPanicStatus(false);
        setEmergencySent(false);
      }, 2000);
    }

    // Auto reset after 30 seconds
    setTimeout(() => {
      setPanicStatus(false);
      setEmergencySent(false);
      setEmergencyDetails(null);
    }, 30000);
  };

  // Cancel emergency
  const cancelEmergency = () => {
    if (emergencyDetails && window.confirm('Are you sure you want to cancel the emergency alert?')) {
      setPanicStatus(false);
      setEmergencySent(false);
      setEmergencyDetails(null);
      alert('Emergency alert cancelled.');
    }
  };

  const getStatusColor = () => {
    switch (socketStatus) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'connecting': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = () => {
    switch (socketStatus) {
      case 'connected': return '🟢 Connected';
      case 'connecting': return '🟡 Connecting...';
      case 'error': return '🔴 Connection Error';
      default: return '⚫ Disconnected';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Panic Button */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Tourist Safety Dashboard</h2>
              <div className="flex items-center mt-1">
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor()}`}>
                  {getStatusText()}
                </span>
                <span className="ml-2 text-xs text-gray-600">
                  📍 {location ? `Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Getting location...'}
                </span>
              </div>
            </div>
            
            {/* Panic Button */}
            <div className="flex flex-col items-end">
              <button
                onClick={handlePanicButton}
                disabled={panicStatus}
                className={`px-8 py-4 rounded-full font-bold text-white text-lg shadow-lg transform transition-all duration-200 flex items-center justify-center ${
                  panicStatus 
                    ? 'bg-red-600 animate-pulse scale-110' 
                    : 'bg-red-500 hover:bg-red-600 hover:scale-105 active:scale-95'
                }`}
              >
                {panicStatus ? (
                  <>
                    <span className="mr-2">🚨</span>
                    HELP IS COMING!
                  </>
                ) : (
                  <>
                    <span className="mr-2">⚠️</span>
                    EMERGENCY
                  </>
                )}
              </button>
              
              {panicStatus && (
                <button
                  onClick={cancelEmergency}
                  className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                >
                  Cancel Emergency
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-4">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => navigate('/tourist/tracker')}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition duration-200 flex items-center"
              >
                📍 Location Tracker
              </button>
              <button 
                onClick={() => navigate('/tourist/map')}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition duration-200 flex items-center"
              >
                🗺️ Live Map
              </button>
              <button 
                onClick={() => navigate('/tourist/safety-map')}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition duration-200 flex items-center"
              >
                🛡️ Safety Map
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Emergency Status Panel */}
      {panicStatus && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="container mx-auto">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-red-500 text-2xl">🚨</span>
              </div>
              <div className="ml-3 flex-grow">
                <h3 className="font-bold text-red-800">EMERGENCY ALERT SENT!</h3>
                <p className="text-red-700">
                  Police and rescue team have been notified. Stay calm and wait for help.
                </p>
                
                {emergencyDetails && (
                  <div className="mt-2 text-sm bg-red-100 p-2 rounded">
                    <p><strong>Alert ID:</strong> {emergencyDetails.id}</p>
                    <p><strong>Time:</strong> {new Date(emergencyDetails.timestamp).toLocaleTimeString()}</p>
                    <p><strong>Location:</strong> 
                      {emergencyDetails.location ? 
                        ` ${emergencyDetails.location.latitude.toFixed(4)}, ${emergencyDetails.location.longitude.toFixed(4)}` 
                        : ' Getting location...'}
                    </p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${
                        emergencyDetails.acknowledged ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {emergencyDetails.acknowledged ? 'Acknowledged by Police' : 'Waiting for response'}
                      </span>
                    </p>
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      {socketStatus !== 'connected' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-yellow-500">⚠️</span>
              <span className="ml-2 text-yellow-700">
                {socketStatus === 'connecting' ? 'Connecting to emergency services...' : 
                 socketStatus === 'error' ? 'Connection error. Emergency alerts may be delayed.' : 
                 'Disconnected. Trying to reconnect...'}
              </span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-yellow-700 underline hover:text-yellow-900"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/tourist/tracker" replace />} />
          <Route path="/tracker" element={<GeoFenceTracker />} />
          <Route path="/map" element={<LiveGeoMap />} />
          <Route path="/safety-map" element={<SafetyMap />} />
        </Routes>
        
        <div className="mt-8">
          <GeofenceList />
        </div>
      </div>

      {/* Emergency Instructions Footer */}
      <div className="bg-gray-800 text-white p-4 mt-8">
        <div className="container mx-auto text-center text-sm">
          <p className="font-bold">EMERGENCY INSTRUCTIONS:</p>
          <p>1. Press the red button to alert police and emergency services</p>
          <p>2. Stay where you are if it's safe to do so</p>
          <p>3. Keep your phone accessible for further instructions</p>
          <p className="mt-2 text-gray-400">Your location is being shared with authorities</p>
        </div>
      </div>
    </div>
  );
}

export default Tourist;