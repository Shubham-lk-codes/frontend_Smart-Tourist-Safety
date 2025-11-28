import React, { useState } from 'react';
import axios from 'axios';

const AddGeofence = () => {
  const [formData, setFormData] = useState({
    name: '',
    center: { lat: '', lng: '' },
    radius: '100'
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  const API_BASE = 'http://localhost:3000/api/geo';

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'lat' || name === 'lng') {
      setFormData(prev => ({
        ...prev,
        center: {
          ...prev.center,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage('Geolocation not supported by your browser');
      return;
    }

    setLoading(true);
    setMessage('Getting your current location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          center: {
            lat: latitude.toFixed(6),
            lng: longitude.toFixed(6)
          }
        }));
        setCurrentLocation({ lat: latitude, lng: longitude });
        setMessage('✅ Current location set successfully!');
        setLoading(false);
      },
      (err) => {
        setMessage('❌ Error getting location: ' + err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const geofenceData = {
        name: formData.name,
        center: {
          lat: parseFloat(formData.center.lat),
          lng: parseFloat(formData.center.lng)
        },
        radius: parseFloat(formData.radius)
      };

      const response = await axios.post(`${API_BASE}/add`, geofenceData);

      setMessage('✅ Geofence added successfully!');
      setFormData({
        name: '',
        center: { lat: '', lng: '' },
        radius: '100'
      });
      setCurrentLocation(null);
    } catch (err) {
      setMessage('❌ Error adding geofence: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Add Safe Zone</h2>
        <p className="text-gray-600 text-sm mt-1">
          Create new geofence boundaries for tourist safety
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Geofence Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Safe Zone Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Taj Mahal Safe Zone, Beach Area"
          />
        </div>

        {/* Location Coordinates */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Center Coordinates *
          </label>
          
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Getting Location...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Use My Current Location
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                name="lat"
                value={formData.center.lat}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="28.6139"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                name="lng"
                value={formData.center.lng}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="77.2090"
              />
            </div>
          </div>
        </div>

        {/* Radius */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Safety Radius (meters) *
          </label>
          <input
            type="number"
            name="radius"
            value={formData.radius}
            onChange={handleChange}
            required
            min="1"
            step="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter radius in meters"
          />
          <p className="text-xs text-gray-500 mt-1">
            Recommended: 100-500 meters for tourist areas
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding Safe Zone...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Add Safe Zone
            </>
          )}
        </button>
      </form>

      {/* Message Display */}
      {message && (
        <div className={`mt-4 p-3 rounded-lg ${
          message.includes('✅') 
            ? 'bg-green-100 border border-green-300 text-green-800' 
            : 'bg-red-100 border border-red-300 text-red-800'
        }`}>
          <div className="flex items-center">
            {message.includes('✅') ? (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {message}
          </div>
        </div>
      )}

      {/* Current Location Preview */}
      {currentLocation && (
        <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-800">Current Location Set:</p>
          <p className="font-mono text-xs text-blue-600 mt-1">
            Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
};

export default AddGeofence;