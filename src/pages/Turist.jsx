

// // src/components/Tourist.jsx (Updated)
// import React, { useState, useEffect, useRef } from 'react';
// import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
// import GeoFenceTracker from '../components/GeoFenceTracker';
// import LiveGeoMap from '../components/LiveGeoMap';
// import SafetyMap from '../components/SafetyMap';
// import GeofenceList from '../components/GeofenceList';
// import UserRegistration from '../components/UserRegistration';
// import MLTracker from '../components/MLTracker'; // Import ML Tracker

// function Tourist() {
//   const [panicStatus, setPanicStatus] = useState(false);
//   const [location, setLocation] = useState(null);
//   const [socket, setSocket] = useState(null);
//   const [emergencySent, setEmergencySent] = useState(false);
//   const [emergencyDetails, setEmergencyDetails] = useState(null);
//   const [socketStatus, setSocketStatus] = useState('disconnected');
//   const [activeTab, setActiveTab] = useState('tracker'); // Add active tab state
//   const socketRef = useRef(null);
//   const navigate = useNavigate();

//   // Generate tourist ID if not exists
//   const [touristId, setTouristId] = useState(() => {
//     // Try to get from localStorage or generate new
//     const savedId = localStorage.getItem('tourist_id');
//     if (savedId) return savedId;
    
//     const newId = `tourist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//     localStorage.setItem('tourist_id', newId);
//     return newId;
//   });

//   // WebSocket connection setup (unchanged)
//   useEffect(() => {
//     const connectWebSocket = () => {
//       try {
//         const ws = new WebSocket(`ws://${window.location.hostname}:3000`);
        
//         ws.onopen = () => {
//           console.log('🔗 Tourist WebSocket Connected');
//           setSocketStatus('connected');
//           setSocket(ws);
//           socketRef.current = ws;
          
//           // Identify as tourist user
//           ws.send(JSON.stringify({
//             type: 'identify_user',
//             userType: 'tourist',
//             touristId: touristId // Send tourist ID
//           }));
//         };

//         ws.onmessage = (event) => {
//           try {
//             const data = JSON.parse(event.data);
//             console.log('📨 Tourist received:', data.type);

//             switch (data.type) {
//               case 'panic_acknowledged':
//                 setEmergencyDetails(prev => ({
//                   ...prev,
//                   acknowledged: true,
//                   acknowledgedBy: data.acknowledgedBy,
//                   acknowledgedAt: data.timestamp
//                 }));
//                 break;
                
//               case 'emergency_acknowledged_by_authority':
//                 alert('✅ Police have acknowledged your emergency and are on the way!');
//                 break;

//               case 'ml_alert': // Handle ML alerts from backend
//                 console.log('🤖 Received ML Alert:', data);
//                 if (data.alert && data.alert.type === 'ml_anomaly') {
//                   alert(`🚨 ML ALERT: ${data.alert.data?.message || 'Anomaly detected!'}`);
//                 }
//                 break;
                
//               case 'connection_established':
//                 console.log('✅ WebSocket connection established');
//                 break;
                
//               case 'pong':
//                 // Handle ping-pong for connection health
//                 break;
                
//               default:
//                 console.log('Received:', data);
//             }
//           } catch (error) {
//             console.error('Error parsing WebSocket message:', error);
//           }
//         };

//         ws.onclose = (event) => {
//           console.log('🔴 Tourist WebSocket Disconnected');
//           setSocketStatus('disconnected');
//           socketRef.current = null;
          
//           // Auto-reconnect after 3 seconds
//           setTimeout(() => {
//             console.log('🔄 Attempting to reconnect...');
//             connectWebSocket();
//           }, 3000);
//         };

//         ws.onerror = (error) => {
//           console.error('💥 Tourist WebSocket error:', error);
//           setSocketStatus('error');
//         };

//       } catch (error) {
//         console.error('💥 Failed to create WebSocket:', error);
//         setSocketStatus('error');
//       }
//     };

//     connectWebSocket();

//     // Cleanup
//     return () => {
//       if (socketRef.current) {
//         socketRef.current.close();
//       }
//     };
//   }, [touristId]);

//   // Get current location with better error handling
//   const getCurrentLocation = () => {
//     return new Promise((resolve, reject) => {
//       if (!navigator.geolocation) {
//         reject(new Error('Geolocation not supported'));
//         return;
//       }

//       const options = {
//         enableHighAccuracy: true,
//         timeout: 10000,
//         maximumAge: 0
//       };

//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const locationData = {
//             latitude: position.coords.latitude,
//             longitude: position.coords.longitude,
//             accuracy: position.coords.accuracy,
//             timestamp: new Date().toISOString()
//           };
//           setLocation(locationData);
//           resolve(locationData);
//         },
//         (error) => {
//           console.error('Error getting location:', error);
          
//           // Default location (Delhi) if permission denied
//           const defaultLocation = {
//             latitude: 28.6139,
//             longitude: 77.2090,
//             accuracy: 1000,
//             timestamp: new Date().toISOString()
//           };
//           setLocation(defaultLocation);
//           resolve(defaultLocation);
//         },
//         options
//       );
//     });
//   };

//   // Panic Button Handler - Updated with ML integration
//   const handlePanicButton = async () => {
//     if (panicStatus) {
//       alert('Emergency already sent. Help is on the way!');
//       return;
//     }

//     setPanicStatus(true);
//     setEmergencySent(false);

//     try {
//       // Get current location
//       const currentLocation = await getCurrentLocation();
      
//       const emergencyData = {
//         userId: touristId, // Use the stored tourist ID
//         location: currentLocation,
//         timestamp: new Date().toISOString(),
//         emergencyType: 'general',
//         message: 'Need immediate help!'
//       };

//       // Store emergency details for display
//       setEmergencyDetails({
//         id: `emergency_${Date.now()}`,
//         userId: touristId,
//         location: currentLocation,
//         timestamp: new Date().toISOString(),
//         status: 'active',
//         acknowledged: false
//       });

//       // Send via WebSocket (real-time)
//       if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
//         const panicData = {
//           type: 'panic_alert',
//           data: {
//             userId: touristId,
//             location: currentLocation,
//             timestamp: new Date().toISOString(),
//             emergencyType: 'general',
//             message: 'Need immediate help!'
//           }
//         };
//         socketRef.current.send(JSON.stringify(panicData));
//         console.log('📡 Emergency sent via WebSocket');
//       } else {
//         console.warn('WebSocket not connected, sending via HTTP only');
//       }

//       // Send via HTTP POST to backend API
//       const response = await fetch('http://localhost:3000/api/emergencies/panic-alert', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(emergencyData)
//       });

//       const result = await response.json();
      
//       if (response.ok) {
//         console.log('✅ Emergency alert sent successfully:', result);
//         setEmergencySent(true);
        
//         // Show success message
//         alert(`🚨 Emergency Alert Sent!\nAlert ID: ${result.alertId}\nPolice have been notified. Stay calm and wait for help.`);
        
//         // Update emergency details with server ID
//         setEmergencyDetails(prev => ({
//           ...prev,
//           id: result.alertId,
//           serverResponse: result
//         }));
//       } else {
//         throw new Error(result.error || 'Failed to send emergency alert');
//       }

//     } catch (error) {
//       console.error('❌ Error sending panic alert:', error);
//       alert(`Failed to send emergency alert: ${error.message}\nPlease try again or call emergency services directly.`);
      
//       // Reset panic status on error
//       setTimeout(() => {
//         setPanicStatus(false);
//         setEmergencySent(false);
//       }, 2000);
//     }

//     // Auto reset after 30 seconds
//     setTimeout(() => {
//       setPanicStatus(false);
//       setEmergencySent(false);
//       setEmergencyDetails(null);
//     }, 30000);
//   };

//   // Cancel emergency
//   const cancelEmergency = () => {
//     if (emergencyDetails && window.confirm('Are you sure you want to cancel the emergency alert?')) {
//       setPanicStatus(false);
//       setEmergencySent(false);
//       setEmergencyDetails(null);
//       alert('Emergency alert cancelled.');
//     }
//   };

//   const getStatusColor = () => {
//     switch (socketStatus) {
//       case 'connected': return 'bg-green-100 text-green-800';
//       case 'connecting': return 'bg-yellow-100 text-yellow-800';
//       case 'error': return 'bg-red-100 text-red-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getStatusText = () => {
//     switch (socketStatus) {
//       case 'connected': return '🟢 Connected';
//       case 'connecting': return '🟡 Connecting...';
//       case 'error': return '🔴 Connection Error';
//       default: return '⚫ Disconnected';
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header with Panic Button */}
//       <div className="bg-white shadow-sm border-b">
//         <div className="container mx-auto px-4 py-4">
//           <div className="flex justify-between items-center">
//             <div>
//               <h2 className="text-2xl font-bold text-gray-800">Tourist Safety Dashboard</h2>
//               <div className="flex items-center mt-1">
//                 <span className={`text-xs px-2 py-1 rounded ${getStatusColor()}`}>
//                   {getStatusText()}
//                 </span>
//                 <span className="ml-2 text-xs text-gray-600">
//                   📍 {location ? `Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Getting location...'}
//                 </span>
//                 <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
//                   ID: {touristId.substring(0, 10)}...
//                 </span>
//               </div>
//             </div>
            
//             {/* Panic Button */}
//             <div className="flex flex-col items-end">
//               <button
//                 onClick={handlePanicButton}
//                 disabled={panicStatus}
//                 className={`px-8 py-4 rounded-full font-bold text-white text-lg shadow-lg transform transition-all duration-200 flex items-center justify-center ${
//                   panicStatus 
//                     ? 'bg-red-600 animate-pulse scale-110' 
//                     : 'bg-red-500 hover:bg-red-600 hover:scale-105 active:scale-95'
//                 }`}
//               >
//                 {panicStatus ? (
//                   <>
//                     <span className="mr-2">🚨</span>
//                     HELP IS COMING!
//                   </>
//                 ) : (
//                   <>
//                     <span className="mr-2">⚠️</span>
//                     EMERGENCY
//                   </>
//                 )}
//               </button>
              
//               {panicStatus && (
//                 <button
//                   onClick={cancelEmergency}
//                   className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
//                 >
//                   Cancel Emergency
//                 </button>
//               )}
//             </div>
//           </div>

//           {/* Navigation Tabs */}
//           <div className="mt-4">
//             <div className="flex flex-wrap gap-1 border-b">
//               {/* <button 
//                 onClick={() => setActiveTab('tracker')}
//                 className={`px-4 py-2 rounded-t-lg transition duration-200 flex items-center ${activeTab === 'tracker' ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
//               >
//                 📍 Location Tracker
//               </button> */}
//               <button 
//                 onClick={() => setActiveTab('map')}
//                 className={`px-4 py-2 rounded-t-lg transition duration-200 flex items-center ${activeTab === 'map' ? 'bg-green-100 text-green-700 border-b-2 border-green-600' : 'text-gray-600 hover:bg-gray-100'}`}
//               >
//                  Live Map
//               </button>
//               <button 
//                 onClick={() => setActiveTab('safety')}
//                 className={`px-4 py-2 rounded-t-lg transition duration-200 flex items-center ${activeTab === 'safety' ? 'bg-purple-100 text-purple-700 border-b-2 border-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
//               >
//                  Safety zones and Emergency
//               </button>
//               <button 
//                 onClick={() => setActiveTab('ml')}
//                 className={`px-4 py-2 rounded-t-lg transition duration-200 flex items-center ${activeTab === 'ml' ? 'bg-orange-100 text-orange-700 border-b-2 border-orange-600' : 'text-gray-600 hover:bg-gray-100'}`}
//               >
//                  ML Detection
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Emergency Status Panel */}
//       {panicStatus && (
//         <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
//           <div className="container mx-auto">
//             <div className="flex items-start">
//               <div className="flex-shrink-0">
//                 <span className="text-red-500 text-2xl">🚨</span>
//               </div>
//               <div className="ml-3 flex-grow">
//                 <h3 className="font-bold text-red-800">EMERGENCY ALERT SENT!</h3>
//                 <p className="text-red-700">
//                   Police and rescue team have been notified. Stay calm and wait for help.
//                 </p>
                
//                 {emergencyDetails && (
//                   <div className="mt-2 text-sm bg-red-100 p-2 rounded">
//                     <p><strong>Alert ID:</strong> {emergencyDetails.id}</p>
//                     <p><strong>Time:</strong> {new Date(emergencyDetails.timestamp).toLocaleTimeString()}</p>
//                     <p><strong>Location:</strong> 
//                       {emergencyDetails.location ? 
//                         ` ${emergencyDetails.location.latitude.toFixed(4)}, ${emergencyDetails.location.longitude.toFixed(4)}` 
//                         : ' Getting location...'}
//                     </p>
//                     <p><strong>Status:</strong> 
//                       <span className={`ml-1 px-2 py-1 rounded text-xs ${
//                         emergencyDetails.acknowledged ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
//                       }`}>
//                         {emergencyDetails.acknowledged ? 'Acknowledged by Police' : 'Waiting for response'}
//                       </span>
//                     </p>
//                   </div>
//                 )}
//               </div>
//               <div className="flex-shrink-0">
//                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Connection Status */}
//       {socketStatus !== 'connected' && (
//         <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-4">
//           <div className="container mx-auto flex justify-between items-center">
//             <div className="flex items-center">
//               <span className="text-yellow-500">⚠️</span>
//               <span className="ml-2 text-yellow-700">
//                 {socketStatus === 'connecting' ? 'Connecting to emergency services...' : 
//                  socketStatus === 'error' ? 'Connection error. Emergency alerts may be delayed.' : 
//                  'Disconnected. Trying to reconnect...'}
//               </span>
//             </div>
//             <button
//               onClick={() => window.location.reload()}
//               className="text-sm text-yellow-700 underline hover:text-yellow-900"
//             >
//               Retry Connection
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Main Content Area */}
//       <div className="container mx-auto px-4 py-6">
//         {/* Tab Content */}
//         {activeTab === 'tracker' && <GeoFenceTracker />}
//         {activeTab === 'map' && <LiveGeoMap />}
//         {activeTab === 'safety' && <SafetyMap />}
//         {activeTab === 'ml' && <MLTracker touristId={touristId} />}
        
//         {/* Always show these components at the bottom */}
//         {/* <div className="mt-8">
//           <GeofenceList />
//         </div> */}
//         {/* <div className="mt-6">
//           <UserRegistration />
//         </div> */}
//       </div>

//       {/* Emergency Instructions Footer */}
//       <div className="bg-gray-800 text-white p-4 mt-8">
//         <div className="container mx-auto text-center text-sm">
//           <p className="font-bold">EMERGENCY INSTRUCTIONS:</p>
//           <p>1. Press the red button to alert police and emergency services</p>
//           <p>2. Stay where you are if it's safe to do so</p>
//           <p>3. Keep your phone accessible for further instructions</p>
//           <p className="mt-2 text-gray-400">Your location is being shared with authorities</p>
//           <p className="text-xs text-gray-500 mt-2">Tourist ID: {touristId}</p>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Tourist;

// src/components/Tourist.jsx (Updated with Repeating Alerts)
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import GeoFenceTracker from '../components/GeoFenceTracker';
import LiveGeoMap from '../components/LiveGeoMap';
import SafetyMap from '../components/SafetyMap';
import GeofenceList from '../components/GeofenceList';
import UserRegistration from '../components/UserRegistration';
import MLTracker from '../components/MLTracker';

function Tourist() {
  const [panicStatus, setPanicStatus] = useState(false);
  const [location, setLocation] = useState(null);
  const [socket, setSocket] = useState(null);
  const [emergencySent, setEmergencySent] = useState(false);
  const [emergencyDetails, setEmergencyDetails] = useState(null);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [activeTab, setActiveTab] = useState('tracker');
  const [currentZone, setCurrentZone] = useState('safe');
  const [userInteracted, setUserInteracted] = useState(false);
  const [repeatingAlert, setRepeatingAlert] = useState(null); // Track repeating alert
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const alertIntervalRef = useRef(null); // Ref for interval

  // Generate tourist ID if not exists
  const [touristId, setTouristId] = useState(() => {
    const savedId = localStorage.getItem('tourist_id');
    if (savedId) return savedId;
    
    const newId = `tourist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.getItem('tourist_id', newId);
    return newId;
  });

  // Audio files paths
  const audioPaths = {
    unsafe_zone: '/audio/unsafe_zone.wav',
    restricted_zone: '/audio/restricted_zone.wav',
    high_speed: '/audio/high_speed.wav',
    stationary: '/audio/stationary.wav',
    phone_off: '/audio/phone_off.wav',
    test_alert: '/audio/test_alert.wav',
    welcome: '/audio/welcome.wav'
  };

  // Track user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!userInteracted) {
        console.log('✅ User interacted, audio can now play');
        setUserInteracted(true);
      }
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      
      // Cleanup interval on unmount
      if (alertIntervalRef.current) {
        clearInterval(alertIntervalRef.current);
      }
    };
  }, [userInteracted]);

  // Function to play voice alert
  const playVoiceAlert = (alertType) => {
    if (!userInteracted) {
      console.log('⚠️ Waiting for user interaction before playing audio');
      return;
    }

    const audioPath = audioPaths[alertType];
    
    if (!audioPath) {
      console.warn(`⚠️ No audio path found for alert type: ${alertType}`);
      return;
    }

    try {
      const audio = new Audio(audioPath);
      audio.volume = 0.7;
      
      audio.play()
        .then(() => {
          console.log(`🔊 Playing voice alert: ${alertType}`);
          
          const hindiMessages = {
            'unsafe_zone': "चेतावनी! आप असुरक्षित क्षेत्र में प्रवेश कर गए हैं। कृपया अपनी सुरक्षा के लिए तुरंत बाहर निकलें।",
            'restricted_zone': "सतर्क! यह प्रतिबंधित क्षेत्र है। सुरक्षा कारणों से प्रवेश वर्जित है।",
            'high_speed': "खतरा! बहुत तेज गति का पता चला है। कृपया अपनी सुरक्षा के लिए गति कम करें।",
            'stationary': "सावधान! आप बहुत देर से एक ही जगह पर हैं। क्या सब ठीक है?",
            'phone_off': "सूचना! आपका फोन सिग्नल नहीं मिल रहा है। कृपया अपनी स्थिति की जानकारी दें।",
            'test_alert': "यह एक टेस्ट अलर्ट है। आपकी सुरक्षा प्रणाली ठीक से काम कर रही है।",
            'welcome': "स्वागत है! आपकी सुरक्षा प्रणाली सक्रिय है। सुरक्षित रहें।"
          };

          const message = hindiMessages[alertType];
          if (message) {
            showVoiceAlertNotification(message, alertType);
          }
        })
        .catch(error => {
          console.error('❌ Audio playback failed:', error);
        });

    } catch (error) {
      console.error('❌ Error playing voice alert:', error);
    }
  };

  // Start repeating alert every 5 seconds
  const startRepeatingAlert = (alertType) => {
    if (repeatingAlert === alertType) {
      return; // Already repeating this alert
    }
    
    setRepeatingAlert(alertType);
    
    // Play immediately
    playVoiceAlert(alertType);
    
    // Clear any existing interval
    if (alertIntervalRef.current) {
      clearInterval(alertIntervalRef.current);
    }
    
    // Start new interval for repeating alert
    alertIntervalRef.current = setInterval(() => {
      if (userInteracted) {
        playVoiceAlert(alertType);
      }
    }, 5000); // Repeat every 5 seconds
    
    console.log(`🔁 Started repeating ${alertType} alert every 5 seconds`);
  };

  // Stop repeating alert
  const stopRepeatingAlert = () => {
    if (alertIntervalRef.current) {
      clearInterval(alertIntervalRef.current);
      alertIntervalRef.current = null;
      setRepeatingAlert(null);
      console.log('🛑 Stopped repeating alert');
    }
  };

  // Show voice alert notification
  const showVoiceAlertNotification = (message, alertType) => {
    const existingNotification = document.getElementById('voice-alert-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.id = 'voice-alert-notification';
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md animate-fade-in ${
      alertType === 'unsafe_zone' ? 'bg-red-50 border-l-4 border-red-500' :
      alertType === 'restricted_zone' ? 'bg-yellow-50 border-l-4 border-yellow-500' :
      'bg-blue-50 border-l-4 border-blue-500'
    }`;
    
    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <span class="text-xl">🔊</span>
        </div>
        <div class="ml-3">
          <h3 class="font-bold">
            ${alertType === 'unsafe_zone' ? '🚨 Unsafe Zone Alert' :
              alertType === 'restricted_zone' ? '⚠️ Restricted Zone Alert' :
              '🔊 Voice Alert'}
          </h3>
          <p class="mt-1">${message}</p>
          <p class="text-xs mt-2 opacity-75">
            ${repeatingAlert === alertType ? '⏱️ Repeating every 5 seconds' : 'Hindi • Safety Alert'}
          </p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-gray-500 hover:text-gray-700">
          ✕
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 5000);
  };

  // Function to check if user is outside safe zones
  const checkZoneSafety = async (lat, lng) => {
    try {
      const response = await fetch('http://localhost:5001/check-zone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          tourist_id: touristId
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const previousZone = currentZone;
        setCurrentZone(data.zone_type || 'safe');
        
        // Check if user entered unsafe/restricted zone
        if ((data.zone_type === 'unsafe' || data.zone_type === 'restricted') && userInteracted) {
          const alertType = data.zone_type === 'unsafe' ? 'unsafe_zone' : 'restricted_zone';
          
          // If user just entered the zone, start repeating alert
          if (previousZone === 'safe') {
            startRepeatingAlert(alertType);
          }
          // If user is already in the zone, continue repeating
          else if (previousZone === data.zone_type && !repeatingAlert) {
            startRepeatingAlert(alertType);
          }
        } 
        // If user returned to safe zone, stop repeating alert
        else if (data.zone_type === 'safe' && repeatingAlert) {
          stopRepeatingAlert();
        }
        
        return data;
      }
    } catch (error) {
      console.error('Error checking zone safety:', error);
    }
    
    return { zone_type: 'safe' };
  };

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
          
          ws.send(JSON.stringify({
            type: 'identify_user',
            userType: 'tourist',
            touristId: touristId
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

              case 'ml_alert':
                console.log('🤖 Received ML Alert:', data);
                if (data.alert && data.alert.type === 'ml_anomaly' && userInteracted) {
                  const alertMessage = data.alert.data?.message || 'Anomaly detected!';
                  alert(`🚨 ML ALERT: ${alertMessage}`);
                  
                  if (alertMessage.includes('Stationary')) {
                    playVoiceAlert('stationary');
                  } else if (alertMessage.includes('speed')) {
                    playVoiceAlert('high_speed');
                  } else if (alertMessage.includes('signal')) {
                    playVoiceAlert('phone_off');
                  } else if (alertMessage.includes('unsafe') || alertMessage.includes('Unsafe')) {
                    startRepeatingAlert('unsafe_zone');
                    setCurrentZone('unsafe');
                  } else if (alertMessage.includes('restricted') || alertMessage.includes('Restricted')) {
                    startRepeatingAlert('restricted_zone');
                    setCurrentZone('restricted');
                  }
                }
                break;
                
              case 'zone_alert':
                console.log('📍 Zone Alert:', data);
                if ((data.zone_type === 'unsafe' || data.zone_type === 'restricted') && userInteracted) {
                  const alertType = data.zone_type === 'unsafe' ? 'unsafe_zone' : 'restricted_zone';
                  startRepeatingAlert(alertType);
                  setCurrentZone(data.zone_type);
                } else {
                  stopRepeatingAlert();
                  setCurrentZone('safe');
                }
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

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (alertIntervalRef.current) {
        clearInterval(alertIntervalRef.current);
      }
    };
  }, [touristId, userInteracted]);

  // Get current location with zone safety check
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
        async (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          setLocation(locationData);
          
          await checkZoneSafety(locationData.latitude, locationData.longitude);
          
          resolve(locationData);
        },
        (error) => {
          console.error('Error getting location:', error);
          
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

  // Initial location check
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Periodically check location and zone safety
  useEffect(() => {
    const locationCheckInterval = setInterval(async () => {
      try {
        await getCurrentLocation();
      } catch (error) {
        console.error('Periodic location check failed:', error);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(locationCheckInterval);
  }, []);

  // Panic Button Handler
  const handlePanicButton = async () => {
    if (panicStatus) {
      alert('Emergency already sent. Help is on the way!');
      return;
    }

    setPanicStatus(true);
    setEmergencySent(false);

    try {
      const currentLocation = await getCurrentLocation();
      
      const emergencyData = {
        userId: touristId,
        location: currentLocation,
        timestamp: new Date().toISOString(),
        emergencyType: 'general',
        message: 'Need immediate help!',
        current_zone: currentZone,
        zone_alert: currentZone !== 'safe' ? `Tourist is in ${currentZone.toUpperCase()} zone` : null
      };

      setEmergencyDetails({
        id: `emergency_${Date.now()}`,
        userId: touristId,
        location: currentLocation,
        timestamp: new Date().toISOString(),
        status: 'active',
        acknowledged: false,
        current_zone: currentZone
      });

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        const panicData = {
          type: 'panic_alert',
          data: emergencyData
        };
        socketRef.current.send(JSON.stringify(panicData));
        console.log('📡 Emergency sent via WebSocket');
      } else {
        console.warn('WebSocket not connected, sending via HTTP only');
      }

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
        
        let alertMessage = `🚨 Emergency Alert Sent!\nAlert ID: ${result.alertId}\nPolice have been notified. Stay calm and wait for help.`;
        
        if (currentZone !== 'safe') {
          alertMessage += `\n\n⚠️ WARNING: You are currently in a ${currentZone.toUpperCase()} zone.`;
          alertMessage += currentZone === 'unsafe' 
            ? '\nPlease try to move to a safer location if possible.'
            : '\nPlease exit this area immediately if it is safe to do so.';
        }
        
        alert(alertMessage);
        
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
      
      setTimeout(() => {
        setPanicStatus(false);
        setEmergencySent(false);
      }, 2000);
    }

    setTimeout(() => {
      setPanicStatus(false);
      setEmergencySent(false);
      setEmergencyDetails(null);
    }, 30000);
  };

  // Test voice alert button
  const testVoiceAlert = () => {
    if (!userInteracted) {
      alert('Please click anywhere on the page first to enable audio');
      return;
    }
    playVoiceAlert('test_alert');
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

  // Manually stop repeating alert
  const stopAlertButton = () => {
    stopRepeatingAlert();
    setCurrentZone('safe');
    alert('Alerts stopped. Please stay safe.');
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

  const getZoneColor = () => {
    switch (currentZone) {
      case 'safe': return 'bg-green-100 text-green-800';
      case 'unsafe': return 'bg-red-100 text-red-800';
      case 'restricted': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getZoneText = () => {
    switch (currentZone) {
      case 'safe': return '🟢 Safe Zone';
      case 'unsafe': return '🔴 Unsafe Zone';
      case 'restricted': return '🟡 Restricted Zone';
      default: return '⚫ Unknown Zone';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* User Interaction Reminder */}
      {!userInteracted && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-yellow-500">🔊</span>
              <span className="ml-2 text-yellow-700">
                Click anywhere on the page to enable voice alerts
              </span>
            </div>
            <button
              onClick={() => setUserInteracted(true)}
              className="text-sm text-yellow-700 underline hover:text-yellow-900"
            >
              Enable Audio
            </button>
          </div>
        </div>
      )}

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
                <span className={`ml-2 text-xs px-2 py-1 rounded ${getZoneColor()}`}>
                  {getZoneText()}
                </span>
                <span className="ml-2 text-xs text-gray-600">
                  📍 {location ? `Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Getting location...'}
                </span>
                <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  ID: {touristId.substring(0, 10)}...
                </span>
                {repeatingAlert && (
                  <span className="ml-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded animate-pulse">
                    🔊 Repeating Alert Active
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={testVoiceAlert}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 flex items-center"
              >
                <span className="mr-2">🔊</span>
                Test Voice
              </button>
              
              {repeatingAlert && (
                <button
                  onClick={stopAlertButton}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200 flex items-center"
                >
                  <span className="mr-2">🛑</span>
                  Stop Alert
                </button>
              )}
              
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
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap gap-1 border-b">
              <button 
                onClick={() => setActiveTab('tracker')}
                className={`px-4 py-2 rounded-t-lg transition duration-200 flex items-center ${activeTab === 'tracker' ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                📍 Location Tracker
              </button>
              <button 
                onClick={() => setActiveTab('map')}
                className={`px-4 py-2 rounded-t-lg transition duration-200 flex items-center ${activeTab === 'map' ? 'bg-green-100 text-green-700 border-b-2 border-green-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                 Live Map
              </button>
              <button 
                onClick={() => setActiveTab('safety')}
                className={`px-4 py-2 rounded-t-lg transition duration-200 flex items-center ${activeTab === 'safety' ? 'bg-purple-100 text-purple-700 border-b-2 border-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                 Safety zones and Emergency
              </button>
              <button 
                onClick={() => setActiveTab('ml')}
                className={`px-4 py-2 rounded-t-lg transition duration-200 flex items-center ${activeTab === 'ml' ? 'bg-orange-100 text-orange-700 border-b-2 border-orange-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                 ML Detection
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Current Zone Warning */}
      {currentZone !== 'safe' && (
        <div className={`${currentZone === 'unsafe' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'} border-l-4 p-4 mb-4`}>
          <div className="container mx-auto">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className={`text-xl ${currentZone === 'unsafe' ? 'text-red-500' : 'text-yellow-500'}`}>
                  {currentZone === 'unsafe' ? '⚠️' : '🚫'}
                </span>
              </div>
              <div className="ml-3 flex-grow">
                <h3 className="font-bold">
                  {currentZone === 'unsafe' ? 'UNSAFE ZONE ALERT' : 'RESTRICTED ZONE ALERT'}
                </h3>
                <p>
                  {currentZone === 'unsafe' 
                    ? 'You are in an unsafe area. Please exit immediately for your safety.'
                    : 'You are in a restricted area. Entry is prohibited for security reasons.'}
                </p>
                <div className="mt-2">
                  <p className="text-sm">
                    <strong>Voice Alert:</strong> {currentZone === 'unsafe' 
                      ? 'चेतावनी! आप असुरक्षित क्षेत्र में प्रवेश कर गए हैं। कृपया अपनी सुरक्षा के लिए तुरंत बाहर निकलें।'
                      : 'सतर्क! यह प्रतिबंधित क्षेत्र है। सुरक्षा कारणों से प्रवेश वर्जित है।'}
                  </p>
                  {repeatingAlert && (
                    <p className="text-sm text-red-600 mt-1">
                      ⏱️ This alert will repeat every 5 seconds until you leave the zone
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    <p><strong>Zone:</strong> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${getZoneColor()}`}>
                        {getZoneText()}
                      </span>
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

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-6">
        {activeTab === 'tracker' && <GeoFenceTracker />}
        {activeTab === 'map' && <LiveGeoMap />}
        {activeTab === 'safety' && <SafetyMap />}
        {activeTab === 'ml' && <MLTracker touristId={touristId} />}
      </div>

      {/* Emergency Instructions Footer */}
      <div className="bg-gray-800 text-white p-4 mt-8">
        <div className="container mx-auto text-center text-sm">
          <p className="font-bold">EMERGENCY INSTRUCTIONS:</p>
          <p>1. Press the red button to alert police and emergency services</p>
          <p>2. Stay where you are if it's safe to do so</p>
          <p>3. Keep your phone accessible for further instructions</p>
          <p>4. Click anywhere on the page to enable voice alerts</p>
          <p>5. Unsafe zone alerts repeat every 5 seconds until you leave</p>
          <p className="mt-2 text-gray-400">
            {currentZone !== 'safe' 
              ? `⚠️ WARNING: You are in a ${currentZone.toUpperCase()} zone. Voice alert repeating.`
              : '✅ You are in a safe zone.'}
          </p>
          <p className="text-xs text-gray-500 mt-2">Tourist ID: {touristId}</p>
        </div>
      </div>

      <style jsx="true">{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .animate-pulse {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
}

export default Tourist;