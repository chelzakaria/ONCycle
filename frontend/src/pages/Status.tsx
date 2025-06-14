import React, { useState } from 'react';
import FilterBar, { type FilterBarValue } from '../components/FilterBar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import FrontSVG from '../assets/front.svg';
import CarriageSVG from '../assets/carriage.svg';
import { Tooltip } from '@mui/material';
import { Pagination } from '@mui/material';
import { supabase } from '../dbClient';

const NUM_COLUMNS = 24;
const CARRIAGES_PER_TRAIN = 5;
const COLUMN_WIDTH_PERCENT = 100 / NUM_COLUMNS;
const TRAIN_HEIGHT = 60; // px
const TRAIN_START_COLUMNS = [0, 3, 6, 10, 15, 0, 3, 6, 10, 15]; // Example start columns for each train
const GAP = -25; // px vertical gap between trains

const initialFilter: FilterBarValue = {
  departure: null,
  arrival: null,
  trainType: null,
  date: null,
};

const Status: React.FC = () => {
  const [filter, setFilter] = React.useState<FilterBarValue>(initialFilter);
  const [trips, setTrips] = React.useState<any[]>([]);
  const [currentPage, setCurrentPage] = React.useState(0);

  // Calculate the starting hour based on the first train's departure time
  const getTimelineStartHour = React.useMemo(() => {
    if (trips.length === 0) return 0;

    const firstTrip = trips.find(trip => trip.sequence === 1);
    if (!firstTrip?.theorical_departure_time) return 0;

    const [hours] = firstTrip.theorical_departure_time.split(':');
    return parseInt(hours, 10);
  }, [trips]);

  // Helper to generate hour labels based on start hour
  const getHourLabel = (hour: number) => {
    const adjustedHour = (getTimelineStartHour + hour) % 24;
    const nextHour = (adjustedHour + 1) % 24;
    const format = (h: number) => {
      if (h === 0) return '12am';
      if (h < 12) return `${h}am`;
      if (h === 12) return '12pm';
      return `${h - 12}pm`;
    };
    return `${format(adjustedHour)}-${format(nextHour)}`;
  };

  const handleSearch = async () => {
    // Check if any filter is selected
    if (!filter.departure && !filter.arrival && !filter.trainType && !filter.date) {
      setTrips([]); // Clear trips if no filters are selected
      return;
    }

    let query = supabase.from('trips').select('*').order('theorical_departure_time', { ascending: true });
    if (filter.departure) query = query.eq('initial_departure_station', filter.departure.label);
    if (filter.arrival) query = query.eq('final_arrival_station', filter.arrival.label);
    if (filter.trainType) query = query.eq('train_type', filter.trainType.code);
    if (filter.date) query = query.eq('date', filter.date.format('YYYY-MM-DD'));
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching trips:', error.message);
    } else {
      console.log('Fetched trips:', data);

      setTrips(data || []);
    }
    setCurrentPage(0); // Reset to first page on new search
  };

  // Calculate number of unique train IDs
  const uniqueTrainIds = React.useMemo(() => {
    const trainIds = new Set(trips.map(trip => trip.train_id));
    return Array.from(trainIds);
  }, [trips]);

  // Get current page of trains (12 per page)
  const currentTrains = React.useMemo(() => {
    const start = currentPage * 12;
    return uniqueTrainIds.slice(start, start + 12);
  }, [uniqueTrainIds, currentPage]);

  // Calculate starting column for each train based on theoretical departure time
  const getTrainStartColumn = (trainId: string) => {
    const firstSequenceTrip = trips.find(trip =>
      trip.train_id === trainId && trip.sequence === 1
    );

    if (!firstSequenceTrip?.theorical_departure_time) {
      return 0;
    }

    const [hours] = firstSequenceTrip.theorical_departure_time.split(':');
    const departureHour = parseInt(hours, 10);
    const column = (departureHour - getTimelineStartHour + 24) % 24;
    console.log(`Train ${trainId} - Departure: ${hours}:00, Column: ${column}, Position: ${column * COLUMN_WIDTH_PERCENT}%`);
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
        // height: 'calc(100vh - 170px)', // Account for navbar (75px) and filter bar (95px)
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
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          marginBottom: 0
        }}>
          {/* Columns background with integrated timeline */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '0.5%',
            right: '0.5%',
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
                  title={`This column represents the time interval ${getHourLabel(i)}`}
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
            left: '0.5%',
            right: '0.5%',
            width: '99%',
            height: '100%',
            zIndex: 2,
            pointerEvents: 'auto',
            padding: 0,
          }}>
            {currentTrains.map((trainId, index) => {
              const startColumn = getTrainStartColumn(trainId);
              return (
                <div
                  key={trainId}
                  style={{
                    position: 'relative',
                    height: 100,
                    marginBottom: -45,
                    marginTop: index === 0 ? 20 : 0,
                    display: 'flex',
                    alignItems: 'center',
                    left: `${startColumn * COLUMN_WIDTH_PERCENT}%`,
                  }}
                  onMouseEnter={() => console.log(`Train ID: ${trainId}`)}
                >
                  {[...Array(CARRIAGES_PER_TRAIN)].map((_, carIdx) => (
                    <img
                      key={carIdx}
                      src={CarriageSVG}
                      alt="Carriage"
                      style={{
                        height: TRAIN_HEIGHT,
                        width: `${COLUMN_WIDTH_PERCENT}%`,
                        objectFit: 'contain'
                      }}
                    />
                  ))}
                  <img
                    src={FrontSVG}
                    alt="Train Front"
                    style={{
                      height: TRAIN_HEIGHT,
                      width: `${COLUMN_WIDTH_PERCENT}%`,
                      objectFit: 'contain'
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {uniqueTrainIds.length > 12 && (
            <div style={{
              position: 'absolute',
              bottom: 5,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 3,
            }}>
              <Pagination
                count={Math.ceil(uniqueTrainIds.length / 12)}
                page={currentPage + 1}
                onChange={(_, page) => setCurrentPage(page - 1)}
                color="primary"
                size="medium"
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: '#FFFFFF',
                    '&.Mui-selected': {
                      backgroundColor: '#FFFFFF',
                      color: '#101418',
                      '&:hover': {
                        backgroundColor: '#FFFFFF',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>
    </LocalizationProvider>
  );
};

export default Status;