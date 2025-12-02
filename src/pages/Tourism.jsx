// pages/Tourism.js
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import LiveGeoMap from '../components/LiveGeoMap';
import AddGeofence from '../components/AddGeofence';
import GeofenceList from '../components/GeofenceList';
import UserRegistration from '../components/UserRegistration';


const Tourism = () => {
  return (
    <div>
      {/* <GeofenceList /> */}
      <UserRegistration />
      <AddGeofence />
      <LiveGeoMap />
    </div>
  );
};

export default Tourism;