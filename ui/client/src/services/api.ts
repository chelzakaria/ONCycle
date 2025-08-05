const API_BASE_URL = 'http://localhost:3001/api/public';

export interface TripFilters {
  start_station?: string;
  end_station?: string;
  train_type?: string;
  date?: string;
}

export interface StatisticsFilters {
  from?: string;
  to?: string;
}

const getHeaders = () => ({
  'Content-Type': 'application/json',
});

export const fetchTrips = async (filters?: TripFilters): Promise<any[]> => {
  try {
    const params = new URLSearchParams();

    if (filters?.start_station) {
      params.append('initial_departure_station', filters.start_station);
    }
    if (filters?.end_station) {
      params.append('final_arrival_station', filters.end_station);
    }
    if (filters?.train_type) {
      params.append('train_type', filters.train_type);
    }
    if (filters?.date) {
      params.append('date', filters.date);
    }

    const response = await fetch(`${API_BASE_URL}/trips?${params.toString()}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching trips:', error);
    throw error;
  }
};

export const fetchTripsForStatistics = async (filters?: StatisticsFilters): Promise<any[]> => {
  try {
    const params = new URLSearchParams();

    if (filters?.from) {
      params.append('from', filters.from);
    }
    if (filters?.to) {
      params.append('to', filters.to);
    }

    const response = await fetch(`${API_BASE_URL}/trips/statistics?${params.toString()}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching trips for statistics:', error);
    throw error;
  }
};

export const fetchTrainDelays = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/train_delays`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching train delays:', error);
    throw error;
  }
};

export const fetchTrafficData = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/traffic`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching traffic data:', error);
    throw error;
  }
};