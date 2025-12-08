

// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import axios from 'axios';
// import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, Tooltip, useMap } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';

// // Fix for default markers in React-Leaflet
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
//   iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
// });

// // Custom icons
// const touristIcon = new L.Icon({
//   iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   shadowSize: [41, 41]
// });

// const policeIcon = new L.Icon({
//   iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   shadowSize: [41, 41]
// });

// const otherUserIcon = new L.Icon({
//   iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   shadowSize: [41, 41]
// });

// const panicIcon = new L.Icon({
//   iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
//   iconSize: [30, 48],
//   iconAnchor: [15, 48],
//   popupAnchor: [1, -34],
//   shadowSize: [48, 48]
// });

// const anomalyIcon = new L.Icon({
//   iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
//   iconSize: [30, 48],
//   iconAnchor: [15, 48],
//   popupAnchor: [1, -34],
//   shadowSize: [48, 48]
// });

// // Component to handle auto-centering of map
// const MapCenterHandler = ({ center, zoom, userLocation }) => {
//   const map = useMap();
  
//   useEffect(() => {
//     if (userLocation && center) {
//       map.setView(center, zoom);
//       console.log('📍 Map centered to:', center);
//     }
//   }, [center, zoom, map, userLocation]);
  
//   return null;
// };

// const LiveGeoMap = () => {
//   const [boundaries, setBoundaries] = useState([]);
//   const [userLocation, setUserLocation] = useState(null);
//   const [otherUsers, setOtherUsers] = useState([]);
//   const [status, setStatus] = useState('Click Start Tracking to begin');
//   const [isTracking, setIsTracking] = useState(false);
//   const [connectionStatus, setConnectionStatus] = useState('disconnected');
//   const [userCount, setUserCount] = useState(0);
//   const [geofenceStatus, setGeofenceStatus] = useState(null);
//   const [userType, setUserType] = useState('tourist');
//   const [mapCenter, setMapCenter] = useState(null);
//   const [mapZoom, setMapZoom] = useState(16);
//   const [emergencyAlerts, setEmergencyAlerts] = useState([]);
//   const [initialLocationSet, setInitialLocationSet] = useState(false);
//   const [anomalyDetections, setAnomalyDetections] = useState([]);
//   const [anomalyStatus, setAnomalyStatus] = useState({
//     isActive: false,
//     alerts: [],
//     score: 0,
//     isAnomalous: false
//   });
//   const [voiceAlertsEnabled, setVoiceAlertsEnabled] = useState(true);
//   const [mlSystemStatus, setMlSystemStatus] = useState(null);
  
//   const watchIdRef = useRef(null);
//   const wsRef = useRef(null);
//   const reconnectTimeoutRef = useRef(null);
//   const mapRef = useRef(null);
//   const anomalyCheckIntervalRef = useRef(null);
  
//   const API_BASE = 'http://localhost:3000/api/geo';
//   const WS_URL = 'ws://localhost:3000';
//   const ML_API_URL = 'http://localhost:5001';

//   // Get initial user location when component mounts
//   useEffect(() => {
//     if (!initialLocationSet && navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const { latitude, longitude } = position.coords;
//           setMapCenter([latitude, longitude]);
//           setInitialLocationSet(true);
//           console.log('📍 Initial location set:', latitude, longitude);
//         },
//         (error) => {
//           console.log('⚠️ Could not get initial location, using default');
//           setMapCenter([21.1458, 79.0881]);
//           setInitialLocationSet(true);
//         },
//         {
//           enableHighAccuracy: true,
//           timeout: 5000,
//           maximumAge: 0
//         }
//       );
//     }
//   }, [initialLocationSet]);

//   // Check ML System Status
//   useEffect(() => {
//     const checkMlStatus = async () => {
//       try {
//         const response = await axios.get(`${ML_API_URL}/status`);
//         setMlSystemStatus(response.data);
//         console.log('🤖 ML System Status:', response.data);
//       } catch (error) {
//         console.error('❌ ML System check failed:', error);
//         setMlSystemStatus({
//           model_ready: false,
//           voice_alerts_enabled: false,
//           error: 'ML System not available'
//         });
//       }
//     };

//     checkMlStatus();
//     const interval = setInterval(checkMlStatus, 30000); // Check every 30 seconds
    
//     return () => clearInterval(interval);
//   }, []);

//   // Send location to ML Anomaly Detection
//   const sendToMlDetection = async (latitude, longitude, speed = null) => {
//     if (!mlSystemStatus?.model_ready) {
//       console.log('🤖 ML System not ready');
//       return null;
//     }

//     try {
//       const touristId = localStorage.getItem('tourist_id') || `tourist_${Date.now()}`;
//       localStorage.setItem('tourist_id', touristId);

//       const data = {
//         tourist_id: touristId,
//         latitude: latitude,
//         longitude: longitude,
//         timestamp: Date.now() / 1000,
//         speed: speed
//       };

//       console.log('🤖 Sending to ML Detection:', data);
      
//       const response = await axios.post(`${ML_API_URL}/detect`, data);
      
//       if (response.data.success && response.data.result) {
//         const result = response.data.result;
        
//         // Update anomaly status
//         const newStatus = {
//           isActive: true,
//           alerts: result.alerts || [],
//           score: result.anomaly_score || 0,
//           isAnomalous: result.is_anomalous || false,
//           location: result.location,
//           touristName: result.tourist_name,
//           timestamp: result.timestamp
//         };
        
//         setAnomalyStatus(newStatus);
        
//         // Add to anomaly detections list
//         if (result.is_anomalous) {
//           const newAnomaly = {
//             id: `anomaly_${Date.now()}`,
//             touristId: result.tourist_id,
//             touristName: result.tourist_name,
//             anomalyScore: result.anomaly_score,
//             alerts: result.alerts,
//             location: result.location,
//             timestamp: new Date().toISOString(),
//             voiceAlerts: result.voice_alerts || []
//           };
          
//           setAnomalyDetections(prev => [newAnomaly, ...prev].slice(0, 10));
          
//           // Show anomaly alert
//           setStatus(`🚨 ANOMALY DETECTED: ${result.alerts?.[0] || 'Unusual activity detected'}`);
          
//           // Play voice alert if enabled
//           if (voiceAlertsEnabled && result.voice_alerts && result.voice_alerts.length > 0) {
//             console.log('🔊 Playing anomaly voice alert');
//             // Hindi audio would play automatically from ML backend
//           }
//         }
        
//         return result;
//       }
      
//       return null;
//     } catch (error) {
//       console.error('❌ ML Detection error:', error);
//       return null;
//     }
//   };

//   // Test voice alert
//   const testVoiceAlert = async () => {
//     try {
//       const response = await axios.post(`${ML_API_URL}/voice-alert/test`);
//       if (response.data.success) {
//         setStatus(`🔊 Voice alert test: ${response.data.hindi_message}`);
//       }
//     } catch (error) {
//       console.error('❌ Voice alert test failed:', error);
//     }
//   };

//   // Toggle voice alerts
//   const toggleVoiceAlerts = async () => {
//     try {
//       const newStatus = !voiceAlertsEnabled;
//       const response = await axios.post(`${ML_API_URL}/voice-alert/toggle`, {
//         enabled: newStatus
//       });
      
//       if (response.data.success) {
//         setVoiceAlertsEnabled(newStatus);
//         setStatus(`🔊 ${response.data.hindi_message}`);
//       }
//     } catch (error) {
//       console.error('❌ Toggle voice alerts failed:', error);
//     }
//   };

//   // WebSocket connection with reconnection
//   const connectWebSocket = useCallback(() => {
//     try {
//       if (wsRef.current?.readyState === WebSocket.OPEN) {
//         return;
//       }

//       setConnectionStatus('connecting');
//       setStatus('🔄 Connecting to WebSocket...');

//       const ws = new WebSocket(WS_URL);
//       wsRef.current = ws;

//       ws.onopen = () => {
//         console.log('✅ WebSocket connected');
//         setConnectionStatus('connected');
//         setStatus('✅ Connected - Ready for live tracking');
        
//         // Identify user type
//         ws.send(JSON.stringify({
//           type: 'identify_user',
//           userType: userType
//         }));
        
//         // Clear any reconnect timeout
//         if (reconnectTimeoutRef.current) {
//           clearTimeout(reconnectTimeoutRef.current);
//           reconnectTimeoutRef.current = null;
//         }
//       };

//       ws.onmessage = (event) => {
//         try {
//           const data = JSON.parse(event.data);
//           console.log('📨 WebSocket message:', data.type);

//           switch (data.type) {
//             case 'connection_established':
//               setStatus('✅ WebSocket connected successfully');
//               break;
              
//             case 'location_update':
//               if (data.clientId !== getClientId()) {
//                 setOtherUsers(prev => {
//                   const existingIndex = prev.findIndex(u => u.id === data.clientId);
//                   if (existingIndex >= 0) {
//                     const updated = [...prev];
//                     updated[existingIndex] = {
//                       ...updated[existingIndex],
//                       ...data.data,
//                       lastUpdate: data.timestamp
//                     };
//                     return updated;
//                   } else {
//                     return [...prev, {
//                       id: data.clientId,
//                       ...data.data,
//                       lastUpdate: data.timestamp,
//                       userType: data.data.userType || 'tourist'
//                     }];
//                   }
//                 });
//               }
//               break;
              
//             case 'user_connected':
//               setUserCount(data.userCount);
//               setStatus(`👤 User connected - Total: ${data.userCount}`);
//               setTimeout(() => setStatus('✅ Ready for live tracking'), 2000);
//               break;
              
//             case 'user_disconnected':
//               setUserCount(prev => prev - 1);
//               setOtherUsers(prev => prev.filter(u => u.id !== data.clientId));
//               break;
              
//             case 'health_check':
//               setUserCount(data.userCount);
//               break;

//             case 'panic_alert':
//               setEmergencyAlerts(prev => [
//                 ...prev.filter(alert => alert.id !== data.id),
//                 data
//               ]);
//               if (userType === 'police') {
//                 setStatus(`🚨 New emergency alert from ${data.clientId}`);
                
//                 // Auto-center map to emergency location
//                 if (data.location && mapRef.current) {
//                   setTimeout(() => {
//                     mapRef.current.setView([data.location.lat, data.location.lng], 16);
//                     setMapCenter([data.location.lat, data.location.lng]);
//                   }, 100);
//                 }
//               }
//               break;

//             case 'panic_acknowledged':
//               setStatus(`🚨 ${data.message}`);
//               break;

//             case 'emergency_acknowledged_by_authority':
//               setEmergencyAlerts(prev => 
//                 prev.filter(alert => alert.id !== data.alertId)
//               );
//               setStatus(`✅ ${data.message}`);
//               break;

//             case 'emergency_status_update':
//               setEmergencyAlerts(prev =>
//                 prev.map(alert => 
//                   alert.id === data.alert.id ? { ...alert, ...data.alert } : alert
//                 )
//               );
//               break;
              
//             case 'ml_anomaly_alert':
//               // Handle anomaly alerts from ML system
//               setAnomalyDetections(prev => [
//                 {
//                   id: data.alertId || `anomaly_${Date.now()}`,
//                   touristId: data.tourist_id,
//                   touristName: data.tourist_name || 'Unknown',
//                   anomalyScore: data.score || 0.8,
//                   alerts: [data.message],
//                   location: data.location,
//                   timestamp: data.timestamp || new Date().toISOString(),
//                   type: 'ml_anomaly'
//                 },
//                 ...prev.slice(0, 9)
//               ]);
              
//               setStatus(`🚨 ML Anomaly Alert: ${data.message}`);
              
//               if (userType === 'police' && data.location && mapRef.current) {
//                 setTimeout(() => {
//                   mapRef.current.setView([data.location.latitude, data.location.longitude], 16);
//                 }, 100);
//               }
//               break;
              
//             default:
//               console.log('Unknown message type:', data.type);
//           }
//         } catch (error) {
//           console.error('❌ Error parsing WebSocket message:', error);
//         }
//       };

//       ws.onclose = (event) => {
//         console.log('🔴 WebSocket disconnected:', event.code, event.reason);
//         setConnectionStatus('disconnected');
//         setStatus('❌ WebSocket disconnected');
        
//         // Attempt reconnect after 3 seconds if not normal closure
//         if (event.code !== 1000 && event.code !== 1001) {
//           reconnectTimeoutRef.current = setTimeout(() => {
//             console.log('🔄 Attempting to reconnect...');
//             connectWebSocket();
//           }, 3000);
//         }
//       };

//       ws.onerror = (error) => {
//         console.error('💥 WebSocket error:', error);
//         setConnectionStatus('error');
//         setStatus('❌ WebSocket connection error');
//       };

//     } catch (error) {
//       console.error('❌ Error creating WebSocket:', error);
//       setStatus('❌ WebSocket not supported');
//     }
//   }, [userType]);

//   // Generate unique client ID
//   const getClientId = () => {
//     let clientId = localStorage.getItem('websocket_client_id');
//     if (!clientId) {
//       clientId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//       localStorage.setItem('websocket_client_id', clientId);
//     }
//     return clientId;
//   };

//   // Send panic alert
//   const sendPanicAlert = () => {
//     if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
//       setStatus('❌ Not connected to WebSocket');
//       return;
//     }

//     if (!userLocation) {
//       setStatus('❌ Location not available for panic alert');
//       return;
//     }

//     const panicData = {
//       type: 'panic_alert',
//       location: {
//         lat: userLocation.lat,
//         lng: userLocation.lng,
//         accuracy: userLocation.accuracy
//       },
//       data: {
//         emergencyType: 'general',
//         message: 'Need immediate assistance!',
//         touristId: getClientId()
//       }
//     };

//     wsRef.current.send(JSON.stringify(panicData));
//     setStatus('🚨 PANIC BUTTON PRESSED! Help is on the way...');
//   };

//   // Acknowledge emergency (for police)
//   const acknowledgeEmergency = (alertId) => {
//     if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
//       setStatus('❌ Not connected to WebSocket');
//       return;
//     }

//     wsRef.current.send(JSON.stringify({
//       type: 'emergency_acknowledged',
//       alertId: alertId
//     }));
    
//     setEmergencyAlerts(prev => prev.filter(alert => alert.id !== alertId));
//     setStatus(`✅ Emergency ${alertId} acknowledged`);
//   };

//   // Acknowledge anomaly (for police)
//   const acknowledgeAnomaly = (anomalyId) => {
//     setAnomalyDetections(prev => prev.filter(anomaly => anomaly.id !== anomalyId));
//     setStatus(`✅ Anomaly ${anomalyId} acknowledged`);
//   };

//   // Switch user type
//   const switchUserType = (newType) => {
//     setUserType(newType);
//     if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
//       wsRef.current.send(JSON.stringify({
//         type: 'identify_user',
//         userType: newType
//       }));
//     }
//     setStatus(`👤 Switched to ${newType} mode`);
//   };

//   // Simulate anomaly for testing
//   const simulateAnomaly = async () => {
//     try {
//       const response = await axios.post(`${ML_API_URL}/simulate`, {
//         tourist_id: getClientId()
//       });
      
//       if (response.data.success) {
//         setStatus(`🤖 ${response.data.hindi_message}`);
        
//         // Add to anomaly detections
//         const simulatedAnomaly = {
//           id: `simulated_${Date.now()}`,
//           touristId: getClientId(),
//           touristName: 'Test Tourist',
//           anomalyScore: 0.9,
//           alerts: ['🚨 SIMULATED ANOMALY: High speed detected (25 m/s)'],
//           location: { lat: 28.6139, lng: 77.2090 },
//           timestamp: new Date().toISOString(),
//           isSimulated: true
//         };
        
//         setAnomalyDetections(prev => [simulatedAnomaly, ...prev.slice(0, 9)]);
//       }
//     } catch (error) {
//       console.error('❌ Simulate anomaly failed:', error);
//     }
//   };

//   const startLiveTracking = () => {
//     if (!navigator.geolocation) {
//       setStatus('❌ Geolocation not supported');
//       return;
//     }

//     // Connect WebSocket if not connected
//     if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
//       connectWebSocket();
//     }

//     setIsTracking(true);
//     setStatus('🚀 Live tracking started...');

//     // Clear previous watch if exists
//     if (watchIdRef.current) {
//       navigator.geolocation.clearWatch(watchIdRef.current);
//     }

//     // Clear previous anomaly check interval
//     if (anomalyCheckIntervalRef.current) {
//       clearInterval(anomalyCheckIntervalRef.current);
//     }

//     // Start anomaly check interval (every 10 seconds)
//     anomalyCheckIntervalRef.current = setInterval(() => {
//       if (userLocation) {
//         sendToMlDetection(userLocation.lat, userLocation.lng, userLocation.speed);
//       }
//     }, 10000);

//     watchIdRef.current = navigator.geolocation.watchPosition(
//       async (position) => {
//         const { latitude, longitude, accuracy, speed } = position.coords;
//         const newLocation = { 
//           lat: latitude, 
//           lng: longitude,
//           accuracy: accuracy,
//           speed: speed,
//           timestamp: new Date().toISOString()
//         };
        
//         setUserLocation(newLocation);
        
//         // Auto-center map to user location
//         if (!mapCenter || (mapCenter && (
//           Math.abs(mapCenter[0] - latitude) > 0.0001 || 
//           Math.abs(mapCenter[1] - longitude) > 0.0001
//         ))) {
//           setMapCenter([latitude, longitude]);
//           console.log('📍 Map auto-centered to user location:', latitude, longitude);
//         }

//         // Send location via WebSocket
//         if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
//           wsRef.current.send(JSON.stringify({
//             type: 'location_update',
//             data: {
//               ...newLocation,
//               userId: getClientId(),
//               userType: userType
//             }
//           }));
//         }

//         // Check geofence status
//         try {
//           const response = await axios.get(`${API_BASE}/check`, {
//             params: { lat: latitude, lng: longitude },
//             timeout: 5000
//           });
//           setGeofenceStatus(response.data);
          
//           // If in restricted zone, send to ML detection immediately
//           if (response.data.inGeofence) {
//             sendToMlDetection(latitude, longitude, speed);
//           }
          
//           setStatus(`${response.data.message} | 📍 Live updating...`);
//         } catch (err) {
//           console.error('Geofence check error:', err);
//           if (isTracking) {
//             setStatus('📍 Live tracking - Temporary geofence service issue');
//           }
//         }
//       },
//       (err) => {
//         console.error('Geolocation error:', err);
//         setStatus('❌ Location error: ' + err.message);
//         setIsTracking(false);
        
//         // Clear interval
//         if (anomalyCheckIntervalRef.current) {
//           clearInterval(anomalyCheckIntervalRef.current);
//         }
//       },
//       {
//         enableHighAccuracy: true,
//         timeout: 10000,
//         maximumAge: 0,
//         distanceFilter: 5
//       }
//     );
//   };

//   const stopLiveTracking = () => {
//     if (watchIdRef.current) {
//       navigator.geolocation.clearWatch(watchIdRef.current);
//       watchIdRef.current = null;
//     }
    
//     if (anomalyCheckIntervalRef.current) {
//       clearInterval(anomalyCheckIntervalRef.current);
//       anomalyCheckIntervalRef.current = null;
//     }
    
//     setIsTracking(false);
//     setStatus('⏹️ Tracking stopped');
//   };

//   // Manual center to user location
//   const centerToUserLocation = () => {
//     if (userLocation && mapRef.current) {
//       mapRef.current.setView([userLocation.lat, userLocation.lng], 16);
//       setMapCenter([userLocation.lat, userLocation.lng]);
//       setStatus('📍 Map centered to your location');
//     }
//   };

//   // Real-time Map Component with Leaflet
//   const RealTimeMap = () => {
//     if (!mapCenter) {
//       return (
//         <div className="w-full h-96  overflow-hidden border-2 border-gray-300 shadow-lg flex items-center justify-center bg-gray-100">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
//             <p className="text-gray-600">Loading map...</p>
//             <p className="text-sm text-gray-500 mt-2">Waiting for location permission</p>
//           </div>
//         </div>
//       );
//     }

//     return (
//       <div className="w-full h-96  overflow-hidden border-2 border-gray-300 shadow-lg">
//         <MapContainer
//           center={mapCenter}
//           zoom={mapZoom}
//           style={{ height: '100%', width: '100%' }}
//           ref={mapRef}
//           whenCreated={(mapInstance) => {
//             mapRef.current = mapInstance;
//             // Add zoom change event listener
//             mapInstance.on('zoom', () => {
//               setMapZoom(mapInstance.getZoom());
//             });
            
//             // Add move event listener
//             mapInstance.on('move', () => {
//               const center = mapInstance.getCenter();
//               setMapCenter([center.lat, center.lng]);
//             });
//           }}
//         >
//           <MapCenterHandler 
//             center={mapCenter} 
//             zoom={mapZoom} 
//             userLocation={userLocation}
//           />
          
//           <TileLayer
//             attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           />
          
//           {/* Draw boundaries */}
//           {boundaries.map((boundary, index) => {
//             if (boundary.type === 'circle' && boundary.center && boundary.radius) {
//               return (
//                 <Circle
//                   key={boundary._id || index}
//                   center={[boundary.center.lat, boundary.center.lng]}
//                   radius={boundary.radius}
//                   pathOptions={{
//                     color: '#10B981',
//                     fillColor: '#10B981',
//                     fillOpacity: 0.2,
//                     weight: 2
//                   }}
//                 >
//                   <Tooltip permanent direction="center">
//                     <div className="font-bold text-green-800">🛡️ {boundary.name}</div>
//                   </Tooltip>
//                 </Circle>
//               );
//             } else if (boundary.type === 'polygon' && boundary.coordinates) {
//               return (
//                 <Polygon
//                   key={boundary._id || index}
//                   positions={boundary.coordinates.map(coord => [coord.lat, coord.lng])}
//                   pathOptions={{
//                     color: '#8B5CF6',
//                     fillColor: '#8B5CF6',
//                     fillOpacity: 0.2,
//                     weight: 2
//                   }}
//                 >
//                   <Popup>
//                     <div className="font-bold text-purple-800">📍 {boundary.name}</div>
//                   </Popup>
//                 </Polygon>
//               );
//             }
//             return null;
//           })}
          
//           {/* Other Users */}
//           {otherUsers.map((user) => (
//             <Marker
//               key={user.id}
//               position={[user.lat, user.lng]}
//               icon={user.userType === 'police' ? policeIcon : otherUserIcon}
//             >
//               <Popup>
//                 <div className="p-2">
//                   <div className="font-bold">
//                     {user.userType === 'police' ? '👮 Police' : '👤 Tourist'}
//                   </div>
//                   <div className="text-sm text-gray-600">
//                     Lat: {user.lat.toFixed(6)}<br />
//                     Lng: {user.lng.toFixed(6)}
//                   </div>
//                   <div className="text-xs text-gray-500 mt-1">
//                     Last update: {new Date(user.lastUpdate).toLocaleTimeString()}
//                   </div>
//                 </div>
//               </Popup>
//             </Marker>
//           ))}
          
//           {/* Current User Location */}
//           {userLocation && (
//             <Marker
//               position={[userLocation.lat, userLocation.lng]}
//               icon={userType === 'police' ? policeIcon : touristIcon}
//             >
//               <Popup>
//                 <div className="p-2">
//                   <div className="font-bold text-blue-600">
//                     🎯 YOU ({userType.toUpperCase()})
//                   </div>
//                   <div className="text-sm">
//                     Latitude: {userLocation.lat.toFixed(6)}<br />
//                     Longitude: {userLocation.lng.toFixed(6)}<br />
//                     Accuracy: ±{userLocation.accuracy?.toFixed(1) || '0'}m<br />
//                     Speed: {userLocation.speed ? userLocation.speed.toFixed(1) + ' m/s' : 'N/A'}
//                   </div>
//                   <div className="text-xs text-gray-500 mt-1">
//                     Updated: {new Date(userLocation.timestamp).toLocaleTimeString()}
//                   </div>
//                   {anomalyStatus.isActive && (
//                     <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
//                       <div className="text-xs font-semibold text-yellow-800">
//                         🤖 Anomaly Score: {(anomalyStatus.score * 100).toFixed(1)}%
//                       </div>
//                       {anomalyStatus.alerts.map((alert, idx) => (
//                         <div key={idx} className="text-xs text-yellow-600 mt-1">
//                           {alert}
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </Popup>
//             </Marker>
//           )}
          
//           {/* Emergency Alerts */}
//           {emergencyAlerts.map((alert) => (
//             <Marker
//               key={alert.id}
//               position={[alert.location.lat, alert.location.lng]}
//               icon={panicIcon}
//             >
//               <Popup>
//                 <div className="p-2">
//                   <div className="font-bold text-red-600">🚨 EMERGENCY ALERT</div>
//                   <div className="text-sm">
//                     From: {alert.clientId}<br />
//                     Type: {alert.data?.emergencyType || 'General'}<br />
//                     Message: {alert.data?.message || 'Need assistance!'}
//                   </div>
//                   <div className="text-xs text-gray-500 mt-1">
//                     Time: {new Date(alert.timestamp).toLocaleTimeString()}
//                   </div>
//                   {userType === 'police' && (
//                     <button
//                       onClick={() => acknowledgeEmergency(alert.id)}
//                       className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
//                     >
//                       Acknowledge
//                     </button>
//                   )}
//                 </div>
//               </Popup>
//             </Marker>
//           ))}
          
//           {/* Anomaly Detections */}
//           {anomalyDetections.map((anomaly) => (
//             <Marker
//               key={anomaly.id}
//               position={[anomaly.location.lat, anomaly.location.lng]}
//               icon={anomalyIcon}
//             >
//               <Popup>
//                 <div className="p-2">
//                   <div className="font-bold text-yellow-600">🤖 ANOMALY DETECTED</div>
//                   <div className="text-sm">
//                     Tourist: {anomaly.touristName}<br />
//                     Score: {(anomaly.anomalyScore * 100).toFixed(1)}%<br />
//                     Type: {anomaly.isSimulated ? 'Simulated' : 'ML Detected'}
//                   </div>
//                   <div className="text-xs mt-1">
//                     {anomaly.alerts.map((alert, idx) => (
//                       <div key={idx} className="text-yellow-700">{alert}</div>
//                     ))}
//                   </div>
//                   <div className="text-xs text-gray-500 mt-1">
//                     Time: {new Date(anomaly.timestamp).toLocaleTimeString()}
//                   </div>
//                   {userType === 'police' && (
//                     <button
//                       onClick={() => acknowledgeAnomaly(anomaly.id)}
//                       className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
//                     >
//                       Acknowledge
//                     </button>
//                   )}
//                 </div>
//               </Popup>
//             </Marker>
//           ))}
//         </MapContainer>
//       </div>
//     );
//   };

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       if (watchIdRef.current) {
//         navigator.geolocation.clearWatch(watchIdRef.current);
//       }
//       if (wsRef.current) {
//         wsRef.current.close(1000, 'Component unmount');
//       }
//       if (reconnectTimeoutRef.current) {
//         clearTimeout(reconnectTimeoutRef.current);
//       }
//       if (anomalyCheckIntervalRef.current) {
//         clearInterval(anomalyCheckIntervalRef.current);
//       }
//     };
//   }, []);

//   // Fetch boundaries on mount
//   useEffect(() => {
//     const fetchBoundaries = async () => {
//       try {
//         const response = await axios.get(`${API_BASE}/geofences`, {
//           timeout: 10000
//         });
//         setBoundaries(response.data.boundaries || []);
//       } catch (err) {
//         console.error('Error fetching boundaries:', err);
//         // Set some default boundaries for demo
//         setBoundaries([
//           {
//             _id: 'demo1',
//             name: 'Demo Safe Zone',
//             type: 'circle',
//             center: { lat: 21.1458, lng: 79.0881 },
//             radius: 3000
//           }
//         ]);
//       }
//     };

//     fetchBoundaries();
//   }, []);

//   return (
//     <div className="max-w-7xl mx-auto">
//       <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-8 border-b border-gray-200/50">
//           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
//             <div>
//               <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//                 Live Geo Tracking with AI Anomaly Detection
//               </h2>
//               <p className="text-gray-600 mt-2 text-lg">Real-time location monitoring with AI-powered anomaly detection</p>
//             </div>
            
//             <div className="flex flex-wrap gap-4 mt-4 lg:mt-0">
//               {/* User Type Switch */}
//               <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-gray-200/50">
//                 <span className="text-sm font-medium text-gray-700">Mode:</span>
//                 <div className="flex space-x-1">
//                   <button
//                     onClick={() => switchUserType('tourist')}
//                     className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
//                       userType === 'tourist' 
//                         ? 'bg-blue-500 text-white shadow-lg' 
//                         : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                     }`}
//                   >
//                     Tourist
//                   </button>
//                   <button
//                     onClick={() => switchUserType('police')}
//                     className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
//                       userType === 'police' 
//                         ? 'bg-red-500 text-white shadow-lg' 
//                         : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                     }`}
//                   >
//                     Police
//                   </button>
//                 </div>
//               </div>

//               <div className={`px-4 py-3 rounded-2xl text-sm font-semibold flex items-center backdrop-blur-sm ${
//                 connectionStatus === 'connected' 
//                   ? 'bg-green-100/80 text-green-800 border border-green-300/50' 
//                   : connectionStatus === 'connecting'
//                   ? 'bg-yellow-100/80 text-yellow-800 border border-yellow-300/50'
//                   : 'bg-red-100/80 text-red-800 border border-red-300/50'
//               }`}>
//                 <div className={`w-3 h-3 rounded-full mr-3 ${
//                   connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
//                   connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
//                 }`}></div>
//                 WebSocket: {connectionStatus}
//               </div>
              
//               <div className="bg-blue-100/80 text-blue-800 px-4 py-3 rounded-2xl text-sm font-semibold border border-blue-300/50 backdrop-blur-sm">
//                 👥 Online: {userCount}
//               </div>

//               <div className={`px-4 py-3 rounded-2xl text-sm font-semibold flex items-center backdrop-blur-sm ${
//                 mlSystemStatus?.model_ready 
//                   ? 'bg-green-100/80 text-green-800 border border-green-300/50' 
//                   : 'bg-red-100/80 text-red-800 border border-red-300/50'
//               }`}>
//                 <div className={`w-3 h-3 rounded-full mr-3 ${
//                   mlSystemStatus?.model_ready ? 'bg-green-500' : 'bg-red-500'
//                 }`}></div>
//                 AI: {mlSystemStatus?.model_ready ? 'Active' : 'Offline'}
//               </div>
//             </div>
//           </div>
//         </div>
        
//         <div className="p-8 space-y-8">
//           {/* Control Buttons */}
//           <div className="flex flex-col sm:flex-row gap-4">
//             <button
//               onClick={startLiveTracking}
//               disabled={isTracking}
//               className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-green-300 disabled:to-emerald-400 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-200 disabled:transform-none disabled:cursor-not-allowed transform hover:scale-105 flex items-center justify-center shadow-lg backdrop-blur-sm"
//             >
//               <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//               </svg>
//               {isTracking ? '🚀 Tracking Active...' : 'Start Live Tracking'}
//             </button>
            
//             <button
//               onClick={stopLiveTracking}
//               disabled={!isTracking}
//               className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-red-300 disabled:to-pink-400 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-200 disabled:transform-none disabled:cursor-not-allowed transform hover:scale-105 flex items-center justify-center shadow-lg backdrop-blur-sm"
//             >
//               <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
//               </svg>
//               Stop Tracking
//             </button>

//             {/* Panic Button - Only for Tourists */}
//             {userType === 'tourist' && (
//               <button
//                 onClick={sendPanicAlert}
//                 disabled={!userLocation || connectionStatus !== 'connected'}
//                 className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-red-300 disabled:to-orange-400 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-200 disabled:transform-none disabled:cursor-not-allowed transform hover:scale-105 flex items-center justify-center shadow-lg backdrop-blur-sm animate-pulse"
//               >
//                 <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
//                 </svg>
//                 🚨 PANIC BUTTON
//               </button>
//             )}
//           </div>

//           {/* AI Anomaly Detection Controls */}
//           <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-2xl border-2 border-yellow-200/50 backdrop-blur-sm">
//             <h3 className="font-bold text-yellow-800 mb-3 flex items-center text-lg">
//               <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
//               </svg>
//               AI Anomaly Detection System
//             </h3>
//             <div className="flex flex-wrap gap-3">
//               <button
//                 onClick={simulateAnomaly}
//                 disabled={!mlSystemStatus?.model_ready}
//                 className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 disabled:from-yellow-300 disabled:to-amber-400 text-white font-medium py-2 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center"
//               >
//                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//                 Simulate Anomaly
//               </button>
              
//               <button
//                 onClick={testVoiceAlert}
//                 disabled={!mlSystemStatus?.voice_alerts_enabled}
//                 className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:from-blue-300 disabled:to-cyan-400 text-white font-medium py-2 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center"
//               >
//                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
//                 </svg>
//                 Test Voice Alert
//               </button>
              
//               <button
//                 onClick={toggleVoiceAlerts}
//                 className={`font-medium py-2 px-6 rounded-xl transition-all duration-200 flex items-center ${
//                   voiceAlertsEnabled
//                     ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white'
//                     : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
//                 }`}
//               >
//                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
//                 </svg>
//                 {voiceAlertsEnabled ? 'Disable Voice' : 'Enable Voice'}
//               </button>
              
//               <div className="flex-1 bg-white/80 p-3 rounded-xl border border-yellow-200/50">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm font-medium text-gray-700">Current Anomaly Score:</span>
//                   <span className={`font-bold text-lg ${
//                     anomalyStatus.score > 0.7 ? 'text-red-600' :
//                     anomalyStatus.score > 0.4 ? 'text-yellow-600' : 'text-green-600'
//                   }`}>
//                     {(anomalyStatus.score * 100).toFixed(1)}%
//                   </span>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
//                   <div 
//                     className={`h-2 rounded-full ${
//                       anomalyStatus.score > 0.7 ? 'bg-red-500' :
//                       anomalyStatus.score > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
//                     }`}
//                     style={{ width: `${anomalyStatus.score * 100}%` }}
//                   ></div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Status Display */}
//           <div className={`text-center p-6 rounded-2xl border-2 backdrop-blur-sm ${
//             anomalyStatus.isAnomalous ? 'bg-gradient-to-r from-red-50 to-orange-100 border-red-300 text-red-800 animate-pulse' :
//             geofenceStatus?.inGeofence ? 'bg-gradient-to-r from-green-50 to-emerald-100 border-green-300 text-green-800' : 
//             status.includes('outside') ? 'bg-gradient-to-r from-yellow-50 to-amber-100 border-yellow-300 text-yellow-800' : 
//             status.includes('PANIC') ? 'bg-gradient-to-r from-red-50 to-orange-100 border-red-300 text-red-800 animate-pulse' :
//             'bg-gradient-to-r from-blue-50 to-cyan-100 border-blue-300 text-blue-800'
//           }`}>
//             <div className="flex items-center justify-center space-x-3">
//               {isTracking && (
//                 <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
//               )}
//               <span className="text-lg font-semibold">{status}</span>
//             </div>
//             {anomalyStatus.alerts.length > 0 && (
//               <div className="mt-2">
//                 {anomalyStatus.alerts.map((alert, idx) => (
//                   <div key={idx} className="text-sm font-medium text-red-700 bg-red-50/50 p-2 rounded-lg">
//                     🤖 {alert}
//                   </div>
//                 ))}
//               </div>
//             )}
//             {geofenceStatus?.boundary && (
//               <div className="mt-2 text-sm font-medium">
//                 Current Zone: <span className="font-bold">{geofenceStatus.boundary}</span>
//               </div>
//             )}
//             {userLocation && (
//               <div className="mt-2 text-xs text-gray-600">
//                 Location: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
//               </div>
//             )}
//           </div>

//           {/* Real-time Map */}
//           <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-2xl border-2 border-gray-200/50 shadow-inner backdrop-blur-sm">
//             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
//               <h3 className="text-xl font-bold text-gray-800 flex items-center">
//                 <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
//                 </svg>
//                 Live Tracking Map
//               </h3>
//               <div className="flex flex-wrap gap-2">
//                 {userLocation && (
//                   <button
//                     onClick={centerToUserLocation}
//                     disabled={!userLocation}
//                     className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all"
//                   >
//                     <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
//                     </svg>
//                     Center on Me
//                   </button>
//                 )}
//                 <div className="text-sm text-gray-600 bg-white/80 px-3 py-2 rounded-lg border border-gray-300">
//                   <div className="flex items-center gap-2">
//                     <span className="font-medium">Zoom:</span> 
//                     <span className="font-mono">{mapZoom}</span>
//                   </div>
//                   {mapCenter && (
//                     <div className="text-xs mt-1">
//                       Lat: {mapCenter[0].toFixed(6)}, Lng: {mapCenter[1].toFixed(6)}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//             <RealTimeMap />
            
//             {/* Legend */}
//             <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200/50">
//               <div className="flex items-center space-x-2 text-sm bg-white/80 px-3 py-1.5 rounded-lg border border-gray-200">
//                 <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//                 <span className="text-gray-700">Safe Zones</span>
//               </div>
//               <div className="flex items-center space-x-2 text-sm bg-white/80 px-3 py-1.5 rounded-lg border border-gray-200">
//                 <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
//                 <span className="text-gray-700">Tourist</span>
//               </div>
//               <div className="flex items-center space-x-2 text-sm bg-white/80 px-3 py-1.5 rounded-lg border border-gray-200">
//                 <div className="w-3 h-3 bg-red-500 rounded-full"></div>
//                 <span className="text-gray-700">Police</span>
//               </div>
//               <div className="flex items-center space-x-2 text-sm bg-white/80 px-3 py-1.5 rounded-lg border border-gray-200">
//                 <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
//                 <span className="text-gray-700">Other Users</span>
//               </div>
//               <div className="flex items-center space-x-2 text-sm bg-white/80 px-3 py-1.5 rounded-lg border border-gray-200">
//                 <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
//                 <span className="text-gray-700">Emergency</span>
//               </div>
//               <div className="flex items-center space-x-2 text-sm bg-white/80 px-3 py-1.5 rounded-lg border border-gray-200">
//                 <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
//                 <span className="text-gray-700">Anomaly</span>
//               </div>
//             </div>
//           </div>

//           {/* Information Grid */}
//           <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
//             {/* Safe Zones */}
//             <div className="bg-gradient-to-br from-gray-50 to-green-50 p-6 rounded-2xl border-2 border-green-200/50 shadow backdrop-blur-sm">
//               <h3 className="font-bold text-gray-700 mb-4 flex items-center text-lg">
//                 <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
//                 </svg>
//                 Safe Zones ({boundaries.length})
//               </h3>
//               <div className="space-y-3 max-h-60 overflow-y-auto">
//                 {boundaries.slice(0, 5).map((boundary, index) => (
//                   <div key={boundary._id || index} className="flex items-center justify-between p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-green-200/50 shadow-sm">
//                     <div className="flex items-center space-x-3">
//                       <div className={`w-3 h-3 rounded-full ${boundary.type === 'circle' ? 'bg-green-500' : 'bg-purple-500'}`}></div>
//                       <div>
//                         <span className="text-sm font-semibold text-gray-800">{boundary.name}</span>
//                         <div className="text-xs text-gray-500">
//                           {boundary.center?.lat?.toFixed(4) || 'N/A'}, {boundary.center?.lng?.toFixed(4) || 'N/A'}
//                         </div>
//                       </div>
//                     </div>
//                     <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded-full">
//                       {boundary.radius ? `${boundary.radius}m` : 'Polygon'}
//                     </span>
//                   </div>
//                 ))}
//                 {boundaries.length > 5 && (
//                   <div className="text-center text-sm text-gray-500 bg-white/50 p-2 rounded-lg">
//                     +{boundaries.length - 5} more zones
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Live Location Data */}
//             {userLocation && (
//               <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-2xl border-2 border-blue-200/50 shadow backdrop-blur-sm">
//                 <h3 className="font-bold text-gray-700 mb-4 flex items-center text-lg">
//                   <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
//                   </svg>
//                   Your Live Position
//                 </h3>
//                 <div className="space-y-3 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-blue-200/50">
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm font-medium text-gray-600">Latitude:</span>
//                     <span className="font-mono text-sm bg-blue-50 px-2 py-1 rounded">{userLocation.lat.toFixed(6)}</span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm font-medium text-gray-600">Longitude:</span>
//                     <span className="font-mono text-sm bg-blue-50 px-2 py-1 rounded">{userLocation.lng.toFixed(6)}</span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm font-medium text-gray-600">Accuracy:</span>
//                     <span className="font-mono text-sm bg-green-50 px-2 py-1 rounded">±{userLocation.accuracy?.toFixed(1) || '0'}m</span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm font-medium text-gray-600">Speed:</span>
//                     <span className="font-mono text-sm bg-purple-50 px-2 py-1 rounded">
//                       {userLocation.speed ? userLocation.speed.toFixed(1) + ' m/s' : 'N/A'}
//                     </span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm font-medium text-gray-600">Last Update:</span>
//                     <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded">
//                       {new Date(userLocation.timestamp).toLocaleTimeString()}
//                     </span>
//                   </div>
//                   <div className="flex justify-between items-center">
//                     <span className="text-sm font-medium text-gray-600">User Type:</span>
//                     <span className={`font-semibold px-2 py-1 rounded ${
//                       userType === 'tourist' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
//                     }`}>
//                       {userType.toUpperCase()}
//                     </span>
//                   </div>
//                   {anomalyStatus.isActive && (
//                     <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 mt-2">
//                       <div className="flex justify-between items-center">
//                         <span className="text-sm font-medium text-yellow-800">Anomaly Status:</span>
//                         <span className={`font-bold ${
//                           anomalyStatus.isAnomalous ? 'text-red-600' : 'text-green-600'
//                         }`}>
//                           {anomalyStatus.isAnomalous ? '⚠️ DETECTED' : '✅ NORMAL'}
//                         </span>
//                       </div>
//                       <div className="text-xs text-yellow-700 mt-1">
//                         Score: {(anomalyStatus.score * 100).toFixed(1)}%
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}

//             {/* Anomaly Detections & Online Users */}
//             <div className="bg-gradient-to-br from-gray-50 to-purple-50 p-6 rounded-2xl border-2 border-purple-200/50 shadow backdrop-blur-sm">
//               <h3 className="font-bold text-gray-700 mb-4 flex items-center text-lg">
//                 <svg className="w-6 h-6 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
//                 </svg>
//                 Anomaly Detections & Users
//               </h3>
//               <div className="space-y-3">
//                 <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-purple-200/50">
//                   <div className="text-center">
//                     <div className="text-2xl font-bold text-purple-600">{userCount}</div>
//                     <div className="text-sm text-gray-600">Active Connections</div>
//                   </div>
//                 </div>
                
//                 {/* Anomaly Detections */}
//                 {anomalyDetections.length > 0 && (
//                   <div className="bg-yellow-50/80 backdrop-blur-sm p-3 rounded-xl border border-yellow-200/50">
//                     <div className="text-sm font-semibold text-yellow-700 mb-2 flex items-center justify-between">
//                       <div className="flex items-center">
//                         <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
//                         </svg>
//                         Recent Anomalies ({anomalyDetections.length})
//                       </div>
//                       {anomalyDetections.length > 0 && (
//                         <button 
//                           onClick={() => setAnomalyDetections([])}
//                           className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded"
//                         >
//                           Clear All
//                         </button>
//                       )}
//                     </div>
//                     <div className="space-y-2 max-h-40 overflow-y-auto">
//                       {anomalyDetections.map((anomaly) => (
//                         <div key={anomaly.id} className="flex items-center justify-between text-xs p-2 bg-white/50 rounded">
//                           <div>
//                             <div className="font-medium text-yellow-700">
//                               {anomaly.touristName}
//                             </div>
//                             <div className="text-yellow-600 truncate">
//                               {anomaly.alerts[0]}
//                             </div>
//                           </div>
//                           <div className="flex flex-col items-end">
//                             <span className={`font-bold ${
//                               anomaly.anomalyScore > 0.7 ? 'text-red-600' :
//                               anomaly.anomalyScore > 0.4 ? 'text-yellow-600' : 'text-green-600'
//                             }`}>
//                               {(anomaly.anomalyScore * 100).toFixed(0)}%
//                             </span>
//                             {userType === 'police' && (
//                               <button
//                                 onClick={() => acknowledgeAnomaly(anomaly.id)}
//                                 className="mt-1 bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs"
//                               >
//                                 Ack
//                               </button>
//                             )}
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}
                
//                 {/* Emergency Alerts */}
//                 {emergencyAlerts.length > 0 && (
//                   <div className="bg-red-50/80 backdrop-blur-sm p-3 rounded-xl border border-red-200/50">
//                     <div className="text-sm font-semibold text-red-700 mb-2 flex items-center">
//                       <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
//                       </svg>
//                       Active Emergencies ({emergencyAlerts.length})
//                     </div>
//                     <div className="space-y-2">
//                       {emergencyAlerts.slice(0, 3).map((alert) => (
//                         <div key={alert.id} className="flex items-center justify-between text-xs p-2 bg-white/50 rounded">
//                           <span className="text-red-600 font-medium truncate">Alert: {alert.clientId}</span>
//                           {userType === 'police' && (
//                             <button
//                               onClick={() => acknowledgeEmergency(alert.id)}
//                               className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
//                             >
//                               Ack
//                             </button>
//                           )}
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}
                
//                 {/* Other Users */}
//                 {otherUsers.length > 0 && (
//                   <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-purple-200/50">
//                     <div className="text-sm font-semibold text-gray-700 mb-2">Other Users Online:</div>
//                     <div className="space-y-2 max-h-32 overflow-y-auto">
//                       {otherUsers.slice(0, 5).map((user, index) => (
//                         <div key={user.id} className="flex items-center space-x-2 text-xs">
//                           <div className={`w-2 h-2 rounded-full ${
//                             user.userType === 'police' ? 'bg-red-500' : 'bg-purple-500'
//                           }`}></div>
//                           <span className="text-gray-600 truncate">
//                             {user.userType === 'police' ? '👮 Police' : '👤 Tourist'} - {user.id.substring(0, 8)}
//                           </span>
//                           <span className="text-gray-400 ml-auto text-xs">
//                             {user.lastUpdate ? new Date(user.lastUpdate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Now'}
//                           </span>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LiveGeoMap;

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

// Custom icons (keeping existing icons)
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

const anomalyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
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
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(16);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [initialLocationSet, setInitialLocationSet] = useState(false);
  const [anomalyDetections, setAnomalyDetections] = useState([]);
  const [anomalyStatus, setAnomalyStatus] = useState({
    isActive: false,
    alerts: [],
    score: 0,
    isAnomalous: false
  });
  const [voiceAlertsEnabled, setVoiceAlertsEnabled] = useState(true);
  const [mlSystemStatus, setMlSystemStatus] = useState(null);
  
  const watchIdRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const mapRef = useRef(null);
  const anomalyCheckIntervalRef = useRef(null);
  
  const API_BASE = 'http://localhost:3000/api/geo';
  const WS_URL = 'ws://localhost:3000';
  const ML_API_URL = 'http://localhost:5001';

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
          setMapCenter([21.1458, 79.0881]);
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

  // Check ML System Status
  useEffect(() => {
    const checkMlStatus = async () => {
      try {
        const response = await axios.get(`${ML_API_URL}/status`);
        setMlSystemStatus(response.data);
        console.log('🤖 ML System Status:', response.data);
      } catch (error) {
        console.error('❌ ML System check failed:', error);
        setMlSystemStatus({
          model_ready: false,
          voice_alerts_enabled: false,
          error: 'ML System not available'
        });
      }
    };

    checkMlStatus();
    const interval = setInterval(checkMlStatus, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Send location to ML Anomaly Detection
  const sendToMlDetection = async (latitude, longitude, speed = null) => {
    if (!mlSystemStatus?.model_ready) {
      console.log('🤖 ML System not ready');
      return null;
    }

    try {
      const touristId = localStorage.getItem('tourist_id') || `tourist_${Date.now()}`;
      localStorage.setItem('tourist_id', touristId);

      const data = {
        tourist_id: touristId,
        latitude: latitude,
        longitude: longitude,
        timestamp: Date.now() / 1000,
        speed: speed
      };

      console.log('🤖 Sending to ML Detection:', data);
      
      const response = await axios.post(`${ML_API_URL}/detect`, data);
      
      if (response.data.success && response.data.result) {
        const result = response.data.result;
        
        // Update anomaly status
        const newStatus = {
          isActive: true,
          alerts: result.alerts || [],
          score: result.anomaly_score || 0,
          isAnomalous: result.is_anomalous || false,
          location: result.location,
          touristName: result.tourist_name,
          timestamp: result.timestamp
        };
        
        setAnomalyStatus(newStatus);
        
        // Add to anomaly detections list
        if (result.is_anomalous) {
          const newAnomaly = {
            id: `anomaly_${Date.now()}`,
            touristId: result.tourist_id,
            touristName: result.tourist_name,
            anomalyScore: result.anomaly_score,
            alerts: result.alerts,
            location: result.location,
            timestamp: new Date().toISOString(),
            voiceAlerts: result.voice_alerts || []
          };
          
          setAnomalyDetections(prev => [newAnomaly, ...prev].slice(0, 10));
          
          // Show anomaly alert
          setStatus(`🚨 ANOMALY DETECTED: ${result.alerts?.[0] || 'Unusual activity detected'}`);
          
          // Play voice alert if enabled
          if (voiceAlertsEnabled && result.voice_alerts && result.voice_alerts.length > 0) {
            console.log('🔊 Playing anomaly voice alert');
            // Hindi audio would play automatically from ML backend
          }
        }
        
        return result;
      }
      
      return null;
    } catch (error) {
      console.error('❌ ML Detection error:', error);
      return null;
    }
  };

  // Test voice alert
  const testVoiceAlert = async () => {
    try {
      const response = await axios.post(`${ML_API_URL}/voice-alert/test`);
      if (response.data.success) {
        setStatus(`🔊 Voice alert test: ${response.data.hindi_message}`);
      }
    } catch (error) {
      console.error('❌ Voice alert test failed:', error);
    }
  };

  // Toggle voice alerts
  const toggleVoiceAlerts = async () => {
    try {
      const newStatus = !voiceAlertsEnabled;
      const response = await axios.post(`${ML_API_URL}/voice-alert/toggle`, {
        enabled: newStatus
      });
      
      if (response.data.success) {
        setVoiceAlertsEnabled(newStatus);
        setStatus(`🔊 ${response.data.hindi_message}`);
      }
    } catch (error) {
      console.error('❌ Toggle voice alerts failed:', error);
    }
  };

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
              
            case 'ml_anomaly_alert':
              // Handle anomaly alerts from ML system
              setAnomalyDetections(prev => [
                {
                  id: data.alertId || `anomaly_${Date.now()}`,
                  touristId: data.tourist_id,
                  touristName: data.tourist_name || 'Unknown',
                  anomalyScore: data.score || 0.8,
                  alerts: [data.message],
                  location: data.location,
                  timestamp: data.timestamp || new Date().toISOString(),
                  type: 'ml_anomaly'
                },
                ...prev.slice(0, 9)
              ]);
              
              setStatus(`🚨 ML Anomaly Alert: ${data.message}`);
              
              if (userType === 'police' && data.location && mapRef.current) {
                setTimeout(() => {
                  mapRef.current.setView([data.location.latitude, data.location.longitude], 16);
                }, 100);
              }
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

  // Acknowledge anomaly (for police)
  const acknowledgeAnomaly = (anomalyId) => {
    setAnomalyDetections(prev => prev.filter(anomaly => anomaly.id !== anomalyId));
    setStatus(`✅ Anomaly ${anomalyId} acknowledged`);
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

  // Simulate anomaly for testing
  const simulateAnomaly = async () => {
    try {
      const response = await axios.post(`${ML_API_URL}/simulate`, {
        tourist_id: getClientId()
      });
      
      if (response.data.success) {
        setStatus(`🤖 ${response.data.hindi_message}`);
        
        // Add to anomaly detections
        const simulatedAnomaly = {
          id: `simulated_${Date.now()}`,
          touristId: getClientId(),
          touristName: 'Test Tourist',
          anomalyScore: 0.9,
          alerts: ['🚨 SIMULATED ANOMALY: High speed detected (25 m/s)'],
          location: { lat: 28.6139, lng: 77.2090 },
          timestamp: new Date().toISOString(),
          isSimulated: true
        };
        
        setAnomalyDetections(prev => [simulatedAnomaly, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      console.error('❌ Simulate anomaly failed:', error);
    }
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

    // Clear previous anomaly check interval
    if (anomalyCheckIntervalRef.current) {
      clearInterval(anomalyCheckIntervalRef.current);
    }

    // Start anomaly check interval (every 10 seconds)
    anomalyCheckIntervalRef.current = setInterval(() => {
      if (userLocation) {
        sendToMlDetection(userLocation.lat, userLocation.lng, userLocation.speed);
      }
    }, 10000);

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy, speed } = position.coords;
        const newLocation = { 
          lat: latitude, 
          lng: longitude,
          accuracy: accuracy,
          speed: speed,
          timestamp: new Date().toISOString()
        };
        
        setUserLocation(newLocation);
        
        // Auto-center map to user location
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
          
          // If in restricted zone, send to ML detection immediately
          if (response.data.inGeofence) {
            sendToMlDetection(latitude, longitude, speed);
          }
          
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
        
        // Clear interval
        if (anomalyCheckIntervalRef.current) {
          clearInterval(anomalyCheckIntervalRef.current);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        distanceFilter: 5
      }
    );
  };

  const stopLiveTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (anomalyCheckIntervalRef.current) {
      clearInterval(anomalyCheckIntervalRef.current);
      anomalyCheckIntervalRef.current = null;
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
        <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-gray-600 text-sm font-medium">Loading map...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
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
                    fillOpacity: 0.1,
                    weight: 2
                  }}
                >
                  <Tooltip permanent direction="center">
                    <div className="font-medium text-sm text-green-700">{boundary.name}</div>
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
                    fillOpacity: 0.1,
                    weight: 2
                  }}
                >
                  <Popup>
                    <div className="font-medium text-sm text-purple-700">{boundary.name}</div>
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
                  <div className="font-medium text-sm">
                    {user.userType === 'police' ? '👮 Police' : '👤 Tourist'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Lat: {user.lat.toFixed(6)}<br />
                    Lng: {user.lng.toFixed(6)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Updated: {new Date(user.lastUpdate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                  <div className="font-medium text-sm text-blue-600">
                    🎯 YOU ({userType.toUpperCase()})
                  </div>
                  <div className="text-xs mt-1">
                    Lat: {userLocation.lat.toFixed(6)}<br />
                    Lng: {userLocation.lng.toFixed(6)}<br />
                    Accuracy: ±{userLocation.accuracy?.toFixed(1) || '0'}m
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Updated: {new Date(userLocation.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  {anomalyStatus.isActive && (
                    <div className="mt-2 p-1.5 bg-yellow-50 rounded text-xs">
                      <div className="font-medium text-yellow-700">
                        Anomaly: {(anomalyStatus.score * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
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
                  <div className="font-medium text-sm text-red-600">🚨 EMERGENCY</div>
                  <div className="text-xs mt-1">
                    From: {alert.clientId}<br />
                    Time: {new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  {userType === 'police' && (
                    <button
                      onClick={() => acknowledgeEmergency(alert.id)}
                      className="mt-2 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs w-full"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Anomaly Detections */}
          {anomalyDetections.map((anomaly) => (
            <Marker
              key={anomaly.id}
              position={[anomaly.location.lat, anomaly.location.lng]}
              icon={anomalyIcon}
            >
              <Popup>
                <div className="p-2">
                  <div className="font-medium text-sm text-yellow-600">🤖 ANOMALY</div>
                  <div className="text-xs mt-1">
                    Score: {(anomaly.anomalyScore * 100).toFixed(1)}%<br />
                    Time: {new Date(anomaly.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  {userType === 'police' && (
                    <button
                      onClick={() => acknowledgeAnomaly(anomaly.id)}
                      className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs w-full"
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
      if (anomalyCheckIntervalRef.current) {
        clearInterval(anomalyCheckIntervalRef.current);
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
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Live Geo Tracking</h1>
        <p className="text-gray-600 text-sm mt-1">Real-time location monitoring with AI anomaly detection</p>
      </div>

      {/* Status Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium text-gray-700 truncate">{status}</span>
            </div>
            {userLocation && (
              <div className="text-xs text-gray-500 mt-1">
                Location: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Mode:</span>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => switchUserType('tourist')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    userType === 'tourist' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tourist
                </button>
                <button
                  onClick={() => switchUserType('police')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    userType === 'police' 
                      ? 'bg-white shadow-sm text-red-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Police
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-600">Online: {userCount}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                mlSystemStatus?.model_ready ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-xs text-gray-600">AI: {mlSystemStatus?.model_ready ? 'Active' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Primary Controls */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Tracking Controls</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={startLiveTracking}
                disabled={isTracking}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isTracking 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isTracking ? '🟢 Tracking Active' : 'Start Tracking'}
              </button>
              
              <button
                onClick={stopLiveTracking}
                disabled={!isTracking}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  !isTracking 
                    ? 'bg-gray-100 text-gray-400' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                Stop Tracking
              </button>
              
              {userType === 'tourist' && (
                <button
                  onClick={sendPanicAlert}
                  disabled={!userLocation || connectionStatus !== 'connected'}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    !userLocation || connectionStatus !== 'connected'
                      ? 'bg-gray-100 text-gray-400' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  🚨 Panic Button
                </button>
              )}
            </div>
          </div>

          {/* AI Controls */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">AI Anomaly Detection</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Voice:</span>
                <button
                  onClick={toggleVoiceAlerts}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    voiceAlertsEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    voiceAlertsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={simulateAnomaly}
                disabled={!mlSystemStatus?.model_ready}
                className="px-4 py-2.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium border border-yellow-200 transition-colors disabled:opacity-50"
              >
                Simulate Anomaly
              </button>
              
              <button
                onClick={testVoiceAlert}
                disabled={!mlSystemStatus?.voice_alerts_enabled}
                className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium border border-blue-200 transition-colors disabled:opacity-50"
              >
                Test Voice Alert
              </button>
              
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Anomaly Score</span>
                  <span className={`text-sm font-medium ${
                    anomalyStatus.score > 0.7 ? 'text-red-600' :
                    anomalyStatus.score > 0.4 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {(anomalyStatus.score * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${
                      anomalyStatus.score > 0.7 ? 'bg-red-500' :
                      anomalyStatus.score > 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${anomalyStatus.score * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Location Info */}
        {userLocation && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Your Location</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Latitude</span>
                <span className="text-sm font-mono text-gray-900">{userLocation.lat.toFixed(6)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Longitude</span>
                <span className="text-sm font-mono text-gray-900">{userLocation.lng.toFixed(6)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Accuracy</span>
                <span className="text-sm text-gray-900">±{userLocation.accuracy?.toFixed(1) || '0'}m</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Speed</span>
                <span className="text-sm text-gray-900">
                  {userLocation.speed ? userLocation.speed.toFixed(1) + ' m/s' : 'N/A'}
                </span>
              </div>
              <button
                onClick={centerToUserLocation}
                disabled={!userLocation}
                className="w-full mt-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Center Map on Me
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Map Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Live Tracking Map</h2>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
              Zoom: {mapZoom}
            </div>
            {mapCenter && (
              <div className="text-xs text-gray-500">
                Lat: {mapCenter[0].toFixed(4)}, Lng: {mapCenter[1].toFixed(4)}
              </div>
            )}
          </div>
        </div>
        <RealTimeMap />
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Safe Zones</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Tourist</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Police</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Other Users</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Emergency</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Anomaly</span>
          </div>
        </div>
      </div>

      {/* Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Safe Zones */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Safe Zones</h2>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              {boundaries.length} zones
            </span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {boundaries.slice(0, 5).map((boundary, index) => (
              <div key={boundary._id || index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{boundary.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {boundary.center?.lat?.toFixed(4)}, {boundary.center?.lng?.toFixed(4)}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-green-700">
                    {boundary.radius ? `${boundary.radius}m` : 'Polygon'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Anomaly Detections */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Anomaly Detections</h2>
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
              {anomalyDetections.length} alerts
            </span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {anomalyDetections.map((anomaly) => (
              <div key={anomaly.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-yellow-900">{anomaly.touristName}</div>
                    <div className="text-xs text-yellow-700 mt-1 truncate">{anomaly.alerts[0]}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-sm font-bold ${
                      anomaly.anomalyScore > 0.7 ? 'text-red-600' :
                      anomaly.anomalyScore > 0.4 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {(anomaly.anomalyScore * 100).toFixed(0)}%
                    </span>
                    {userType === 'police' && (
                      <button
                        onClick={() => acknowledgeAnomaly(anomaly.id)}
                        className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                      >
                        Ack
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {anomalyDetections.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No anomaly detections
              </div>
            )}
          </div>
        </div>

        {/* Active Emergencies */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Active Emergencies</h2>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
              {emergencyAlerts.length} active
            </span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {emergencyAlerts.map((alert) => (
              <div key={alert.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-red-900">Emergency Alert</div>
                    <div className="text-xs text-red-700 mt-1">From: {alert.clientId}</div>
                  </div>
                  {userType === 'police' && (
                    <button
                      onClick={() => acknowledgeEmergency(alert.id)}
                      className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                    >
                      Ack
                    </button>
                  )}
                </div>
              </div>
            ))}
            {emergencyAlerts.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No active emergencies
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveGeoMap;