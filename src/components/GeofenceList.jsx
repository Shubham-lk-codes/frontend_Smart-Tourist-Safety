import React, { useState } from 'react';
import axios from 'axios';

const GeofenceList = ({ geofences, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_BASE = 'http://localhost:3000/api/geo';

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this geofence?')) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${API_BASE}/geofences/${id}`);
      setMessage('✅ Geofence deleted successfully!');
      onUpdate();
    } catch (err) {
      setMessage('❌ Error deleting geofence: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    return type === 'circle' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800';
  };

  const getTypeIcon = (type) => {
    return type === 'circle' ? '⭕' : '🔷';
  };

  if (geofences.length === 0) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">🗺️</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Safe Zones Created</h3>
        <p className="text-gray-500">Create your first safe zone to start monitoring tourist areas</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">All Safe Zones</h2>
        <p className="text-gray-600 text-sm">Manage your geofence boundaries</p>
      </div>

      {message && (
        <div className={`mx-6 mt-4 p-3 rounded-lg ${
          message.includes('✅') 
            ? 'bg-green-100 border border-green-300 text-green-800' 
            : 'bg-red-100 border border-red-300 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {geofences.map((geofence) => (
          <div key={geofence._id} className="p-6 hover:bg-gray-50 transition duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${getTypeColor(geofence.type)}`}>
                  {getTypeIcon(geofence.type)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{geofence.name}</h3>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(geofence.type)}`}>
                      {geofence.type === 'circle' ? 'Circular' : 'Polygonal'}
                    </span>
                    <span className="text-sm text-gray-500">
                      Created: {new Date(geofence.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {geofence.type === 'circle' && (
                  <span className="text-sm text-gray-600">
                    Radius: {geofence.radius}m
                  </span>
                )}
                <button
                  onClick={() => handleDelete(geofence._id)}
                  disabled={loading}
                  className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Coordinates Display */}
            <div className="mt-4 bg-gray-50 p-3 rounded-lg">
              {geofence.type === 'circle' ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Center:</span>
                    <div className="font-mono text-xs mt-1">
                      {geofence.center.lat.toFixed(6)}, {geofence.center.lng.toFixed(6)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Coverage:</span>
                    <div className="text-sm mt-1">
                      {geofence.radius} meter radius
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-gray-600 text-sm">Polygon Points ({geofence.coordinates.length}):</span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {geofence.coordinates.slice(0, 4).map((coord, index) => (
                      <div key={index} className="font-mono text-xs bg-white p-2 rounded border">
                        Point {index + 1}: {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
                      </div>
                    ))}
                    {geofence.coordinates.length > 4 && (
                      <div className="font-mono text-xs bg-white p-2 rounded border text-gray-500">
                        +{geofence.coordinates.length - 4} more points
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