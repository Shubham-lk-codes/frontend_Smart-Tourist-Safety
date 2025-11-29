// pages/Tourism.js
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import LiveGeoMap from '../components/LiveGeoMap';
import AddGeofence from '../components/AddGeofence';


const Tourism = () => {
  return (
    <div>
      <AddGeofence />
      <LiveGeoMap />
    </div>
  );
};

export default Tourism;