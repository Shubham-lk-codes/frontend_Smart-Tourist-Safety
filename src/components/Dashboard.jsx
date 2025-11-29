import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddGeofence from './AddGeofence';
import LiveGeoMap from './LiveGeoMap';
import GeofenceList from './GeofenceList';
import MapView from './MapView'; // ✅ NEW: Import MapView

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('tracker');
  const [geofences, setGeofences] = useState([]);
  const [stats, setStats] = useState({ total: 0, circles: 0, polygons: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedGeofence, setSelectedGeofence] = useState(null);

  const API_BASE = 'http://localhost:3000/api/geo';

  const fetchGeofences = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/geofences`);
      setGeofences(response.data.boundaries || []);
      
      // Calculate stats
      const circles = (response.data.boundaries || []).filter(g => g.type === 'circle').length;
      const polygons = (response.data.boundaries || []).filter(g => g.type === 'polygon').length;
      
      setStats({
        total: (response.data.boundaries || []).length,
        circles,
        polygons
      });
    } catch (error) {
      console.error('Error fetching geofences:', error);
      setGeofences([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGeofences();
  }, []);

  const handleGeofenceAdded = () => {
    fetchGeofences();
    setActiveTab('map'); // Switch to map view after adding
  };

  const handleGeofenceClick = (geofence) => {
    setSelectedGeofence(geofence);
    // You can show a modal or details panel with geofence information
    console.log('Selected geofence:', geofence);
  };

  const getTabContent = () => {
    if (loading && activeTab !== 'add') {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'tracker':
        return <LiveGeoMap />;
      case 'map':
        return (
          <MapView 
            geofences={geofences} 
            onGeofenceClick={handleGeofenceClick}
          />
        );
      case 'add':
        return <AddGeofence onGeofenceAdded={handleGeofenceAdded} />;
      case 'list':
        return <GeofenceList geofences={geofences} onUpdate={fetchGeofences} />;
      default:
        return <LiveGeoMap />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  GeoGuard
                </h1>
                <p className="text-gray-600 text-sm">Intelligent Geofencing System</p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="hidden md:flex space-x-6">
              <div className="text-center bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-xs text-gray-500 font-medium">Total Zones</div>
              </div>
              <div className="text-center bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-2xl font-bold text-green-600">{stats.circles}</div>
                <div className="text-xs text-gray-500 font-medium">Circular</div>
              </div>
              <div className="text-center bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-2xl font-bold text-purple-600">{stats.polygons}</div>
                <div className="text-xs text-gray-500 font-medium">Polygonal</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 mt-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[
              { id: 'tracker', name: 'Live Tracker', icon: '📍', color: 'blue' },
              { id: 'map', name: 'Interactive Map', icon: '🗺️', color: 'green' }, // ✅ NEW: Map tab
              { id: 'add', name: 'Add Zone', icon: '➕', color: 'purple' },
              { id: 'list', name: 'All Zones', icon: '📋', color: 'orange' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? `border-${tab.color}-500 text-${tab.color}-600`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.name}</span>
                  {activeTab === tab.id && (
                    <div className={`w-2 h-2 bg-${tab.color}-500 rounded-full animate-pulse`}></div>
                  )}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="py-8">
          {getTabContent()}
        </div>
      </div>

      {/* Mobile Stats */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200 p-4">
        <div className="flex justify-around">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-gray-500">Zones</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{stats.circles}</div>
            <div className="text-xs text-gray-500">Circular</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{stats.polygons}</div>
            <div className="text-xs text-gray-500">Polygonal</div>
          </div>
        </div>
      </div>

      {/* Selected Geofence Modal (Optional) */}
      {selectedGeofence && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">{selectedGeofence.name}</h3>
              <button
                onClick={() => setSelectedGeofence(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <p><strong>Type:</strong> {selectedGeofence.type}</p>
              {selectedGeofence.type === 'circle' && (
                <>
                  <p><strong>Radius:</strong> {selectedGeofence.radius}m</p>
                  <p><strong>Center:</strong> {selectedGeofence.center.lat.toFixed(6)}, {selectedGeofence.center.lng.toFixed(6)}</p>
                </>
              )}
              {selectedGeofence.type === 'polygon' && (
                <p><strong>Points:</strong> {selectedGeofence.coordinates.length}</p>
              )}
              <p><strong>Created:</strong> {new Date(selectedGeofence.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;