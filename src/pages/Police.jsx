import React, { useState, useEffect, useRef } from 'react';
import GeoFenceTracker from '../components/GeoFenceTracker';
import LiveGeoMap from '../components/LiveGeoMap';
import UserLookup from '../components/UserLookup';

// Leaflet Map Modal Component
const LeafletMapModal = ({ isOpen, onClose, location, alertId, clientId }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet CSS and JS dynamically
  useEffect(() => {
    if (!isOpen) return;

    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';

    script.onload = () => {
      setLeafletLoaded(true);
    };

    document.head.appendChild(link);
    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (link.parentNode) link.parentNode.removeChild(link);
      if (script.parentNode) script.parentNode.removeChild(script);
      setLeafletLoaded(false);
    };
  }, [isOpen]);

  // Initialize map when Leaflet is loaded
  useEffect(() => {
    if (!leafletLoaded || !isOpen || !location || !mapRef.current) return;

    const L = window.L;

    // Clear existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize map
    const lat = location.latitude || location.lat || 28.6139;
    const lng = location.longitude || location.lng || 77.2090;

    mapInstanceRef.current = L.map(mapRef.current).setView([lat, lng], 16);

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    // Add emergency marker with red icon
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

    // Add popup with emergency details
    const popupContent = `
      <div style="padding: 10px; max-width: 250px;">
        <h3 style="color: #e74c3c; margin: 0 0 10px 0; font-weight: bold;">🚨 EMERGENCY LOCATION</h3>
        <p style="margin: 5px 0;"><strong>Alert ID:</strong> ${alertId.substring(0, 12)}...</p>
        <p style="margin: 5px 0;"><strong>User:</strong> ${clientId.substring(0, 20)}...</p>
        <p style="margin: 5px 0;"><strong>Latitude:</strong> ${lat.toFixed(6)}</p>
        <p style="margin: 5px 0;"><strong>Longitude:</strong> ${lng.toFixed(6)}</p>
        <p style="margin: 5px 0;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
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

    // Add accuracy circle if available
    if (location.accuracy) {
      L.circle([lat, lng], {
        color: '#e74c3c',
        fillColor: '#e74c3c',
        fillOpacity: 0.1,
        radius: location.accuracy
      }).addTo(mapInstanceRef.current);
    }

    // Add scale control
    L.control.scale().addTo(mapInstanceRef.current);

    // Fit bounds to marker
    mapInstanceRef.current.fitBounds([[lat, lng]]);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded, isOpen, location, alertId, clientId]);

  if (!isOpen || !location) return null;

  const lat = location.latitude || location.lat || 28.6139;
  const lng = location.longitude || location.lng || 77.2090;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl leading-6 font-bold text-gray-900">
                    🗺️ Emergency Location Map (OpenStreetMap)
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-700">Alert ID</p>
                      <p className="text-lg font-bold truncate">{alertId.substring(0, 20)}...</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-green-700">Coordinates</p>
                      <p className="text-lg font-bold">
                        {lat.toFixed(6)}, {lng.toFixed(6)}
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-red-700">User ID</p>
                      <p className="text-lg font-bold truncate">{clientId.substring(0, 20)}...</p>
                    </div>
                  </div>
                </div>

                {/* Map Container */}
                <div
                  ref={mapRef}
                  className="w-full h-96 rounded-lg border border-gray-300 shadow-inner"
                  style={{ minHeight: '400px' }}
                >
                  {!leafletLoaded && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading map...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                  <a
                    href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${lat}%2C${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    🚗 Get Driving Directions
                  </a>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=16`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                  >
                    🔍 Open in OpenStreetMap
                  </a>
                  <a
                    href={`https://maps.google.com/?q=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
                  >
                    📱 Google Maps
                  </a>
                  <button
                    onClick={() => {
                      const coords = `${lat},${lng}`;
                      navigator.clipboard.writeText(coords);
                      alert('Coordinates copied to clipboard!');
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700"
                  >
                    📋 Copy Coordinates
                  </button>
                </div>

                {/* Location Details */}
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold text-lg mb-2">📍 Location Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Latitude:</p>
                      <p className="font-mono font-bold">{lat.toFixed(8)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Longitude:</p>
                      <p className="font-mono font-bold">{lng.toFixed(8)}</p>
                    </div>
                    {location.accuracy && (
                      <div>
                        <p className="text-sm text-gray-600">Accuracy:</p>
                        <p className="font-mono font-bold">{location.accuracy.toFixed(1)} meters</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Mapped Time:</p>
                      <p className="font-mono font-bold">{new Date().toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close Map
            </button>
            <button
              type="button"
              onClick={() => {
                // Create a printable version
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                  <html>
                    <head>
                      <title>Emergency Location - ${alertId.substring(0, 12)}</title>
                      <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .header { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                        .coordinates { background: #f1f1f1; padding: 15px; border-radius: 5px; margin: 10px 0; }
                        .map-link { color: #007bff; text-decoration: none; }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <h1>🚨 Emergency Location Report</h1>
                        <p><strong>Alert ID:</strong> ${alertId}</p>
                        <p><strong>User ID:</strong> ${clientId}</p>
                        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                      </div>
                      <div class="coordinates">
                        <h3>📍 Location Coordinates</h3>
                        <p><strong>Latitude:</strong> ${lat.toFixed(8)}</p>
                        <p><strong>Longitude:</strong> ${lng.toFixed(8)}</p>
                        ${location.accuracy ? `<p><strong>Accuracy:</strong> ${location.accuracy.toFixed(1)} meters</p>` : ''}
                      </div>
                      <div>
                        <h3>🗺️ Map Links</h3>
                        <ul>
                          <li><a href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=16" target="_blank" class="map-link">Open in OpenStreetMap</a></li>
                          <li><a href="https://maps.google.com/?q=${lat},${lng}" target="_blank" class="map-link">Open in Google Maps</a></li>
                          <li><a href="https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${lat}%2C${lng}" target="_blank" class="map-link">Get Driving Directions</a></li>
                        </ul>
                      </div>
                      <p style="margin-top: 30px; color: #666; font-size: 12px;">
                        Printed on ${new Date().toLocaleString()} | Smart Tourist Safety System
                      </p>
                    </body>
                  </html>
                `);
                printWindow.document.close();
                printWindow.print();
              }}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              🖨️ Print Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple location info component for table view
const LocationInfo = ({ location, alertId, clientId, onMapClick }) => {
  if (!location) return <span className="text-gray-500 text-sm">N/A</span>;

  const lat = location.latitude || location.lat;
  const lng = location.longitude || location.lng;

  return (
    <div className="text-sm">
      <div className="flex items-center space-x-2">
        <span className="font-mono">
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </span>
        <button
          onClick={() => onMapClick({ location, id: alertId, clientId })}
          className="text-blue-600 hover:text-blue-800 text-xs"
          title="View on map"
        >
          🗺️
        </button>
      </div>
      {location.accuracy && (
        <div className="text-xs text-gray-500">
          ±{location.accuracy.toFixed(1)}m
        </div>
      )}
    </div>
  );
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

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);

  // Initialize Web Audio Context
  const initAudio = () => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.log('Audio context not supported:', error);
    }
  };

  // Play emergency sound
  const playEmergencySound = () => {
    if (!audioContextRef.current) {
      initAudio();
    }

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    try {
      const audioContext = audioContextRef.current;
      if (!audioContext) return;

      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator1.frequency.value = 1000;
      oscillator2.frequency.value = 800;
      oscillator1.type = 'sine';
      oscillator2.type = 'sine';

      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);

      oscillator1.start(audioContext.currentTime);
      oscillator2.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 2);
      oscillator2.stop(audioContext.currentTime + 2);
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  // Fetch emergency alerts from backend
  const fetchEmergencyAlerts = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/emergencies');
      if (response.ok) {
        const data = await response.json();
        setEmergencyAlerts(data.emergencies || []);
        updateEmergencyStats(data.emergencies || []);
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
      console.log('🔄 Connecting to WebSocket...');
      setSocketStatus('connecting');

      const ws = new WebSocket(`ws://${window.location.hostname}:3000`);

      ws.onopen = () => {
        console.log('🔗 Police WebSocket Connected');
        setSocketStatus('connected');
        setReconnectAttempts(0);
        socketRef.current = ws;

        ws.send(JSON.stringify({
          type: 'identify_user',
          userType: 'police',
          officerId: `officer_${Date.now()}`,
          timestamp: new Date().toISOString()
        }));

        fetchEmergencyAlerts();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Police received:', data.type);

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

            case 'connection_established':
              console.log('✅ Connection established with server');
              break;

            case 'location_update':
              handleLocationUpdate(data);
              break;

            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔴 Police WebSocket Disconnected:', event.code, event.reason);
        setSocketStatus('disconnected');
        socketRef.current = null;

        if (reconnectAttempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`🔄 Reconnecting in ${delay / 1000} seconds... (Attempt ${reconnectAttempts + 1})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connectWebSocket();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('💥 Police WebSocket error:', error);
        setSocketStatus('error');
      };

    } catch (error) {
      console.error('💥 Failed to create WebSocket:', error);
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
      source: alertData.source || 'websocket'
    };

    setEmergencyAlerts(prev => {
      const exists = prev.find(a => a.id === newAlert.id);
      if (!exists) {
        const updated = [newAlert, ...prev];
        updateEmergencyStats(updated);
        return updated;
      }
      return prev;
    });

    playEmergencySound();
    showBrowserNotification(newAlert);
    console.log('🚨 Emergency Alert Received:', newAlert);
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
            lastSeen: new Date().toISOString(),
            lastUpdate: data.timestamp
          }
          : client
      )
    );
  };

  // Show browser notification
  const showBrowserNotification = (alert) => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      const notification = new Notification("🚨 EMERGENCY ALERT", {
        body: `Tourist in distress at location (${alert.location?.latitude?.toFixed(4)}, ${alert.location?.longitude?.toFixed(4)})`,
        icon: "/emergency-icon.png",
        tag: alert.id,
        requireInteraction: true,
        silent: false
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        handleOpenMap(alert);
      };

      setTimeout(() => notification.close(), 10000);
    } else if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  // Open map with emergency location
  const handleOpenMap = (alert) => {
    setSelectedAlert(alert);
    setShowMapModal(true);
  };

  // Open in OpenStreetMap
  const handleOpenOSM = (location) => {
    if (!location) return;

    const lat = location.latitude || location.lat;
    const lng = location.longitude || location.lng;

    if (lat && lng) {
      const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=17`;
      window.open(osmUrl, '_blank');
    }
  };

  // Open driving directions
  const handleOpenDirections = (location) => {
    if (!location) return;

    const lat = location.latitude || location.lat;
    const lng = location.longitude || location.lng;

    if (lat && lng) {
      const directionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${lat}%2C${lng}`;
      window.open(directionsUrl, '_blank');
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    initAudio();
    connectWebSocket();

    const refreshInterval = setInterval(() => {
      fetchEmergencyAlerts();
    }, 30000);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      clearInterval(refreshInterval);
    };
  }, []);

  // Acknowledge emergency alert
  const acknowledgeAlert = async (alertId) => {
    const alert = emergencyAlerts.find(a => a.id === alertId);
    if (!alert) return;

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
        officerId: `officer_${Date.now()}`,
        timestamp: new Date().toISOString()
      }));
    }

    try {
      await fetch(`http://localhost:3000/api/emergencies/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acknowledgedBy: 'police',
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error sending acknowledgment:', error);
    }

    console.log(`✅ Emergency ${alertId} acknowledged`);
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

    try {
      await fetch(`http://localhost:3000/api/emergencies/${alertId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resolvedBy: 'police',
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error sending resolution:', error);
    }

    console.log(`✅ Emergency ${alertId} resolved`);
  };

  // Manual reconnect
  const handleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setReconnectAttempts(0);
    connectWebSocket();
  };

  // Refresh data manually
  const handleRefresh = () => {
    fetchEmergencyAlerts();
  };

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const getStatusColor = () => {
    switch (socketStatus) {
      case 'connected': return 'bg-green-100 text-green-800 border-green-500';
      case 'connecting': return 'bg-yellow-100 text-yellow-800 border-yellow-500';
      case 'error': return 'bg-red-100 text-red-800 border-red-500';
      default: return 'bg-gray-100 text-gray-800 border-gray-500';
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

  // Filter alerts by status
  const activeAlerts = emergencyAlerts.filter(a => a.status === 'active');
  const acknowledgedAlerts = emergencyAlerts.filter(a => a.status === 'acknowledged');
  const resolvedAlerts = emergencyAlerts.filter(a => a.status === 'resolved');

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
        />
      )}

      {/* Police Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <span className="mr-3">🚓</span> Police Emergency Dashboard
              </h1>
              <p className="text-blue-200 mt-1">Real-time Emergency Monitoring & Response System</p>
            </div>

            <div className="text-right">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-700 p-3 rounded-lg">
                  <div className="text-2xl font-bold">{activeConnections}</div>
                  <div className="text-sm text-blue-200">Active Users</div>
                </div>
                <div className={`p-3 rounded-lg ${activeAlerts.length > 0 ? 'bg-red-600 animate-pulse' : 'bg-green-600'}`}>
                  <div className="text-2xl font-bold">{activeAlerts.length}</div>
                  <div className="text-sm">Active Emergencies</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Alerts Panel */}
      {activeAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b-4 border-red-500 shadow-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold text-red-800 flex items-center">
                <span className="mr-2">🚨</span> ACTIVE EMERGENCY ALERTS
              </h3>
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm animate-pulse">
                {activeAlerts.length} URGENT
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeAlerts.map(alert => {
                const userLocation = connectedClients.find(c => c.id === alert.clientId)?.location;
                return (
                  <div key={alert.id} className="bg-white border-l-4 border-red-500 p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-red-700 text-lg">EMERGENCY</p>
                        <p className="text-sm text-gray-600 font-mono">ID: {alert.id.substring(0, 12)}...</p>
                        <p className="text-sm text-gray-600">Tourist: {alert.clientId.substring(0, 15)}...</p>
                        <p className="text-xs text-gray-500 mt-1">
                          📅 {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition duration-200"
                          title="Acknowledge Emergency"
                        >
                          ✅ Ack
                        </button>
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition duration-200"
                          title="Mark as Resolved"
                        >
                          ✓ Resolve
                        </button>
                      </div>
                    </div>

                    {/* Location Information */}
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <p className="text-sm font-semibold text-gray-700 mb-1">📍 Location:</p>
                      {alert.location ? (
                        <LocationInfo
                          location={alert.location}
                          alertId={alert.id}
                          clientId={alert.clientId}
                          onMapClick={handleOpenMap}
                        />
                      ) : (
                        <p className="text-gray-500">Location not available</p>
                      )}
                    </div>

                    {/* Emergency Details */}
                    {alert.data && (
                      <div className="mt-2 text-sm">
                        {alert.data.emergencyType && (
                          <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded mr-2">
                            {alert.data.emergencyType.toUpperCase()}
                          </span>
                        )}
                        {alert.data.message && (
                          <p className="text-gray-600 mt-2">"{alert.data.message}"</p>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenMap(alert)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center justify-center"
                      >
                        <span className="mr-1">🗺️</span> View Map
                      </button>
                      <button
                        onClick={() => handleOpenDirections(alert.location)}
                        className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center justify-center"
                      >
                        <span className="mr-1">🚗</span> Get Directions
                      </button>
                      <button
                        onClick={() => handleOpenOSM(alert.location)}
                        className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center justify-center"
                      >
                        <span className="mr-1">🔍</span> OpenStreetMap
                      </button>
                      <button
                        onClick={() => {
                          if (alert.location) {
                            const lat = alert.location.latitude || alert.location.lat;
                            const lng = alert.location.longitude || alert.location.lng;
                            navigator.clipboard.writeText(`${lat},${lng}`);
                            alert('Coordinates copied to clipboard!');
                          }
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm font-medium transition duration-200 flex items-center justify-center"
                      >
                        <span className="mr-1">📋</span> Copy Coords
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Connection Status Bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className={`p-3 rounded-lg border ${getStatusColor()} flex justify-between items-center`}>
            <div className="flex items-center space-x-4">
              <div>
                <span className="font-bold">WebSocket: {getStatusText()}</span>
              </div>
              <div className="text-sm">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded mr-3">
                  👥 Users: {activeConnections}
                </span>
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded mr-3">
                  🚨 Emergencies: {emergencyStats.active} active
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded">
                  ✅ Resolved: {emergencyStats.resolved}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              {socketStatus !== 'connected' && (
                <button
                  onClick={handleReconnect}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition duration-200 flex items-center"
                >
                  <span className="mr-2">🔄</span> Reconnect
                </button>
              )}
              <button
                onClick={handleRefresh}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition duration-200 flex items-center"
                title="Refresh Data"
              >
                <span className="mr-2">⟳</span> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-1 border-b">
            <a
              href="/police/tracker"
              className="px-6 py-4 text-blue-600 border-b-2 border-blue-600 font-semibold hover:bg-blue-50 transition duration-200"
            >
              📍 Geo Tracker
            </a>
            <a
              href="/police/map"
              className="px-6 py-4 text-gray-600 hover:text-blue-600 hover:bg-gray-50 font-semibold transition duration-200"
            >
              🗺️ Live Emergency Map
            </a>
            <a
              href="/police/lookup"
              className="px-6 py-4 text-gray-600 hover:text-blue-600 hover:bg-gray-50 font-semibold transition duration-200"
            >
              👤 User Lookup
            </a>
            <a
              href="/police/history"
              className="px-6 py-4 text-gray-600 hover:text-blue-600 hover:bg-gray-50 font-semibold transition duration-200"
            >
              📊 Alert History
            </a>
          </nav>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6 border-t-4 border-red-500">
            <div className="text-3xl font-bold text-red-600">{emergencyStats.active}</div>
            <div className="text-gray-600 font-medium">Active Emergencies</div>
            <div className="text-xs text-gray-500 mt-2">Requires immediate attention</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border-t-4 border-yellow-500">
            <div className="text-3xl font-bold text-yellow-600">{emergencyStats.acknowledged}</div>
            <div className="text-gray-600 font-medium">Acknowledged</div>
            <div className="text-xs text-gray-500 mt-2">Response team dispatched</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border-t-4 border-green-500">
            <div className="text-3xl font-bold text-green-600">{emergencyStats.resolved}</div>
            <div className="text-gray-600 font-medium">Resolved</div>
            <div className="text-xs text-gray-500 mt-2">Emergency handled</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border-t-4 border-blue-500">
            <div className="text-3xl font-bold text-blue-600">{activeConnections}</div>
            <div className="text-gray-600 font-medium">Connected Users</div>
            <div className="text-xs text-gray-500 mt-2">Active tourist connections</div>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
          <div className="border-b px-6 py-4">
            <h3 className="text-xl font-bold text-gray-800">🗺️ Live Emergency Map</h3>
            <p className="text-gray-600 text-sm">Real-time location tracking of emergencies and tourists</p>
          </div>
          <div className="p-4">
            <LiveGeoMap
              emergencyAlerts={emergencyAlerts}
              connectedClients={connectedClients}
              onEmergencyClick={(alert) => handleOpenMap(alert)}
            />
          </div>
        </div>

        {/* Connected Users Section */}
        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
          <div className="border-b px-6 py-4">
            <h3 className="text-xl font-bold text-gray-800">👥 Connected Tourists</h3>
            <p className="text-gray-600 text-sm">Currently active tourist connections</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectedClients.map(client => (
                <div key={client.id} className="border rounded-lg p-4 hover:bg-gray-50 transition duration-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">
                        Tourist: {client.id.substring(0, 20)}...
                      </p>
                      <p className="text-sm text-gray-600">
                        Connected: {new Date(client.connectedAt).toLocaleTimeString()}
                      </p>
                      {client.location && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">
                            📍 {client.location.latitude?.toFixed(6) || client.location.lat?.toFixed(6)},
                            {client.location.longitude?.toFixed(6) || client.location.lng?.toFixed(6)}
                          </p>
                          <button
                            onClick={() => handleOpenOSM(client.location)}
                            className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                          >
                            View in Maps →
                          </button>
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
                <div className="col-span-3 text-center py-8 text-gray-500">
                  No tourists currently connected
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Alerts History */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b px-6 py-4">
            <h3 className="text-xl font-bold text-gray-800">📊 Emergency Alerts History</h3>
            <p className="text-gray-600 text-sm">All emergency alerts with status tracking</p>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tourist ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {emergencyAlerts.map(alert => (
                    <tr key={alert.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(alert.timestamp).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleTimeString()}
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
                          onMapClick={handleOpenMap}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {alert.data?.emergencyType || 'General'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${alert.status === 'active'
                            ? 'bg-red-100 text-red-800 animate-pulse'
                            : alert.status === 'acknowledged'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                          {alert.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          {alert.location && (
                            <button
                              onClick={() => handleOpenMap(alert)}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                            >
                              🗺️ Map
                            </button>
                          )}
                          {alert.status === 'active' && (
                            <button
                              onClick={() => acknowledgeAlert(alert.id)}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                            >
                              ✅ Ack
                            </button>
                          )}
                          {alert.status !== 'resolved' && (
                            <button
                              onClick={() => resolveAlert(alert.id)}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700"
                            >
                              ✓ Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {emergencyAlerts.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        No emergency alerts yet. All clear! 🎉
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-6 mt-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold">🚓 Police Emergency Response System</h4>
              <p className="text-gray-400 text-sm mt-1">Real-time monitoring & dispatch</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {emergencyStats.active} active emergencies • {activeConnections} connected users
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Police;