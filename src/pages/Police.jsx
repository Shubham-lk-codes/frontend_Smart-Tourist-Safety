// import React, { useState, useEffect, useRef } from 'react';
// import GeoFenceTracker from '../components/GeoFenceTracker';
// import LiveGeoMap from '../components/LiveGeoMap';
// import UserLookup from '../components/UserLookup';

// // Leaflet Map Modal Component
// const LeafletMapModal = ({ isOpen, onClose, location, alertId, clientId }) => {
//   const mapRef = useRef(null);
//   const mapInstanceRef = useRef(null);
//   const markerRef = useRef(null);
//   const [leafletLoaded, setLeafletLoaded] = useState(false);

//   // Load Leaflet CSS and JS dynamically
//   useEffect(() => {
//     if (!isOpen) return;

//     const link = document.createElement('link');
//     link.rel = 'stylesheet';
//     link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
//     link.crossOrigin = '';

//     const script = document.createElement('script');
//     script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
//     script.crossOrigin = '';

//     script.onload = () => {
//       setLeafletLoaded(true);
//     };

//     document.head.appendChild(link);
//     document.head.appendChild(script);

//     return () => {
//       if (link.parentNode) link.parentNode.removeChild(link);
//       if (script.parentNode) script.parentNode.removeChild(script);
//       setLeafletLoaded(false);
//     };
//   }, [isOpen]);

//   // Initialize map when Leaflet is loaded
//   useEffect(() => {
//     if (!leafletLoaded || !isOpen || !location || !mapRef.current) return;

//     const L = window.L;

//     if (mapInstanceRef.current) {
//       mapInstanceRef.current.remove();
//       mapInstanceRef.current = null;
//     }

//     const lat = location.latitude || location.lat || 28.6139;
//     const lng = location.longitude || location.lng || 77.2090;

//     mapInstanceRef.current = L.map(mapRef.current).setView([lat, lng], 16);

//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//       attribution: '© OpenStreetMap contributors',
//       maxZoom: 19,
//     }).addTo(mapInstanceRef.current);

//     const redIcon = L.icon({
//       iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
//       shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
//       iconSize: [25, 41],
//       iconAnchor: [12, 41],
//       popupAnchor: [1, -34],
//       shadowSize: [41, 41]
//     });

//     markerRef.current = L.marker([lat, lng], {
//       icon: redIcon,
//       title: `Emergency Location - ${clientId || 'Unknown User'}`
//     }).addTo(mapInstanceRef.current);

//     const popupContent = `
//       <div style="padding: 10px; max-width: 250px;">
//         <h3 style="color: #e74c3c; margin: 0 0 10px 0; font-weight: bold;">🚨 EMERGENCY LOCATION</h3>
//         <p style="margin: 5px 0;"><strong>Alert ID:</strong> ${alertId.substring(0, 12)}...</p>
//         <p style="margin: 5px 0;"><strong>User:</strong> ${clientId.substring(0, 20)}...</p>
//         <p style="margin: 5px 0;"><strong>Latitude:</strong> ${lat.toFixed(6)}</p>
//         <p style="margin: 5px 0;"><strong>Longitude:</strong> ${lng.toFixed(6)}</p>
//         <p style="margin: 5px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
//         <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
//           <a href="https://www.openstreetmap.org/directions?from=&to=${lat}%2C${lng}&zoom=16&type=walk" 
//              target="_blank" 
//              style="background: #3498db; color: white; padding: 5px 10px; text-decoration: none; border-radius: 4px; display: inline-block;">
//             Get Directions
//           </a>
//         </div>
//       </div>
//     `;

//     markerRef.current.bindPopup(popupContent).openPopup();

//     if (location.accuracy) {
//       L.circle([lat, lng], {
//         color: '#e74c3c',
//         fillColor: '#e74c3c',
//         fillOpacity: 0.1,
//         radius: location.accuracy
//       }).addTo(mapInstanceRef.current);
//     }

//     L.control.scale().addTo(mapInstanceRef.current);
//     mapInstanceRef.current.fitBounds([[lat, lng]]);

//     return () => {
//       if (mapInstanceRef.current) {
//         mapInstanceRef.current.remove();
//         mapInstanceRef.current = null;
//       }
//     };
//   }, [leafletLoaded, isOpen, location, alertId, clientId]);

//   if (!isOpen || !location) return null;

//   const lat = location.latitude || location.lat || 28.6139;
//   const lng = location.longitude || location.lng || 77.2090;

//   return (
//     <div className="fixed inset-0 z-50 overflow-y-auto">
//       <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
//         <div
//           className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
//           onClick={onClose}
//         ></div>

//         <div className="inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
//           <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
//             <div className="sm:flex sm:items-start">
//               <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
//                 <div className="flex justify-between items-center mb-4">
//                   <h3 className="text-lg font-semibold text-gray-900">
//                     Emergency Location Map
//                   </h3>
//                   <button
//                     onClick={onClose}
//                     className="text-gray-400 hover:text-gray-500"
//                   >
//                     ✕
//                   </button>
//                 </div>

//                 <div className="mb-4">
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                     <div className="bg-gray-50 p-3 rounded">
//                       <p className="text-xs font-medium text-gray-600">Alert ID</p>
//                       <p className="text-sm font-bold truncate">{alertId.substring(0, 20)}...</p>
//                     </div>
//                     <div className="bg-gray-50 p-3 rounded">
//                       <p className="text-xs font-medium text-gray-600">Coordinates</p>
//                       <p className="text-sm font-bold">
//                         {lat.toFixed(6)}, {lng.toFixed(6)}
//                       </p>
//                     </div>
//                     <div className="bg-gray-50 p-3 rounded">
//                       <p className="text-xs font-medium text-gray-600">User ID</p>
//                       <p className="text-sm font-bold truncate">{clientId.substring(0, 20)}...</p>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Map Container */}
//                 <div
//                   ref={mapRef}
//                   className="w-full h-80 rounded border border-gray-300"
//                 >
//                   {!leafletLoaded && (
//                     <div className="flex items-center justify-center h-full">
//                       <div className="text-center">
//                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
//                         <p className="mt-2 text-sm text-gray-600">Loading map...</p>
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 {/* Action Buttons */}
//                 <div className="mt-4 flex flex-wrap gap-2">
//                   <a
//                     href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${lat}%2C${lng}`}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
//                   >
//                     Get Directions
//                   </a>
//                   <a
//                     href={`https://maps.google.com/?q=${lat},${lng}`}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
//                   >
//                     Google Maps
//                   </a>
//                   <button
//                     onClick={() => {
//                       const coords = `${lat},${lng}`;
//                       navigator.clipboard.writeText(coords);
//                     }}
//                     className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
//                   >
//                     Copy Coordinates
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="bg-gray-50 px-4 py-3 sm:px-6">
//             <button
//               type="button"
//               onClick={onClose}
//               className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-sm font-medium text-white hover:bg-red-700"
//             >
//               Close Map
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Simple location info component for table view
// const LocationInfo = ({ location, alertId, clientId, onMapClick }) => {
//   if (!location) return <span className="text-sm text-gray-500">N/A</span>;

//   const lat = location.latitude || location.lat;
//   const lng = location.longitude || location.lng;

//   return (
//     <div className="text-sm">
//       <div className="flex items-center space-x-2">
//         <span className="font-mono">
//           {lat.toFixed(6)}, {lng.toFixed(6)}
//         </span>
//         <button
//           onClick={() => onMapClick({ location, id: alertId, clientId })}
//           className="text-blue-600 hover:text-blue-800"
//           title="View on map"
//         >
//           🗺️
//         </button>
//       </div>
//       {location.accuracy && (
//         <div className="text-xs text-gray-500">
//           ±{location.accuracy.toFixed(1)}m
//         </div>
//       )}
//     </div>
//   );
// };

// function Police() {
//   const [emergencyAlerts, setEmergencyAlerts] = useState([]);
//   const [activeConnections, setActiveConnections] = useState(0);
//   const [socketStatus, setSocketStatus] = useState('disconnected');
//   const [reconnectAttempts, setReconnectAttempts] = useState(0);
//   const [connectedClients, setConnectedClients] = useState([]);
//   const [emergencyStats, setEmergencyStats] = useState({
//     active: 0,
//     acknowledged: 0,
//     resolved: 0,
//     total: 0
//   });
//   const [selectedAlert, setSelectedAlert] = useState(null);
//   const [showMapModal, setShowMapModal] = useState(false);

//   const socketRef = useRef(null);
//   const reconnectTimeoutRef = useRef(null);

//   // Fetch emergency alerts from backend
//   const fetchEmergencyAlerts = async () => {
//     try {
//       const response = await fetch('http://localhost:3000/api/emergencies');
//       if (response.ok) {
//         const data = await response.json();
//         setEmergencyAlerts(data.emergencies || []);
//         updateEmergencyStats(data.emergencies || []);
//       }
//     } catch (error) {
//       console.error('Error fetching emergency alerts:', error);
//     }
//   };

//   // Update emergency statistics
//   const updateEmergencyStats = (alerts) => {
//     const stats = {
//       active: alerts.filter(a => a.status === 'active').length,
//       acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
//       resolved: alerts.filter(a => a.status === 'resolved').length,
//       total: alerts.length
//     };
//     setEmergencyStats(stats);
//   };

//   // WebSocket connection
//   const connectWebSocket = () => {
//     try {
//       setSocketStatus('connecting');

//       const ws = new WebSocket(`ws://${window.location.hostname}:3000`);

//       ws.onopen = () => {
//         setSocketStatus('connected');
//         setReconnectAttempts(0);
//         socketRef.current = ws;

//         ws.send(JSON.stringify({
//           type: 'identify_user',
//           userType: 'police'
//         }));

//         fetchEmergencyAlerts();
//       };

//       ws.onmessage = (event) => {
//         try {
//           const data = JSON.parse(event.data);

//           switch (data.type) {
//             case 'panic_alert':
//               handleEmergencyAlert(data);
//               break;
//             case 'emergency_alert':
//               handleEmergencyAlert(data.alert || data);
//               break;
//             case 'emergency_status_update':
//               handleEmergencyUpdate(data);
//               break;
//             case 'user_connected':
//               handleUserConnected(data);
//               break;
//             case 'user_disconnected':
//               handleUserDisconnected(data);
//               break;
//             case 'health_check':
//               handleHealthCheck(data);
//               break;
//             case 'location_update':
//               handleLocationUpdate(data);
//               break;
//           }
//         } catch (error) {
//           console.error('Error parsing WebSocket message:', error);
//         }
//       };

//       ws.onclose = (event) => {
//         setSocketStatus('disconnected');
//         socketRef.current = null;

//         if (reconnectAttempts < 5) {
//           const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
//           reconnectTimeoutRef.current = setTimeout(() => {
//             setReconnectAttempts(prev => prev + 1);
//             connectWebSocket();
//           }, delay);
//         }
//       };

//       ws.onerror = (error) => {
//         setSocketStatus('error');
//       };

//     } catch (error) {
//       setSocketStatus('error');
//     }
//   };

//   // Message handlers
//   const handleEmergencyAlert = (alertData) => {
//     const newAlert = {
//       id: alertData.id || `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//       type: 'emergency',
//       clientId: alertData.clientId || alertData.userId || 'unknown',
//       location: alertData.location || alertData.data?.location,
//       timestamp: alertData.timestamp || new Date().toISOString(),
//       status: 'active',
//       acknowledged: alertData.acknowledged || false,
//       data: alertData.data || {},
//       source: alertData.source || 'websocket'
//     };

//     setEmergencyAlerts(prev => {
//       const exists = prev.find(a => a.id === newAlert.id);
//       if (!exists) {
//         const updated = [newAlert, ...prev];
//         updateEmergencyStats(updated);
//         return updated;
//       }
//       return prev;
//     });
//   };

//   const handleEmergencyUpdate = (data) => {
//     setEmergencyAlerts(prev => {
//       const updated = prev.map(alert => {
//         if (alert.id === data.alert?.id) {
//           return { ...alert, ...data.alert };
//         }
//         return alert;
//       });
//       updateEmergencyStats(updated);
//       return updated;
//     });
//   };

//   const handleUserConnected = (data) => {
//     setActiveConnections(prev => prev + 1);
//     setConnectedClients(prev => {
//       const exists = prev.find(c => c.id === data.clientId);
//       if (!exists && data.clientId) {
//         return [...prev, {
//           id: data.clientId,
//           type: 'tourist',
//           connectedAt: data.timestamp || new Date().toISOString(),
//           lastSeen: new Date().toISOString()
//         }];
//       }
//       return prev;
//     });
//   };

//   const handleUserDisconnected = (data) => {
//     setActiveConnections(prev => Math.max(0, prev - 1));
//     setConnectedClients(prev =>
//       prev.filter(c => c.id !== data.clientId)
//     );
//   };

//   const handleHealthCheck = (data) => {
//     setActiveConnections(data.userCount || 0);
//   };

//   const handleLocationUpdate = (data) => {
//     setConnectedClients(prev =>
//       prev.map(client =>
//         client.id === data.clientId
//           ? {
//             ...client,
//             location: data.data,
//             lastSeen: new Date().toISOString()
//           }
//           : client
//       )
//     );
//   };

//   // Open map with emergency location
//   const handleOpenMap = (alert) => {
//     setSelectedAlert(alert);
//     setShowMapModal(true);
//   };

//   // Initialize WebSocket connection
//   useEffect(() => {
//     connectWebSocket();

//     const refreshInterval = setInterval(() => {
//       fetchEmergencyAlerts();
//     }, 30000);

//     return () => {
//       if (reconnectTimeoutRef.current) {
//         clearTimeout(reconnectTimeoutRef.current);
//       }
//       if (socketRef.current) {
//         socketRef.current.close();
//       }
//       clearInterval(refreshInterval);
//     };
//   }, []);

//   // Acknowledge emergency alert
//   const acknowledgeAlert = async (alertId) => {
//     setEmergencyAlerts(prev => {
//       const updated = prev.map(alert =>
//         alert.id === alertId
//           ? { ...alert, acknowledged: true, status: 'acknowledged', acknowledgedAt: new Date().toISOString() }
//           : alert
//       );
//       updateEmergencyStats(updated);
//       return updated;
//     });

//     if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
//       socketRef.current.send(JSON.stringify({
//         type: 'emergency_acknowledged',
//         alertId: alertId,
//         acknowledgedBy: 'police',
//         timestamp: new Date().toISOString()
//       }));
//     }
//   };

//   // Resolve emergency alert
//   const resolveAlert = async (alertId) => {
//     setEmergencyAlerts(prev => {
//       const updated = prev.map(alert =>
//         alert.id === alertId
//           ? { ...alert, status: 'resolved', resolvedAt: new Date().toISOString() }
//           : alert
//       );
//       updateEmergencyStats(updated);
//       return updated;
//     });
//   };

//   // Filter alerts by status
//   const activeAlerts = emergencyAlerts.filter(a => a.status === 'active');

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Map Modal */}
//       {showMapModal && selectedAlert && selectedAlert.location && (
//         <LeafletMapModal
//           isOpen={showMapModal}
//           onClose={() => {
//             setShowMapModal(false);
//             setSelectedAlert(null);
//           }}
//           location={selectedAlert.location}
//           alertId={selectedAlert.id}
//           clientId={selectedAlert.clientId}
//         />
//       )}

//       {/* Header */}
//       <div className="bg-white border-b shadow-sm">
//         <div className="max-w-7xl mx-auto px-4 py-4">
//           <div className="flex flex-col md:flex-row md:items-center md:justify-between">
//             <div className="mb-4 md:mb-0">
//               <h1 className="text-xl font-bold text-gray-900">Police Dashboard</h1>
//               <p className="text-sm text-gray-600">Real-time emergency monitoring</p>
//             </div>

//             <div className="flex items-center space-x-4">
//               <div className={`px-3 py-1 rounded-full text-sm ${socketStatus === 'connected' ? 'bg-green-100 text-green-800' : socketStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
//                 {socketStatus === 'connected' ? '🟢 Connected' : socketStatus === 'connecting' ? '🟡 Connecting...' : '🔴 Disconnected'}
//               </div>
//               <div className="text-right">
//                 <div className="text-sm font-medium text-gray-900">{activeConnections} connected users</div>
//                 <div className="text-xs text-gray-500">Active connections</div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Active Emergency Alerts */}
//       {activeAlerts.length > 0 && (
//         <div className="bg-red-50 border-b border-red-200">
//           <div className="max-w-7xl mx-auto px-4 py-3">
//             <div className="flex items-center justify-between mb-2">
//               <h3 className="font-semibold text-red-800 text-sm">
//                 Active Emergencies ({activeAlerts.length})
//               </h3>
//               <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
//                 {activeAlerts.length} URGENT
//               </span>
//             </div>
//             <div className="space-y-3">
//               {activeAlerts.map(alert => (
//                 <div key={alert.id} className="bg-white border border-red-200 rounded p-3">
//                   <div className="flex justify-between items-start mb-2">
//                     <div>
//                       <div className="font-medium text-red-700 text-sm">EMERGENCY ALERT</div>
//                       <div className="text-xs text-gray-600 mt-1">
//                         Tourist: {alert.clientId.substring(0, 15)}...
//                       </div>
//                     </div>
//                     <div className="flex space-x-2">
//                       <button
//                         onClick={() => acknowledgeAlert(alert.id)}
//                         className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
//                       >
//                         Acknowledge
//                       </button>
//                       <button
//                         onClick={() => resolveAlert(alert.id)}
//                         className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
//                       >
//                         Resolve
//                       </button>
//                     </div>
//                   </div>

//                   {alert.location && (
//                     <div className="mt-2">
//                       <div className="text-xs font-medium text-gray-700 mb-1">Location:</div>
//                       <LocationInfo
//                         location={alert.location}
//                         alertId={alert.id}
//                         clientId={alert.clientId}
//                         onMapClick={handleOpenMap}
//                       />
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto px-4 py-6">
//         {/* Stats Overview */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//           <div className="bg-white rounded-lg border p-4">
//             <div className="text-2xl font-bold text-red-600">{emergencyStats.active}</div>
//             <div className="text-sm font-medium text-gray-700">Active</div>
//             <div className="text-xs text-gray-500 mt-1">Requires attention</div>
//           </div>
//           <div className="bg-white rounded-lg border p-4">
//             <div className="text-2xl font-bold text-yellow-600">{emergencyStats.acknowledged}</div>
//             <div className="text-sm font-medium text-gray-700">Acknowledged</div>
//             <div className="text-xs text-gray-500 mt-1">Response dispatched</div>
//           </div>
//           <div className="bg-white rounded-lg border p-4">
//             <div className="text-2xl font-bold text-green-600">{emergencyStats.resolved}</div>
//             <div className="text-sm font-medium text-gray-700">Resolved</div>
//             <div className="text-xs text-gray-500 mt-1">Emergency handled</div>
//           </div>
//           <div className="bg-white rounded-lg border p-4">
//             <div className="text-2xl font-bold text-blue-600">{activeConnections}</div>
//             <div className="text-sm font-medium text-gray-700">Connected Users</div>
//             <div className="text-xs text-gray-500 mt-1">Active tourists</div>
//           </div>
//         </div>

//         {/* Map Section */}
//         <div className="bg-white rounded-lg border mb-6">
//           <div className="border-b px-4 py-3">
//             <h3 className="font-semibold text-gray-900">Live Emergency Map</h3>
//           </div>
//           <div className="p-4">
//             <LiveGeoMap
//               emergencyAlerts={emergencyAlerts}
//               connectedClients={connectedClients}
//               onEmergencyClick={handleOpenMap}
//             />
//           </div>
//         </div>

//         {/* Emergency Alerts Table */}
//         <div className="bg-white rounded-lg border">
//           <div className="border-b px-4 py-3">
//             <h3 className="font-semibold text-gray-900">Emergency Alerts History</h3>
//           </div>
//           <div className="overflow-x-auto">
//             <table className="min-w-full">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Time</th>
//                   <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tourist ID</th>
//                   <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Location</th>
//                   <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
//                   <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200">
//                 {emergencyAlerts.map(alert => (
//                   <tr key={alert.id} className="hover:bg-gray-50">
//                     <td className="px-4 py-3">
//                       <div className="text-sm text-gray-900">
//                         {new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
//                       </div>
//                       <div className="text-xs text-gray-500">
//                         {new Date(alert.timestamp).toLocaleDateString()}
//                       </div>
//                     </td>
//                     <td className="px-4 py-3">
//                       <div className="text-sm font-mono text-gray-900">
//                         {alert.clientId.substring(0, 16)}...
//                       </div>
//                     </td>
//                     <td className="px-4 py-3">
//                       <LocationInfo
//                         location={alert.location}
//                         alertId={alert.id}
//                         clientId={alert.clientId}
//                         onMapClick={handleOpenMap}
//                       />
//                     </td>
//                     <td className="px-4 py-3">
//                       <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
//                         alert.status === 'active'
//                           ? 'bg-red-100 text-red-800'
//                           : alert.status === 'acknowledged'
//                             ? 'bg-yellow-100 text-yellow-800'
//                             : 'bg-green-100 text-green-800'
//                       }`}>
//                         {alert.status.toUpperCase()}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3">
//                       <div className="flex space-x-2">
//                         {alert.location && (
//                           <button
//                             onClick={() => handleOpenMap(alert)}
//                             className="text-blue-600 hover:text-blue-800 text-sm"
//                           >
//                             Map
//                           </button>
//                         )}
//                         {alert.status === 'active' && (
//                           <button
//                             onClick={() => acknowledgeAlert(alert.id)}
//                             className="text-green-600 hover:text-green-800 text-sm"
//                           >
//                             Acknowledge
//                           </button>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//                 {emergencyAlerts.length === 0 && (
//                   <tr>
//                     <td colSpan="5" className="px-4 py-8 text-center text-gray-500 text-sm">
//                       No emergency alerts
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Connected Users Section */}
//         <div className="bg-white rounded-lg border mt-6">
//           <div className="border-b px-4 py-3">
//             <h3 className="font-semibold text-gray-900">Connected Tourists ({connectedClients.length})</h3>
//           </div>
//           <div className="p-4">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {connectedClients.map(client => (
//                 <div key={client.id} className="border rounded p-3">
//                   <div className="flex justify-between items-start">
//                     <div>
//                       <p className="font-medium text-sm text-gray-800">
//                         {client.id.substring(0, 20)}...
//                       </p>
//                       <p className="text-xs text-gray-600 mt-1">
//                         Connected: {new Date(client.connectedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
//                       </p>
//                       {client.location && (
//                         <div className="mt-2">
//                           <p className="text-xs text-gray-500">
//                             📍 {client.location.latitude?.toFixed(6) || client.location.lat?.toFixed(6)},
//                             {client.location.longitude?.toFixed(6) || client.location.lng?.toFixed(6)}
//                           </p>
//                         </div>
//                       )}
//                     </div>
//                     <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
//                       Online
//                     </span>
//                   </div>
//                 </div>
//               ))}
//               {connectedClients.length === 0 && (
//                 <div className="col-span-3 text-center py-6 text-gray-500 text-sm">
//                   No connected tourists
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Footer */}
//       <div className="bg-gray-800 text-white py-4 mt-8">
//         <div className="max-w-7xl mx-auto px-4">
//           <div className="flex justify-between items-center">
//             <div>
//               <p className="text-sm">Police Emergency Response System</p>
//             </div>
//             <div className="text-right">
//               <p className="text-xs text-gray-400">
//                 Last updated: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Police;

import React, { useState, useEffect, useRef } from 'react';
import GeoFenceTracker from '../components/GeoFenceTracker';
import LiveGeoMap from '../components/LiveGeoMap';
import UserLookup from '../components/UserLookup';

// Audio for siren sound
const playSirenSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.6);
    
    setTimeout(() => {
      oscillator.disconnect();
      audioContext.close();
    }, 700);
  } catch (error) {
    console.log('Audio context not supported, playing fallback sound');
    // Fallback: Play a beep sound
    const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
    audio.volume = 0.3;
    audio.play();
  }
};

// Leaflet Map Modal Component
const LeafletMapModal = ({ isOpen, onClose, location, alertId, clientId, timestamp }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet CSS and JS dynamically
  useEffect(() => {
    if (!isOpen) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.crossOrigin = '';

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.crossOrigin = '';

    script.onload = () => {
      setLeafletLoaded(true);
    };

    document.head.appendChild(link);
    document.head.appendChild(script);

    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
      if (script.parentNode) script.parentNode.removeChild(script);
      setLeafletLoaded(false);
    };
  }, [isOpen]);

  // Initialize map when Leaflet is loaded
  useEffect(() => {
    if (!leafletLoaded || !isOpen || !location || !mapRef.current) return;

    const L = window.L;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const lat = location.latitude || location.lat || 28.6139;
    const lng = location.longitude || location.lng || 77.2090;

    mapInstanceRef.current = L.map(mapRef.current).setView([lat, lng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    const redIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    markerRef.current = L.marker([lat, lng], {
      icon: redIcon,
      title: `Emergency Location - ${clientId || 'Unknown User'}`
    }).addTo(mapInstanceRef.current);

    const popupContent = `
      <div style="padding: 10px; max-width: 250px;">
        <h3 style="color: #e74c3c; margin: 0 0 10px 0; font-weight: bold;">🚨 EMERGENCY LOCATION</h3>
        <p style="margin: 5px 0;"><strong>Alert ID:</strong> ${alertId?.substring(0, 12) || 'N/A'}...</p>
        <p style="margin: 5px 0;"><strong>User:</strong> ${clientId?.substring(0, 20) || 'Unknown'}...</p>
        <p style="margin: 5px 0;"><strong>Latitude:</strong> ${lat.toFixed(6)}</p>
        <p style="margin: 5px 0;"><strong>Longitude:</strong> ${lng.toFixed(6)}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString()}</p>
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
          <a href="https://www.openstreetmap.org/directions?from=&to=${lat}%2C${lng}&zoom=16&type=walk" 
             target="_blank" 
             style="background: #3498db; color: white; padding: 5px 10px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Get Directions
          </a>
        </div>
      </div>
    `;

    markerRef.current.bindPopup(popupContent).openPopup();

    if (location.accuracy) {
      L.circle([lat, lng], {
        color: '#e74c3c',
        fillColor: '#e74c3c',
        fillOpacity: 0.1,
        radius: location.accuracy
      }).addTo(mapInstanceRef.current);
    }

    L.control.scale().addTo(mapInstanceRef.current);
    mapInstanceRef.current.fitBounds([[lat, lng]]);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded, isOpen, location, alertId, clientId, timestamp]);

  if (!isOpen || !location) return null;

  const lat = location.latitude || location.lat || 28.6139;
  const lng = location.longitude || location.lng || 77.2090;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Emergency Location Map
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs font-medium text-gray-600">Alert ID</p>
                      <p className="text-sm font-bold truncate">{alertId?.substring(0, 20) || 'N/A'}...</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs font-medium text-gray-600">Coordinates</p>
                      <p className="text-sm font-bold">
                        {lat.toFixed(6)}, {lng.toFixed(6)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs font-medium text-gray-600">Time</p>
                      <p className="text-sm font-bold truncate">
                        {timestamp ? new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Map Container */}
                <div
                  ref={mapRef}
                  className="w-full h-80 rounded border border-gray-300"
                >
                  {!leafletLoaded && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">Loading map...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${lat}%2C${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Get Directions
                  </a>
                  <a
                    href={`https://maps.google.com/?q=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Google Maps
                  </a>
                  <button
                    onClick={() => {
                      const coords = `${lat},${lng}`;
                      navigator.clipboard.writeText(coords);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Copy Coordinates
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-sm font-medium text-white hover:bg-red-700"
            >
              Close Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple location info component for table view
const LocationInfo = ({ location, alertId, clientId, timestamp, onMapClick }) => {
  if (!location) return <span className="text-sm text-gray-500">N/A</span>;

  const lat = location.latitude || location.lat;
  const lng = location.longitude || location.lng;

  return (
    <div className="text-sm">
      <div className="flex items-center space-x-2 mb-1">
        <span className="font-mono">
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </span>
        <button
          onClick={() => onMapClick({ location, id: alertId, clientId, timestamp })}
          className="text-blue-600 hover:text-blue-800"
          title="View on map"
        >
          🗺️
        </button>
      </div>
      {timestamp && (
        <div className="text-xs text-gray-500">
          {new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
      )}
      {location.accuracy && (
        <div className="text-xs text-gray-500">
          ±{location.accuracy.toFixed(1)}m
        </div>
      )}
    </div>
  );
};

// Time ago calculator
const getTimeAgo = (timestamp) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  return 'Just now';
};

function Police() {
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [activeConnections, setActiveConnections] = useState(0);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectedClients, setConnectedClients] = useState([]);
  const [emergencyStats, setEmergencyStats] = useState({
    active: 0,
    acknowledged: 0,
    resolved: 0,
    total: 0
  });
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [lastEmergencyTime, setLastEmergencyTime] = useState(null);

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const sirenTimeoutRef = useRef(null);

  // Play siren sound for new emergencies
  const playEmergencySiren = () => {
    playSirenSound();
    
    // Play siren 3 times with delay
    let count = 0;
    const playNext = () => {
      if (count < 3) {
        playSirenSound();
        count++;
        sirenTimeoutRef.current = setTimeout(playNext, 800);
      }
    };
    
    playNext();
  };

  // Fetch emergency alerts from backend
  const fetchEmergencyAlerts = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/emergencies');
      if (response.ok) {
        const data = await response.json();
        const alerts = data.emergencies || [];
        setEmergencyAlerts(alerts);
        updateEmergencyStats(alerts);
        
        // Check for new emergencies
        if (alerts.length > 0) {
          const latestAlert = alerts[0];
          const latestTime = new Date(latestAlert.timestamp).getTime();
          
          if (!lastEmergencyTime || latestTime > lastEmergencyTime) {
            if (latestAlert.status === 'active' && !latestAlert.acknowledged) {
              playEmergencySiren();
            }
            setLastEmergencyTime(latestTime);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching emergency alerts:', error);
    }
  };

  // Update emergency statistics
  const updateEmergencyStats = (alerts) => {
    const stats = {
      active: alerts.filter(a => a.status === 'active').length,
      acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
      total: alerts.length
    };
    setEmergencyStats(stats);
  };

  // WebSocket connection
  const connectWebSocket = () => {
    try {
      setSocketStatus('connecting');

      const ws = new WebSocket(`ws://${window.location.hostname}:3000`);

      ws.onopen = () => {
        setSocketStatus('connected');
        setReconnectAttempts(0);
        socketRef.current = ws;

        ws.send(JSON.stringify({
          type: 'identify_user',
          userType: 'police'
        }));

        fetchEmergencyAlerts();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'panic_alert':
              handleEmergencyAlert(data);
              break;
            case 'emergency_alert':
              handleEmergencyAlert(data.alert || data);
              break;
            case 'emergency_status_update':
              handleEmergencyUpdate(data);
              break;
            case 'user_connected':
              handleUserConnected(data);
              break;
            case 'user_disconnected':
              handleUserDisconnected(data);
              break;
            case 'health_check':
              handleHealthCheck(data);
              break;
            case 'location_update':
              handleLocationUpdate(data);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        setSocketStatus('disconnected');
        socketRef.current = null;

        if (reconnectAttempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connectWebSocket();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        setSocketStatus('error');
      };

    } catch (error) {
      setSocketStatus('error');
    }
  };

  // Message handlers
  const handleEmergencyAlert = (alertData) => {
    const newAlert = {
      id: alertData.id || `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'emergency',
      clientId: alertData.clientId || alertData.userId || 'unknown',
      location: alertData.location || alertData.data?.location,
      timestamp: alertData.timestamp || new Date().toISOString(),
      status: 'active',
      acknowledged: alertData.acknowledged || false,
      data: alertData.data || {},
      source: alertData.source || 'websocket',
      receivedAt: new Date().toISOString()
    };

    setEmergencyAlerts(prev => {
      const exists = prev.find(a => a.id === newAlert.id);
      if (!exists) {
        const updated = [newAlert, ...prev];
        updateEmergencyStats(updated);
        
        // Play siren sound for new active emergency
        if (newAlert.status === 'active' && !newAlert.acknowledged) {
          playEmergencySiren();
        }
        
        return updated;
      }
      return prev;
    });
  };

  const handleEmergencyUpdate = (data) => {
    setEmergencyAlerts(prev => {
      const updated = prev.map(alert => {
        if (alert.id === data.alert?.id) {
          return { ...alert, ...data.alert };
        }
        return alert;
      });
      updateEmergencyStats(updated);
      return updated;
    });
  };

  const handleUserConnected = (data) => {
    setActiveConnections(prev => prev + 1);
    setConnectedClients(prev => {
      const exists = prev.find(c => c.id === data.clientId);
      if (!exists && data.clientId) {
        return [...prev, {
          id: data.clientId,
          type: 'tourist',
          connectedAt: data.timestamp || new Date().toISOString(),
          lastSeen: new Date().toISOString()
        }];
      }
      return prev;
    });
  };

  const handleUserDisconnected = (data) => {
    setActiveConnections(prev => Math.max(0, prev - 1));
    setConnectedClients(prev =>
      prev.filter(c => c.id !== data.clientId)
    );
  };

  const handleHealthCheck = (data) => {
    setActiveConnections(data.userCount || 0);
  };

  const handleLocationUpdate = (data) => {
    setConnectedClients(prev =>
      prev.map(client =>
        client.id === data.clientId
          ? {
            ...client,
            location: data.data,
            lastSeen: new Date().toISOString()
          }
          : client
      )
    );
  };

  // Open map with emergency location
  const handleOpenMap = (alert) => {
    setSelectedAlert(alert);
    setShowMapModal(true);
  };

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();

    const refreshInterval = setInterval(() => {
      fetchEmergencyAlerts();
    }, 30000);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (sirenTimeoutRef.current) {
        clearTimeout(sirenTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
      clearInterval(refreshInterval);
    };
  }, []);

  // Acknowledge emergency alert
  const acknowledgeAlert = async (alertId) => {
    setEmergencyAlerts(prev => {
      const updated = prev.map(alert =>
        alert.id === alertId
          ? { ...alert, acknowledged: true, status: 'acknowledged', acknowledgedAt: new Date().toISOString() }
          : alert
      );
      updateEmergencyStats(updated);
      return updated;
    });

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'emergency_acknowledged',
        alertId: alertId,
        acknowledgedBy: 'police',
        timestamp: new Date().toISOString()
      }));
    }
  };

  // Resolve emergency alert
  const resolveAlert = async (alertId) => {
    setEmergencyAlerts(prev => {
      const updated = prev.map(alert =>
        alert.id === alertId
          ? { ...alert, status: 'resolved', resolvedAt: new Date().toISOString() }
          : alert
      );
      updateEmergencyStats(updated);
      return updated;
    });
  };

  // Filter alerts by status
  const activeAlerts = emergencyAlerts.filter(a => a.status === 'active');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Map Modal */}
      {showMapModal && selectedAlert && selectedAlert.location && (
        <LeafletMapModal
          isOpen={showMapModal}
          onClose={() => {
            setShowMapModal(false);
            setSelectedAlert(null);
          }}
          location={selectedAlert.location}
          alertId={selectedAlert.id}
          clientId={selectedAlert.clientId}
          timestamp={selectedAlert.timestamp}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-xl font-bold text-gray-900">Police Dashboard</h1>
              <p className="text-sm text-gray-600">Real-time emergency monitoring</p>
            </div>

            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm ${socketStatus === 'connected' ? 'bg-green-100 text-green-800' : socketStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                {socketStatus === 'connected' ? '🟢 Connected' : socketStatus === 'connecting' ? '🟡 Connecting...' : '🔴 Disconnected'}
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{activeConnections} connected users</div>
                <div className="text-xs text-gray-500">Active connections</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Emergency Alerts */}
      {activeAlerts.length > 0 && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-red-800 text-sm">
                Active Emergencies ({activeAlerts.length})
              </h3>
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                {activeAlerts.length} URGENT
              </span>
            </div>
            <div className="space-y-3">
              {activeAlerts.map(alert => (
                <div key={alert.id} className="bg-white border border-red-200 rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-red-700 text-sm">🚨 EMERGENCY ALERT</span>
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          {getTimeAgo(alert.timestamp)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Tourist: {alert.clientId.substring(0, 15)}...
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Time: {new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>

                  {alert.location && (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-gray-700 mb-1">Location:</div>
                      <LocationInfo
                        location={alert.location}
                        alertId={alert.id}
                        clientId={alert.clientId}
                        timestamp={alert.timestamp}
                        onMapClick={handleOpenMap}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-red-600">{emergencyStats.active}</div>
            <div className="text-sm font-medium text-gray-700">Active</div>
            <div className="text-xs text-gray-500 mt-1">Requires attention</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-yellow-600">{emergencyStats.acknowledged}</div>
            <div className="text-sm font-medium text-gray-700">Acknowledged</div>
            <div className="text-xs text-gray-500 mt-1">Response dispatched</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-green-600">{emergencyStats.resolved}</div>
            <div className="text-sm font-medium text-gray-700">Resolved</div>
            <div className="text-xs text-gray-500 mt-1">Emergency handled</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-2xl font-bold text-blue-600">{activeConnections}</div>
            <div className="text-sm font-medium text-gray-700">Connected Users</div>
            <div className="text-xs text-gray-500 mt-1">Active tourists</div>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-lg border mb-6">
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold text-gray-900">Live Emergency Map</h3>
          </div>
          {/* <div className="p-4">
            <LiveGeoMap
              emergencyAlerts={emergencyAlerts}
              connectedClients={connectedClients}
              onEmergencyClick={handleOpenMap}
            />
          </div> */}
        </div>

        {/* Emergency Alerts Table */}
        <div className="bg-white rounded-lg border">
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold text-gray-900">Emergency Alerts History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Time</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tourist ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Location</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {emergencyAlerts.map(alert => (
                  <tr key={alert.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        {getTimeAgo(alert.timestamp)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-mono text-gray-900">
                        {alert.clientId.substring(0, 16)}...
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <LocationInfo
                        location={alert.location}
                        alertId={alert.id}
                        clientId={alert.clientId}
                        timestamp={alert.timestamp}
                        onMapClick={handleOpenMap}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        alert.status === 'active'
                          ? 'bg-red-100 text-red-800'
                          : alert.status === 'acknowledged'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {alert.status.toUpperCase()}
                      </span>
                      {alert.acknowledgedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Ack: {new Date(alert.acknowledgedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        {alert.location && (
                          <button
                            onClick={() => handleOpenMap(alert)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Map
                          </button>
                        )}
                        {alert.status === 'active' && (
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {emergencyAlerts.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500 text-sm">
                      No emergency alerts
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Connected Users Section */}
        <div className="bg-white rounded-lg border mt-6">
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold text-gray-900">Connected Tourists ({connectedClients.length})</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectedClients.map(client => (
                <div key={client.id} className="border rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm text-gray-800">
                        {client.id.substring(0, 20)}...
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Connected: {new Date(client.connectedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                      {client.location && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">
                            📍 {client.location.latitude?.toFixed(6) || client.location.lat?.toFixed(6)},
                            {client.location.longitude?.toFixed(6) || client.location.lng?.toFixed(6)}
                          </p>
                        </div>
                      )}
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Online
                    </span>
                  </div>
                </div>
              ))}
              {connectedClients.length === 0 && (
                <div className="col-span-3 text-center py-6 text-gray-500 text-sm">
                  No connected tourists
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm">Police Emergency Response System</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">
                Last updated: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Police;