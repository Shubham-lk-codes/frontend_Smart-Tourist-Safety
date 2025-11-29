import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import GeoFenceTracker from './components/GeoFenceTracker';
import LiveGeoMap from './components/LiveGeoMap';
import UserRegistration from './components/UserRegistration';
import UserLookup from './components/UserLookup';
import BlockchainInfo from './components/BlockchainInfo';
import AddGeofence from './components/AddGeofence';
import Tourist from './pages/turist';
import Police from './pages/police';


function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Smart Tourist Safety
            </h1>
            <p className="text-gray-600">
              Blockchain-powered user management with Geo-fencing
            </p>
          </header>

          {/* Routes for different stakeholders */}
          <main>
            <Routes>
              {/* Tourist Routes - Ab Tourist component ke andar nested routes honge */}
              <Route path="/tourist/*" element={<Tourist />} />
              
              {/* Police Routes */}
              <Route path="/police/*" element={<Police />} />
              <Route path="/police/lookup" element={<UserLookup />} />
              <Route path="/police/tracker" element={<GeoFenceTracker />} />
              <Route path="/police/map" element={<LiveGeoMap />} />
              
              {/* Tourism Department Routes */}
              <Route path="/tourism-department/blockchain" element={<BlockchainInfo />} />
              <Route path="/tourism-department/geofence" element={<AddGeofence />} />
              <Route path="/tourism-department/map" element={<LiveGeoMap />} />
              
              {/* Rescue Team Routes */}
              <Route path="/rescue-team/lookup" element={<UserLookup />} />
              <Route path="/rescue-team/tracker" element={<GeoFenceTracker />} />
              <Route path="/rescue-team/map" element={<LiveGeoMap />} />
              
              {/* Admin Routes */}
              <Route path="/admin/blockchain" element={<BlockchainInfo />} />
              <Route path="/admin/geofence" element={<AddGeofence />} />
              <Route path="/admin/users" element={<UserLookup />} />
              
              {/* System Admin Routes */}
              <Route path="/system-admin/blockchain" element={<BlockchainInfo />} />
              <Route path="/system-admin/geofence" element={<AddGeofence />} />
              <Route path="/system-admin/users" element={<UserLookup />} />
              
              {/* Default route */}
              <Route path="/" element={<Navigate to="/tourist" replace />} />
            </Routes>
          </main>

          <footer className="text-center mt-8 text-sm text-gray-500">
            <p>Blockchain User ID System with Real-time Geo-fencing</p>
          </footer>
        </div>
      </div>
    </Router>
  );
}

export default App;