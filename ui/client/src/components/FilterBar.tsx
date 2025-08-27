import React from 'react';
import { Box, AppBar, Toolbar, TextField, Paper, Typography, Button, Tooltip } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import TrainIcon from '@mui/icons-material/Train';
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
          top: { xs: '60px', sm: '60px', md: '75px' },
          height: { xs: 'auto', sm: 'auto', md: '95px' },
          minHeight: { xs: '120px', sm: '140px', md: '95px' },
          justifyContent: 'center',
          zIndex: 1100,
          px: { xs: 2, sm: 3, md: 5 },
          pt: { xs: 1, sm: 1.5, md: 2 },
          pb: { xs: 1, sm: 1.5, md: 1 },
          borderTop: '1.5px solid #3B4A59',
          borderBottom: '1.5px solid #3B4A59',
        }}
      >
        <Toolbar sx={{
          minHeight: { xs: '100px !important', sm: '120px !important', md: '85px !important' },
          px: { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'column', md: 'row' },
          gap: { xs: 1.5, sm: 2, md: 2, lg: 3, xl: 4 },
          justifyContent: { xs: 'center', sm: 'center', md: 'flex-start' },
          alignItems: { xs: 'stretch', sm: 'stretch', md: 'center' },
        }}>
          <Paper elevation={0} sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row', md: 'row' },
            alignItems: { xs: 'stretch', sm: 'center', md: 'center' },
            gap: { xs: 1.5, sm: 1.5, md: 1.5, lg: 2, xl: 2 },
            background: 'transparent',
            boxShadow: 'none',
            p: 0,
            width: '100%',
            justifyContent: { xs: 'stretch', sm: 'center', md: 'center' },
            flexWrap: { xs: 'nowrap', sm: 'wrap', md: 'nowrap' },
            // overflow: 'hidden'
          }}>
            {/* Departure Station */}
            <Autocomplete
              options={departureOptions.sort((a, b) => a.label.localeCompare(b.label))}
              value={departure}
              onChange={(_, newValue) => handleDepartureChange(newValue)}
              getOptionLabel={(option) => option.label}
              sx={{
                flex: { xs: '1 1 100%', sm: '1 1 180px', md: '1 1 180px', lg: '1 1 220px', xl: '0 0 280px' },
                minWidth: { xs: '100%', sm: 180, md: 180, lg: 220, xl: 280 },
                maxWidth: { xs: '100%', sm: '100%', md: '250px', lg: '280px', xl: 280 }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Departure Station"
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
              sx={{
                flex: { xs: '1 1 100%', sm: '1 1 180px', md: '1 1 180px', lg: '1 1 220px', xl: '0 0 280px' },
                minWidth: { xs: '100%', sm: 180, md: 180, lg: 220, xl: 280 },
                maxWidth: { xs: '100%', sm: '100%', md: '250px', lg: '280px', xl: 280 }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Arrival Station"
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
              sx={{
                flex: { xs: '1 1 100%', sm: '1 1 180px', md: '1 1 180px', lg: '1 1 220px', xl: '0 0 280px' },
                minWidth: { xs: '100%', sm: 180, md: 180, lg: 220, xl: 280 },
                maxWidth: { xs: '100%', sm: '100%', md: '250px', lg: '280px', xl: 280 }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Train Type"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: trainType ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {params.InputProps.endAdornment}
                        <Box sx={{ display: 'flex', px: 1.5, py: 0.5, borderRadius: 2, border: `2px solid ${trainType.color}`, background: `${trainType.color}10`, alignItems: 'center' }}>
                          <TrainIcon fontSize="small" sx={{ color: trainType.color, mr: 0.5 }} />
                          <Typography variant="subtitle2" sx={{ color: trainType.color, fontWeight: 700, fontSize: { xs: 13, md: 15 }, ml: 0.5 }}>
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
                      <Typography variant="subtitle2" sx={{ color: option.color, fontWeight: 700, fontSize: { xs: 13, md: 15 }, ml: 0.5 }}>
                        {option.code}
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
            />
            {/* Date Picker */}
            <Box sx={{
              flex: { xs: '1 1 100%', sm: '1 1 180px', md: '1 1 180px', lg: '1 1 220px', xl: '0 0 280px' },
              minWidth: { xs: '100%', sm: 180, md: 180, lg: 220, xl: 280 },
              maxWidth: { xs: '100%', sm: '100%', md: '250px', lg: '280px', xl: 280 }
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
                disableFuture
                minDate={dayjs('2025-05-18')}
              />
            </Box>
            {/* Action Buttons Container */}
            <Box sx={{
              display: 'flex',
              gap: { xs: 1, sm: 1.5, md: 2 },
              justifyContent: { xs: 'center', sm: 'center', md: 'flex-start' },
              flexShrink: 0,
              alignItems: 'center',
              mt: { xs: 1, sm: 0, md: 0 }
            }}>
              <Tooltip title="Search for trains" placement="top">
                <Button
                  variant="contained"
                  color="primary"
                  sx={{
                    minWidth: { xs: 45, md: 50 },
                    height: { xs: 45, md: 50 },
                    fontWeight: 700,
                    fontSize: { xs: 16, md: 18 },
                    p: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={handleSearch}
                >
                  <SearchIcon sx={{ fontSize: { xs: 24, md: 32 } }} />
                </Button>
              </Tooltip>
              <Tooltip title="Reset filters" placement="top">
                <Button
                  variant="outlined"
                  color="primary"
                  sx={{
                    minWidth: { xs: 45, md: 50 },
                    height: { xs: 45, md: 50 },
                    fontWeight: 700,
                    fontSize: { xs: 16, md: 18 },
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
                  <RestartAltIcon sx={{ fontSize: { xs: 24, md: 32 } }} />
                </Button>
              </Tooltip>
            </Box>
            {/* Current search values display */}
            {/* {lastSearchValues &&
              lastSearchValues.departure &&
              lastSearchValues.arrival &&
              lastSearchValues.trainType &&
              lastSearchValues.date && (
                <Tooltip title="Current search values" placement="top">
                  <Box
                    sx={{
                      display: 'inline-flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      borderRadius: 1,
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      px: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
                      py: { xs: 0.5, sm: 0.5, md: 1, lg: 1 },
                      fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem', lg: '0.8rem' },
                      fontWeight: 700,
                      color: 'rgb(59, 130, 246)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      flexShrink: 0,
                      minWidth: { xs: 'auto', sm: 'auto', md: 'auto' },
                      maxWidth: { xs: '200px', sm: '250px', md: 'none' },
                      mt: { xs: 1, sm: 0, md: 0 }
                    }}
                  >
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: { xs: 0.5, sm: 0.75, md: 1 },
                      flexWrap: { xs: 'wrap', sm: 'nowrap', md: 'nowrap' },
                      justifyContent: 'center'
                    }}>
                      <Typography variant="caption" sx={{
                        fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem', lg: '0.8rem' },
                        fontWeight: 700,
                        textAlign: 'center',
                        whiteSpace: { xs: 'nowrap', sm: 'nowrap', md: 'nowrap' },
                        overflow: { xs: 'hidden', sm: 'visible', md: 'visible' },
                        textOverflow: { xs: 'ellipsis', sm: 'clip', md: 'clip' },
                        maxWidth: { xs: '80px', sm: 'none', md: 'none' }
                      }}>
                        {lastSearchValues.departure.label}
                      </Typography>
                      <ArrowForwardIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18, lg: 20 } }} />
                      <Typography variant="caption" sx={{
                        fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem', lg: '0.8rem' },
                        fontWeight: 700,
                        textAlign: 'center',
                        whiteSpace: { xs: 'nowrap', sm: 'nowrap', md: 'nowrap' },
                        overflow: { xs: 'hidden', sm: 'visible', md: 'visible' },
                        textOverflow: { xs: 'ellipsis', sm: 'clip', md: 'clip' },
                        maxWidth: { xs: '80px', sm: 'none', md: 'none' }
                      }}>
                        {lastSearchValues.arrival.label}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{
                      fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem', lg: '0.75rem' },
                      fontWeight: 700,
                      textAlign: 'center',
                      mt: 0.5,
                      whiteSpace: { xs: 'nowrap', sm: 'normal', md: 'normal' },
                      overflow: { xs: 'hidden', sm: 'visible', md: 'visible' },
                      textOverflow: { xs: 'ellipsis', sm: 'clip', md: 'clip' }
                    }}>
                      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                        {lastSearchValues.date.format('dddd, MMMM DD, YYYY')}
                      </Box>
                      <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                        {lastSearchValues.date.format('DD/MM/YY')}
                      </Box>
                    </Typography>
                  </Box>
                </Tooltip>
              )} */}

          </Paper>
        </Toolbar>
      </AppBar>
    </LocalizationProvider >
  );
};

export default FilterBar;