import React from 'react'
import GeoFenceTracker from './components/GeoFenceTracker';
import LiveGeoMap from './components/LiveGeoMap';
import UserRegistration from './components/UserRegistration';
import UserLookup from './components/UserLookup';
import BlockchainInfo from './components/BlockchainInfo';
import AddGeofence from './components/AddGeofence';

function Police() {
  return (
    <div>
        <GeoFenceTracker />
        <LiveGeoMap />
        <UserRegistration />

    </div>
  )
}

export default Police