import React, { useEffect } from 'react';
import { supabase } from './dbClient'; // adjust the path if needed

const Trips: React.FC = () => {
  useEffect(() => {
    const fetchTrips = async () => {
      const { data, error } = await supabase.from('trips').select('*');
      if (error) {
        console.error('Error fetching trips:', error.message);
      } else {
        console.log('Trips data:', data);
      }
    };
    fetchTrips();
  }, []);

  return <div>Check the console for trips data!</div>;
};

export default Trips;