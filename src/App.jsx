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
import Tourism from './pages/Tourism';
import Rescue from './pages/Rescue';
import Dashboard from './components/Dashboard';

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
              <Route path="/tourism-department" element={<Tourism />} />
             
              
              {/* Rescue Team Routes */}
              <Route path="/rescue-team" element={<Rescue />} />
              <Route path="/rescue-team/tracker" element={<GeoFenceTracker />} />
              <Route path="/rescue-team/map" element={<LiveGeoMap />} />
              <Route path="/dashboard" element={ <Dashboard />} />
              
             
           
              
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