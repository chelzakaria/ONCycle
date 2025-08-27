import React from 'react';
import { Box, Paper, TextField, Typography, Button, Tooltip } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import dayjs, { Dayjs } from 'dayjs';

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

export type ForecastBarValue = {
  departure: { label: string; train_id: string; sequence: number } | null;
  arrival: { label: string; train_id: string; sequence: number } | null;
  date: Dayjs | null;
};

type ForecastBarProps = {
  value: ForecastBarValue;
  onChange: (value: ForecastBarValue) => void;
  onPredict: (trainId: string) => void;
  onReset: () => void;
  onFindTrips: () => void;
  trafficData: TrafficRecord[];
  loading: boolean;
  foundTrips: TrafficRecord[][];
};

const ForecastBar: React.FC<ForecastBarProps> = ({
  value,
  onChange,
  // onPredict,
  onReset,
  onFindTrips,
  trafficData,
  loading,
  foundTrips
}) => {
  const { departure, arrival, date } = value;

  // Get unique departure stations (current_station)
  const departureOptions = React.useMemo(() => {
    const uniqueStations = [...new Set(trafficData.map(record => record.current_station))];
    return uniqueStations.map(station => ({
      label: station,
      train_id: trafficData.find(r => r.current_station === station)?.train_id || '',
      sequence: trafficData.find(r => r.current_station === station)?.sequence || 0
    }));
  }, [trafficData]);

  const arrivalOptions = React.useMemo(() => {
    if (!departure) return [];


    const trainIdsWithDeparture = trafficData
      .filter(r => r.current_station === departure.label)
      .map(r => r.train_id);

    const maxSequenceByTrainId: Record<string, number> = {};
    trainIdsWithDeparture.forEach(trainId => {
      const maxSeq = Math.max(
        ...trafficData
          .filter(r => r.train_id === trainId && r.current_station === departure.label)
          .map(r => r.sequence)
      );
      maxSequenceByTrainId[trainId] = maxSeq;
    });


    const validRecords = trafficData.filter(record =>
      trainIdsWithDeparture.includes(record.train_id) &&
      record.sequence >= maxSequenceByTrainId[record.train_id]
    );

    // Get unique next_station values
    const uniqueStations = [...new Set(validRecords.map(record => record.next_station))];
    return uniqueStations.map(station => ({
      label: station,
      train_id: departure.train_id,
      sequence: validRecords.find(r => r.next_station === station)?.sequence || 0
    }));
  }, [trafficData, departure]);


  const handleDepartureChange = (newDeparture: typeof departureOptions[0] | null) => {

    onChange({
      ...value,
      departure: newDeparture,
      arrival: null,
    });
  };

  const handleArrivalChange = (newArrival: typeof arrivalOptions[0] | null) => {


    onChange({
      ...value,
      arrival: newArrival
    });
  };



  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper elevation={5} sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        pb: { xs: 1.5, sm: 2, md: 2 },
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 1, sm: 1.5, md: 2 },
        alignItems: 'center',
        width: { xs: '95vw', sm: '90vw', md: '85vw' },
        maxWidth: { xs: 'none', sm: 'none', md: 'none' },
        minWidth: { xs: 'auto', sm: 'auto', md: 'auto' },
        marginTop: { xs: 6, sm: 7, md: 8 },
        mx: { xs: 'auto', sm: 'auto', md: 'auto' },
        background: '#181F29',
      }}>
        <Typography variant="h5" sx={{
          mb: { xs: 2, sm: 2.5, md: 3 },
          color: '#fff',
          fontWeight: 700,
          fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
          textAlign: 'center'
        }}>
          Predict Your Next Trip
        </Typography>

        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'column', md: 'row' },
          gap: { xs: 1.5, sm: 2, md: 2 },
          alignItems: { xs: 'stretch', sm: 'stretch', md: 'center' },
          justifyContent: { xs: 'center', sm: 'center', md: 'center' },
          width: '100%',
          flexWrap: 'nowrap',
          overflow: 'visible',
        }}>
          {/* Departure Station */}
          <Autocomplete
            options={departureOptions.sort((a, b) => a.label.localeCompare(b.label))}
            value={departure}
            onChange={(_, newValue) => handleDepartureChange(newValue)}
            getOptionLabel={option => option.label}
            sx={{

              flex: {
                xs: '1 1 100%',
                sm: '1 1 calc(50% - 8px)',
                md: '1 1 200px',
                lg: '1 1 220px',
                xl: '1 1 280px'
              },
              minWidth: {
                xs: '100%',
                sm: '200px',
                md: '180px',
                lg: '200px',
                xl: '280px'
              },
              maxWidth: {
                xs: '100%',
                sm: '100%',
                md: '300px',
                lg: '320px',
                xl: '320px'
              }
            }}
            renderInput={params => (
              <TextField {...params} label="Departure Station" />
            )}
            renderOption={(props, option) => {
              const { key, ...rest } = props;
              return (
                <Box component="li" key={key} {...rest} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOnIcon sx={{ color: '#4CAF50', fontSize: 20 }} />
                  {option.label}
                </Box>
              );
            }}
            disabled={loading}
          />

          {/* Arrival Station */}
          <Autocomplete
            options={arrivalOptions.sort((a, b) => a.label.localeCompare(b.label))}
            value={arrival}
            onChange={(_, newValue) => handleArrivalChange(newValue)}
            getOptionLabel={option => option.label}
            sx={{
              // Matching responsive sizing with departure
              flex: {
                xs: '1 1 100%',
                sm: '1 1 calc(50% - 8px)',
                md: '1 1 200px',
                lg: '1 1 220px',
                xl: '1 1 280px'
              },
              minWidth: {
                xs: '100%',
                sm: '200px',
                md: '180px',
                lg: '200px',
                xl: '280px'
              },
              maxWidth: {
                xs: '100%',
                sm: '100%',
                md: '300px',
                lg: '320px',
                xl: '320px'
              }
            }}
            renderInput={params => (
              <TextField {...params} label="Arrival Station" />
            )}
            renderOption={(props, option) => {
              const { key, ...rest } = props;
              return (
                <Box component="li" key={key} {...rest} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOnIcon sx={{ color: '#FF9800', fontSize: 20 }} />
                  {option.label}
                </Box>
              );
            }}
            disabled={loading || !departure}
          />

          {/* Date Picker */}
          <Box sx={{
            flex: {
              xs: '1 1 100%',
              sm: '1 1 calc(50% - 8px)',
              md: '1 1 200px',
              lg: '1 1 220px',
              xl: '1 1 280px'
            },
            minWidth: {
              xs: '100%',
              sm: '200px',
              md: '180px',
              lg: '200px',
              xl: '280px'
            },
            maxWidth: {
              xs: '100%',
              sm: '100%',
              md: '300px',
              lg: '320px',
              xl: '320px'
            }
          }}>
            <DatePicker
              label="Pick a date"
              value={date}
              format="DD/MM/YYYY"
              onChange={newValue => onChange({ ...value, date: newValue })}
              sx={{ width: '100%' }}
              slotProps={{
                textField: {
                  sx: {
                    width: '100%'
                  }
                }
              }}
              minDate={dayjs().startOf('day')}
            />
          </Box>

          {/* Action Buttons Container */}
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'row', sm: 'row', md: 'row' },
            gap: { xs: 1.5, sm: 1.5, md: 2 },
            justifyContent: { xs: 'center', sm: 'center', md: 'flex-start' },
            flexShrink: 0,
            alignItems: 'center',
            mt: { xs: 1, sm: 0, md: 0 },
            // Improved button container sizing
            width: { xs: '100%', sm: '100%', md: 'auto' },
            flex: { xs: 'none', sm: 'none', md: '0 0 auto' }
          }}>

            {/* Find Trip Button */}
            <Box sx={{
              display: { xs: 'block', sm: 'block', md: 'none', lg: 'block' },
              flex: { xs: '1', sm: '1', md: 'none', lg: 'none' }
            }}>
              <Button
                variant="contained"
                color="primary"
                sx={{
                  minWidth: { xs: '100%', sm: '100%', md: 150, lg: 150 },
                  width: { xs: '100%', sm: '100%', md: 'auto', lg: 'auto' },
                  fontWeight: 650,
                  fontSize: { xs: 16, md: 17 },
                  minHeight: { xs: 45, md: 50 },
                  py: { xs: 1.5, md: 2 }
                }}
                onClick={onFindTrips}
              >
                Find Trip
              </Button>
            </Box>

            <Box sx={{ display: { xs: 'none', sm: 'none', md: 'block', lg: 'none' } }}>
              <Tooltip title="Find trips" placement="top">
                <Button
                  variant="contained"
                  color="primary"
                  sx={{
                    minWidth: 50,
                    height: 50,
                    fontWeight: 700,
                    p: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={onFindTrips}
                >
                  <SearchIcon sx={{ fontSize: 32 }} />
                </Button>
              </Tooltip>
            </Box>

            {/* Reset Button */}
            <Box sx={{
              display: { xs: 'block', sm: 'block', md: 'none', lg: 'block' },
              flex: { xs: '1', sm: '1', md: 'none', lg: 'none' }
            }}>
              {/* Full width buttons on same line for xs and sm, original for lg+ */}
              <Button
                variant="contained"
                color="secondary"
                sx={{
                  minWidth: { xs: '100%', sm: '100%', md: 150, lg: 150 },
                  width: { xs: '100%', sm: '100%', md: 'auto', lg: 'auto' },
                  fontWeight: 650,
                  fontSize: { xs: 16, md: 17 },
                  minHeight: { xs: 45, md: 50 },
                  py: { xs: 1.5, md: 2 }
                }}
                onClick={onReset}
              >
                Reset
              </Button>
            </Box>

            <Box sx={{ display: { xs: 'none', sm: 'none', md: 'block', lg: 'none' } }}>
              {/* Square icon button for md only (900px-1200px) */}
              <Tooltip title="Reset form" placement="top">
                <Button
                  variant="outlined"
                  color="primary"
                  sx={{
                    minWidth: 50,
                    height: 50,
                    fontWeight: 700,
                    p: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)'
                    }
                  }}
                  onClick={onReset}
                >
                  <RestartAltIcon sx={{ fontSize: 32 }} />
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {/* Trips count display */}
        <Box sx={{
          display: 'flex',
          justifyContent: { xs: 'center', sm: 'flex-end', md: 'flex-end' },
          mt: { xs: 1.5, sm: 2, md: 2 },
          width: '100%'
        }}>
          <Typography variant="body2" sx={{
            color: '#ccc',
            fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
            mr: { xs: 0, sm: 2, md: 2 },
            textAlign: { xs: 'center', sm: 'right', md: 'right' }
          }}>
            {foundTrips.length} trips found
          </Typography>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};

export default ForecastBar;
