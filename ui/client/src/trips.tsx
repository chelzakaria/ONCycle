import React, { useEffect } from 'react';
import { fetchTrips } from './services/api';

const Trips: React.FC = () => {
  useEffect(() => {
    const fetchTripsData = async () => {
      try {
        const data = await fetchTrips();
        console.log('Trips data:', data);
      } catch (error) {
        console.error('Error fetching trips:', error);
      }
    };
    fetchTripsData();
  }, []);

  return <div>Check the console for trips data!</div>;
};

export default Trips;