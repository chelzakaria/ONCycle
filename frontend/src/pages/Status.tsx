import React from 'react';
import FilterBar, { type FilterBarValue } from '../components/FilterBar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Tooltip } from '@mui/material';
import { Pagination } from '@mui/material';
import { supabase } from '../dbClient';
import Alert from '@mui/material/Alert';
import carriageGreen from '../assets/carriage-green.svg';
import carriageYellow from '../assets/carriage-yellow.svg';
import carriageOrange from '../assets/carriage-orange.svg';
import carriageRed from '../assets/carriage-red.svg';
import frontGreen from '../assets/front-green.svg';
import frontYellow from '../assets/front-yellow.svg';
import frontOrange from '../assets/front-orange.svg';
import frontRed from '../assets/front-red.svg';
import Slide from '@mui/material/Slide';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import TrainIcon from '@mui/icons-material/Train';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { Box } from '@mui/material';

const NUM_COLUMNS = 24;
const COLUMN_WIDTH_PERCENT = 100 / NUM_COLUMNS;
const TRAIN_HEIGHT = 60; // px

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
  const [showAlert, setShowAlert] = React.useState(false);
  const [selectedTrain, setSelectedTrain] = React.useState<any[]>([]);
  const [openDialog, setOpenDialog] = React.useState(false);

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
    // const nextHour = (adjustedHour + 1) % 24;
    const format = (h: number) => {
      if (h === 0) return '12am';
      if (h < 12) return `${h}am`;
      if (h === 12) return '12pm';
      return `${h - 12}pm`;
    };
    return `${format(adjustedHour)}`;
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
      setShowAlert(true);
      // Auto hide after 3 seconds
      setTimeout(() => {
        setShowAlert(false);
      }, 1500);
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
    return column;
  };

  const getCarriagesNumber = (trainId: string) => {
    const trainTrips = trips.filter(t => t.train_id === trainId);
    const firstTrip = trainTrips.find(t => t.sequence === 1);
    const lastTrip = trainTrips.find(t => t.sequence === trainTrips.length);

    if (!firstTrip || !lastTrip) return 0;

    const timeToMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    let departure = timeToMinutes(firstTrip.theorical_departure_time);
    let arrival = timeToMinutes(lastTrip.theorical_arrival_time);

    // Handle midnight crossing
    if (arrival < departure) arrival += 24 * 60;

    const totalHours = Math.ceil((arrival - departure) / 60);
    return Math.max(0, totalHours - 1);
  };


  const getDelayDuration = (trainId: string) => {
    const trainTrips = trips.filter(t => t.train_id === trainId);
    const lastTrip = trainTrips.find(t => t.sequence === trainTrips.length);
    return {
      arrival: lastTrip.arrival_delay, departure: lastTrip.departure_delay
    };
  }

  // Use palette colors
  const palette = {
    green: '#5DD384',
    yellow: '#FAB902',
    orange: '#FB7A31',
    red: '#FF5B77',
  };
  function getDelayColor(delay: number) {
    if (delay < 5) return palette.green;
    if (delay < 15) return palette.yellow;
    if (delay < 30) return palette.orange;
    return palette.red;
  }
  function getDelayBg(delay: number) {
    const color = getDelayColor(delay);
    return color + '10';
  }

  const getCarriageImage = (delay: number): string => {
    if (delay < 5) return carriageGreen;
    if (delay < 15) return carriageYellow;
    if (delay < 30) return carriageOrange;
    return carriageRed;
  };

  const getFrontImage = (delay: number): string => {
    if (delay < 5) return frontGreen;
    if (delay < 15) return frontYellow;
    if (delay < 30) return frontOrange;
    return frontRed;
  };

  const handleTrainClick = (trainId: string) => {
    const trainTrips = trips.filter(trip => trip.train_id === trainId)
      .sort((a, b) => a.sequence - b.sequence);
    console.log('Train data for debugging:', trainTrips); // Debug log
    setSelectedTrain(trainTrips);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTrain([]);
  };

  // Helper to format time as HH:MM
  function formatTimeHHMM(time: string) {
    if (!time) return '';
    const [h, m] = time.split(':');
    return h && m ? `${h}:${m}` : time;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <FilterBar value={filter} onChange={setFilter} onSearch={handleSearch} />
      <div className="page-container" style={{
        position: 'relative',
        padding: 0,
        paddingBottom: 0,
        marginBottom: 0,
        margin: 0,
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
          {/* Alert Message */}
          <Slide direction="up" in={showAlert && trips.length > 0} mountOnEnter unmountOnExit>
            <Alert
              severity="success"
              sx={{
                position: 'absolute',
                bottom: '5%',
                left: '40%',
                transform: 'translateX(-50%)',
                zIndex: 5,
                width: 'auto',
                minWidth: '250px',
                fontSize: 15,
              }}
            >
              Trains fetched successfully
            </Alert>
          </Slide>
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
                      fontSize: 15,
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
              const delay = getDelayDuration(trainId).arrival;
              const carriageImage = getCarriageImage(delay);
              const frontImage = getFrontImage(delay);
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

                >
                  {[...Array(getCarriagesNumber(trainId))].map((_, carIdx) => (
                    <img
                      key={carIdx}
                      src={carriageImage}
                      alt={`Carriage ${carIdx + 1}`}
                      style={{
                        height: TRAIN_HEIGHT,
                        width: `${COLUMN_WIDTH_PERCENT}%`,
                        objectFit: 'contain',
                      }}
                      onClick={() => handleTrainClick(trainId)}
                    />
                  ))}
                  <img
                    src={frontImage}
                    alt="Train front"
                    style={{
                      height: TRAIN_HEIGHT,
                      width: `${COLUMN_WIDTH_PERCENT}%`,
                      objectFit: 'contain',
                    }}
                    onClick={() => handleTrainClick(trainId)}
                  />

                </div>
              );
            })}
          </div>

          {/* Itinerary Dialog */}
          <Dialog
            open={openDialog}
            onClose={handleCloseDialog}
            maxWidth="xs"
            fullWidth
            PaperProps={{
              sx: {
                backgroundColor: '#11161B',
                color: '#FFFFFF',
                border: '2px solid #3B4A59',
                borderRadius: 2,
                maxWidth: 500
              }
            }}
          >
            <DialogTitle sx={{
              // borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              // pb: 2,
              fontFamily: 'Urbanist, sans-serif',
              fontWeight: 400,
              fontSize: 20,
              color: '#B5B5B5',
              position: 'relative',
            }}>

              <IconButton
                aria-label="close"
                onClick={handleCloseDialog}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: '#B5B5B5',
                }}
                size="large"
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ mt: 1, minHeight: 400, fontFamily: 'Urbanist, sans-serif', position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                {/* Vertical dotted line */}
                {selectedTrain.length > 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 34, // Center of avatar (40px avatar + 16px ListItemAvatar default padding / 2)
                      top: 28, // Half avatar height (40px/2) + List padding
                      bottom: 28,
                      width: 0,
                      borderLeft: '3px dotted #B5B5B5',
                      zIndex: 0,
                      pointerEvents: 'none',
                    }}
                  />
                )}
                <List sx={{ width: '100%', bgcolor: 'transparent', padding: 0, margin: 0 }} dense>
                  {selectedTrain.map((trip) => {
                    // Avatar color by delay
                    let bgColor = '#FFF';
                    const delay = Math.max(trip.arrival_delay || 0, trip.departure_delay || 0);
                    if (delay < 5) bgColor = '#6FFF8D';
                    else if (delay < 15) bgColor = '#F7D154';
                    else if (delay < 30) bgColor = '#FF9800';
                    else bgColor = '#F44336';
                    return (
                      <ListItem key={trip.sequence} alignItems="flex-start" dense style={{ paddingTop: 2, paddingBottom: 2, minHeight: 36 }}>
                        <ListItemAvatar style={{ position: 'relative', zIndex: 1 }}>
                          <Avatar sx={{ bgcolor: bgColor }}>
                            <TrainIcon sx={{ color: '#232323' }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<span style={{ fontWeight: 700, fontSize: 17, color: '#FFF', fontFamily: 'Urbanist, sans-serif' }}>{trip.station_name}</span>}
                          secondary={
                            <span
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '180px 180px',
                                fontSize: 13,
                                color: '#FFF',
                                fontFamily: 'Urbanist, sans-serif',
                                gap: 5,
                              }}
                            >
                              {/* Arrival chip */}
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                {trip.theorical_arrival_time && (
                                  <Tooltip title={trip.arrival_delay > 0 ? `Delay: ${trip.arrival_delay} min` : ''} arrow disableHoverListener={!(trip.arrival_delay > 0)}>
                                    <Box sx={{ display: 'flex', px: 1.5, py: 0.5, borderRadius: 2, border: `2px solid ${getDelayColor(trip.arrival_delay || 0)}`, background: getDelayBg(trip.arrival_delay || 0), alignItems: 'center', cursor: 'pointer' }}>
                                      <span style={{ fontWeight: 700, marginRight: 4, fontSize: 13 }}>Arrival:</span>
                                      <span style={{ color: getDelayColor(trip.arrival_delay || 0), fontWeight: 700, fontSize: 13 }}>
                                        {formatTimeHHMM(trip.theorical_arrival_time)}
                                      </span>
                                    </Box>
                                  </Tooltip>
                                )}
                              </span>
                              {/* Departure chip */}
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                {trip.theorical_departure_time && (
                                  <Tooltip title={trip.departure_delay > 0 ? `Delay: ${trip.departure_delay} min` : ''} arrow disableHoverListener={!(trip.departure_delay > 0)}>
                                    <Box sx={{ display: 'flex', px: 1.5, py: 0.5, borderRadius: 2, border: `2px solid ${getDelayColor(trip.departure_delay || 0)}`, background: getDelayBg(trip.departure_delay || 0), alignItems: 'center', cursor: trip.departure_delay > 0 ? 'pointer' : 'default' }}>
                                      <span style={{ fontWeight: 700, marginRight: 4, fontSize: 13 }}>Departure:</span>
                                      <span style={{ color: getDelayColor(trip.departure_delay || 0), fontWeight: 700, fontSize: 13 }}>
                                        {formatTimeHHMM(trip.theorical_departure_time)}
                                      </span>
                                    </Box>
                                  </Tooltip>
                                )}
                              </span>
                            </span>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </div>
            </DialogContent>
          </Dialog>

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