import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to update map view when current location changes
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], zoom || 15);
    }
  }, [center, zoom, map]);

  return null;
};

// Component to fit map to bounds
const FitBoundsUpdater = ({ bounds }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [50, 50] });
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
    }
  }, [bounds, map]);

  return null;
};

// Custom hook for accurate area calculation
const useGeofenceArea = () => {
  // More accurate calculation using Haversine formula for polygons
  const calculatePolygonArea = (coordinates) => {
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 3) return 0;

    const earthRadius = 6371000; // Earth's radius in meters
    let area = 0;
    const n = coordinates.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const point1 = coordinates[i];
      const point2 = coordinates[j];

      if (!point1 || !point2) continue;

      const lat1 = (point1.lat * Math.PI) / 180;
      const lat2 = (point2.lat * Math.PI) / 180;
      const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;

      area += Math.atan2(
        Math.tan(dLng / 2) * (Math.tan(lat1 / 2) + Math.tan(lat2 / 2)),
        1 + Math.tan(lat1 / 2) * Math.tan(lat2 / 2) * Math.cos(dLng)
      );
    }

    area = 2 * Math.pow(earthRadius, 2) * Math.abs(area);
    return area;
  };

  const calculateCircleArea = (radius) => {
    if (!radius || isNaN(radius)) return 0;
    return Math.PI * radius * radius;
  };

  const formatArea = (area) => {
    if (!area || isNaN(area)) return '0 m²';
    
    if (area < 10000) {
      return `${area.toFixed(0)} m²`;
    } else if (area < 1000000) {
      return `${(area / 10000).toFixed(2)} hectares`;
    } else {
      return `${(area / 1000000).toFixed(2)} km²`;
    }
  };

  return {
    calculatePolygonArea,
    calculateCircleArea,
    formatArea
  };
};

const AddGeofence = ({ onGeofenceAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'circle',
    center: { lat: '', lng: '' },
    radius: '100',
    coordinates: []
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default India center
  const [selectedFence, setSelectedFence] = useState(null);
  const [viewingFence, setViewingFence] = useState(false);
  const [mapBounds, setMapBounds] = useState(null);
  const [mapZoom, setMapZoom] = useState(13);
  const mapRef = useRef(null);

  const { calculatePolygonArea, calculateCircleArea, formatArea } = useGeofenceArea();

  const API_BASE = 'http://localhost:3000/api/geo';

  // Initialize when component mounts
  useEffect(() => {
    fetchGeofences();
  }, []);

  // Fetch all geofences from the server with proper error handling
  const fetchGeofences = async () => {
    try {
      const response = await axios.get(`${API_BASE}/geofences`);
      
      if (response.data && Array.isArray(response.data)) {
        setGeofences(response.data);
      } else {
        console.warn('API response is not an array:', response.data);
        setGeofences([]);
      }
    } catch (err) {
      console.error('Error fetching geofences:', err);
      setGeofences([]);
      setMessage('❌ Error loading existing geofences');
    }
  };

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
    } else if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        coordinates: value === 'polygon' ? [] : undefined
      }));
      // Clear polygon points when switching types
      if (value === 'circle') {
        setPolygonPoints([]);
      }
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
        const newLocation = { lat: latitude, lng: longitude };
        
        setFormData(prev => ({
          ...prev,
          center: {
            lat: latitude.toFixed(6),
            lng: longitude.toFixed(6)
          }
        }));
        setCurrentLocation(newLocation);
        setMapCenter([latitude, longitude]);
        setMapZoom(15);
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
        maximumAge: 60000
      }
    );
  };

  const addPolygonPoint = () => {
    if (formData.center.lat && formData.center.lng) {
      const lat = parseFloat(formData.center.lat);
      const lng = parseFloat(formData.center.lng);
      
      if (isNaN(lat) || isNaN(lng)) {
        setMessage('❌ Please enter valid coordinates');
        return;
      }

      const newPoint = { lat, lng };
      setPolygonPoints(prev => [...prev, newPoint]);
      setFormData(prev => ({
        ...prev,
        center: { lat: '', lng: '' }
      }));
      setMessage(`✅ Point ${polygonPoints.length + 1} added to polygon`);
    } else {
      setMessage('❌ Please enter both latitude and longitude');
    }
  };

  const clearPolygon = () => {
    setPolygonPoints([]);
    setMessage('Polygon points cleared');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Enhanced validation
      if (!formData.name.trim()) {
        throw new Error('Zone name is required');
      }

      if (formData.type === 'circle') {
        if (!formData.center.lat || !formData.center.lng) {
          throw new Error('Center coordinates are required for circular zone');
        }
        
        const lat = parseFloat(formData.center.lat);
        const lng = parseFloat(formData.center.lng);
        const radius = parseFloat(formData.radius);
        
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error('Invalid center coordinates');
        }
        if (!formData.radius || isNaN(radius) || radius <= 0) {
          throw new Error('Valid radius is required (must be greater than 0)');
        }
      }

      if (formData.type === 'polygon') {
        if (polygonPoints.length < 3) {
          throw new Error('At least 3 points are required for polygon');
        }
      }

      // Prepare data for API
      const geofenceData = {
        name: formData.name.trim(),
        type: formData.type,
      };

      // Add circle-specific data
      if (formData.type === 'circle') {
        geofenceData.center = {
          lat: parseFloat(formData.center.lat),
          lng: parseFloat(formData.center.lng)
        };
        geofenceData.radius = parseFloat(formData.radius);
      }

      // Add polygon-specific data
      if (formData.type === 'polygon') {
        geofenceData.coordinates = polygonPoints;
      }

      console.log('Sending geofence data:', geofenceData);

      const response = await axios.post(`${API_BASE}/geofences`, geofenceData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });

      if (response.status === 201) {
        setMessage('✅ Geofence added successfully!');
        // Reset form
        setFormData({
          name: '',
          type: 'circle',
          center: { lat: '', lng: '' },
          radius: '100',
          coordinates: []
        });
        setPolygonPoints([]);
        setCurrentLocation(null);

        await fetchGeofences();

        if (onGeofenceAdded) {
          onGeofenceAdded();
        }
      }
    } catch (err) {
      console.error('Submission error:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details?.[0] || 
                          err.message || 
                          'Unknown error occurred';
      setMessage('❌ Error adding geofence: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const viewFenceArea = (fence) => {
    setSelectedFence(fence);
    setViewingFence(true);
    
    if (fence.type === 'circle') {
      // For circle, center on it and set appropriate zoom based on radius
      setMapCenter([fence.center.lat, fence.center.lng]);
      
      // Calculate zoom level based on radius
      let zoomLevel = 15;
      if (fence.radius > 5000) zoomLevel = 12;
      else if (fence.radius > 2000) zoomLevel = 13;
      else if (fence.radius > 500) zoomLevel = 14;
      else if (fence.radius > 100) zoomLevel = 15;
      else zoomLevel = 16;
      
      setMapZoom(zoomLevel);
      
      // Calculate bounds for the circle
      const lat = fence.center.lat;
      const lng = fence.center.lng;
      const radiusInDegrees = fence.radius / 111320; // Approximate conversion
      
      const bounds = [
        [lat - radiusInDegrees, lng - radiusInDegrees],
        [lat + radiusInDegrees, lng + radiusInDegrees]
      ];
      setMapBounds(bounds);
      
    } else if (fence.type === 'polygon' && fence.coordinates && fence.coordinates.length > 0) {
      // For polygon, calculate bounds from all points
      const lats = fence.coordinates.map(coord => coord.lat);
      const lngs = fence.coordinates.map(coord => coord.lng);
      
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      // Calculate center
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      setMapCenter([centerLat, centerLng]);
      
      // Set bounds
      const bounds = [
        [minLat, minLng],
        [maxLat, maxLng]
      ];
      setMapBounds(bounds);
      
      // Calculate zoom based on polygon size
      const latDiff = maxLat - minLat;
      const lngDiff = maxLng - minLng;
      const maxDiff = Math.max(latDiff, lngDiff);
      
      let zoomLevel = 15;
      if (maxDiff > 1) zoomLevel = 10;
      else if (maxDiff > 0.5) zoomLevel = 11;
      else if (maxDiff > 0.2) zoomLevel = 12;
      else if (maxDiff > 0.1) zoomLevel = 13;
      else if (maxDiff > 0.05) zoomLevel = 14;
      else zoomLevel = 15;
      
      setMapZoom(zoomLevel);
    }
    
    setMessage(`🔍 Viewing "${fence.name}" on map`);
  };

  const closeFenceView = () => {
    setSelectedFence(null);
    setViewingFence(false);
    setMapCenter([20.5937, 78.9629]);
    setMapZoom(13);
    setMapBounds(null);
    setMessage('');
  };

  const handleMapCreated = (map) => {
    mapRef.current = map;
  };

  // Safe geofences array for rendering
  const safeGeofences = Array.isArray(geofences) ? geofences : [];

  return (
    <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 p-8 border-b border-gray-200/50">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Create fenced Zone
          </h2>
          <p className="text-gray-600 text-lg mt-2">
            Define geofence boundaries for tourist safety monitoring
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Form Section */}
        <div className="lg:w-1/2 p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Geofence Type */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-4">
                Zone Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`relative flex cursor-pointer rounded-2xl border-2 p-6 focus:outline-none transition-all duration-200 ${formData.type === 'circle'
                    ? 'border-blue-500 bg-blue-50/50 shadow-lg scale-105'
                    : 'border-gray-300 bg-white/50 hover:border-gray-400'
                  }`}>
                  <input
                    type="radio"
                    name="type"
                    value="circle"
                    checked={formData.type === 'circle'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">⭕</span>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">Circular Zone</div>
                        <div className="text-gray-500 text-sm mt-1">Define center and radius</div>
                      </div>
                    </div>
                    <div className="h-6 w-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                      {formData.type === 'circle' && (
                        <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                  </div>
                </label>

                <label className={`relative flex cursor-pointer rounded-2xl border-2 p-6 focus:outline-none transition-all duration-200 ${formData.type === 'polygon'
                    ? 'border-purple-500 bg-purple-50/50 shadow-lg scale-105'
                    : 'border-gray-300 bg-white/50 hover:border-gray-400'
                  }`}>
                  <input
                    type="radio"
                    name="type"
                    value="polygon"
                    checked={formData.type === 'polygon'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🔷</span>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">Polygonal Zone</div>
                        <div className="text-gray-500 text-sm mt-1">Define custom shape</div>
                      </div>
                    </div>
                    <div className="h-6 w-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                      {formData.type === 'polygon' && (
                        <div className="h-3 w-3 rounded-full bg-purple-600"></div>
                      )}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Geofence Name */}
            <div>
              <label className="block text-lg font-semibold text-black text-gray-700 mb-3">
                Zone Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-4 border-2 text-black border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 backdrop-blur-sm text-lg transition-all duration-200"
                placeholder="e.g., Taj Mahal Safe Zone, Beach Area"
              />
            </div>

            {/* Location Coordinates */}
            <div className="space-y-4">
              <label className="block text-lg font-semibold text-gray-700">
                {formData.type === 'circle' ? 'Center Coordinates *' : 'Polygon Points *'}
              </label>

              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-green-300 disabled:to-emerald-400 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 disabled:transform-none transform hover:scale-105 shadow-lg flex items-center justify-center text-lg"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Getting Location...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Use My Current Location
                  </>
                )}
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    name="lat"
                    value={formData.center.lat}
                    onChange={handleChange}
                    required={formData.type === 'circle'}
                    className="w-full px-4 py-3 border-2 text-black border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                    placeholder="28.6139"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    name="lng"
                    value={formData.center.lng}
                    onChange={handleChange}
                    required={formData.type === 'circle'}
                    className="w-full px-4 py-3 text-black border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                    placeholder="77.2090"
                  />
                </div>
              </div>

              {/* Polygon Controls */}
              {formData.type === 'polygon' && (
                <div className="space-y-4">
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={addPolygonPoint}
                      disabled={!formData.center.lat || !formData.center.lng}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:from-blue-300 disabled:to-cyan-400 text-black font-semibold py-3 px-4 rounded-2xl transition-all duration-200 disabled:transform-none transform hover:scale-105 shadow-lg"
                    >
                      Add Point
                    </button>
                    <button
                      type="button"
                      onClick={clearPolygon}
                      className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-black font-semibold py-3 px-4 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      Clear All
                    </button>
                  </div>

                  {polygonPoints.length > 0 && (
                    <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border-2 border-gray-200/50">
                      <p className="text-lg font-semibold text-gray-700 mb-4">
                        Polygon Points ({polygonPoints.length})
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {polygonPoints.map((point, index) => (
                          <div key={index} className="flex justify-between items-center text-sm bg-white/80 p-3 rounded-xl border border-gray-200 shadow-sm">
                            <span className="font-semibold text-gray-700">Point {index + 1}</span>
                            <span className="font-mono text-gray-800">
                              {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-3">
                        ✅ Minimum 3 points required for polygon
                      </p>
                      {polygonPoints.length >= 3 && (
                        <p className="text-sm text-green-600 font-semibold mt-2">
                          📐 Estimated Area: {formatArea(calculatePolygonArea(polygonPoints))}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Radius (only for circle) */}
            {formData.type === 'circle' && (
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-3">
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
                  className="w-full px-4 py-4 border-2 text-black border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 backdrop-blur-sm text-lg transition-all duration-200"
                  placeholder="Enter radius in meters"
                />
                <p className="text-sm text-gray-500 mt-2 ml-2">
                  🎯 Recommended: 100-500 meters for tourist areas
                </p>
                {formData.radius && (
                  <p className="text-sm text-green-600 font-semibold mt-2 ml-2">
                    📐 Estimated Area: {formatArea(calculateCircleArea(parseFloat(formData.radius)))}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (formData.type === 'polygon' && polygonPoints.length < 3)}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-blue-300 disabled:to-purple-400 text-white font-bold py-5 px-6 rounded-2xl transition-all duration-200 disabled:transform-none transform hover:scale-105 shadow-2xl flex items-center justify-center text-lg"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Safe Zone...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Create fenced Zone
                </>
              )}
            </button>
          </form>

          {/* Message Display */}
          {message && (
            <div className={`mt-8 p-4 rounded-2xl backdrop-blur-sm border ${message.includes('✅')
                ? 'bg-green-100/80 border-green-300 text-green-800'
                : message.includes('🔍')
                ? 'bg-blue-100/80 border-blue-300 text-blue-800'
                : 'bg-red-100/80 border-red-300 text-red-800'
              }`}>
              <div className="flex items-center">
                {message.includes('✅') ? (
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : message.includes('🔍') ? (
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="font-semibold">{message}</span>
              </div>
            </div>
          )}

          {/* Current Location Preview */}
          {currentLocation && (
            <div className="mt-8 bg-blue-50/80 backdrop-blur-sm p-4 rounded-2xl border border-blue-200/50">
              <p className="text-sm font-semibold text-blue-800">📍 Current Location Set:</p>
              <p className="font-mono text-sm text-blue-600 mt-1">
                Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}
              </p>
            </div>
          )}
        </div>

        {/* Map Section */}
        <div className="lg:w-1/2 p-8 border-l border-gray-200/50">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Geofence Map</h3>
            <p className="text-gray-600">View all created safety zones and their coverage areas</p>
          </div>

          {/* View Fence Area Button */}
          {safeGeofences.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => {
                  if (viewingFence) {
                    closeFenceView();
                  } else if (safeGeofences.length > 0) {
                    viewFenceArea(safeGeofences[0]);
                  }
                }}
                className={`w-full ${viewingFence 
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700' 
                  : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700'
                } text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center`}
              >
                {viewingFence ? (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Close Fence View
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Fence Area on Map
                  </>
                )}
              </button>
            </div>
          )}

          {/* Real Map Container */}
          <div className="w-full h-96 rounded-2xl border-2 border-gray-300/50 shadow-inner overflow-hidden mb-6">
            <MapContainer 
              center={mapCenter} 
              zoom={mapZoom} 
              style={{ height: '100%', width: '100%' }}
              whenCreated={handleMapCreated}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Update map when current location changes */}
              {currentLocation && (
                <MapUpdater center={currentLocation} zoom={15} />
              )}
              
              {/* Update map when viewing fence */}
              {viewingFence && selectedFence && (
                <MapUpdater 
                  center={{
                    lat: selectedFence.type === 'circle' 
                      ? selectedFence.center.lat 
                      : selectedFence.coordinates.reduce((sum, coord) => sum + coord.lat, 0) / selectedFence.coordinates.length,
                    lng: selectedFence.type === 'circle' 
                      ? selectedFence.center.lng 
                      : selectedFence.coordinates.reduce((sum, coord) => sum + coord.lng, 0) / selectedFence.coordinates.length
                  }} 
                  zoom={mapZoom} 
                />
              )}
              
              {/* Fit bounds for selected fence */}
              {viewingFence && mapBounds && (
                <FitBoundsUpdater bounds={mapBounds} />
              )}
              
              {/* Show current location marker */}
              {currentLocation && (
                <Marker position={[currentLocation.lat, currentLocation.lng]}>
                  <Popup>
                    <div className="text-center">
                      <strong>Your Current Location</strong><br />
                      Lat: {currentLocation.lat.toFixed(6)}<br />
                      Lng: {currentLocation.lng.toFixed(6)}
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* Show all geofences on map */}
              {safeGeofences.map((fence) => {
                if (fence.type === 'circle' && fence.center) {
                  const area = calculateCircleArea(fence.radius);
                  return (
                    <Circle
                      key={fence._id || fence.id}
                      center={[fence.center.lat, fence.center.lng]}
                      radius={fence.radius}
                      pathOptions={{
                        color: viewingFence && selectedFence?._id === fence._id ? 'red' : 'blue',
                        fillColor: viewingFence && selectedFence?._id === fence._id ? 'red' : 'blue',
                        fillOpacity: viewingFence && selectedFence?._id === fence._id ? 0.3 : 0.1,
                        weight: viewingFence && selectedFence?._id === fence._id ? 4 : 2
                      }}
                      eventHandlers={{
                        click: () => {
                          // When clicking on the circle on the map, zoom to it
                          viewFenceArea(fence);
                        }
                      }}
                    >
                      <Tooltip permanent direction="center" className="custom-tooltip">
                        <div className="text-center font-semibold">
                          {fence.name}<br />
                          <span className="text-xs">{formatArea(area)}</span>
                        </div>
                      </Tooltip>
                      <Popup>
                        <div className="text-center">
                          <strong>{fence.name}</strong><br />
                          Type: Circular Zone<br />
                          Radius: {fence.radius}m<br />
                          Area: {formatArea(area)}<br />
                          Center: {fence.center.lat.toFixed(6)}, {fence.center.lng.toFixed(6)}
                          <div className="mt-2">
                            <button
                              onClick={() => viewFenceArea(fence)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                            >
                              {viewingFence && selectedFence?._id === fence._id ? 'Close View' : 'View This Fence'}
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Circle>
                  );
                } else if (fence.type === 'polygon' && fence.coordinates) {
                  const polygonCoords = fence.coordinates.map(coord => [coord.lat, coord.lng]);
                  const area = calculatePolygonArea(fence.coordinates);
                  
                  // Calculate center for tooltip
                  const centerLat = fence.coordinates.reduce((sum, coord) => sum + coord.lat, 0) / fence.coordinates.length;
                  const centerLng = fence.coordinates.reduce((sum, coord) => sum + coord.lng, 0) / fence.coordinates.length;
                  
                  return (
                    <Polygon
                      key={fence._id || fence.id}
                      positions={polygonCoords}
                      pathOptions={{
                        color: viewingFence && selectedFence?._id === fence._id ? 'red' : 'purple',
                        fillColor: viewingFence && selectedFence?._id === fence._id ? 'red' : 'purple',
                        fillOpacity: viewingFence && selectedFence?._id === fence._id ? 0.3 : 0.1,
                        weight: viewingFence && selectedFence?._id === fence._id ? 4 : 2
                      }}
                      eventHandlers={{
                        click: () => {
                          // When clicking on the polygon on the map, zoom to it
                          viewFenceArea(fence);
                        }
                      }}
                    >
                      <Tooltip permanent direction="center" className="custom-tooltip">
                        <div className="text-center font-semibold">
                          {fence.name}<br />
                          <span className="text-xs">{formatArea(area)}</span>
                        </div>
                      </Tooltip>
                      <Popup>
                        <div className="text-center">
                          <strong>{fence.name}</strong><br />
                          Type: Polygonal Zone<br />
                          Points: {fence.coordinates.length}<br />
                          Area: {formatArea(area)}<br />
                          <div className="mt-2">
                            <button
                              onClick={() => viewFenceArea(fence)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                            >
                              {viewingFence && selectedFence?._id === fence._id ? 'Close View' : 'View This Fence'}
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Polygon>
                  );
                }
                return null;
              })}
            </MapContainer>
          </div>

          {/* Restricted Zones List with Area Summary */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-gray-200/50 p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-semibold text-gray-800">Restricted Zones</h4>
              {safeGeofences.length > 0 && (
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                  Total: {safeGeofences.length} zone{safeGeofences.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            
            {safeGeofences.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <p className="text-gray-500">No restricted zones created yet. Create your first safety zone above.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {safeGeofences.map((fence, index) => {
                  const area = fence.type === 'circle' 
                    ? calculateCircleArea(fence.radius)
                    : calculatePolygonArea(fence.coordinates);
                  
                  return (
                    <div key={fence._id || fence.id || index} className="bg-white/80 p-4 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-semibold text-gray-800">{fence.name}</h5>
                          <div className="flex items-center mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${fence.type === 'circle' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'}`}>
                              {fence.type === 'circle' ? '⭕ Circular' : '🔷 Polygonal'}
                            </span>
                            <span className="ml-2 text-sm font-semibold text-red-600">
                              Area: {formatArea(area)}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => viewFenceArea(fence)}
                            className={`${viewingFence && selectedFence?._id === fence._id 
                              ? 'bg-red-500 hover:bg-red-600' 
                              : 'bg-blue-500 hover:bg-blue-600'
                            } text-white px-3 py-1 rounded-lg text-sm transition-colors`}
                          >
                            {viewingFence && selectedFence?._id === fence._id ? 'Close View' : 'View Fence'}
                          </button>
                          <button 
                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                            onClick={async () => {
                              try {
                                if (!fence._id && !fence.id) {
                                  throw new Error('Geofence ID is missing');
                                }
                                
                                await axios.delete(`${API_BASE}/geofences/${fence._id || fence.id}`);
                                setMessage('✅ Restricted zone deleted successfully!');
                                await fetchGeofences();
                                if (selectedFence?._id === fence._id) {
                                  closeFenceView();
                                }
                              } catch (err) {
                                setMessage('❌ Error deleting restricted zone: ' + (err.response?.data?.error || err.message));
                              }
                            }}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {fence.type === 'circle' ? (
                        <p className="text-sm text-gray-600 mt-2">
                          Center: {fence.center?.lat?.toFixed(6) || 'N/A'}, {fence.center?.lng?.toFixed(6) || 'N/A'} • Radius: {fence.radius || 'N/A'}m
                        </p>
                      ) : (
                        <p className="text-sm text-gray-600 mt-2">
                          Points: {fence.coordinates?.length || 0} • Perimeter: ~{(Math.sqrt(area) * 4).toFixed(0)}m
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddGeofence;