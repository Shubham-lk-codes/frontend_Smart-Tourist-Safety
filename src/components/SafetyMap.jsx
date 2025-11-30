import React, { useState, useEffect } from 'react';

function SafetyMap() {
  const [safeZones, setSafeZones] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);

  useEffect(() => {
    // Fetch safe zones from backend
    fetchSafeZones();
    fetchEmergencyContacts();
  }, []);

  const fetchSafeZones = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/safe-zones');
      const data = await response.json();
      setSafeZones(data);
    } catch (error) {
      console.error('Error fetching safe zones:', error);
    }
  };

  const fetchEmergencyContacts = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/emergency-contacts');
      const data = await response.json();
      setEmergencyContacts(data);
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-2xl font-bold mb-6 text-gray-800">🛡️ Safety Information Map</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Safe Zones */}
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="text-lg font-semibold mb-3 text-green-800">✅ Safe Zones</h4>
          <div className="space-y-2">
            {safeZones.map((zone, index) => (
              <div key={index} className="bg-white rounded p-3 shadow-sm">
                <p className="font-medium">{zone.name}</p>
                <p className="text-sm text-gray-600">{zone.address}</p>
                <p className="text-xs text-green-600">Distance: {zone.distance}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-red-50 rounded-lg p-4">
          <h4 className="text-lg font-semibold mb-3 text-red-800">📞 Emergency Contacts</h4>
          <div className="space-y-2">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="bg-white rounded p-3 shadow-sm">
                <p className="font-medium">{contact.name}</p>
                <p className="text-sm text-gray-600">{contact.phone}</p>
                <p className="text-xs text-red-600">{contact.type}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Safety Tips */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h4 className="text-lg font-semibold mb-3 text-blue-800">💡 Safety Tips</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Always share your live location with trusted contacts</li>
          <li>Stay in well-lit and populated areas</li>
          <li>Save emergency numbers in your phone</li>
          <li>Use the panic button in case of emergency</li>
          <li>Be aware of your surroundings</li>
        </ul>
      </div>
    </div>
  );
}

export default SafetyMap;