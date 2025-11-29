import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const LiveGeoMap = () => {
  const [boundaries, setBoundaries] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [otherUsers, setOtherUsers] = useState([]);
  const [status, setStatus] = useState('Click Start Tracking to begin');
  const [isTracking, setIsTracking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [userCount, setUserCount] = useState(0);
  const [geofenceStatus, setGeofenceStatus] = useState(null);
  const [userType, setUserType] = useState('tourist'); // 'tourist' or 'police'
  
  const watchIdRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  
  // ✅ CORRECTED: Use port 3000 instead of 8080
  const API_BASE = 'http://localhost:3000/api/geo';
  const WS_URL = 'ws://localhost:3000';

  // WebSocket connection with reconnection
  const connectWebSocket = useCallback(() => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      setConnectionStatus('connecting');
      setStatus('🔄 Connecting to WebSocket...');

      // ✅ CORRECTED: Use correct WebSocket URL
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setConnectionStatus('connected');
        setStatus('✅ Connected - Ready for live tracking');
        
        // Identify user type
        ws.send(JSON.stringify({
          type: 'identify_user',
          userType: userType
        }));
        
        // Clear any reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message:', data.type);

          switch (data.type) {
            case 'connection_established':
              setStatus('✅ WebSocket connected successfully');
              break;
              
            case 'location_update':
              if (data.clientId !== getClientId()) {
                setOtherUsers(prev => {
                  const existingIndex = prev.findIndex(u => u.id === data.clientId);
                  if (existingIndex >= 0) {
                    const updated = [...prev];
                    updated[existingIndex] = {
                      ...updated[existingIndex],
                      ...data.data,
                      lastUpdate: data.timestamp
                    };
                    return updated;
                  } else {
                    return [...prev, {
                      id: data.clientId,
                      ...data.data,
                      lastUpdate: data.timestamp
                    }];
                  }
                });
              }
              break;
              
            case 'user_connected':
              setUserCount(data.userCount);
              setStatus(`👤 User connected - Total: ${data.userCount}`);
              setTimeout(() => setStatus('✅ Ready for live tracking'), 2000);
              break;
              
            case 'user_disconnected':
              setUserCount(prev => prev - 1);
              setOtherUsers(prev => prev.filter(u => u.id !== data.clientId));
              break;
              
            case 'health_check':
              setUserCount(data.userCount);
              break;

            // NEW: Handle panic alert acknowledgments
            case 'panic_acknowledged':
              setStatus(`🚨 ${data.message}`);
              break;

            case 'emergency_acknowledged_by_authority':
              setStatus(`✅ ${data.message}`);
              break;
              
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔴 WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');
        setStatus('❌ WebSocket disconnected');
        
        // Attempt reconnect after 3 seconds if not normal closure
        if (event.code !== 1000 && event.code !== 1001) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            connectWebSocket();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('💥 WebSocket error:', error);
        setConnectionStatus('error');
        setStatus('❌ WebSocket connection error');
      };

    } catch (error) {
      console.error('❌ Error creating WebSocket:', error);
      setStatus('❌ WebSocket not supported');
    }
  }, [userType]);

  // Generate unique client ID
  const getClientId = () => {
    let clientId = localStorage.getItem('websocket_client_id');
    if (!clientId) {
      clientId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('websocket_client_id', clientId);
    }
    return clientId;
  };

  // NEW: Send panic alert
  const sendPanicAlert = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setStatus('❌ Not connected to WebSocket');
      return;
    }

    if (!userLocation) {
      setStatus('❌ Location not available for panic alert');
      return;
    }

    const panicData = {
      type: 'panic_alert',
      location: {
        lat: userLocation.lat,
        lng: userLocation.lng,
        accuracy: userLocation.accuracy
      },
      data: {
        emergencyType: 'general',
        message: 'Need immediate assistance!',
        touristId: getClientId()
      }
    };

    wsRef.current.send(JSON.stringify(panicData));
    setStatus('🚨 PANIC BUTTON PRESSED! Help is on the way...');
  };

  // NEW: Switch user type
  const switchUserType = (newType) => {
    setUserType(newType);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'identify_user',
        userType: newType
      }));
    }
    setStatus(`👤 Switched to ${newType} mode`);
  };

  const startLiveTracking = () => {
    if (!navigator.geolocation) {
      setStatus('❌ Geolocation not supported');
      return;
    }

    // Connect WebSocket if not connected
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connectWebSocket();
    }

    setIsTracking(true);
    setStatus('🚀 Live tracking started...');

    // Clear previous watch if exists
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newLocation = { 
          lat: latitude, 
          lng: longitude,
          accuracy: accuracy,
          timestamp: new Date().toISOString()
        };
        
        setUserLocation(newLocation);

        // Send location via WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'location_update',
            data: {
              ...newLocation,
              userId: getClientId(),
              userType: userType
            }
          }));
        }

        // Check geofence status
        try {
          const response = await axios.get(`${API_BASE}/check`, {
            params: { lat: latitude, lng: longitude }
          });
          setGeofenceStatus(response.data);
          setStatus(`${response.data.message} | 📍 Live updating...`);
        } catch (err) {
          console.error('Geofence check error:', err);
          setStatus('📍 Live tracking - Error checking geofence');
        }
      },
      (err) => {
        setStatus('❌ Location error: ' + err.message);
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
    setStatus('⏹️ Tracking stopped');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmount');
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Fetch boundaries on mount
  useEffect(() => {
    const fetchBoundaries = async () => {
      try {
        const response = await axios.get(`${API_BASE}/geofences`);
        setBoundaries(response.data.boundaries || []);
      } catch (err) {
        console.error('Error fetching boundaries:', err);
      }
    };

    fetchBoundaries();
  }, []);

  // Mock Map with real-time updates
  const RealTimeMap = () => (
    <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-cyan-100 border-2 border-blue-300 rounded-2xl relative overflow-hidden shadow-inner">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-blue-200/50"></div>
      
      {/* Boundaries */}
      {boundaries.map((boundary, index) => (
        <div
          key={boundary._id || index}
          className="absolute w-48 h-48 bg-green-200/40 border-2 border-green-500 rounded-full opacity-70 animate-pulse"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-green-800 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg border border-green-200">
            🛡️ {boundary.name}
          </div>
        </div>
      ))}
      
      {/* Other Users */}
      {otherUsers.map((user, index) => (
        <div
          key={user.id}
          className="absolute w-6 h-6 bg-purple-500 border-2 border-white rounded-full shadow-lg animate-pulse"
          style={{
            left: `${40 + (index * 10)}%`,
            top: `${30 + (index * 15)}%`,
          }}
        >
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-semibold bg-purple-100/90 backdrop-blur-sm px-2 py-1 rounded shadow border border-purple-200">
            👤
          </div>
        </div>
      ))}
      
      {/* Current User Location */}
      {userLocation && (
        <div
          className="absolute w-10 h-10 bg-red-500 border-3 border-white rounded-full shadow-lg animate-bounce"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-sm font-bold bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg border border-red-200">
            🎯 YOU
          </div>
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-xs text-red-600 font-mono bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow border border-red-200">
            {userType.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-8 border-b border-gray-200/50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Live Geo Tracking
              </h2>
              <p className="text-gray-600 mt-2 text-lg">Real-time location monitoring with WebSocket</p>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-4 lg:mt-0">
              {/* User Type Switch */}
              <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-gray-200/50">
                <span className="text-sm font-medium text-gray-700">Mode:</span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => switchUserType('tourist')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      userType === 'tourist' 
                        ? 'bg-blue-500 text-white shadow-lg' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Tourist
                  </button>
                  <button
                    onClick={() => switchUserType('police')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      userType === 'police' 
                        ? 'bg-red-500 text-white shadow-lg' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Police
                  </button>
                </div>
              </div>

              <div className={`px-4 py-3 rounded-2xl text-sm font-semibold flex items-center backdrop-blur-sm ${
                connectionStatus === 'connected' 
                  ? 'bg-green-100/80 text-green-800 border border-green-300/50' 
                  : connectionStatus === 'connecting'
                  ? 'bg-yellow-100/80 text-yellow-800 border border-yellow-300/50'
                  : 'bg-red-100/80 text-red-800 border border-red-300/50'
              }`}>
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                WebSocket: {connectionStatus}
              </div>
              
              <div className="bg-blue-100/80 text-blue-800 px-4 py-3 rounded-2xl text-sm font-semibold border border-blue-300/50 backdrop-blur-sm">
                👥 Online: {userCount}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-8 space-y-8">
          {/* Control Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={startLiveTracking}
              disabled={isTracking}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-green-300 disabled:to-emerald-400 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-200 disabled:transform-none disabled:cursor-not-allowed transform hover:scale-105 flex items-center justify-center shadow-lg backdrop-blur-sm"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {isTracking ? '🚀 Tracking Active...' : 'Start Live Tracking'}
            </button>
            
            <button
              onClick={stopLiveTracking}
              disabled={!isTracking}
              className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-red-300 disabled:to-pink-400 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-200 disabled:transform-none disabled:cursor-not-allowed transform hover:scale-105 flex items-center justify-center shadow-lg backdrop-blur-sm"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Stop Tracking
            </button>

            {/* Panic Button - Only for Tourists */}
            {userType === 'tourist' && (
              <button
                onClick={sendPanicAlert}
                disabled={!userLocation || connectionStatus !== 'connected'}
                className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-red-300 disabled:to-orange-400 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-200 disabled:transform-none disabled:cursor-not-allowed transform hover:scale-105 flex items-center justify-center shadow-lg backdrop-blur-sm animate-pulse"
              >
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                🚨 PANIC BUTTON
              </button>
            )}
          </div>

          {/* Status Display */}
          <div className={`text-center p-6 rounded-2xl border-2 backdrop-blur-sm ${
            geofenceStatus?.inGeofence ? 'bg-gradient-to-r from-green-50 to-emerald-100 border-green-300 text-green-800' : 
            status.includes('outside') ? 'bg-gradient-to-r from-yellow-50 to-amber-100 border-yellow-300 text-yellow-800' : 
            status.includes('PANIC') ? 'bg-gradient-to-r from-red-50 to-orange-100 border-red-300 text-red-800 animate-pulse' :
            'bg-gradient-to-r from-blue-50 to-cyan-100 border-blue-300 text-blue-800'
          }`}>
            <div className="flex items-center justify-center space-x-3">
              {isTracking && (
                <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
              )}
              <span className="text-lg font-semibold">{status}</span>
            </div>
            {geofenceStatus?.boundary && (
              <div className="mt-2 text-sm font-medium">
                Current Zone: <span className="font-bold">{geofenceStatus.boundary}</span>
              </div>
            )}
          </div>

          {/* Real-time Map */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-2xl border-2 border-gray-200/50 shadow-inner backdrop-blur-sm">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Live Tracking Map
            </h3>
            <RealTimeMap />
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200/50">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-700">Safe Zones</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-gray-700">Your Location</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-4 h-4 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-gray-700">Other Users</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Tourist Mode</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-gray-700">Police Mode</span>
              </div>
            </div>
          </div>

          {/* Information Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Safe Zones */}
            <div className="bg-gradient-to-br from-gray-50 to-green-50 p-6 rounded-2xl border-2 border-green-200/50 shadow backdrop-blur-sm">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center text-lg">
                <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Safe Zones ({boundaries.length})
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {boundaries.slice(0, 5).map((boundary, index) => (
                  <div key={boundary._id || index} className="flex items-center justify-between p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-green-200/50 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${boundary.type === 'circle' ? 'bg-green-500' : 'bg-purple-500'} animate-pulse`}></div>
                      <div>
                        <span className="text-sm font-semibold text-gray-800">{boundary.name}</span>
                        <div className="text-xs text-gray-500">
                          {boundary.center?.lat?.toFixed(4) || 'N/A'}, {boundary.center?.lng?.toFixed(4) || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {boundary.radius ? `${boundary.radius}m` : 'Polygon'}
                    </span>
                  </div>
                ))}
                {boundaries.length > 5 && (
                  <div className="text-center text-sm text-gray-500 bg-white/50 p-2 rounded-lg">
                    +{boundaries.length - 5} more zones
                  </div>
                )}
              </div>
            </div>

            {/* Live Location Data */}
            {userLocation && (
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-2xl border-2 border-blue-200/50 shadow backdrop-blur-sm">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center text-lg">
                  <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Your Live Position
                </h3>
                <div className="space-y-3 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-blue-200/50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Latitude:</span>
                    <span className="font-mono text-sm bg-blue-50 px-2 py-1 rounded">{userLocation.lat.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Longitude:</span>
                    <span className="font-mono text-sm bg-blue-50 px-2 py-1 rounded">{userLocation.lng.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Accuracy:</span>
                    <span className="font-mono text-sm bg-green-50 px-2 py-1 rounded">±{userLocation.accuracy?.toFixed(1) || '0'}m</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Last Update:</span>
                    <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded">
                      {new Date(userLocation.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">User Type:</span>
                    <span className={`font-semibold px-2 py-1 rounded ${
                      userType === 'tourist' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {userType.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Online Users */}
            <div className="bg-gradient-to-br from-gray-50 to-purple-50 p-6 rounded-2xl border-2 border-purple-200/50 shadow backdrop-blur-sm">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center text-lg">
                <svg className="w-6 h-6 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Online Users
              </h3>
              <div className="space-y-3">
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-purple-200/50">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{userCount}</div>
                    <div className="text-sm text-gray-600">Active Connections</div>
                  </div>
                </div>
                
                {otherUsers.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-purple-200/50">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Other Users:</div>
                    <div className="space-y-2">
                      {otherUsers.slice(0, 5).map((user, index) => (
                        <div key={user.id} className="flex items-center space-x-2 text-xs">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                          <span className="text-gray-600">User {index + 1}</span>
                          <span className="text-gray-400 ml-auto">
                            {user.lastUpdate ? new Date(user.lastUpdate).toLocaleTimeString() : 'Just now'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveGeoMap;