// import React, { useState } from 'react';
// import GeoFenceTracker from './components/GeoFenceTracker';
// import LiveGeoMap from './components/LiveGeoMap';

// function App() {
//   const [activeTab, setActiveTab] = useState('tracker');

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
//       <div className="container mx-auto px-4">
//         <header className="text-center mb-8">
//           <h1 className="text-4xl font-bold text-gray-800 mb-2">
//             Smart Tourist Safety
//           </h1>
//           <p className="text-gray-600">
//             Monitor your location within safe zones
//           </p>
//         </header>

//         {/* Tab Navigation */}
//         <div className="flex justify-center mb-8">
//           <div className="bg-white rounded-lg p-1 shadow-sm">
//             <button
//               onClick={() => setActiveTab('tracker')}
//               className={`px-6 py-2 rounded-md font-medium transition duration-200 ${
//                 activeTab === 'tracker'
//                   ? 'bg-blue-500 text-white'
//                   : 'text-gray-600 hover:text-blue-500'
//               }`}
//             >
//               Location Check
//             </button>
//             <button
//               onClick={() => setActiveTab('map')}
//               className={`px-6 py-2 rounded-md font-medium transition duration-200 ${
//                 activeTab === 'map'
//                   ? 'bg-blue-500 text-white'
//                   : 'text-gray-600 hover:text-blue-500'
//               }`}
//             >
//               Live Map
//             </button>
//           </div>
//         </div>

//         {/* Content */}
//         <main>
//           {activeTab === 'tracker' && <GeoFenceTracker />}
//           {activeTab === 'map' && <LiveGeoMap />}
//         </main>

//         {/* Status */}
//         <footer className="text-center mt-8 text-sm text-gray-500">
//           <p>Make sure your backend server is running on http://localhost:3000</p>
//         </footer>
//       </div>
//     </div>
//   );
// }

// export default App;

import React, { useState } from 'react';
import GeoFenceTracker from './components/GeoFenceTracker';
import LiveGeoMap from './components/LiveGeoMap';
import UserRegistration from './components/UserRegistration';
import UserLookup from './components/UserLookup';
import BlockchainInfo from './components/BlockchainInfo';

function App() {
  const [activeTab, setActiveTab] = useState('blockchain');

  const tabs = [
    { id: 'blockchain', name: 'Blockchain Info' },
    { id: 'register', name: 'User Registration' },
    { id: 'lookup', name: 'User Lookup' },
    { id: 'tracker', name: 'Geo Tracker' },
    { id: 'map', name: 'Live Map' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'register':
        return <UserRegistration />;
      case 'lookup':
        return <UserLookup />;
      case 'tracker':
        return <GeoFenceTracker />;
      case 'map':
        return <LiveGeoMap />;
      case 'blockchain':
      default:
        return <BlockchainInfo />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Smart Tourist Safety
          </h1>
          <p className="text-gray-600">
            Blockchain-powered user management system
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm flex flex-wrap justify-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md font-medium transition duration-200 m-1 ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <main>
          {renderContent()}
        </main>

        {/* Status */}
        <footer className="text-center mt-8 text-sm text-gray-500">
          <p>Blockchain User ID System - Secure and Immutable</p>
        </footer>
      </div>
    </div>
  );
}

export default App;