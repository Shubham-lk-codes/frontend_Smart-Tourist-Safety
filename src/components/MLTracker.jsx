// src/components/MLTracker.jsx
import React, { useState, useEffect, useRef } from 'react';

const MLTracker = ({ touristId }) => {
  const [location, setLocation] = useState(null);
  const [anomalyData, setAnomalyData] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [mlAlerts, setMlAlerts] = useState([]);
  const [mlStatus, setMlStatus] = useState('idle');
  const [locationError, setLocationError] = useState(null);
  const trackingInterval = useRef(null);

  // Backend URLs
  const BACKEND_URL = 'http://localhost:3000';
  const ML_API_URL = 'http://localhost:5001';

  // Get current location with better error handling
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setLocationError('Geolocation not supported by your browser');
        const defaultLocation = {
          latitude: 28.6139,
          longitude: 77.2090,
          accuracy: 1000,
          timestamp: new Date().toISOString()
        };
        setLocation(defaultLocation);
        resolve(defaultLocation);
        return;
      }

      const options = {
        enableHighAccuracy: false, // Changed from true to false for faster results
        timeout: 5000, // Reduced from 10000 to 5000
        maximumAge: 30000 // Allow cached location (30 seconds old)
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
          setLocationError(null);
          resolve(locationData);
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage = '';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Using default location.';
              break;
            default:
              errorMessage = 'Unknown error getting location.';
          }
          
          setLocationError(errorMessage);
          
          // Default location (Delhi) as fallback
          const defaultLocation = {
            latitude: 28.6139,
            longitude: 77.2090,
            accuracy: 1000,
            timestamp: new Date().toISOString(),
            isSimulated: true
          };
          setLocation(defaultLocation);
          resolve(defaultLocation);
        },
        options
      );
    });
  };

  // Send location to ML model for anomaly detection
  const detectAnomaly = async (locationData) => {
    if (!touristId || !locationData) return;

    try {
      setMlStatus('processing');
      
      const response = await fetch(`${BACKEND_URL}/api/ml/detect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tourist_id: touristId,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          timestamp: Date.now() / 1000
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('🤖 ML Detection result:', result);
        setAnomalyData(result.result || result);
        
        // Check if anomaly was detected
        if (result.result?.is_anomalous || result?.is_anomalous) {
          const alertData = result.result || result;
          setMlAlerts(prev => [{
            id: Date.now(),
            message: alertData.alerts?.[0] || 'Anomaly detected',
            timestamp: new Date().toISOString(),
            location: locationData,
            anomaly_score: alertData.anomaly_score || 0,
            type: 'ML_ANOMALY'
          }, ...prev.slice(0, 9)]);
        }
        
        setMlStatus('success');
      } else {
        throw new Error(result.error || 'ML detection failed');
      }
    } catch (error) {
      console.error('❌ ML Detection error:', error);
      setMlStatus('error');
    }
  };

  // Check ML service status
  const checkMLStatus = async () => {
    try {
      const response = await fetch(`${ML_API_URL}/health`);
      const data = await response.json();
      console.log('🤖 ML Service Status:', data.status);
      return data.status === 'healthy';
    } catch (error) {
      console.log('❌ ML Service not available:', error.message);
      return false;
    }
  };

  // Start continuous tracking
  const startTracking = async () => {
    if (isTracking) return;
    
    const mlAvailable = await checkMLStatus();
    if (!mlAvailable) {
      alert('ML Service is not available. Anomaly detection will be limited.');
    }

    setIsTracking(true);
    
    // Initial location and detection
    const initialLocation = await getCurrentLocation();
    await detectAnomaly(initialLocation);
    
    // Start periodic tracking
    trackingInterval.current = setInterval(async () => {
      const currentLocation = await getCurrentLocation();
      await detectAnomaly(currentLocation);
    }, 30000); // Every 30 seconds
    
    console.log('📍 Tracking started');
  };

  // Stop tracking
  const stopTracking = () => {
    setIsTracking(false);
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
      trackingInterval.current = null;
    }
    setMlStatus('idle');
    console.log('📍 Tracking stopped');
  };

  // Handle manual anomaly detection
  const handleManualDetection = async () => {
    const currentLocation = await getCurrentLocation();
    await detectAnomaly(currentLocation);
  };

  // Simulate anomaly (for testing)
  const simulateAnomaly = async () => {
    console.log('🧪 Simulating anomaly...');
    
    // Use current location if available, otherwise use default
    const currentLocation = location || {
      latitude: 28.6139,
      longitude: 77.2090,
      accuracy: 50,
      timestamp: new Date().toISOString()
    };

    try {
      // Call simulation endpoint
      const response = await fetch(`${BACKEND_URL}/api/ml/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tourist_id: touristId || 'test_tourist'
        })
      });

      const result = await response.json();
      console.log('🧪 Simulation result:', result);
      
      if (result.success) {
        alert('🚨 Anomaly simulated successfully! Police have been notified.');
        // Update anomaly data with simulation result
        setAnomalyData(result.result);
        
        // Add to alerts
        if (result.result?.alerts?.length > 0) {
          setMlAlerts(prev => [{
            id: Date.now(),
            message: result.result.alerts[0],
            timestamp: new Date().toISOString(),
            location: currentLocation,
            anomaly_score: result.result.anomaly_score || 0,
            type: 'SIMULATED_ANOMALY'
          }, ...prev.slice(0, 9)]);
        }
      }
    } catch (error) {
      console.error('Simulation error:', error);
      
      // Fallback simulation
      const simulatedData = {
        tourist_id: touristId || 'test_tourist',
        anomaly_score: 0.9,
        is_anomalous: true,
        alerts: ['🚨 SIMULATED: High speed anomaly detected (25 m/s)'],
        location: currentLocation,
        timestamp: new Date().toISOString(),
        phone_status: 'online',
        speed: 25.0
      };
      
      setAnomalyData(simulatedData);
      alert('🚨 Simulation completed! (Using fallback)');
    }
  };

  // Request location permission explicitly
  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    
    // Try to get location once to trigger permission prompt
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationError(null);
        alert('✅ Location permission granted!');
      },
      (error) => {
        alert(`❌ Location permission denied: ${error.message}`);
        setLocationError('Permission denied. Please enable location access in browser settings.');
      },
      { enableHighAccuracy: false, timeout: 3000 }
    );
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }
    };
  }, []);

  return (
    <div className="ml-tracker-container bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <span className="mr-2">🤖</span> ML Anomaly Detection
        </h2>
        <p className="text-gray-600">AI-powered safety monitoring</p>
      </div>

      {/* Location Status */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <span className="font-semibold text-blue-700">📍 Current Location:</span>
            {location ? (
              <span className="ml-2 text-gray-700">
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                {location.isSimulated && <span className="ml-2 text-yellow-600 text-sm">(Simulated)</span>}
              </span>
            ) : (
              <span className="ml-2 text-gray-500">Getting location...</span>
            )}
          </div>
          <button
            onClick={requestLocationPermission}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Enable Location
          </button>
        </div>
        
        {locationError && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
            ⚠️ {locationError}
          </div>
        )}
      </div>

      {/* Status Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-500">ML Status</div>
          <div className={`text-lg font-bold ${mlStatus === 'success' ? 'text-green-600' : 
            mlStatus === 'error' ? 'text-red-600' : 
            mlStatus === 'processing' ? 'text-yellow-600' : 'text-gray-600'}`}>
            {mlStatus === 'success' ? '✅ Active' : 
             mlStatus === 'error' ? '❌ Error' : 
             mlStatus === 'processing' ? '🔄 Processing' : '🟡 Idle'}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-500">Tracking</div>
          <div className={`text-lg font-bold ${isTracking ? 'text-green-600' : 'text-red-600'}`}>
            {isTracking ? '🟢 Active' : '🔴 Stopped'}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm font-medium text-gray-500">Alerts</div>
          <div className="text-lg font-bold text-red-600">
            {mlAlerts.length} Detected
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={isTracking ? stopTracking : startTracking}
          className={`px-6 py-3 rounded-lg font-semibold transition duration-200 ${
            isTracking 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isTracking ? (
            <>
              <span className="mr-2">⏸️</span> Stop Tracking
            </>
          ) : (
            <>
              <span className="mr-2">▶️</span> Start Tracking
            </>
          )}
        </button>

        <button
          onClick={handleManualDetection}
          disabled={mlStatus === 'processing'}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition duration-200 disabled:opacity-50"
        >
          <span className="mr-2">🔍</span> Detect Now
        </button>

        <button
          onClick={simulateAnomaly}
          className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition duration-200"
        >
          <span className="mr-2">🧪</span> Simulate Anomaly
        </button>
      </div>

      {/* Current Status */}
      {anomalyData && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-bold text-blue-800 mb-2">Current Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <div className="text-sm text-blue-600">Anomaly Score</div>
              <div className={`text-xl font-bold ${anomalyData.anomaly_score > 0.5 ? 'text-red-600' : 'text-green-600'}`}>
                {anomalyData.anomaly_score?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div>
              <div className="text-sm text-blue-600">Status</div>
              <div className={`text-xl font-bold ${anomalyData.is_anomalous ? 'text-red-600' : 'text-green-600'}`}>
                {anomalyData.is_anomalous ? '🚨 Anomalous' : '✅ Normal'}
              </div>
            </div>
            <div>
              <div className="text-sm text-blue-600">Phone Status</div>
              <div className="text-xl font-bold text-gray-700">
                {anomalyData.phone_status || 'online'}
              </div>
            </div>
            <div>
              <div className="text-sm text-blue-600">History Size</div>
              <div className="text-xl font-bold text-gray-700">
                {anomalyData.history_size || anomalyData.buffer_size || 0} points
              </div>
            </div>
          </div>
          
          {anomalyData.alerts && anomalyData.alerts.length > 0 && (
            <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
              <div className="font-semibold text-red-700 mb-1">Alerts:</div>
              {anomalyData.alerts.map((alert, index) => (
                <div key={index} className="text-red-600 text-sm">
                  • {alert}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ML Alerts History */}
      <div>
        <h3 className="font-bold text-gray-800 mb-3">Recent ML Alerts</h3>
        {mlAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            <div className="text-3xl mb-2">🎉</div>
            <p>No anomalies detected</p>
            <p className="text-sm">All movements appear normal</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {mlAlerts.map((alert) => (
              <div key={alert.id} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-red-700">
                      {alert.type === 'SIMULATED_ANOMALY' ? '🧪 SIMULATED' : '🚨 ML'} ALERT
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">
                    Score: {alert.anomaly_score?.toFixed(2) || 'N/A'}
                  </div>
                </div>
                <p className="text-red-600 mb-2">{alert.message}</p>
                {alert.location && (
                  <div className="text-xs text-gray-500">
                    📍 {alert.location.latitude.toFixed(4)}, {alert.location.longitude.toFixed(4)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Information Panel */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-bold text-gray-700 mb-2">How ML Detection Works:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <span className="font-semibold">Speed Analysis:</span> Detects unusually high movement speeds</li>
          <li>• <span className="font-semibold">Pattern Recognition:</span> Identifies erratic movement patterns</li>
          <li>• <span className="font-semibold">Stationary Detection:</span> Flags prolonged stationary periods</li>
          <li>• <span className="font-semibold">Geofence Integration:</span> Works with your existing geofence system</li>
          <li>• <span className="font-semibold">Real-time Alerts:</span> Automatically notifies police of anomalies</li>
        </ul>
        <div className="mt-3 text-xs text-gray-500">
          <p>💡 <strong>Note:</strong> If location fails, simulated Delhi location will be used for testing.</p>
          <p>🔧 <strong>Fix Location:</strong> Enable location permission in browser settings.</p>
        </div>
      </div>
    </div>
  );
};

export default MLTracker;