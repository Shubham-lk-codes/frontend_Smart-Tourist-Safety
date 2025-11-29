import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GeoFenceTracker from '../components/GeoFenceTracker';
import LiveGeoMap from '../components/LiveGeoMap';
import UserRegistration from '../components/UserRegistration';


function Tourist() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Tourist Dashboard</h2>
      
      {/* Tourist ke liye navigation */}
      <nav className="mb-6">
        <div className="flex space-x-4">
          <a href="/tourist/registration" className="px-4 py-2  text-black rounded">Registration</a>
          <a href="/tourist/tracker" className="px-4 py-2 text-black rounded">Tracker</a>
          <a href="/tourist/map" className="px-4 py-2 bg- text-black rounded">Live Map</a>
        </div>
      </nav>

      {/* Nested Routes */}
      <Routes>
        <Route path="/" element={<Navigate to="/tourist/registration" replace />} />
        <Route path="/registration" element={<UserRegistration />} />
        <Route path="/tracker" element={<GeoFenceTracker />} />
        <Route path="/map" element={<LiveGeoMap />} />
      </Routes>
    </div>
  );
}

export default Tourist;