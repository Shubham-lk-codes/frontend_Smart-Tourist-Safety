// src/components/MLStatus.jsx
import React, { useState, useEffect } from 'react';

const MLStatus = () => {
  const [mlStatus, setMlStatus] = useState('checking');
  const [lastChecked, setLastChecked] = useState(null);

  const checkMLStatus = async () => {
    try {
      const response = await fetch('http://localhost:5001/health');
      const data = await response.json();
      setMlStatus(data.status === 'healthy' ? 'healthy' : 'unhealthy');
    } catch (error) {
      setMlStatus('unavailable');
    }
    setLastChecked(new Date());
  };

  useEffect(() => {
    checkMLStatus();
    const interval = setInterval(checkMLStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (mlStatus) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-500';
      case 'unhealthy': return 'bg-red-100 text-red-800 border-red-500';
      case 'unavailable': return 'bg-yellow-100 text-yellow-800 border-yellow-500';
      default: return 'bg-gray-100 text-gray-800 border-gray-500';
    }
  };

  const getStatusText = () => {
    switch (mlStatus) {
      case 'healthy': return '🤖 ML: Active';
      case 'unhealthy': return '🤖 ML: Error';
      case 'unavailable': return '🤖 ML: Offline';
      default: return '🤖 ML: Checking...';
    }
  };

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm border ${getStatusColor()}`}>
      <span>{getStatusText()}</span>
      {lastChecked && (
        <span className="ml-2 text-xs opacity-75">
          ({Math.floor((new Date() - lastChecked) / 1000)}s ago)
        </span>
      )}
      <button 
        onClick={checkMLStatus}
        className="ml-2 text-xs underline"
        title="Check ML Status"
      >
        ⟳
      </button>
    </div>
  );
};

export default MLStatus;