import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const touristIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const policeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const otherUserIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const panicIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [1, -34],
  shadowSize: [48, 48]
});

// Component to handle auto-centering of map
const MapCenterHandler = ({ center, zoom, userLocation }) => {
  const map = useMap();
  
  useEffect(() => {
    if (userLocation && center) {
      map.setView(center, zoom);
      console.log('📍 Map centered to:', center);
    }
  }, [center, zoom, map, userLocation]);
  
  return null;
};

const LiveGeoMap = () => {
  const [boundaries, setBoundaries] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [otherUsers, setOtherUsers] = useState([]);
  const [status, setStatus] = useState('Click Start Tracking to begin');
  const [isTracking, setIsTracking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [userCount, setUserCount] = useState(0);
  const [geofenceStatus, setGeofenceStatus] = useState(null);
  const [userType, setUserType] = useState('tourist');
  const [mapCenter, setMapCenter] = useState(null); // Initially null, will be set by user location
  const [mapZoom, setMapZoom] = useState(16); // Zoom level for street view
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [initialLocationSet, setInitialLocationSet] = useState(false);
  
  const watchIdRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const mapRef = useRef(null);
  
  const API_BASE = 'http://localhost:3000/api/geo';
  const WS_URL = 'ws://localhost:3000';

  // Get initial user location when component mounts
  useEffect(() => {
    if (!initialLocationSet && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          setInitialLocationSet(true);
          console.log('📍 Initial location set:', latitude, longitude);
        },
        (error) => {
          console.log('⚠️ Could not get initial location, using default');
          // Use a default location if geolocation fails
          setMapCenter([21.1458, 79.0881]); // Default: Nagpur
          setInitialLocationSet(true);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }
  }, [initialLocationSet]);

  // WebSocket connection with reconnection
  const connectWebSocket = useCallback(() => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      setConnectionStatus('connecting');
      setStatus('🔄 Connecting to WebSocket...');

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
                      lastUpdate: data.timestamp,
                      userType: data.data.userType || 'tourist'
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

            case 'panic_alert':
              setEmergencyAlerts(prev => [
                ...prev.filter(alert => alert.id !== data.id),
                data
              ]);
              if (userType === 'police') {
                setStatus(`🚨 New emergency alert from ${data.clientId}`);
                
                // Auto-center map to emergency location
                if (data.location && mapRef.current) {
                  setTimeout(() => {
                    mapRef.current.setView([data.location.lat, data.location.lng], 16);
                    setMapCenter([data.location.lat, data.location.lng]);
                  }, 100);
                }
              }
              break;

            case 'panic_acknowledged':
              setStatus(`🚨 ${data.message}`);
              break;

            case 'emergency_acknowledged_by_authority':
              setEmergencyAlerts(prev => 
                prev.filter(alert => alert.id !== data.alertId)
              );
              setStatus(`✅ ${data.message}`);
              break;

            case 'emergency_status_update':
              setEmergencyAlerts(prev =>
                prev.map(alert => 
                  alert.id === data.alert.id ? { ...alert, ...data.alert } : alert
                )
              );
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

  // Send panic alert
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

  // Acknowledge emergency (for police)
  const acknowledgeEmergency = (alertId) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setStatus('❌ Not connected to WebSocket');
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'emergency_acknowledged',
      alertId: alertId
    }));
    
    setEmergencyAlerts(prev => prev.filter(alert => alert.id !== alertId));
    setStatus(`✅ Emergency ${alertId} acknowledged`);
  };

  // Switch user type
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
        
        // Auto-center map to user location (only when tracking starts or significant movement)
        if (!mapCenter || (mapCenter && (
          Math.abs(mapCenter[0] - latitude) > 0.0001 || 
          Math.abs(mapCenter[1] - longitude) > 0.0001
        ))) {
          setMapCenter([latitude, longitude]);
          console.log('📍 Map auto-centered to user location:', latitude, longitude);
        }

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
            params: { lat: latitude, lng: longitude },
            timeout: 5000
          });
          setGeofenceStatus(response.data);
          setStatus(`${response.data.message} | 📍 Live updating...`);
        } catch (err) {
          console.error('Geofence check error:', err);
          if (isTracking) {
            setStatus('📍 Live tracking - Temporary geofence service issue');
          }
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setStatus('❌ Location error: ' + err.message);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        distanceFilter: 5 // Update every 5 meters movement
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

  // Manual center to user location
  const centerToUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 16);
      setMapCenter([userLocation.lat, userLocation.lng]);
      setStatus('📍 Map centered to your location');
    }
  };

  // Real-time Map Component with Leaflet
  const RealTimeMap = () => {
    if (!mapCenter) {
      return (
        <div className="w-full h-96 rounded-2xl overflow-hidden border-2 border-gray-300 shadow-lg flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
            <p className="text-sm text-gray-500 mt-2">Waiting for location permission</p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-96 rounded-2xl overflow-hidden border-2 border-gray-300 shadow-lg">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance;
            // Add zoom change event listener
            mapInstance.on('zoom', () => {
              setMapZoom(mapInstance.getZoom());
            });
            
            // Add move event listener
            mapInstance.on('move', () => {
              const center = mapInstance.getCenter();
              setMapCenter([center.lat, center.lng]);
            });
          }}
        >
          <MapCenterHandler 
            center={mapCenter} 
            zoom={mapZoom} 
            userLocation={userLocation}
          />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Draw boundaries */}
          {boundaries.map((boundary, index) => {
            if (boundary.type === 'circle' && boundary.center && boundary.radius) {
              return (
                <Circle
                  key={boundary._id || index}
                  center={[boundary.center.lat, boundary.center.lng]}
                  radius={boundary.radius}
                  pathOptions={{
                    color: '#10B981',
                    fillColor: '#10B981',
                    fillOpacity: 0.2,
                    weight: 2
                  }}
                >
                  <Tooltip permanent direction="center">
                    <div className="font-bold text-green-800">🛡️ {boundary.name}</div>
                  </Tooltip>
                </Circle>
              );
            } else if (boundary.type === 'polygon' && boundary.coordinates) {
              return (
                <Polygon
                  key={boundary._id || index}
                  positions={boundary.coordinates.map(coord => [coord.lat, coord.lng])}
                  pathOptions={{
                    color: '#8B5CF6',
                    fillColor: '#8B5CF6',
                    fillOpacity: 0.2,
                    weight: 2
                  }}
                >
                  <Popup>
                    <div className="font-bold text-purple-800">📍 {boundary.name}</div>
                  </Popup>
                </Polygon>
              );
            }
            return null;
          })}
          
          {/* Other Users */}
          {otherUsers.map((user) => (
            <Marker
              key={user.id}
              position={[user.lat, user.lng]}
              icon={user.userType === 'police' ? policeIcon : otherUserIcon}
            >
              <Popup>
                <div className="p-2">
                  <div className="font-bold">
                    {user.userType === 'police' ? '👮 Police' : '👤 Tourist'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Lat: {user.lat.toFixed(6)}<br />
                    Lng: {user.lng.toFixed(6)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Last update: {new Date(user.lastUpdate).toLocaleTimeString()}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Current User Location */}
          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userType === 'police' ? policeIcon : touristIcon}
            >
              <Popup>
                <div className="p-2">
                  <div className="font-bold text-blue-600">
                    🎯 YOU ({userType.toUpperCase()})
                  </div>
                  <div className="text-sm">
                    Latitude: {userLocation.lat.toFixed(6)}<br />
                    Longitude: {userLocation.lng.toFixed(6)}<br />
                    Accuracy: ±{userLocation.accuracy?.toFixed(1) || '0'}m
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Updated: {new Date(userLocation.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Emergency Alerts */}
          {emergencyAlerts.map((alert) => (
            <Marker
              key={alert.id}
              position={[alert.location.lat, alert.location.lng]}
              icon={panicIcon}
            >
              <Popup>
                <div className="p-2">
                  <div className="font-bold text-red-600">🚨 EMERGENCY ALERT</div>
                  <div className="text-sm">
                    From: {alert.clientId}<br />
                    Type: {alert.data?.emergencyType || 'General'}<br />
                    Message: {alert.data?.message || 'Need assistance!'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Time: {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                  {userType === 'police' && (
                    <button
                      onClick={() => acknowledgeEmergency(alert.id)}
                      className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    );
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
        const response = await axios.get(`${API_BASE}/geofences`, {
          timeout: 10000
        });
        setBoundaries(response.data.boundaries || []);
      } catch (err) {
        console.error('Error fetching boundaries:', err);
        // Set some default boundaries for demo
        setBoundaries([
          {
            _id: 'demo1',
            name: 'Demo Safe Zone',
            type: 'circle',
            center: { lat: 21.1458, lng: 79.0881 },
            radius: 3000
          }
        ]);
      }
    };

    fetchBoundaries();
  }, []);

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
            {userLocation && (
              <div className="mt-2 text-xs text-gray-600">
                Location: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
              </div>
            )}
          </div>

          {/* Real-time Map */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-2xl border-2 border-gray-200/50 shadow-inner backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Live Tracking Map
              </h3>
              <div className="flex flex-wrap gap-2">
                {userLocation && (
                  <button
                    onClick={centerToUserLocation}
                    disabled={!userLocation}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    Center on Me
                  </button>
                )}
                <div className="text-sm text-gray-600 bg-white/80 px-3 py-2 rounded-lg border border-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Zoom:</span> 
                    <span className="font-mono">{mapZoom}</span>
                  </div>
                  {mapCenter && (
                    <div className="text-xs mt-1">
                      Lat: {mapCenter[0].toFixed(6)}, Lng: {mapCenter[1].toFixed(6)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <RealTimeMap />
            
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200/50">
              <div className="flex items-center space-x-2 text-sm bg-white/80 px-3 py-1.5 rounded-lg border border-gray-200">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Safe Zones</span>
              </div>
              <div className="flex items-center space-x-2 text-sm bg-white/80 px-3 py-1.5 rounded-lg border border-gray-200">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Tourist</span>
              </div>
              <div className="flex items-center space-x-2 text-sm bg-white/80 px-3 py-1.5 rounded-lg border border-gray-200">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-700">Police</span>
              </div>
              <div className="flex items-center space-x-2 text-sm bg-white/80 px-3 py-1.5 rounded-lg border border-gray-200">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-700">Other Users</span>
              </div>
              <div className="flex items-center space-x-2 text-sm bg-white/80 px-3 py-1.5 rounded-lg border border-gray-200">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-gray-700">Emergency</span>
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
                      <div className={`w-3 h-3 rounded-full ${boundary.type === 'circle' ? 'bg-green-500' : 'bg-purple-500'}`}></div>
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

            {/* Online Users & Emergencies */}
            <div className="bg-gradient-to-br from-gray-50 to-purple-50 p-6 rounded-2xl border-2 border-purple-200/50 shadow backdrop-blur-sm">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center text-lg">
                <svg className="w-6 h-6 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Online Users & Emergencies
              </h3>
              <div className="space-y-3">
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-purple-200/50">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{userCount}</div>
                    <div className="text-sm text-gray-600">Active Connections</div>
                  </div>
                </div>
                
                {emergencyAlerts.length > 0 && (
                  <div className="bg-red-50/80 backdrop-blur-sm p-3 rounded-xl border border-red-200/50">
                    <div className="text-sm font-semibold text-red-700 mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Active Emergencies ({emergencyAlerts.length})
                    </div>
                    <div className="space-y-2">
                      {emergencyAlerts.slice(0, 3).map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between text-xs p-2 bg-white/50 rounded">
                          <span className="text-red-600 font-medium truncate">Alert: {alert.clientId}</span>
                          {userType === 'police' && (
                            <button
                              onClick={() => acknowledgeEmergency(alert.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                            >
                              Ack
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {otherUsers.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-purple-200/50">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Other Users:</div>
                    <div className="space-y-2">
                      {otherUsers.slice(0, 5).map((user, index) => (
                        <div key={user.id} className="flex items-center space-x-2 text-xs">
                          <div className={`w-2 h-2 rounded-full ${
                            user.userType === 'police' ? 'bg-red-500' : 'bg-purple-500'
                          }`}></div>
                          <span className="text-gray-600">
                            {user.userType === 'police' ? '👮 Police' : '👤 Tourist'}
                          </span>
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