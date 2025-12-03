import React, { useState } from 'react';
import axios from 'axios';

const UserRegistration = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    aadhar: '',
    location: '',
    emergencyContact: ''
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const API_BASE = 'http://localhost:3000/api/users';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Enhanced payload for tourist registration
      const payload = {
        ...formData,
        departmentId: 'TOURISM_DEPT_001', // ID of the tourism department
        registeredAt: 'Checkpoint_Goa_001',
        type: 'TOURIST',
        timestamp: new Date().toISOString()
      };

      const response = await axios.post(`${API_BASE}/register`, payload);
      setUser(response.data.user);
      
      // Reset form
      setFormData({ 
        name: '', 
        email: '', 
        phone: '', 
        aadhar: '', 
        location: '',
        emergencyContact: '' 
      });
      
      // Close form after successful registration
      setShowForm(false);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Reset everything and start fresh
  const handleNewRegistration = () => {
    setUser(null);
    setShowForm(true);
    setError('');
  };

  // Close form without submitting
  const handleCancel = () => {
    setShowForm(false);
    setFormData({ 
      name: '', 
      email: '', 
      phone: '', 
      aadhar: '', 
      location: '',
      emergencyContact: '' 
    });
    setError('');
  };

  return (
    <div className="w-full mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
      {/* Card Header */}
      <div className="p-6 border-b border-gray-200/60">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Tourist Registration</h2>
            <p className="text-gray-600 mt-1">Create blockchain-based digital IDs for tourists</p>
          </div>
          
          {!showForm && !user && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
            >
              <span className="text-lg">➕</span>
              <span>Add New Tourist</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Success Message */}
        {user ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl text-emerald-600">✅</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-emerald-800">Registration Successful!</h3>
                <p className="text-emerald-600">Tourist digital ID created with blockchain verification</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white/80 p-4 rounded-xl border border-emerald-200">
                <p className="text-sm text-gray-600 mb-1">Tourist Information</p>
                <p className="font-bold text-gray-800">{user.name}</p>
                <p className="text-gray-600 text-sm">{user.email}</p>
                <p className="text-gray-600 text-sm">{user.phone}</p>
              </div>
              
              <div className="bg-white/80 p-4 rounded-xl border border-emerald-200">
                <p className="text-sm text-gray-600 mb-1">Blockchain Details</p>
                <div className="space-y-1">
                  <p className="text-xs">
                    <span className="text-gray-700 font-medium">ID:</span>{' '}
                    <code className="bg-emerald-100 px-2 py-1 rounded text-emerald-800 font-mono">
                      {user.userId}
                    </code>
                  </p>
                  <p className="text-xs">
                    <span className="text-gray-700 font-medium">Block Hash:</span>{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded text-gray-800 font-mono truncate">
                      {user.blockHash?.substring(0, 30)}...
                    </code>
                  </p>
                  <p className="text-xs">
                    <span className="text-gray-700 font-medium">Timestamp:</span>{' '}
                    <span className="text-gray-600">{new Date().toLocaleString()}</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleNewRegistration}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-semibold transition duration-200 flex items-center space-x-2"
              >
                <span>➕</span>
                <span>Add Another Tourist</span>
              </button>
              <button
                onClick={() => window.print()}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition duration-200"
              >
                Print ID Card
              </button>
            </div>
          </div>
        ) : null}

        {/* Registration Form - Only shows when showForm is true */}
        {showForm && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl p-6 mb-6 border border-blue-200/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <span className="w-2 h-6 bg-blue-500 rounded-full mr-3"></span>
                New Tourist Registration
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
                title="Cancel"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Two Column Grid for Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                    <span className="text-xs text-gray-500 ml-2">(as per government ID)</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="Enter tourist's full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aadhar Number *
                    <span className="text-xs text-gray-500 ml-2">(for Indian nationals)</span>
                  </label>
                  <input
                    type="text"
                    name="aadhar"
                    value={formData.aadhar}
                    onChange={handleChange}
                    required
                    pattern="\d{4}\s?\d{4}\s?\d{4}"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="XXXX XXXX XXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="tourist@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="e.g., Goa Beach Checkpoint"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact *
                  </label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    placeholder="Emergency contact number"
                  />
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-center space-x-2 mt-4">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I confirm that I have verified the tourist's identification documents and have permission to create their digital ID.
                </label>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">⚠️</span>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition duration-200"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Digital ID...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">🆔</span>
                      <span>Create Blockchain ID</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Empty State - When no form and no user */}
        {!showForm && !user && !error && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">👤</span>
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-3">No Tourist Being Registered</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Click "Add New Tourist" above to begin creating a blockchain-based digital ID for a tourist.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
            >
              Get Started
            </button>
          </div>
        )}
      </div>

      {/* Card Footer - Stats */}
      <div className="bg-gray-50/80 border-t border-gray-200/60 p-4">
        <div className="flex justify-center space-x-6 text-sm text-gray-600">
          <span className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Blockchain Secured
          </span>
          <span className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            Real-time Tracking
          </span>
          <span className="flex items-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
            GDPR Compliant
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserRegistration;