import React, { useState, useEffect, useRef } from 'react';
import GeoFenceTracker from '../components/GeoFenceTracker';
import LiveGeoMap from '../components/LiveGeoMap';
import UserLookup from '../components/UserLookup';

function Police() {
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [activeConnections, setActiveConnections] = useState(0);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // WebSocket connection with proper error handling and reconnection
  const connectWebSocket = () => {
    try {
      console.log('🔄 Connecting to WebSocket...');
      setSocketStatus('connecting');
      
      const ws = new WebSocket('ws://localhost:3000');
      
      ws.onopen = () => {
        console.log('🔗 Police WebSocket Connected');
        setSocketStatus('connected');
        setReconnectAttempts(0);
        socketRef.current = ws;
        
        // Identify as police user immediately after connection
        ws.send(JSON.stringify({
          type: 'identify_user',
          userType: 'police'
        }));
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
              
            case 'user_connected':
              setActiveConnections(prev => prev + 1);
              break;
              
            case 'user_disconnected':
              setActiveConnections(prev => Math.max(0, prev - 1));
              break;
              
            case 'health_check':
              setActiveConnections(data.userCount || 0);
              break;
              
            case 'connection_established':
              console.log('✅ Connection established with server');
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
        
        // Auto-reconnect with exponential backoff
        if (reconnectAttempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`🔄 Reconnecting in ${delay/1000} seconds... (Attempt ${reconnectAttempts + 1})`);
          
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

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();

    // Cleanup on component unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Handle emergency alerts
  const handleEmergencyAlert = (alertData) => {
    const newAlert = {
      id: alertData.id || Date.now() + Math.random(),
      type: 'emergency',
      userId: alertData.clientId || alertData.userId || 'unknown',
      location: alertData.location || alertData.data?.location,
      timestamp: alertData.timestamp || new Date().toISOString(),
      status: 'active',
      acknowledged: false
    };

    setEmergencyAlerts(prev => [newAlert, ...prev]);
    
    // Play emergency sound
    playEmergencySound();
    
    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification('🚨 EMERGENCY ALERT', {
        body: `Tourist in distress at location`,
        icon: '/emergency-icon.png',
        requireInteraction: true
      });
    }
  };

  // Play emergency sound
  const playEmergencySound = () => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
    } catch (error) {
      console.log('Audio context not supported:', error);
    }
  };

  // Acknowledge emergency alert
  const acknowledgeAlert = (alertId) => {
    setEmergencyAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true, status: 'acknowledged' }
          : alert
      )
    );

    // Send acknowledgment back to server
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
  const resolveAlert = (alertId) => {
    setEmergencyAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'resolved', resolvedAt: new Date().toISOString() }
          : alert
      )
    );
  };

  // Manual reconnect
  const handleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setReconnectAttempts(0);
    connectWebSocket();
  };

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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
      {/* Police Header with Emergency Alerts */}
      <div className="bg-blue-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">🚓 Police Dashboard</h1>
              <p className="text-blue-200">Real-time Emergency Monitoring System</p>
            </div>
            
            <div className="text-right">
              <div className="text-sm">
                <span className="bg-green-500 text-white px-2 py-1 rounded">
                  👥 {activeConnections} Active Users
                </span>
              </div>
              <div className="text-sm mt-1">
                <span className={`px-2 py-1 rounded ${
                  emergencyAlerts.filter(a => a.status === 'active').length > 0 
                    ? 'bg-red-500 animate-pulse' 
                    : 'bg-gray-500'
                }`}>
                  🚨 {emergencyAlerts.filter(a => a.status === 'active').length} Active Emergencies
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Alerts Panel */}
      {emergencyAlerts.length > 0 && (
        <div className="bg-red-50 border-b-4 border-red-500">
          <div className="container mx-auto px-4 py-3">
            <h3 className="text-lg font-bold text-red-800 mb-2">🚨 Active Emergency Alerts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {emergencyAlerts
                .filter(alert => alert.status === 'active')
                .map(alert => (
                  <div key={alert.id} className="bg-white border-l-4 border-red-500 p-3 rounded shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-red-700">Emergency Alert</p>
                        <p className="text-sm text-gray-600">User: {alert.userId}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </p>
                        {alert.location && (
                          <p className="text-xs text-gray-600">
                            📍 Lat: {alert.location.latitude?.toFixed(4)}, Lng: {alert.location.longitude?.toFixed(4)}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                        >
                          Ack
                        </button>
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-1">
            <a 
              href="/police/tracker" 
              className="px-4 py-3 text-blue-600 border-b-2 border-blue-600 font-medium"
            >
              📍 Geo Tracker
            </a>
            <a 
              href="/police/map" 
              className="px-4 py-3 text-gray-600 hover:text-blue-600 font-medium"
            >
              🗺️ Live Map
            </a>
            <a 
              href="/police/lookup" 
              className="px-4 py-3 text-gray-600 hover:text-blue-600 font-medium"
            >
              👤 User Lookup
            </a>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* WebSocket Status */}
        <div className={`mb-4 p-3 rounded flex justify-between items-center ${getStatusColor()}`}>
          <div>
            <span className="font-semibold">WebSocket: {getStatusText()}</span> | 
            Active Users: {activeConnections} | 
            Emergency Alerts: {emergencyAlerts.length} |
            Reconnect Attempts: {reconnectAttempts}
          </div>
          {socketStatus !== 'connected' && (
            <button
              onClick={handleReconnect}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 ml-4"
            >
              🔄 Reconnect
            </button>
          )}
        </div>

        {/* Dashboard Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
            <LiveGeoMap emergencyAlerts={emergencyAlerts} />
          </div>
          <div>
            <GeoFenceTracker />
          </div>
          <div>
            <UserLookup />
          </div>
        </div>

        {/* Emergency Alerts History */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Emergency Alerts History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Time</th>
                  <th className="px-4 py-2 text-left">User ID</th>
                  <th className="px-4 py-2 text-left">Location</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {emergencyAlerts.map(alert => (
                  <tr key={alert.id} className="border-b">
                    <td className="px-4 py-2">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2 font-mono text-sm">{alert.userId}</td>
                    <td className="px-4 py-2 text-xs">
                      {alert.location ? 
                        `${alert.location.latitude?.toFixed(4)}, ${alert.location.longitude?.toFixed(4)}` 
                        : 'N/A'
                      }
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        alert.status === 'active' ? 'bg-red-100 text-red-800' :
                        alert.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {alert.status === 'active' && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 mr-2"
                        >
                          Acknowledge
                        </button>
                      )}
                      {alert.status !== 'resolved' && (
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {emergencyAlerts.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-4 text-center text-gray-500">
                      No emergency alerts yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Police;