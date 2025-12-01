import React, { useState, useEffect, useCallback, useMemo } from 'react';

function SafetyMap() {
  const [safeZones, setSafeZones] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [loading, setLoading] = useState({
    safeZones: true,
    emergencyContacts: true
  });
  const [error, setError] = useState({
    safeZones: null,
    emergencyContacts: null
  });
  const [userLocation, setUserLocation] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);

  // Fix: Hardcode the API URL
  const apiBaseUrl = 'http://localhost:3000';

  // Optimize: Debounce location updates
  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          console.warn('Unable to get location:', err);
          setUserLocation({ lat: 28.6139, lng: 77.2090 });
        },
        { timeout: 10000, maximumAge: 60000 } // Cache location for 1 minute
      );
    }
  }, []);

  const fetchSafeZones = useCallback(async (location = null) => {
    try {
      setLoading(prev => ({ ...prev, safeZones: true }));
      setError(prev => ({ ...prev, safeZones: null }));
      
      let url = `${apiBaseUrl}/api/safe-zones`;
      
      if (location) {
        url = `${apiBaseUrl}/api/safe-zones/nearby?lat=${location.lat}&lng=${location.lng}&radius=20`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch safe zones: ${response.status}`);
      }
      
      const data = await response.json();
      setSafeZones(data);
    } catch (error) {
      console.error('Error fetching safe zones:', error);
      setError(prev => ({ ...prev, safeZones: error.message }));
      
      // Fallback mock data
      setSafeZones([
        {
          _id: '1',
          name: 'Main Police Station',
          address: '123 Safety Street, Tourist District',
          distance: '0.5 km',
          type: 'police_station',
          phone: '100'
        },
        {
          _id: '2',
          name: 'City General Hospital',
          address: '456 Health Avenue, Medical Zone',
          distance: '1.2 km',
          type: 'hospital',
          phone: '102'
        },
        {
          _id: '3',
          name: 'Tourist Information Center',
          address: '789 Tourist Plaza, City Center',
          distance: '0.8 km',
          type: 'tourist_center',
          phone: '1363'
        }
      ]);
    } finally {
      setLoading(prev => ({ ...prev, safeZones: false }));
    }
  }, [apiBaseUrl]);

  const fetchEmergencyContacts = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, emergencyContacts: true }));
      setError(prev => ({ ...prev, emergencyContacts: null }));
      
      const response = await fetch(`${apiBaseUrl}/api/emergency-contacts`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch contacts: ${response.status}`);
      }
      
      const data = await response.json();
      setEmergencyContacts(data);
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      setError(prev => ({ ...prev, emergencyContacts: error.message }));
      
      // Fallback mock data
      setEmergencyContacts([
        {
          _id: '1',
          name: 'Police Emergency',
          phone: '100',
          type: 'police',
          description: 'Police emergency hotline'
        },
        {
          _id: '2',
          name: 'Ambulance Emergency',
          phone: '102',
          type: 'ambulance',
          description: 'Medical emergency ambulance'
        },
        {
          _id: '3',
          name: 'Fire Department',
          phone: '101',
          type: 'fire',
          description: 'Fire emergency services'
        }
      ]);
    } finally {
      setLoading(prev => ({ ...prev, emergencyContacts: false }));
    }
  }, [apiBaseUrl]);

  // Optimize: Separate effects to prevent multiple re-renders
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  useEffect(() => {
    fetchEmergencyContacts();
  }, [fetchEmergencyContacts]);

  // Optimize: Only fetch safe zones when location changes
  useEffect(() => {
    if (userLocation) {
      fetchSafeZones(userLocation);
    }
  }, [userLocation, fetchSafeZones]);

  const handleZoneClick = useCallback((zone) => {
    setSelectedZone(zone);
    setSelectedContact(null);
  }, []);

  const handleContactClick = useCallback((contact) => {
    setSelectedContact(contact);
    setSelectedZone(null);
  }, []);

  const handleCall = useCallback((phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`;
  }, []);

  const handleRefresh = useCallback(() => {
    getUserLocation();
    fetchSafeZones(userLocation);
    fetchEmergencyContacts();
  }, [getUserLocation, fetchSafeZones, fetchEmergencyContacts, userLocation]);

  // Optimize: Memoize these functions
  const getZoneIcon = useMemo(() => (type) => {
    switch(type) {
      case 'police_station': return '🚓';
      case 'hospital': return '🏥';
      case 'embassy': return '🏛️';
      case 'tourist_center': return '🏪';
      case 'safe_haven': return '🏠';
      default: return '📍';
    }
  }, []);

  const getContactIcon = useMemo(() => (type) => {
    switch(type) {
      case 'police': return '👮';
      case 'ambulance': return '🚑';
      case 'fire': return '🚒';
      case 'tourist_helpline': return '🏖️';
      case 'local_authority': return '🏛️';
      case 'embassy': return '🇺🇸';
      default: return '📞';
    }
  }, []);

  const getZoneColor = useMemo(() => (type) => {
    switch(type) {
      case 'police_station': return 'bg-blue-100 border-blue-300';
      case 'hospital': return 'bg-red-100 border-red-300';
      case 'embassy': return 'bg-purple-100 border-purple-300';
      case 'tourist_center': return 'bg-yellow-100 border-yellow-300';
      case 'safe_haven': return 'bg-green-100 border-green-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  }, []);

  const getContactColor = useMemo(() => (type) => {
    switch(type) {
      case 'police': return 'bg-blue-50 border-blue-200';
      case 'ambulance': return 'bg-red-50 border-red-200';
      case 'fire': return 'bg-orange-50 border-orange-200';
      case 'tourist_helpline': return 'bg-yellow-50 border-yellow-200';
      case 'local_authority': return 'bg-purple-50 border-purple-200';
      case 'embassy': return 'bg-indigo-50 border-indigo-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  }, []);

  // Optimize: Memoize safety tips
  const safetyTips = useMemo(() => [
    { icon: '📍', text: 'Share your live location with trusted contacts' },
    { icon: '💡', text: 'Stay in well-lit and populated areas' },
    { icon: '📱', text: 'Save emergency numbers in your phone' },
    { icon: '🚨', text: 'Use panic button in emergency situations' },
    { icon: '👀', text: 'Always be aware of your surroundings' },
  ], []);

  // Optimize: Memoize loading skeletons
  const loadingSkeletons = useMemo(() => 
    Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="bg-white rounded-lg p-3 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    )), []);

  // Optimize: Memoize contact loading skeletons
  const contactSkeletons = useMemo(() => 
    Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="bg-white rounded-lg p-3 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    )), []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-800">🛡️ Safety Information Map</h3>
          {userLocation && (
            <p className="text-xs md:text-sm text-gray-600 mt-1">
              Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm md:text-base w-full md:w-auto justify-center"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Error Messages */}
      {error.safeZones && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">⚠️ {error.safeZones}</p>
          <p className="text-red-600 text-xs mt-1">Showing fallback data</p>
        </div>
      )}

      {error.emergencyContacts && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">⚠️ {error.emergencyContacts}</p>
          <p className="text-red-600 text-xs mt-1">Showing fallback data</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Safe Zones */}
        <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl p-4 md:p-5 shadow-sm border border-green-100">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-base md:text-lg font-semibold text-green-800 flex items-center gap-2">
              <span className="text-lg md:text-xl">✅</span> Safe Zones Nearby
            </h4>
            {loading.safeZones && (
              <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-green-600"></div>
            )}
          </div>
          
          <div className="space-y-3 max-h-[250px] md:max-h-[300px] overflow-y-auto pr-2">
            {loading.safeZones ? (
              loadingSkeletons
            ) : safeZones.length > 0 ? (
              safeZones.map((zone) => (
                <div
                  key={zone._id || zone.id}
                  onClick={() => handleZoneClick(zone)}
                  className={`bg-white rounded-lg p-3 md:p-4 shadow-sm border-2 cursor-pointer transition-transform hover:scale-[1.01] active:scale-[1.02] ${selectedZone?._id === zone._id ? 'ring-2 ring-green-500 ring-opacity-50' : ''
                    } ${getZoneColor(zone.type)}`}
                >
                  <div className="flex items-start gap-2 md:gap-3">
                    <span className="text-xl md:text-2xl">{getZoneIcon(zone.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{zone.name}</p>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800 whitespace-nowrap">
                          {zone.distance}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-gray-600 mt-1 truncate">{zone.address}</p>
                      {zone.phone && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCall(zone.phone);
                            }}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors whitespace-nowrap"
                          >
                            📞 {zone.phone}
                          </button>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full capitalize truncate">
                            {zone.type.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 md:py-8 text-gray-500">
                <div className="text-3xl md:text-4xl mb-2">🏜️</div>
                <p className="text-sm md:text-base">No safe zones found in your area</p>
              </div>
            )}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-linear-to-br from-red-50 to-pink-50 rounded-xl p-4 md:p-5 shadow-sm border border-red-100">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-base md:text-lg font-semibold text-red-800 flex items-center gap-2">
              <span className="text-lg md:text-xl">📞</span> Emergency Contacts
            </h4>
            {loading.emergencyContacts && (
              <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-red-600"></div>
            )}
          </div>
          
          <div className="space-y-3 max-h-[250px] md:max-h-[300px] overflow-y-auto pr-2">
            {loading.emergencyContacts ? (
              contactSkeletons
            ) : emergencyContacts.length > 0 ? (
              emergencyContacts.map((contact) => (
                <div
                  key={contact._id || contact.id}
                  onClick={() => handleContactClick(contact)}
                  className={`bg-white rounded-lg p-3 md:p-4 shadow-sm border-2 cursor-pointer transition-transform hover:scale-[1.01] active:scale-[1.02] ${selectedContact?._id === contact._id ? 'ring-2 ring-red-500 ring-opacity-50' : ''
                    } ${getContactColor(contact.type)}`}
                >
                  <div className="flex items-start gap-2 md:gap-3">
                    <span className="text-xl md:text-2xl">{getContactIcon(contact.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{contact.name}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCall(contact.phone);
                          }}
                          className="text-xs md:text-sm px-2 md:px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors flex items-center gap-1 whitespace-nowrap"
                        >
                          <span>📞</span>
                          <span>{contact.phone}</span>
                        </button>
                      </div>
                      <p className="text-xs md:text-sm text-gray-600 mt-1 line-clamp-2">{contact.description}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full capitalize truncate">
                          {contact.type.replace('_', ' ')}
                        </span>
                        {contact.priority && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full whitespace-nowrap">
                            Priority: {contact.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 md:py-8 text-gray-500">
                <div className="text-3xl md:text-4xl mb-2">📵</div>
                <p className="text-sm md:text-base">No emergency contacts available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Details Panel */}
      {(selectedZone || selectedContact) && (
        <div className="mt-4 md:mt-6 bg-linear-to-r from-blue-50 to-cyan-50 rounded-xl p-4 md:p-5 shadow-sm border border-blue-200">
          <h4 className="text-base md:text-lg font-semibold text-blue-800 mb-3">📋 Details</h4>
          {selectedZone && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 md:gap-3">
                <span className="text-2xl md:text-3xl">{getZoneIcon(selectedZone.type)}</span>
                <div className="min-w-0">
                  <h5 className="font-bold text-lg md:text-xl text-gray-800 truncate">{selectedZone.name}</h5>
                  <p className="text-gray-600 text-sm md:text-base truncate">{selectedZone.address}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                <div className="bg-white p-2 md:p-3 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-500">Distance</p>
                  <p className="font-semibold text-sm md:text-base">{selectedZone.distance}</p>
                </div>
                <div className="bg-white p-2 md:p-3 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-500">Type</p>
                  <p className="font-semibold text-sm md:text-base capitalize">{selectedZone.type.replace('_', ' ')}</p>
                </div>
                {selectedZone.phone && (
                  <div className="bg-white p-2 md:p-3 rounded-lg">
                    <p className="text-xs md:text-sm text-gray-500">Contact</p>
                    <p className="font-semibold text-sm md:text-base">{selectedZone.phone}</p>
                  </div>
                )}
                {selectedZone.description && (
                  <div className="bg-white p-2 md:p-3 rounded-lg sm:col-span-2 md:col-span-2">
                    <p className="text-xs md:text-sm text-gray-500">Description</p>
                    <p className="font-semibold text-sm md:text-base line-clamp-2">{selectedZone.description}</p>
                  </div>
                )}
              </div>
              {selectedZone.phone && (
                <button
                  onClick={() => handleCall(selectedZone.phone)}
                  className="w-full py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  📞 Call {selectedZone.name}
                </button>
              )}
            </div>
          )}
          
          {selectedContact && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 md:gap-3">
                <span className="text-2xl md:text-3xl">{getContactIcon(selectedContact.type)}</span>
                <div className="min-w-0">
                  <h5 className="font-bold text-lg md:text-xl text-gray-800 truncate">{selectedContact.name}</h5>
                  <p className="text-gray-600 text-sm md:text-base line-clamp-2">{selectedContact.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                <div className="bg-white p-2 md:p-3 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-500">Phone Number</p>
                  <p className="font-semibold text-base md:text-lg truncate">{selectedContact.phone}</p>
                </div>
                <div className="bg-white p-2 md:p-3 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-500">Type</p>
                  <p className="font-semibold text-sm md:text-base capitalize">{selectedContact.type.replace('_', ' ')}</p>
                </div>
                {selectedContact.priority && (
                  <div className="bg-white p-2 md:p-3 rounded-lg">
                    <p className="text-xs md:text-sm text-gray-500">Priority Level</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${i < selectedContact.priority ? 'bg-red-500' : 'bg-gray-300'
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleCall(selectedContact.phone)}
                className="w-full py-2 md:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-2 text-sm md:text-base"
              >
                🚨 Emergency Call: {selectedContact.name}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Safety Tips */}
      <div className="mt-4 md:mt-6 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-4 md:p-5 shadow-sm border border-blue-200">
        <h4 className="text-base md:text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <span className="text-lg md:text-xl">💡</span> Safety Tips & Guidelines
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
          {safetyTips.map((tip, index) => (
            <div
              key={index}
              className="bg-white p-3 md:p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-xl md:text-2xl mb-1 md:mb-2">{tip.icon}</div>
              <p className="text-xs md:text-sm text-gray-700 leading-tight">{tip.text}</p>
            </div>
          ))}
        </div>
        
        {/* Quick Actions */}
        <div className="mt-4 md:mt-6 pt-3 md:pt-6 border-t border-blue-200">
          <h5 className="font-semibold text-blue-800 mb-2 md:mb-3 text-sm md:text-base">⚡ Quick Actions</h5>
          <div className="flex flex-wrap gap-2 md:gap-3">
            <button
              onClick={() => window.location.href = 'tel:112'}
              className="px-3 py-1 md:px-4 md:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 md:gap-2 text-xs md:text-sm"
            >
              🚨 Panic (112)
            </button>
            <button
              onClick={() => window.location.href = 'tel:100'}
              className="px-3 py-1 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 md:gap-2 text-xs md:text-sm"
            >
              👮 Police (100)
            </button>
            <button
              onClick={() => window.location.href = 'tel:102'}
              className="px-3 py-1 md:px-4 md:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 md:gap-2 text-xs md:text-sm"
            >
              🏥 Ambulance (102)
            </button>
            <button
              onClick={() => window.location.href = 'tel:101'}
              className="px-3 py-1 md:px-4 md:py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-1 md:gap-2 text-xs md:text-sm"
            >
              🚒 Fire (101)
            </button>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-green-600">{safeZones.length}</div>
            <p className="text-xs md:text-sm text-gray-600">Safe Zones</p>
          </div>
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-red-600">{emergencyContacts.length}</div>
            <p className="text-xs md:text-sm text-gray-600">Emergency Contacts</p>
          </div>
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-blue-600">
              {userLocation ? '📍' : '❓'}
            </div>
            <p className="text-xs md:text-sm text-gray-600">Location Status</p>
          </div>
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-purple-600">24/7</div>
            <p className="text-xs md:text-sm text-gray-600">Support Available</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SafetyMap;