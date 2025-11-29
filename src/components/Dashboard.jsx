import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddGeofence from './AddGeofence';
import GeoFenceTracker from './GeoFenceTracker';
import GeofenceList from './GeofenceList';
import MapView from './MapView';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('tracker');
  const [geofences, setGeofences] = useState([]);
  const [stats, setStats] = useState({ total: 0, circles: 0, polygons: 0 });

  const API_BASE = 'http://localhost:3000/api/geo';

  const fetchGeofences = async () => {
    try {
      const response = await axios.get(`${API_BASE}/geofences`);
      setGeofences(response.data.boundaries);
      
      // Calculate stats
      const circles = response.data.boundaries.filter(g => g.type === 'circle').length;
      const polygons = response.data.boundaries.filter(g => g.type === 'polygon').length;
      
      setStats({
        total: response.data.boundaries.length,
        circles,
        polygons
      });
    } catch (error) {
      console.error('Error fetching geofences:', error);
    }
  };

  useEffect(() => {
    fetchGeofences();
  }, []);

  const handleGeofenceAdded = () => {
    fetchGeofences();
    setActiveTab('list');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SafeZone Manager</h1>
                <p className="text-sm text-gray-600">Tourist Safety Geofencing System</p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-xs text-gray-500">Total Zones</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.circles}</div>
                <div className="text-xs text-gray-500">Circular</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.polygons}</div>
                <div className="text-xs text-gray-500">Polygonal</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'tracker', name: '📍 Live Tracker', icon: '📍' },
              { id: 'map', name: '🗺️ Map View', icon: '🗺️' },
              { id: 'add', name: '➕ Add Zone', icon: '➕' },
              { id: 'list', name: '📋 All Zones', icon: '📋' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="py-6">
          {activeTab === 'tracker' && <GeoFenceTracker />}
          {activeTab === 'map' && <MapView geofences={geofences} />}
          {activeTab === 'add' && <AddGeofence onGeofenceAdded={handleGeofenceAdded} />}
          {activeTab === 'list' && <GeofenceList geofences={geofences} onUpdate={fetchGeofences} />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;