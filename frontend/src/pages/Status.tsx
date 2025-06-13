import React, { useState } from 'react';
import FilterBar, { type FilterBarValue } from '../components/FilterBar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import FrontSVG from '../assets/front.svg';
import CarriageSVG from '../assets/carriage.svg';
import Tooltip from '@mui/material/Tooltip';
import { supabase } from '../dbClient';

const NUM_COLUMNS = 24;
const CARRIAGES_PER_TRAIN = 5;
const COLUMN_WIDTH_PERCENT = 100 / NUM_COLUMNS;
const TRAIN_HEIGHT = 60; // px
const TRAIN_START_COLUMNS = [0, 3, 6, 10, 15, 0, 3, 6, 10, 15]; // Example start columns for each train
const GAP = -25; // px vertical gap between trains

// Helper to generate hour labels
const getHourLabel = (hour: number) => {
  const nextHour = (hour + 1) % 24;
  const format = (h: number) => {
    if (h === 0) return '12am';
    if (h < 12) return `${h}am`;
    if (h === 12) return '12pm';
    return `${h - 12}pm`;
  };
  return `${format(hour)}-${format(nextHour)}`;
};

const initialFilter: FilterBarValue = {
  departure: null,
  arrival: null,
  trainType: null,
  date: null,
};

const Status: React.FC = () => {
  const [filter, setFilter] = React.useState<FilterBarValue>(initialFilter);
  const [trips, setTrips] = React.useState<any[]>([]);

  const handleSearch = async () => {
    let query = supabase.from('trips').select('*');
    if (filter.departure) query = query.eq('initial_departure_station', filter.departure.label);
    if (filter.arrival) query = query.eq('final_arrival_station', filter.arrival.label);
    if (filter.trainType) query = query.eq('train_type', filter.trainType.code);
    if (filter.date) query = query.eq('date', filter.date.format('YYYY-MM-DD'));
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching trips:', error.message);
    } else {
      console.log('First trip data structure:', data?.[0]);
      setTrips(data || []);
    }
  };

  // Calculate number of unique train IDs
  const uniqueTrainIds = React.useMemo(() => {
    const trainIds = new Set(trips.map(trip => trip.train_id));
    console.log('Unique train IDs:', Array.from(trainIds));
    return Array.from(trainIds);
  }, [trips]);

  // Calculate starting column for each train based on theoretical departure time
  const getTrainStartColumn = (trainId: string) => {
    console.log('Finding start column for train:', trainId);
    const firstSequenceTrip = trips.find(trip => 
      trip.train_id === trainId && trip.sequence === 1
    );
    console.log('First sequence trip found:', firstSequenceTrip);
    
    if (!firstSequenceTrip?.theorical_departure_time) {
      console.log('No departure time found, defaulting to 0');
      console.log('Trips:', trips);
      console.log('First sequence trip:', firstSequenceTrip);
      return 0;
    }
    
    const [hours] = firstSequenceTrip.theorical_departure_time.split(':');
    const column = parseInt(hours, 10);
    console.log('Departure time:', firstSequenceTrip.theorical_departure_time);
    console.log('Hours extracted:', hours);
    console.log('Calculated column:', column);
    return column;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <FilterBar value={filter} onChange={setFilter} onSearch={handleSearch} />
      <div className="page-container" style={{ 
        position: 'relative', 
        padding: 0,
        paddingBottom: 0,
        marginBottom: 0,
        margin: 0,
        height: 'calc(100vh - 170px)', // Account for navbar (75px) and filter bar (95px)
        marginTop: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Content Container */}
        <div style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Columns background with integrated timeline */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '1%',
            width: '99%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1,
            pointerEvents: 'none',
          }}>
            {/* Timeline header */}
            <div style={{
              height: 50,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#101418',
              position: 'sticky',
              top: 0,
              zIndex: 2,
            }}>
              {[...Array(NUM_COLUMNS)].map((_, i) => (
                <Tooltip
                  key={i}
                  title={`This column represents the time interval ${i.toString().padStart(2, '0')}:00 to ${((i + 1) % 24).toString().padStart(2, '0')}:00`}
                  placement="top-start"
                >
                  <div
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      color: '#B5B5B5',
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: 'Urbanist, sans-serif',
                      letterSpacing: 0.5,
                      userSelect: 'none',
                      background: 'transparent',
                      padding: '2px 0',
                      cursor: 'help',
                      pointerEvents: 'auto',
                    }}
                  >
                    {getHourLabel(i)}
                  </div>
                </Tooltip>
              ))}
            </div>
            {/* Column backgrounds */}
            <div style={{
              flex: 1,
              display: 'flex',
              width: '100%',
            }}>
              {[...Array(NUM_COLUMNS)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: '100%',
                    background: i % 2 === 0 ? '#101418' : '#11161B',
                    transition: 'background 0.2s',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Trains Container */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '1%',
            width: '99%',
            height: '100%',
            zIndex: 2,
            pointerEvents: 'auto',
            margin: 0,
            padding: 0,
            overflow: 'auto'
          }}>
            {uniqueTrainIds.map((trainId, index) => {
              const totalCars = CARRIAGES_PER_TRAIN + 1; // +1 for front
              const startColumn = getTrainStartColumn(trainId);
              return (
                <div
                  key={trainId}
                  style={{
                    position: 'relative',
                    height: 100,
                    marginBottom: -40,
                    marginTop: index === 0 ? 20 : 0, // Add top margin only to first train
                    display: 'flex',
                    alignItems: 'center',
                    left: `${startColumn * COLUMN_WIDTH_PERCENT}%`,
                  }}
                >
                  {[...Array(CARRIAGES_PER_TRAIN)].map((_, carIdx) => (
                    <img
                      key={carIdx}
                      src={CarriageSVG}
                      alt="Carriage"
                      style={{ height: TRAIN_HEIGHT, width: `calc(1 * ${COLUMN_WIDTH_PERCENT}vw)`, objectFit: 'contain' }}
                    />
                  ))}
                  <img
                    src={FrontSVG}
                    alt="Train Front"
                    style={{ height: TRAIN_HEIGHT, width: `calc(1 * ${COLUMN_WIDTH_PERCENT}vw)`, objectFit: 'contain' }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default Status;