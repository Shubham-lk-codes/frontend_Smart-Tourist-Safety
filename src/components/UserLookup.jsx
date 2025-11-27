import React, { useState } from 'react';
import axios from 'axios';

const UserLookup = () => {
  const [userId, setUserId] = useState('');
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = 'http://localhost:3000/api/users';

  const lookupUser = async () => {
    if (!userId.trim()) return;
    
    setLoading(true);
    setError('');

    try {
      const [userResponse, activitiesResponse] = await Promise.all([
        axios.get(`${API_BASE}/${userId}`),
        axios.get(`${API_BASE}/${userId}/activities`)
      ]);

      setUser(userResponse.data);
      setActivities(activitiesResponse.data.activities);
    } catch (err) {
      setError(err.response?.data?.error || 'User not found');
      setUser(null);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const addActivity = async (activityType) => {
    try {
      const response = await axios.post(`${API_BASE}/${userId}/activities`, {
        activityType,
        details: `User performed ${activityType} at ${new Date().toLocaleString()}`
      });

      // Refresh activities
      lookupUser();
    } catch (err) {
      setError('Failed to add activity');
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">User Lookup</h2>
      
      <div className="flex space-x-2 mb-6">
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter User ID"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={lookupUser}
          disabled={loading || !userId.trim()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Lookup'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {user && (
        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-3">User Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>User ID:</strong>
                <div className="font-mono text-xs bg-green-100 p-1 rounded mt-1">{user.user.userId}</div>
              </div>
              <div>
                <strong>Name:</strong>
                <div>{user.user.name}</div>
              </div>
              <div>
                <strong>Email:</strong>
                <div>{user.user.email}</div>
              </div>
              <div>
                <strong>Registered:</strong>
                <div>{new Date(user.user.registeredAt).toLocaleString()}</div>
              </div>
            </div>
            <div className="mt-3 p-2 bg-green-100 rounded">
              <strong>Blockchain Verified:</strong> 
              <span className={user.blockchainVerified ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                {user.blockchainVerified ? '✅ Valid' : '❌ Invalid'}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Quick Actions</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => addActivity('location_check')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Check Location
              </button>
              <button
                onClick={() => addActivity('safety_check')}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
              >
                Safety Check
              </button>
              <button
                onClick={() => addActivity('emergency_alert')}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Emergency Alert
              </button>
            </div>
          </div>

          {/* Activities */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">User Activities</h3>
            {activities.length === 0 ? (
              <p className="text-gray-500">No activities recorded</p>
            ) : (
              <div className="space-y-2">
                {activities.map((activity, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-3 py-1">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold capitalize">
                        {activity.activityType.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{activity.details}</p>
                    <code className="text-xs bg-gray-100 p-1 rounded block mt-1">
                      Block: {activity.blockHash.substring(0, 16)}...
                    </code>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLookup;