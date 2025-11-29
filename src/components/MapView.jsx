import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Google Maps CSS
const MAPS_CSS = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
const MAPS_JS = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';

const MapView = ({ geofences, onGeofenceClick }) => {
  const [map, setMap] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [mapCircles, setMapCircles] = useState([]);
  const [mapPolygons, setMapPolygons] = useState([]);
  
  const mapRef = useRef(null);
  const API_BASE = 'http://localhost:3000/api/geo';

  // Load Leaflet CSS and JS
  useEffect(() => {
    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = MAPS_CSS;
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement('script');
    script.src = MAPS_JS;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !window.L || !mapRef.current) return;

    // Default coordinates (Delhi)
    const defaultCenter = [28.6139, 77.2090];
    
    const leafletMap = window.L.map(mapRef.current).setView(defaultCenter, 13);

    // Add tile layer (OpenStreetMap)
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(leafletMap);

    setMap(leafletMap);

    // Get user location
    getCurrentLocation(leafletMap);

    return () => {
      if (leafletMap) {
        leafletMap.remove();
      }
    };
  }, [mapLoaded]);

  // Plot geofences on map
  useEffect(() => {
    if (!map || !geofences || !Array.isArray(geofences)) return;

    // Clear existing markers, circles, and polygons
    clearMapElements();

    const markers = [];
    const circles = [];
    const polygons = [];

    geofences.forEach((geofence, index) => {
      if (geofence.type === 'circle' && geofence.center) {
        // Create circle geofence
        const circle = window.L.circle([geofence.center.lat, geofence.center.lng], {
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.2,
          radius: geofence.radius
        }).addTo(map);

        // Add popup
        circle.bindPopup(`
          <div class="p-2">
            <h3 class="font-bold text-green-800">${geofence.name}</h3>
            <p class="text-sm text-gray-600">Circular Safe Zone</p>
            <p class="text-xs">Radius: ${geofence.radius}m</p>
            <p class="text-xs">Coordinates: ${geofence.center.lat.toFixed(6)}, ${geofence.center.lng.toFixed(6)}</p>
          </div>
        `);

        circles.push(circle);

        // Add marker at center
        const marker = window.L.marker([geofence.center.lat, geofence.center.lng])
          .addTo(map)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-bold text-green-800">${geofence.name}</h3>
              <p class="text-sm">🛡️ Safe Zone</p>
              <button onclick="window.geofenceClick && window.geofenceClick(${index})" 
                class="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">
                View Details
              </button>
            </div>
          `);

        markers.push(marker);

      } else if (geofence.type === 'polygon' && geofence.coordinates) {
        // Create polygon geofence
        const polygonCoords = geofence.coordinates.map(coord => [coord.lat, coord.lng]);
        
        const polygon = window.L.polygon(polygonCoords, {
          color: '#8b5cf6',
          fillColor: '#8b5cf6',
          fillOpacity: 0.2
        }).addTo(map);

        // Add popup
        polygon.bindPopup(`
          <div class="p-2">
            <h3 class="font-bold text-purple-800">${geofence.name}</h3>
            <p class="text-sm text-gray-600">Polygonal Safe Zone</p>
            <p class="text-xs">Points: ${geofence.coordinates.length}</p>
            <button onclick="window.geofenceClick && window.geofenceClick(${index})" 
              class="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">
              View Details
            </button>
          </div>
        `);

        polygons.push(polygon);

        // Calculate centroid for marker
        const centroid = calculateCentroid(polygonCoords);
        const marker = window.L.marker(centroid)
          .addTo(map)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-bold text-purple-800">${geofence.name}</h3>
              <p class="text-sm">🔷 Polygonal Zone</p>
              <p class="text-xs">${geofence.coordinates.length} points</p>
            </div>
          `);

        markers.push(marker);
      }
    });

    setMapMarkers(markers);
    setMapCircles(circles);
    setMapPolygons(polygons);

    // Fit map to show all geofences
    if (markers.length > 0) {
      const group = new window.L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }

    // Set up global click handler
    window.geofenceClick = (index) => {
      if (onGeofenceClick && geofences[index]) {
        onGeofenceClick(geofences[index]);
      }
    };

    return () => {
      delete window.geofenceClick;
    };
  }, [map, geofences, onGeofenceClick]);

  const clearMapElements = () => {
    mapMarkers.forEach(marker => map.removeLayer(marker));
    mapCircles.forEach(circle => map.removeLayer(circle));
    mapPolygons.forEach(polygon => map.removeLayer(polygon));
    
    setMapMarkers([]);
    setMapCircles([]);
    setMapPolygons([]);
  };

  const calculateCentroid = (coords) => {
    let x = 0, y = 0;
    coords.forEach(coord => {
      x += coord[0];
      y += coord[1];
    });
    return [x / coords.length, y / coords.length];
  };

  const getCurrentLocation = (leafletMap) => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        // Add user location marker
        if (leafletMap) {
          window.L.marker([latitude, longitude])
            .addTo(leafletMap)
            .bindPopup(`
              <div class="p-2">
                <h3 class="font-bold text-blue-600">Your Location</h3>
                <p class="text-sm">📍 You are here</p>
                <p class="text-xs">${latitude.toFixed(6)}, ${longitude.toFixed(6)}</p>
              </div>
            `)
            .openPopup();

          // Center map on user location
          leafletMap.setView([latitude, longitude], 15);
        }
      },
      (error) => {
        console.log('Error getting location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const refreshLocation = () => {
    if (map) {
      getCurrentLocation(map);
    }
  };

  const fitToGeofences = () => {
    if (map && mapMarkers.length > 0) {
      const group = new window.L.featureGroup(mapMarkers);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  };

  return (
    <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-8 py-6 border-b border-gray-200/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Interactive Map
            </h2>
            <p className="text-gray-600 text-lg mt-1">
              Visualize safe zones on the map with real-time location tracking
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-4 lg:mt-0">
            <button
              onClick={refreshLocation}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>My Location</span>
            </button>
            
            <button
              onClick={fitToGeofences}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
              <span>View All Zones</span>
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="p-6">
        {!mapLoaded && (
          <div className="h-96 bg-gray-100 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
        
        <div 
          ref={mapRef} 
          className="h-96 rounded-2xl border-2 border-gray-200/50 shadow-inner"
          style={{ display: mapLoaded ? 'block' : 'none' }}
        ></div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-6 items-center justify-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Circular Safe Zones</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Polygonal Safe Zones</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Your Location</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Zone Centers</span>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-green-200/50 text-center">
            <div className="text-2xl font-bold text-green-600">
              {geofences?.filter(g => g.type === 'circle').length || 0}
            </div>
            <div className="text-sm text-gray-600">Circular Zones</div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-purple-200/50 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {geofences?.filter(g => g.type === 'polygon').length || 0}
            </div>
            <div className="text-sm text-gray-600">Polygonal Zones</div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-blue-200/50 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {geofences?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Total Zones</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;