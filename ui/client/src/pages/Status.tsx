import React from 'react';
import FilterBar, { type FilterBarValue } from '../components/FilterBar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Divider, Tooltip } from '@mui/material';
import { Pagination } from '@mui/material';
import { fetchTrips, type TripFilters } from '../services/api';
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
const NUM_COLUMNS_MOBILE = 12;

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
  const [noDataFound, setNoDataFound] = React.useState(false);

  // Add responsive column detection
  const [isMobile, setIsMobile] = React.useState(false);
  const [trainsPerPage, setTrainsPerPage] = React.useState(12);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const calculateTrainsPerPageFromDOM = () => {
      // Find the first train element
      const firstTrainElement = document.querySelector('[data-train-index="0"]');
      if (!firstTrainElement) {
        setTrainsPerPage(12);
        return;
      }

      const trainRect = firstTrainElement.getBoundingClientRect();
      const containerElement = document.querySelector('.page-container');
      if (!containerElement) {
        setTrainsPerPage(12);
        return;
      }

      const containerRect = containerElement.getBoundingClientRect();

      const trainTop = trainRect.top - containerRect.top;
      const availableHeight = containerRect.height - trainTop - 50;

      const trainHeight = trainRect.height + 5;

      const calculatedTrainsPerPage = Math.max(6, Math.min(14, Math.floor(availableHeight / trainHeight)));

      setTrainsPerPage(calculatedTrainsPerPage);
    };

    const handleResize = () => {
      checkMobile();
      setTimeout(calculateTrainsPerPageFromDOM, 100);
    };

    checkMobile();
    window.addEventListener('resize', handleResize);

    if (trips.length > 0) {
      requestAnimationFrame(() => {
        setTimeout(calculateTrainsPerPageFromDOM, 50);
      });
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [trips.length]); // Re-run when number of trips changes

  const currentNumColumns = isMobile ? NUM_COLUMNS_MOBILE : NUM_COLUMNS;
  const currentColumnWidth = 100 / currentNumColumns;

  // Calculate the starting hour based on the first train's departure time
  const getTimelineStartHour = React.useMemo(() => {
    if (trips.length === 0) return 0;

    const firstTrip = trips.find(trip => trip.sequence === 1);
    if (!firstTrip?.scheduled_departure_time) return 0;

    const [hours] = firstTrip.scheduled_departure_time.split(':');
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
      setNoDataFound(false);
      return;
    }
    // prevent search if not all filters are selected
    if (!filter.departure || !filter.arrival || !filter.trainType || !filter.date) {
      setTrips([]); // Clear trips if not all filters are selected
      setShowAlert(true);
      setNoDataFound(false);
      // Auto hide after 3 seconds
      setTimeout(() => {
        setShowAlert(false);
      }, 1500);
      return;
    }

    try {
      const filters: TripFilters = {};
      if (filter.departure) filters.start_station = filter.departure.label;
      if (filter.arrival) filters.end_station = filter.arrival.label;
      if (filter.trainType) filters.train_type = filter.trainType.code;
      if (filter.date) filters.date = filter.date.format('YYYY-MM-DD');

      const data = await fetchTrips(filters);

      setTrips(data || []);
      setShowAlert(true);
      // If all filters are set and no data is found
      setNoDataFound((data || []).length === 0);
      // Auto hide after 3 seconds
      setTimeout(() => {
        setShowAlert(false);
        setNoDataFound(false);
      }, 1500);
    } catch (error) {
      console.error('Error fetching trips:', error);
    }
    setCurrentPage(0); // Reset to first page on new search
  };

  // Calculate number of unique train IDs
  const uniqueTrainIds = React.useMemo(() => {
    const trainIds = new Set(trips.map(trip => trip.train_id));
    return Array.from(trainIds);
  }, [trips]);

  // Get current page of trains (dynamic per page based on screen height)
  const currentTrains = React.useMemo(() => {
    const start = currentPage * trainsPerPage;
    return uniqueTrainIds.slice(start, start + trainsPerPage);
  }, [uniqueTrainIds, currentPage, trainsPerPage]);

  React.useEffect(() => {
    if (currentTrains.length > 0) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const firstTrainElement = document.querySelector('[data-train-index="0"]');
          if (firstTrainElement) {
            const trainRect = firstTrainElement.getBoundingClientRect();
            const containerElement = document.querySelector('.page-container');
            if (containerElement) {
              const containerRect = containerElement.getBoundingClientRect();
              const trainTop = trainRect.top - containerRect.top;
              const availableHeight = containerRect.height - trainTop - 50;
              const trainHeight = trainRect.height + 5;
              const calculatedTrainsPerPage = Math.max(6, Math.min(14, Math.floor(availableHeight / trainHeight)));
              setTrainsPerPage(calculatedTrainsPerPage);
            }
          }
        }, 50);
      });
    }
  }, [currentTrains.length]); // Re-run when current page trains change

  // Calculate starting column for each train based on theoretical departure time
  const getTrainStartColumn = (trainId: string) => {
    const firstSequenceTrip = trips.find(trip =>
      trip.train_id === trainId && trip.sequence === 1
    );

    if (!firstSequenceTrip?.scheduled_departure_time) {
      return 0;
    }

    const [hours] = firstSequenceTrip.scheduled_departure_time.split(':');
    const departureHour = parseInt(hours, 10);
    const column = (departureHour - getTimelineStartHour + 24) % 24;

    // Scale column position for mobile
    return isMobile ? Math.floor(column / 2) : column;
  };

  const getCarriagesNumber = (trainId: string) => {
    const trainTrips = trips.filter(t => t.train_id === trainId);
    const firstTrip = trainTrips.find(t => t.sequence === 1);
    const lastTrip = trainTrips.find(t => t.sequence === trainTrips.length);

    if (!firstTrip || !lastTrip) return 0;

    const timeToMinutes = (time: string) => {
      const [h, _] = time.split(':').map(Number);
      return h;
    };

    let departure = timeToMinutes(firstTrip.scheduled_departure_time);
    let arrival = timeToMinutes(lastTrip.scheduled_arrival_time);

    // Handle midnight crossing
    if (arrival < departure) arrival += 24;

    const totalHours = Math.floor(arrival - departure);
    const carriages = Math.max(0, totalHours);

    // On mobile, scale down carriages by half to match column reduction
    return isMobile ? Math.max(0, Math.floor(carriages / 2)) : carriages;
  };


  const getDelayDuration = (trainId: string) => {
    const trainTrips = trips.filter(t => t.train_id === trainId);
    const lastTrip = trainTrips.find(t => t.sequence === trainTrips.length);
    return {
      arrival: lastTrip.arrival_delay, departure: lastTrip.departure_delay
    };
  }

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
      <FilterBar value={filter}
        onChange={setFilter}
        onSearch={handleSearch}
        onReset={() => {
          setFilter(initialFilter);
          setTrips([]);
          setNoDataFound(false);
          setShowAlert(false);
          setCurrentPage(0);
        }} />
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
          {/* Alert for missing filters */}
          <Slide direction="up" in={showAlert && trips.length === 0 && !noDataFound} mountOnEnter unmountOnExit>
            <Alert
              severity="warning"
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
              Please select all filters to search for trains
            </Alert>
          </Slide>
          {/* Alert for no data found */}
          <Slide direction="up" in={showAlert && noDataFound} mountOnEnter unmountOnExit>
            <Alert
              severity="info"
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
              No trains found for the selected filters
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
            <div className="hidden md:flex" style={{
              height: 50,
              width: '100%',
              alignItems: 'center',
              backgroundColor: '#101418',
              position: 'sticky',
              top: 0,
              zIndex: 2,

            }}>
              {[...Array(currentNumColumns)].map((_, i) => (
                <Tooltip
                  key={i}
                  title={`This column represents the time interval ${getHourLabel(isMobile ? i * 2 : i)}`}
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
                    {getHourLabel(isMobile ? i * 2 : i)}
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
              {[...Array(currentNumColumns)].map((_, i) => (
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
                  data-train-index={index}
                  className={index === 0 ? "mt-[250px] sm:mt-[60px] md:mt-[50px]" : "mt-[5px]"}
                  style={{
                    position: 'relative',
                    height: 'auto',
                    // marginBottom: -45,
                    // marginTop: 50,
                    display: 'flex',
                    alignItems: 'center',
                    left: `${startColumn * currentColumnWidth}%`,
                  }}

                >
                  {[...Array(getCarriagesNumber(trainId))].map((_, carIdx) => (
                    <img
                      key={carIdx}
                      src={carriageImage}
                      alt={`Carriage ${carIdx + 1}`}
                      style={{
                        // height: TRAIN_HEIGHT,
                        height: 'auto',
                        width: `${currentColumnWidth}%`,
                        objectFit: 'contain',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleTrainClick(trainId)}

                    />
                  ))}
                  <img
                    src={frontImage}
                    alt="Train front"
                    style={{
                      // height: TRAIN_HEIGHT,
                      height: 'auto',
                      width: `${currentColumnWidth}%`,
                      objectFit: 'contain',
                      cursor: 'pointer',
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
                maxWidth: 420,

              }
            }}
          >
            <DialogTitle sx={{
              // borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              pb: 0,
              fontFamily: 'Urbanist, sans-serif',
              fontWeight: 500,
              fontSize: 18,
              color: '#FFFFFF',

            }}>
              Itinerary Delay Details — {selectedTrain[0]?.date}
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
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mt: 1, mb: 0 }} />
            <DialogContent sx={{ mt: 1, minHeight: 180, fontFamily: 'Urbanist, sans-serif', position: 'relative', overflowX: 'hidden', pl: 1, pr: 1 }}>
              <div style={{ position: 'relative' }}>
                {/* Vertical dotted line */}
                {selectedTrain.length > 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 34,
                      top: 28,
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
                                gridTemplateColumns: '150px 150px',
                                fontSize: 13,
                                color: '#FFF',
                                fontFamily: 'Urbanist, sans-serif',
                                gap: 0,
                              }}
                            >
                              {/* Arrival chip */}
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                {trip.actual_arrival_time && (
                                  <Tooltip title={`Delay: ${trip.arrival_delay > 59 ? Math.floor(trip.arrival_delay / 60) + 'h ' + (trip.arrival_delay % 60) + 'm' : trip.arrival_delay + ' min'}`} arrow >
                                    <Box sx={{ display: 'flex', px: 1.5, py: 0.5, borderRadius: 2, border: `2px solid ${getDelayColor(trip.arrival_delay || 0)}`, background: getDelayBg(trip.arrival_delay || 0), alignItems: 'center', cursor: 'pointer' }}>
                                      <span style={{ fontWeight: 700, marginRight: 4, fontSize: 13 }}>Arrival:</span>
                                      <span style={{ color: getDelayColor(trip.arrival_delay || 0), fontWeight: 700, fontSize: 13 }}>
                                        {formatTimeHHMM(trip.actual_arrival_time)}
                                      </span>
                                    </Box>
                                  </Tooltip>
                                )}
                              </span>
                              {/* Departure chip */}
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                {trip.actual_departure_time && (
                                  <Tooltip title={`Delay: ${trip.departure_delay > 59 ? Math.floor(trip.departure_delay / 60) + 'h ' + (trip.departure_delay % 60) + 'm' : trip.departure_delay + ' min'}`} arrow >
                                    <Box sx={{ display: 'flex', px: 1.5, py: 0.5, borderRadius: 2, border: `2px solid ${getDelayColor(trip.departure_delay || 0)}`, background: getDelayBg(trip.departure_delay || 0), alignItems: 'center', cursor: 'pointer' }} >
                                      <span style={{ fontWeight: 700, marginRight: 4, fontSize: 13 }}>Departure:</span>
                                      <span style={{ color: getDelayColor(trip.departure_delay || 0), fontWeight: 700, fontSize: 13 }}>
                                        {formatTimeHHMM(trip.actual_departure_time)}
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
          {uniqueTrainIds.length > trainsPerPage && (
            <div style={{
              position: 'absolute',
              bottom: 5,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10000,
            }}>
              <Pagination
                count={Math.ceil(uniqueTrainIds.length / trainsPerPage)}
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
          {/* Legend */}
          <div className="hidden md:flex fixed bottom-0 left-0 w-auto gap-4 p-4 z-50" >
            <span className="inline-flex items-center gap-x-1 rounded-tremor-small bg-emerald-100 px-2 py-1 text-tremor-label font-bold text-emerald-800 ring-1 ring-inset ring-emerald-600/10 dark:bg-emerald-400/20 dark:text-emerald-500 dark:ring-emerald-400/20">
              {/* <RiArrowUpLine className="-ml-0.5 size-4" aria-hidden={true} /> */}
              Delay {"<"} 5 min
            </span>

            <span className="inline-flex items-center gap-x-1 rounded-tremor-small bg-yellow-100 px-2 py-1 text-tremor-label font-bold text-yellow-800 ring-1 ring-inset ring-yellow-600/10 dark:bg-yellow-400/20 dark:text-yellow-500 dark:ring-yellow-400/20">
              {/* <RiArrowUpLine className="-ml-0.5 size-4" aria-hidden={true} /> */}
              Delay {"<"} 15 min
            </span>

            <span className="inline-flex items-center gap-x-1 rounded-tremor-small bg-orange-100 px-2 py-1 text-tremor-label font-bold text-orange-800 ring-1 ring-inset ring-orange-600/10 dark:bg-orange-400/20 dark:text-orange-500 dark:ring-orange-400/20">
              {/* <RiArrowUpLine className="-ml-0.5 size-4" aria-hidden={true} /> */}
              Delay {"<"} 30 min
            </span>

            <span className="inline-flex items-center gap-x-1 rounded-tremor-small bg-red-100 px-2 py-1 text-tremor-label font-bold text-red-800 ring-1 ring-inset ring-red-600/10 dark:bg-red-400/20 dark:text-red-500 dark:ring-red-400/20">
              {/* <RiArrowUpLine className="-ml-0.5 size-4" aria-hidden={true} /> */}
              Delay {"≥"} 30 min
            </span>

          </div>





        </div>
      </div>
    </LocalizationProvider >
  );
};

export default Status;