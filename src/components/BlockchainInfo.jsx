import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BlockchainInfo = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = 'http://localhost:3000/api/users';

  const fetchData = async () => {
    try {
      const [statsResponse, usersResponse] = await Promise.all([
        axios.get(`${API_BASE}/blockchain/info`),
        axios.get(API_BASE)
      ]);

      setStats(statsResponse.data);
      setUsers(usersResponse.data.users);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <div className="animate-pulse">Loading blockchain data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Blockchain Information</h2>
      
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalBlocks}</div>
            <div className="text-sm text-blue-800">Total Blocks</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalUsers}</div>
            <div className="text-sm text-green-800">Registered Users</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats.chainValid ? 'Valid' : 'Invalid'}
            </div>
            <div className="text-sm text-purple-800">Chain Status</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-xs font-mono text-orange-600 truncate">
              {stats.latestBlock}
            </div>
            <div className="text-sm text-orange-800">Latest Block</div>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Registered Users</h3>
        {users.length === 0 ? (
          <p className="text-gray-500">No users registered yet</p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.userId} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-800">{user.name}</h4>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <code className="text-xs bg-gray-100 p-1 rounded">
                      {user.userId}
                    </code>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {new Date(user.registeredAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockchainInfo;