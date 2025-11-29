import React, { useState } from 'react';
import axios from 'axios';

const GeofenceList = ({ geofences, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const API_BASE = 'http://localhost:3000/api/geo';

  // ✅ FIX: Handle undefined or null geofences
  const safeGeofences = Array.isArray(geofences) ? geofences : [];

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this geofence?')) {
      return;
    }

    setLoading(true);
    setDeletingId(id);
    try {
      await axios.delete(`${API_BASE}/geofences/${id}`);
      setMessage('✅ Geofence deleted successfully!');
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setMessage('❌ Error deleting geofence: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
      setDeletingId(null);
    }
  };

  const getTypeColor = (type) => {
    return type === 'circle' 
      ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
      : 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-200';
  };

  const getTypeIcon = (type) => {
    return type === 'circle' ? '⭕' : '🔷';
  };

  // ✅ FIX: Check for empty array after ensuring it's an array
  if (safeGeofences.length === 0) {
    return (
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-12 text-center border border-gray-200/50">
        <div className="text-gray-300 text-8xl mb-6">🗺️</div>
        <h3 className="text-2xl font-bold text-gray-700 mb-3">
          {geofences === undefined ? 'Loading Safe Zones...' : 'No Safe Zones Created'}
        </h3>
        <p className="text-gray-500 text-lg max-w-md mx-auto">
          {geofences === undefined 
            ? 'Please wait while we load your safe zones...' 
            : 'Create your first safe zone to start monitoring tourist areas and ensure safety.'
          }
        </p>
        {geofences === undefined && (
          <div className="flex justify-center mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-8 py-6 border-b border-gray-200/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              All Safe Zones
            </h2>
            <p className="text-gray-600 text-lg mt-1">Manage your geofence boundaries and monitoring areas</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-gray-200/50">
            <span className="text-sm font-semibold text-gray-700">
              Total: <span className="text-blue-600">{safeGeofences.length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mx-8 mt-6 p-4 rounded-2xl backdrop-blur-sm border ${
          message.includes('✅') 
            ? 'bg-green-100/80 border-green-300 text-green-800' 
            : 'bg-red-100/80 border-red-300 text-red-800'
        }`}>
          <div className="flex items-center">
            {message.includes('✅') ? (
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {message}
          </div>
        </div>
      )}

      {/* Geofences List */}
      <div className="divide-y divide-gray-200/50">
        {safeGeofences.map((geofence) => (
          <div key={geofence._id} className="p-8 hover:bg-gray-50/50 transition-all duration-200 group">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start space-x-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${getTypeColor(geofence.type)}`}>
                  {getTypeIcon(geofence.type)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {geofence.name || 'Unnamed Zone'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getTypeColor(geofence.type)}`}>
                      {geofence.type === 'circle' ? '⭕ Circular Zone' : '🔷 Polygonal Zone'}
                    </span>
                    <span className="text-sm text-gray-500 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200">
                      📅 Created: {geofence.createdAt ? new Date(geofence.createdAt).toLocaleDateString() : 'Unknown'}
                    </span>
                    {geofence.isActive === false && (
                      <span className="text-sm text-red-600 bg-red-100/80 px-3 py-1 rounded-full border border-red-200">
                        ⚠️ Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                {geofence.type === 'circle' && (
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Radius</div>
                    <div className="text-lg font-bold text-blue-600">
                      {geofence.radius}m
                    </div>
                  </div>
                )}
                <button
                  onClick={() => handleDelete(geofence._id)}
                  disabled={loading}
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-red-300 disabled:to-pink-400 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 disabled:transform-none transform hover:scale-105 shadow-lg backdrop-blur-sm flex items-center space-x-2"
                >
                  {deletingId === geofence._id ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Coordinates Display */}
            <div className="mt-6 bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 shadow-sm">
              {geofence.type === 'circle' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      Center Coordinates
                    </h4>
                    <div className="font-mono text-sm bg-gray-50/80 p-3 rounded-xl border border-gray-200">
                      {/* ✅ FIX: Safe property access */}
                      {geofence.center?.lat?.toFixed(6) || 'N/A'}, {geofence.center?.lng?.toFixed(6) || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                      </svg>
                      Coverage Area
                    </h4>
                    <div className="text-lg font-bold text-green-600 bg-green-50/80 p-3 rounded-xl border border-green-200">
                      {geofence.radius} meter radius
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                    Polygon Points ({geofence.coordinates?.length || 0})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                    {/* ✅ FIX: Safe array mapping */}
                    {(geofence.coordinates || []).slice(0, 6).map((coord, index) => (
                      <div key={index} className="font-mono text-xs bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                        <div className="font-semibold text-gray-600">Point {index + 1}</div>
                        <div className="text-gray-800 mt-1">
                          {coord?.lat?.toFixed(6) || 'N/A'}, {coord?.lng?.toFixed(6) || 'N/A'}
                        </div>
                      </div>
                    ))}
                    {(geofence.coordinates || []).length > 6 && (
                      <div className="font-mono text-xs bg-gray-50/80 p-3 rounded-xl border border-gray-200 text-gray-500 text-center">
                        +{(geofence.coordinates || []).length - 6} more points
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GeofenceList;