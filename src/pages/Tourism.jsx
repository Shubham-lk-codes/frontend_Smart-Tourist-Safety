// pages/Tourism.js
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import LiveGeoMap from '../components/LiveGeoMap';
import AddGeofence from '../components/AddGeofence';
import GeofenceList from '../components/GeofenceList';
import UserRegistration from '../components/UserRegistration';


const Tourism = () => {
  return (
    <div className='m-10'>
      {/* <GeofenceList /> */}
      <div className='mb-10'>
        <UserRegistration />
      </div>
      <AddGeofence />
      {/* <LiveGeoMap /> */}
    </div>
  );
};

export default Tourism;