import React from 'react';
import ForecastBar, { type ForecastBarValue } from '../components/ForecastBar';
import { fetchTrafficData, predictDelays } from '../services/api';
import { Box, Paper, Typography, Grid, Stack, Divider, Button, Slide, Alert, Pagination, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, ListItemAvatar, Avatar, IconButton, Tooltip } from '@mui/material';
import Train from '../assets/Train.svg';
import TrainRed from '../assets/train-red.svg';
import TrainOrange from '../assets/train-orange.svg';
import TrainGreen from '../assets/train-green.svg';
import TrainYellow from '../assets/train-yellow.svg';
import TrainIcon from '@mui/icons-material/Train';
import CloseIcon from '@mui/icons-material/Close';


interface TrafficRecord {
  id: number;
  train_id: string;
  sequence: number;
  current_station: string;
  next_station: string;
  train_type: string;
  scheduled_departure_time?: string;
  scheduled_arrival_time?: string;
}
interface PredictionResult {
  train_id: string;
  arrival_delay: number;
  departure_delay: number;
}

interface StationPrediction {
  station_name: string;
  scheduled_departure_time?: string;
  scheduled_arrival_time?: string;
  arrival_delay?: number;
  departure_delay?: number;
  sequence: number;
}
const Forecast: React.FC = () => {
  const [barValue, setBarValue] = React.useState<ForecastBarValue>({
    departure: null,
    arrival: null,
    date: null
  });
  const [trafficData, setTrafficData] = React.useState<TrafficRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [foundTrips, setFoundTrips] = React.useState<TrafficRecord[][]>([]);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [showAlert, setShowAlert] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [lastSearchParams, setLastSearchParams] = React.useState<string>('');


  const [predictionsRes, setPredictions] = React.useState<Record<string, PredictionResult>>({});
  const [loadingPredictions, setLoadingPredictions] = React.useState<Record<string, boolean>>({});
  const [allStationPredictions, setAllStationPredictions] = React.useState<Record<string, StationPrediction[]>>({});
  const [selectedTrain, setSelectedTrain] = React.useState<StationPrediction[]>([]);
  const [openDialog, setOpenDialog] = React.useState(false);
  const TRIPS_PER_PAGE = 5;

  // Load traffic data on component mount
  React.useEffect(() => {
    const loadTrafficData = async () => {
      try {
        const data = await fetchTrafficData();
        setTrafficData(data);
      } catch (error) {
        console.error('Error loading traffic data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrafficData();
  }, []);

  const handlePredict = async (trainId: string) => {
    // Prevent multiple requests for the same train
    if (loadingPredictions[trainId] || predictionsRes[trainId]) {
      return;
    }

    // Set loading state for this train
    setLoadingPredictions(prev => ({ ...prev, [trainId]: true }));

    try {
      const selectedTrip = foundTrips.find(trip => trip[0].train_id === trainId);

      if (!selectedTrip || selectedTrip.length < 1) {
        console.error('Selected trip not found or has insufficient stations');
        return;
      }

      //  Quick prediction for first and last stations
      const quickPredictions = [
        {
          train_id: trainId,
          scheduled_departure_time: selectedTrip[0].scheduled_departure_time || '',
          trip_date: barValue.date ? barValue.date.format('YYYY-MM-DD') : ''
        },
        {
          train_id: trainId,
          scheduled_departure_time: selectedTrip[selectedTrip.length - 1].scheduled_departure_time || '',
          trip_date: barValue.date ? barValue.date.format('YYYY-MM-DD') : ''
        }
      ];


      const quickResults = await predictDelays(quickPredictions);


      // Set initial predictions immediately (for train color and basic display)
      const firstStationResult = quickResults.predictions[0];
      const lastStationResult = quickResults.predictions[1];

      setPredictions(prev => ({
        ...prev,
        [trainId]: {
          train_id: trainId,
          arrival_delay: Math.round(lastStationResult?.result.arrival_delay || 0),
          departure_delay: Math.round(firstStationResult?.result.departure_delay || 0)
        }
      }));


      const basicStations: StationPrediction[] = [];


      basicStations.push({
        station_name: selectedTrip[0].current_station,
        scheduled_departure_time: selectedTrip[0].scheduled_departure_time,
        departure_delay: Math.round(firstStationResult?.result.departure_delay || 0),
        sequence: selectedTrip[0].sequence
      });

      const lastStation = selectedTrip[selectedTrip.length - 1];
      basicStations.push({
        station_name: lastStation.next_station,
        scheduled_arrival_time: lastStation.scheduled_arrival_time,
        arrival_delay: Math.round(lastStationResult?.result.arrival_delay || 0),
        sequence: lastStation.sequence + 1
      });

      setAllStationPredictions(prev => ({
        ...prev,
        [trainId]: basicStations
      }));

      setLoadingPredictions(prev => ({ ...prev, [trainId]: false }));

      //  Predict intermediate stations in background (if any exist)
      if (selectedTrip.length > 1) {

        const intermediatePredictions = selectedTrip.slice(1).map(station => ({
          train_id: trainId,
          scheduled_departure_time: station.scheduled_departure_time || '',
          trip_date: barValue.date ? barValue.date.format('YYYY-MM-DD') : ''
        }));

        const intermediateResults = await predictDelays(intermediatePredictions);

        const completeStations: StationPrediction[] = [];

        completeStations.push({
          station_name: selectedTrip[0].current_station,
          scheduled_departure_time: selectedTrip[0].scheduled_departure_time,
          departure_delay: Math.round(firstStationResult?.result.departure_delay || 0),
          sequence: selectedTrip[0].sequence
        });

        selectedTrip.slice(1).forEach((station, index) => {
          const predictionResult = intermediateResults.predictions[index];
          completeStations.push({
            station_name: station.current_station,
            scheduled_departure_time: station.scheduled_departure_time,
            scheduled_arrival_time: station.scheduled_arrival_time,
            arrival_delay: Math.round(predictionResult?.result.arrival_delay || 0),
            departure_delay: Math.round(predictionResult?.result.departure_delay || 0),
            sequence: station.sequence
          });
        });

        completeStations.push({
          station_name: lastStation.next_station,
          scheduled_arrival_time: lastStation.scheduled_arrival_time,
          arrival_delay: Math.round(lastStationResult?.result.arrival_delay || 0),
          sequence: lastStation.sequence + 1
        });

        setAllStationPredictions(prev => ({
          ...prev,
          [trainId]: completeStations
        }));

      }

      return quickResults;
    } catch (error) {
      console.error('Error predicting delays:', error);
      setLoadingPredictions(prev => ({ ...prev, [trainId]: false }));
    }
  };
  const getTrainImage = (trainId: string) => {
    const prediction = predictionsRes[trainId];
    if (!prediction) return Train;

    const delay = prediction.arrival_delay;
    if (delay <= 5) return TrainGreen;
    if (delay < 15) return TrainYellow;
    if (delay < 30) return TrainOrange;
    return TrainRed;
  };

  const handleTrainClick = (trainId: string) => {
    if (!predictionsRes[trainId] || loadingPredictions[trainId]) {
      return;
    }

    const stationPredictions = allStationPredictions[trainId];
    if (stationPredictions && stationPredictions.length > 0) {
      setSelectedTrain(stationPredictions);
      setOpenDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTrain([]);
  };

  const getDelayColor = (delay: number) => {
    if (delay < 5) return '#5DD384';
    if (delay < 15) return '#FAB902';
    if (delay < 30) return '#FB7A31';
    return '#FF5B77';
  };

  const getDelayBg = (delay: number) => {
    const color = getDelayColor(delay);
    return color + '10';
  };

  const formatTimeHHMM = (time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    return h && m ? `${h}:${m}` : time;
  };
  const handleReset = () => {
    setBarValue({
      departure: null,
      arrival: null,
      date: null
    });
    setFoundTrips([]);
    setHasSearched(false);
    setShowAlert(false);
    setCurrentPage(1);
    setLastSearchParams('');
    setPredictions({});
    setLoadingPredictions({});
    setAllStationPredictions({});
    setOpenDialog(false);
    setSelectedTrain([]);
  };

  const handleFindTrips = () => {
    const { departure, arrival, date } = barValue;



    // Check if all fields are selected
    if (!departure || !arrival || !date) {
      setShowAlert(true);
      // Auto hide after 1.5 seconds
      setTimeout(() => {
        setShowAlert(false);
      }, 1500);
      return;
    }

    // Create search params string to check if search is the same
    const searchParams = `${departure.label}-${arrival.label}-${date.format('YYYY-MM-DD')}`;

    // Prevent search if the same parameters are used
    if (searchParams === lastSearchParams) {
      return;
    }

    setHasSearched(true); // Mark that search has been performed
    setLastSearchParams(searchParams); // Update last search params
    setCurrentPage(1); // Reset to first page on new search

    // Find train_ids with selected departure station
    const trainIdsWithDeparture = trafficData
      .filter(r => r.current_station === departure.label)
      .map(r => r.train_id);



    // Find max sequence for each train_id at departure station
    const maxSequenceByTrainId: Record<string, number> = {};
    trainIdsWithDeparture.forEach(trainId => {
      const maxSeq = Math.max(
        ...trafficData
          .filter(r => r.train_id === trainId && r.current_station === departure.label)
          .map(r => r.sequence)
      );
      maxSequenceByTrainId[trainId] = maxSeq;
    });



    const allTrips: TrafficRecord[][] = [];
    // Get day of week as string ('0' for Sunday, '1' for Monday, etc.)
    const dayOfWeek = date.day().toString();



    trainIdsWithDeparture.forEach(trainId => {

      const trainRecords = trafficData
        .filter(r => r.train_id === trainId)
        .sort((a, b) => a.sequence - b.sequence);


      // Check if any record for this train has the selected day in its day_of_week
      const hasValidDay = trainRecords.some(
        r =>
          // @ts-ignore
          Array.isArray(r.day_of_week) && r.day_of_week.includes(dayOfWeek)
      );


      if (!hasValidDay) {

        return;
      }

      const depIdx = trainRecords.findIndex(r => r.current_station === departure.label);
      const arrIdx = trainRecords.findIndex(r => r.next_station === arrival.label && r.sequence > depIdx);



      if (depIdx !== -1 && arrIdx !== -1 && depIdx <= arrIdx) {
        const trip = trainRecords.slice(depIdx, arrIdx + 1);

        // Filter trips based on current time and selected date
        const firstStation = trip[0];
        const scheduledDepartureTime = firstStation.scheduled_departure_time;

        // Check if selected date is today
        const today = new Date();
        const selectedDate = date.toDate(); // Convert dayjs to Date
        const isToday = today.toDateString() === selectedDate.toDateString();

        if (scheduledDepartureTime && isToday) {
          const currentHour = today.getHours();
          const currentMinute = today.getMinutes();
          const currentTimeInMinutes = currentHour * 60 + currentMinute;

          const [depHour, depMinute] = scheduledDepartureTime.split(':').map(Number);
          const scheduledTimeInMinutes = depHour * 60 + depMinute;

          if (scheduledTimeInMinutes > currentTimeInMinutes) {
            allTrips.push(trip);
          }
        } else {
          allTrips.push(trip);
        }
      } else {
      }
    });

    // Sort trips by scheduled departure time descending
    allTrips.sort((a, b) => {
      const timeA = a[0].scheduled_departure_time || '00:00';
      const timeB = b[0].scheduled_departure_time || '00:00';

      const [hourA, minuteA] = timeA.split(':').map(Number);
      const [hourB, minuteB] = timeB.split(':').map(Number);

      const timeInMinutesA = hourA * 60 + minuteA;
      const timeInMinutesB = hourB * 60 + minuteB;

      return timeInMinutesA - timeInMinutesB;
    });

    setFoundTrips(allTrips);




    if (allTrips.length === 0) {
      setTimeout(() => {
        setHasSearched(false);
      }, 3000);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(foundTrips.length / TRIPS_PER_PAGE);
  const startIndex = (currentPage - 1) * TRIPS_PER_PAGE;
  const endIndex = startIndex + TRIPS_PER_PAGE;
  const currentTrips = foundTrips.slice(startIndex, endIndex);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 0,
      gap: 10,
      padding: '0 8px'
    }}>
      <ForecastBar
        value={barValue}
        onChange={setBarValue}
        onPredict={handlePredict}
        onReset={handleReset}
        onFindTrips={handleFindTrips}
        trafficData={trafficData}
        loading={loading}
        foundTrips={foundTrips}
      />

      {/* Validation alert - show when not all fields are selected */}
      {showAlert && (
        <Slide direction="up" in={true} mountOnEnter unmountOnExit>
          <Alert
            severity="warning"
            sx={{
              position: 'fixed',
              bottom: '5%',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              width: 'auto',
              minWidth: { xs: '280px', sm: '300px', md: '320px', lg: '350px' },
              maxWidth: '90vw',
              fontSize: 15,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            Please select all fields before searching.
          </Alert>
        </Slide>
      )}

      {/* No trips found alert - only show when searched and no results */}
      {hasSearched && foundTrips.length === 0 && !showAlert && (
        <Slide direction="up" in={true} mountOnEnter unmountOnExit>
          <Alert
            severity="info"
            sx={{
              position: 'fixed',
              bottom: '5%',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              width: 'auto',
              minWidth: { xs: '220px', sm: '250px', md: '270px', lg: '300px' },
              maxWidth: '90vw',
              fontSize: 15,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            No trips found for the selected criteria.
          </Alert>
        </Slide>
      )}
      {foundTrips.length > 0 && (
        <Paper elevation={5} sx={{
          p: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
          pt: { xs: 2, sm: 3, md: 3.5, lg: 4 },
          pb: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          alignItems: 'center',
          width: { xs: '95vw', sm: '90vw', md: '85vw' },
          maxWidth: { xs: 'none', sm: 'none', md: 'none' },
          minWidth: { xs: 'auto', sm: 'auto', md: 'auto' },
          mx: { xs: 1, sm: 2, md: 3, lg: 4 },
          background: '#181F29',
        }}>
          {currentTrips.map((trip, tripIndex) => {
            const firstStation = trip[0];
            const lastStation = trip[trip.length - 1];
            // const trainId = firstStation.train_id;

            return (
              <React.Fragment key={tripIndex}>
                <Grid container spacing={1} sx={{
                  justifyContent: "center",
                  alignItems: "center",
                  flexWrap: { xs: 'wrap', sm: 'nowrap' },
                  gap: { xs: 1, sm: 1.5, md: 2, lg: 2.5 },
                }}>
                  {/* Departure Info */}
                  <Grid size={{ xs: 6, sm: 1.5, md: 1.8, lg: 2 }}>
                    <Stack spacing={0} alignItems="center">
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#94a3b8',
                          fontSize: { xs: '12px', sm: '13px', md: '14px', lg: '15px' },
                          fontWeight: 500,
                          letterSpacing: '0.5px'
                        }}
                      >
                        {firstStation.current_station}
                      </Typography>
                      {(() => {
                        const prediction = predictionsRes[firstStation.train_id];
                        const departureDelay = prediction?.departure_delay || 0;
                        const originalTime = firstStation.scheduled_departure_time;

                        if (departureDelay > 5 && originalTime) {
                          // Calculate new time with delay
                          const [hours, minutes] = originalTime.split(':').map(Number);
                          const totalMinutes = hours * 60 + minutes + departureDelay;
                          const newHours = Math.floor(totalMinutes / 60) % 24;
                          const newMinutes = totalMinutes % 60;
                          const newTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;

                          return (
                            <Stack direction="row" spacing={1} alignItems="center">
                              {/* Original time with strike-through */}
                              <Typography
                                variant="h4"
                                sx={{
                                  color: '#ef4444',
                                  fontSize: '20px',
                                  fontWeight: 600,
                                  letterSpacing: '-0.5px',
                                  textDecoration: 'line-through',
                                  opacity: 0.7
                                }}
                              >
                                {originalTime.split(':').slice(0, 2).join(':')}
                              </Typography>

                              {/* New delayed time */}
                              <Typography
                                variant="h4"
                                sx={{
                                  color: '#f8fafc',
                                  fontSize: '24px',
                                  fontWeight: 800,
                                  letterSpacing: '-0.5px'
                                }}
                              >
                                {newTime}
                              </Typography>
                            </Stack>
                          );
                        } else {
                          // Show normal time when delay <= 5 or no prediction
                          return (
                            <Typography
                              variant="h4"
                              sx={{
                                color: '#f8fafc',
                                fontSize: '24px',
                                fontWeight: 800,
                                letterSpacing: '-0.5px'
                              }}
                            >
                              {originalTime
                                ? originalTime.split(':').slice(0, 2).join(':')
                                : 'N/A'}
                            </Typography>
                          );
                        }
                      })()}
                    </Stack>
                  </Grid>
                  {/* Train & Duration */}
                  <Grid size={{ xs: 12, sm: 6, md: 5, lg: 4.5 }} >
                    <Stack spacing={1} alignItems="center">
                      <img
                        src={getTrainImage(firstStation.train_id)}
                        alt="Train"
                        style={{
                          width: `100%`,
                          objectFit: 'contain',
                          margin: '0 auto',
                          cursor: predictionsRes[firstStation.train_id] && !loadingPredictions[firstStation.train_id]
                            ? 'pointer'
                            : 'default',
                          opacity: predictionsRes[firstStation.train_id] && !loadingPredictions[firstStation.train_id]
                            ? 1
                            : 0.8,
                          transition: 'all 0.2s ease',
                        }}
                        onClick={() => handleTrainClick(firstStation.train_id)}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#94a3b8',
                          fontSize: { xs: '13px', sm: '14px', md: '15px', lg: '16px' },
                          fontWeight: 550,
                          letterSpacing: '0.5px'
                        }}
                      >
                        Duration  {
                          (() => {
                            const prediction = predictionsRes[firstStation.train_id];
                            const arrivalDelay = Math.ceil(prediction?.arrival_delay || 0);
                            const dep = firstStation.scheduled_departure_time;
                            const arr = lastStation.scheduled_arrival_time;

                            if (!dep || !arr) return 'N/A';

                            const [depH, depM] = dep.split(':').map(Number);
                            const [arrH, arrM] = arr.split(':').map(Number);
                            let depMinutes = depH * 60 + depM;
                            let arrMinutes = arrH * 60 + arrM;
                            if (arrMinutes < depMinutes) arrMinutes += 24 * 60;

                            const originalDuration = arrMinutes - depMinutes;
                            const newDuration = originalDuration + arrivalDelay; // Add delay to duration

                            const hours = Math.floor(newDuration / 60);
                            const minutes = newDuration % 60;

                            if (arrivalDelay > 5) {
                              // Show both original (strikethrough) and new duration
                              const origHours = Math.floor(originalDuration / 60);
                              const origMinutes = originalDuration % 60;
                              const originalText = origHours === 0 ? `${origMinutes} min` : `${origHours}h ${origMinutes}m`;
                              const newText = hours === 0 ? `${minutes} min` : `${hours}h ${minutes}m`;

                              return (
                                <>
                                  <span style={{
                                    textDecoration: 'line-through',
                                    color: '#ef4444',
                                    opacity: 0.7,
                                    marginLeft: '8px'
                                  }}>
                                    {originalText}
                                  </span>
                                  <span style={{
                                    color: '#94a3b8',
                                    fontWeight: 550,
                                    marginLeft: '8px'
                                  }}>
                                    {newText}
                                  </span>
                                </>
                              );
                            } else {
                              if (hours === 0) {
                                return `${minutes} min`;
                              }
                              return `${hours}h ${minutes}m`;
                            }
                          })()
                        }
                      </Typography>
                    </Stack>
                  </Grid>
                  {/* Arrival Info */}
                  <Grid size={{ xs: 6, sm: 1.5, md: 1.8, lg: 2 }}>
                    <Stack spacing={0} alignItems="center">
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#94a3b8',
                          fontSize: { xs: '12px', sm: '13px', md: '14px', lg: '15px' },
                          fontWeight: 500,
                          letterSpacing: '0.5px'
                        }}
                      >
                        {lastStation.next_station}
                      </Typography>

                      {(() => {
                        const prediction = predictionsRes[firstStation.train_id];
                        const arrivalDelay = prediction?.arrival_delay || 0;
                        const originalTime = lastStation.scheduled_arrival_time;

                        if (arrivalDelay > 5 && originalTime) {
                          // Calculate new time with delay
                          const [hours, minutes] = originalTime.split(':').map(Number);
                          const totalMinutes = hours * 60 + minutes + arrivalDelay;
                          const newHours = Math.floor(totalMinutes / 60) % 24;
                          const newMinutes = totalMinutes % 60;
                          const newTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;

                          return (
                            <Stack direction="row" spacing={1} alignItems="center">
                              {/* Original time with strike-through */}
                              <Typography
                                variant="h4"
                                sx={{
                                  color: '#ef4444',
                                  fontSize: { xs: '15px', sm: '17px', md: '18px', lg: '20px' },
                                  fontWeight: 600,
                                  letterSpacing: '-0.5px',
                                  textDecoration: 'line-through',
                                  opacity: 0.7
                                }}
                              >
                                {originalTime.split(':').slice(0, 2).join(':')}
                              </Typography>

                              {/* New delayed time */}
                              <Typography
                                variant="h4"
                                sx={{
                                  color: '#f8fafc',
                                  fontSize: { xs: '19px', sm: '22px', md: '22px', lg: '24px' },
                                  fontWeight: 800,
                                  letterSpacing: '-0.5px'
                                }}
                              >
                                {newTime}
                              </Typography>
                            </Stack>
                          );
                        } else {
                          return (
                            <Typography
                              variant="h4"
                              sx={{
                                color: '#f8fafc',
                                fontSize: '24px',
                                fontWeight: 800,
                                letterSpacing: '-0.5px'
                              }}
                            >
                              {originalTime
                                ? originalTime.split(':').slice(0, 2).join(':')
                                : 'N/A'}
                            </Typography>
                          );
                        }
                      })()}
                    </Stack>
                  </Grid>
                  <Divider orientation="vertical" variant="middle" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                  <Grid size={{ xs: 12, sm: 2, md: 2.4, lg: 2.5 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handlePredict(firstStation.train_id)}
                      disabled={loadingPredictions[firstStation.train_id] || !!predictionsRes[firstStation.train_id]}
                      sx={{
                        mt: { xs: 1, sm: 0 },
                        minWidth: { xs: '100%', sm: 120, md: 140, lg: 160 },
                        fontWeight: 650,
                        fontSize: { xs: 12, sm: 12, md: 14, lg: 15 },
                        minHeight: { xs: 36, sm: 40, md: 44, lg: 48 },
                        background: loadingPredictions[firstStation.train_id]
                          ? '#6A55FF'
                          : predictionsRes[firstStation.train_id]
                            ? '#5DD384'
                            : '#3B82F6',
                        '&:hover': {
                          background: loadingPredictions[firstStation.train_id]
                            ? '#6A55FF'
                            : predictionsRes[firstStation.train_id]
                              ? '#4ADE80'
                              : '#2563EB',
                        },
                        '&:disabled': {
                          color: '#000000ff',
                          background: predictionsRes[firstStation.train_id] ? '#99f2b7c0' : undefined,
                        }
                      }}
                    >
                      {loadingPredictions[firstStation.train_id]
                        ? 'Predicting...'
                        : predictionsRes[firstStation.train_id]
                          ? 'Predicted'
                          : 'Predict Delay'}
                    </Button>

                  </Grid>
                </Grid>
                {tripIndex < currentTrips.length - 1 && <Divider sx={{ my: 2 }} />}
                <Divider orientation="horizontal" flexItem sx={{ display: { xs: 'block', sm: 'none' }, my: 1 }} />
              </React.Fragment>
            );

          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 2, sm: 3, md: 3.5, lg: 4 } }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="medium"
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: '#fff',
                    fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.95rem', lg: '1rem' },
                    '&.Mui-selected': {
                      backgroundColor: '#3B82F6',
                      color: '#fff',
                    },
                    '&:hover': {
                      backgroundColor: '#3B82F6',
                      color: '#fff',
                    },
                  },
                }}
              />
            </Box>
          )}
        </Paper>
      )
      }

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
          pb: 0,
          fontFamily: 'Urbanist, sans-serif',
          fontWeight: 500,
          fontSize: 18,
          color: '#FFFFFF',
        }}>
          Predicted Itinerary Delays — {barValue.date?.format('YYYY-MM-DD')}
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
        <DialogContent sx={{
          mt: 1,
          minHeight: 180,
          fontFamily: 'Urbanist, sans-serif',
          position: 'relative',
          overflowX: 'hidden',
          pl: 1,
          pr: 1
        }}>
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
              {selectedTrain.map((station, index) => {
                // Avatar color by delay
                let bgColor = '#FFF';
                const delay = Math.max(station.arrival_delay || 0, station.departure_delay || 0);
                if (delay < 5) bgColor = '#6FFF8D';
                else if (delay < 15) bgColor = '#F7D154';
                else if (delay < 30) bgColor = '#FF9800';
                else bgColor = '#F44336';

                return (
                  <ListItem key={index} alignItems="flex-start" dense style={{ paddingTop: 2, paddingBottom: 2, minHeight: 36 }}>
                    <ListItemAvatar style={{ position: 'relative', zIndex: 1 }}>
                      <Avatar sx={{ bgcolor: bgColor }}>
                        <TrainIcon sx={{ color: '#232323' }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<span style={{ fontWeight: 700, fontSize: 17, color: '#FFF', fontFamily: 'Urbanist, sans-serif' }}>{station.station_name}</span>}
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
                            {station.scheduled_arrival_time && station.arrival_delay !== undefined && (
                              <Tooltip title={`Arrival Delay: ${station.arrival_delay > 59 ? Math.floor(station.arrival_delay / 60) + 'h ' + (station.arrival_delay % 60) + 'm' : station.arrival_delay + ' min'}`} arrow >
                                <Box sx={{
                                  display: 'flex',
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 2,
                                  border: `2px solid ${getDelayColor(station.arrival_delay)}`,
                                  background: getDelayBg(station.arrival_delay),
                                  alignItems: 'center',
                                  cursor: 'pointer'
                                }}>
                                  <span style={{ fontWeight: 700, marginRight: 4, fontSize: 13 }}>Arrival:</span>
                                  <span style={{ color: getDelayColor(station.arrival_delay), fontWeight: 700, fontSize: 13 }}>
                                    {formatTimeHHMM(station.scheduled_arrival_time)}
                                  </span>
                                </Box>
                              </Tooltip>
                            )}
                          </span>
                          {/* Departure chip */}
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {station.scheduled_departure_time && station.departure_delay !== undefined && (
                              <Tooltip title={`Departure Delay: ${station.departure_delay > 59 ? Math.floor(station.departure_delay / 60) + 'h ' + (station.departure_delay % 60) + 'm' : station.departure_delay + ' min'}`} arrow >
                                <Box sx={{
                                  display: 'flex',
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 2,
                                  border: `2px solid ${getDelayColor(station.departure_delay)}`,
                                  background: getDelayBg(station.departure_delay),
                                  alignItems: 'center',
                                  cursor: 'pointer'
                                }}>
                                  <span style={{ fontWeight: 700, marginRight: 4, fontSize: 13 }}>Departure:</span>
                                  <span style={{ color: getDelayColor(station.departure_delay), fontWeight: 700, fontSize: 13 }}>
                                    {formatTimeHHMM(station.scheduled_departure_time)}
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
    </div >
  );
};

export default Forecast;