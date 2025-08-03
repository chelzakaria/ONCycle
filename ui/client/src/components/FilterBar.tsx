import React from 'react';
import { Box, AppBar, Toolbar, TextField, Paper, Typography, Button, Tooltip } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import TrainIcon from '@mui/icons-material/Train';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Dayjs } from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { trainTypeOptions, validRoutes, departureOptions } from '../utils/trainData';
import dayjs from 'dayjs';



// Types for filter values
export type FilterBarValue = {
  departure: typeof departureOptions[0] | null;
  arrival: { label: string; code: string; color: string } | null;
  trainType: typeof trainTypeOptions[0] | null;
  date: Dayjs | null;
};

type FilterBarProps = {
  value: FilterBarValue;
  onChange: (value: FilterBarValue) => void;
  onSearch: () => void;
  onReset?: () => void;
};

const FilterBar: React.FC<FilterBarProps> = ({ value, onChange, onSearch, onReset }) => {
  const { departure, arrival, trainType, date } = value;
  const [lastSearchValues, setLastSearchValues] = React.useState<FilterBarValue | null>(null);

  // Function to check if current values are different from last search
  const hasValuesChanged = React.useCallback(() => {
    if (!lastSearchValues) return true;

    return (
      departure?.label !== lastSearchValues.departure?.label ||
      arrival?.label !== lastSearchValues.arrival?.label ||
      trainType?.code !== lastSearchValues.trainType?.code ||
      date?.format('YYYY-MM-DD') !== lastSearchValues.date?.format('YYYY-MM-DD')
    );
  }, [departure, arrival, trainType, date, lastSearchValues]);

  // Handle search click
  const handleSearch = () => {
    if (hasValuesChanged()) {
      setLastSearchValues(value);
      onSearch();
    }
  };

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
  const departureOptions = React.useMemo(() => {
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
  const arrivalOptions = React.useMemo(() => {
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

  // Handle departure change
  const handleDepartureChange = (newDeparture: typeof departureOptions[0] | null) => {
    const filteredRoutes = newDeparture
      ? validRoutes.filter(r => r.departure === newDeparture.label)
      : validRoutes;

    // Find valid arrival and train type for the new departure
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

  // Handle arrival change
  const handleArrivalChange = (newArrival: typeof arrivalOptions[0] | null) => {
    const filteredRoutes = newArrival
      ? validRoutes.filter(r => r.arrival === newArrival.label)
      : validRoutes;

    // Find valid departure and train type for the new arrival
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

  // Handle train type change
  const handleTrainTypeChange = (newTrainType: typeof trainTypeOptions[0] | null) => {
    const filteredRoutes = newTrainType
      ? validRoutes.filter(r => r.trainType === newTrainType.code)
      : validRoutes;

    // Find valid departure and arrival for the new train type
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
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: '#11161B',
          top: '75px',
          height: '95px',
          justifyContent: 'center',
          zIndex: 1100,
          px: 5,
          pt: 2,
          pb: 1,
          borderTop: '1.5px solid #3B4A59',
          borderBottom: '1.5px solid #3B4A59',
        }}
      >
        <Toolbar sx={{
          minHeight: '85px !important',
          px: { xs: 2, md: 4 },
          display: 'flex',
          gap: 4,
          justifyContent: 'flex-start',
        }}>
          <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', gap: 2, background: 'transparent', boxShadow: 'none', p: 0, width: '100%', justifyContent: 'center' }}>
            {/* Departure Station */}
            <Autocomplete
              options={departureOptions.sort((a, b) => a.label.localeCompare(b.label))}
              value={departure}
              onChange={(_, newValue) => handleDepartureChange(newValue)}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Departure Station"
                  sx={{ minWidth: 280 }}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...rest } = props;
                return (
                  <Box component="li" key={key} {...rest} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon sx={{ color: option.color, fontSize: 20 }} />
                    {option.label}
                  </Box>
                );
              }}
            />

            {/* Arrival Station */}
            <Autocomplete
              options={arrivalOptions.sort((a, b) => a.label.localeCompare(b.label))}
              value={arrival}
              onChange={(_, newValue) => handleArrivalChange(newValue)}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Arrival Station"
                  sx={{ minWidth: 280 }}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...rest } = props;
                return (
                  <Box component="li" key={key} {...rest} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon sx={{ color: option.color, fontSize: 20 }} />
                    {option.label}
                  </Box>
                );
              }}
            />
            {/* Train Type */}
            <Autocomplete
              options={availableTrainTypes.sort((a, b) => a.label.localeCompare(b.label))}
              value={trainType}
              onChange={(_, newValue) => handleTrainTypeChange(newValue)}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Train Type"
                  sx={{ minWidth: 280 }}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: trainType ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {params.InputProps.endAdornment}
                        <Box sx={{ display: 'flex', px: 1.5, py: 0.5, borderRadius: 2, border: `2px solid ${trainType.color}`, background: `${trainType.color}10`, alignItems: 'center' }}>
                          <TrainIcon fontSize="small" sx={{ color: trainType.color, mr: 0.5 }} />
                          <Typography variant="subtitle2" sx={{ color: trainType.color, fontWeight: 700, fontSize: 15, ml: 0.5 }}>
                            {trainType.code}
                          </Typography>
                        </Box>
                      </Box>
                    ) : params.InputProps.endAdornment
                  }}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...rest } = props;
                return (
                  <Box component="li" key={key} {...rest} sx={{ display: 'flex', gap: 1 }}>
                    <TrainIcon fontSize="small" sx={{ color: option.color }} />
                    {option.label}
                    <Box sx={{ ml: 'auto', display: 'flex', px: 1.5, py: 0.5, borderRadius: 2, border: `2px solid ${option.color}`, background: `${option.color}10`, alignItems: 'center' }}>
                      <TrainIcon fontSize="small" sx={{ color: option.color, mr: 0.5 }} />
                      <Typography variant="subtitle2" sx={{ color: option.color, fontWeight: 700, fontSize: 15, ml: 0.5 }}>
                        {option.code}
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
            />
            {/* Date Picker */}
            <DatePicker
              label="Pick a date"
              value={date}
              format="DD/MM/YYYY"
              onChange={newValue => onChange({ ...value, date: newValue })}
              slotProps={{ textField: { sx: { minWidth: 280 } } }}
              disableFuture
              minDate={dayjs('2025-05-18')}
            />
            <Tooltip title="Search for trains" placement="top">

              <Button
                variant="contained"
                color="primary"
                sx={{
                  minWidth: 50,
                  height: 50,
                  fontWeight: 700,
                  fontSize: 18,
                  p: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={handleSearch}
              >
                <SearchIcon fontSize="large" />
              </Button>
            </Tooltip>
            <Tooltip title="Reset filters" placement="top">

              <Button
                variant="outlined"
                color="primary"
                sx={{
                  minWidth: 50,
                  height: 50,
                  fontWeight: 700,
                  fontSize: 18,
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
                onClick={() => {
                  onChange({
                    departure: null,
                    arrival: null,
                    trainType: null,
                    date: null
                  });
                  setLastSearchValues(null);
                  if (typeof onReset === 'function') onReset(); // <-- Add this line
                }}
              >
                <RestartAltIcon fontSize="large" />
              </Button>
            </Tooltip>
            {/* Current search values display */}
            {lastSearchValues &&
              lastSearchValues.departure &&
              lastSearchValues.arrival &&
              lastSearchValues.trainType &&
              lastSearchValues.date && (
                <Tooltip title="Current search values" placement="top">
                  <span className="inline-flex flex-col items-center  rounded-tremor-small bg-blue-100 px-3 py-2 text-tremor-label font-bold text-blue-800 ring-1 ring-inset ring-blue-600/10 dark:bg-blue-400/20 dark:text-blue-500 dark:ring-blue-400/20" style={{ fontSize: '0.8rem' }}>
                    <span className="flex items-center gap-x-2" >
                      {lastSearchValues.departure.label} <ArrowForwardIcon sx={{ fontSize: 20 }} /> {lastSearchValues.arrival.label}
                    </span>
                    <span>
                      {lastSearchValues.date.format('dddd, MMMM DD, YYYY')}
                    </span>
                  </span>
                </Tooltip>
              )}

          </Paper>
        </Toolbar>
      </AppBar>
    </LocalizationProvider >
  );
};

export default FilterBar;