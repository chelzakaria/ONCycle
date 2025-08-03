import React from 'react';
import { Box, Paper, TextField, Typography, Button } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import TrainIcon from '@mui/icons-material/Train';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import dayjs, { Dayjs } from 'dayjs';
import { trainTypeOptions, validRoutes, departureOptions } from '../utils/trainData';

export type ForecastBarValue = {
  departure: typeof departureOptions[0] | null;
  arrival: { label: string; code: string; color: string } | null;
  trainType: typeof trainTypeOptions[0] | null;
  date: Dayjs | null;
};

type ForecastBarProps = {
  value: ForecastBarValue;
  onChange: (value: ForecastBarValue) => void;
  onPredict: () => void;
};

const ForecastBar: React.FC<ForecastBarProps> = ({ value, onChange, onPredict }) => {
  const { departure, arrival, trainType, date } = value;

  // Get all valid routes based on current selections
  const getValidRoutes = React.useCallback(() => {
    let filteredRoutes = validRoutes;
    if (departure) {
      filteredRoutes = filteredRoutes.filter(r => r.departure === departure.label);
    }
    if (arrival) {
      filteredRoutes = filteredRoutes.filter(r => r.arrival === arrival.label);
    }
    if (trainType) {
      filteredRoutes = filteredRoutes.filter(r => r.trainType === trainType.code);
    }
    return filteredRoutes;
  }, [departure, arrival, trainType]);

  // Departure options based on current selections
  const depOptions = React.useMemo(() => {
    const filteredRoutes = getValidRoutes();
    const allDepartures = filteredRoutes.map(r => ({
      label: r.departure,
      code: r.trainType,
      color: r.departureColor
    }));
    return Array.from(new Set(allDepartures.map(d => d.label)))
      .map(label => allDepartures.find(d => d.label === label)!);
  }, [getValidRoutes]);

  // Arrival options based on current selections
  const arrOptions = React.useMemo(() => {
    const filteredRoutes = getValidRoutes();
    const allArrivals = filteredRoutes.map(r => ({
      label: r.arrival,
      code: r.trainType,
      color: r.arrivalColor
    }));
    return Array.from(new Set(allArrivals.map(a => a.label)))
      .map(label => allArrivals.find(a => a.label === label)!);
  }, [getValidRoutes]);

  // Train type options based on current selections
  const availableTrainTypes = React.useMemo(() => {
    const filteredRoutes = getValidRoutes();
    const validTypes = [...new Set(filteredRoutes.map(r => r.trainType))];
    return trainTypeOptions.filter(type => validTypes.includes(type.code));
  }, [getValidRoutes]);

  // Handle changes
  const handleDepartureChange = (newDeparture: typeof departureOptions[0] | null) => {
    const filteredRoutes = newDeparture
      ? validRoutes.filter(r => r.departure === newDeparture.label)
      : validRoutes;
    const validArrival = arrival && filteredRoutes.some(r => r.arrival === arrival.label)
      ? arrival
      : null;
    const validTrainType = trainType && filteredRoutes.some(r => r.trainType === trainType.code)
      ? trainType
      : null;
    onChange({
      ...value,
      departure: newDeparture,
      arrival: validArrival,
      trainType: validTrainType
    });
  };

  const handleArrivalChange = (newArrival: typeof arrOptions[0] | null) => {
    const filteredRoutes = newArrival
      ? validRoutes.filter(r => r.arrival === newArrival.label)
      : validRoutes;
    const validDeparture = departure && filteredRoutes.some(r => r.departure === departure.label)
      ? departure
      : null;
    const validTrainType = trainType && filteredRoutes.some(r => r.trainType === trainType.code)
      ? trainType
      : null;
    onChange({
      ...value,
      departure: validDeparture,
      arrival: newArrival,
      trainType: validTrainType
    });
  };

  const handleTrainTypeChange = (newTrainType: typeof trainTypeOptions[0] | null) => {
    const filteredRoutes = newTrainType
      ? validRoutes.filter(r => r.trainType === newTrainType.code)
      : validRoutes;
    const validDeparture = departure && filteredRoutes.some(r => r.departure === departure.label)
      ? departure
      : null;
    const validArrival = arrival && filteredRoutes.some(r => r.arrival === arrival.label)
      ? arrival
      : null;
    onChange({
      ...value,
      departure: validDeparture,
      arrival: validArrival,
      trainType: newTrainType
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{
        minHeight: '100vh',
        minWidth: '100vw',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
 
      }}>
        <Paper elevation={3} sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          alignItems: 'center',
          minWidth: '98vw',
        //   width: 'fit-content',s
        //   maxWidth: 2000,
          mx: 2,
          background: '#181F29',
        }}>
          <Typography variant="h5" sx={{ mb: 2, color: '#fff', fontWeight: 700 }}>
            Predict Train Delay
          </Typography>
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 2,
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}>
            <Autocomplete
              options={depOptions}
              value={departure}
              onChange={(_, newValue) => handleDepartureChange(newValue)}
              getOptionLabel={option => option.label}
              renderInput={params => (
                <TextField {...params} label="Departure Station" sx={{ minWidth: 280 }} />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOnIcon sx={{ color: option.color, fontSize: 20 }} />
                  {option.label}
                </Box>
              )}
            />
            <Autocomplete
              options={arrOptions}
              value={arrival}
              onChange={(_, newValue) => handleArrivalChange(newValue)}
              getOptionLabel={option => option.label}
              renderInput={params => (
                <TextField {...params} label="Arrival Station" sx={{ minWidth: 280 }} />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOnIcon sx={{ color: option.color, fontSize: 20 }} />
                  {option.label}
                </Box>
              )}
            />
            <Autocomplete
              options={availableTrainTypes}
              value={trainType}
              onChange={(_, newValue) => handleTrainTypeChange(newValue)}
              getOptionLabel={option => option.label}
              renderInput={params => (
                <TextField {...params} label="Train Type" sx={{ minWidth: 280 }} />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', gap: 1 }}>
                  <TrainIcon fontSize="small" sx={{ color: option.color }} />
                  {option.label}
                  <Box sx={{ ml: 'auto', display: 'flex', px: 1.5, py: 0.5, borderRadius: 2, border: `2px solid ${option.color}`, background: `${option.color}10`, alignItems: 'center' }}>
                    <TrainIcon fontSize="small" sx={{ color: option.color, mr: 0.5 }} />
                    <Typography variant="subtitle2" sx={{ color: option.color, fontWeight: 700, fontSize: 15, ml: 0.5 }}>
                      {option.code}
                    </Typography>
                  </Box>
                </Box>
              )}
            />
            <DatePicker
              label="Pick a date"
              value={date}
              format="DD/MM/YYYY"
              onChange={newValue => onChange({ ...value, date: newValue })}
              slotProps={{ textField: { sx: { minWidth: 280 } } }}
              minDate={dayjs('2025-05-18')}
            />
          </Box>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2, minWidth: 200, fontWeight: 700, fontSize: 18 }}
            onClick={onPredict}
          >
            Predict
          </Button>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default ForecastBar;
