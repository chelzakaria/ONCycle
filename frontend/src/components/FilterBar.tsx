import React, { useState } from 'react';
import { Box, AppBar, Toolbar, TextField, Paper, Typography, Button } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import TrainIcon from '@mui/icons-material/Train';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Dayjs } from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import SearchIcon from '@mui/icons-material/Search';

// New color palette
const palette = {
  orange: '#FB7A31',
  green: '#5DD384',
  pink: '#FF5B77',
  purple: '#6A55FF',
  darkPurple: '#422DBB',
  yellow: '#FAB902',
  grayBg: '#6A6A6A',
};

// Define train type options with proper names
const trainTypeOptions = [
  { label: 'TGV', code: 'GV', color: palette.orange },
  { label: 'Al Atlas', code: 'TLR', color: palette.pink },
  { label: 'Navette', code: 'TNR', color: palette.purple},
  { label: 'Train de ligne', code: 'TL', color: palette.yellow },
];

// Helper function to get train type details
const getTrainTypeDetails = (code: string) => {
  return trainTypeOptions.find(type => type.code === code) || trainTypeOptions[0];
};

// Define valid tuples with full data
const validRoutes = [
  { departure: 'CASA VOYAGEURS', arrival: 'TANGER', trainType: 'GV', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('GV').color },
  { departure: 'TANGER', arrival: 'CASA VOYAGEURS', trainType: 'GV', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('GV').color },
  { departure: 'CASA PORT', arrival: 'KENITRA', trainType: 'TNR', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TNR').color },
  { departure: 'KENITRA', arrival: 'CASA PORT', trainType: 'TNR', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TNR').color },
  { departure: 'AEROPORT MED V', arrival: 'CASA PORT', trainType: 'TNR', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TNR').color },
  { departure: 'CASA PORT', arrival: 'AEROPORT MED V', trainType: 'TNR', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TNR').color },
  { departure: 'CASA PORT', arrival: 'SETTAT', trainType: 'TNR', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TNR').color },
  { departure: 'SETTAT', arrival: 'CASA PORT', trainType: 'TNR', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TNR').color },
  { departure: 'EL JADIDA', arrival: 'CASA PORT', trainType: 'TNR', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TNR').color },
  { departure: 'CASA PORT', arrival: 'EL JADIDA', trainType: 'TNR', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TNR').color },
  { departure: 'FES', arrival: 'MARRAKECH', trainType: 'TLR', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TLR').color },
  { departure: 'MARRAKECH', arrival: 'FES', trainType: 'TLR', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TLR').color },
  { departure: 'FES', arrival: 'TANGER', trainType: 'TLR', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TLR').color },
  { departure: 'CASA VOYAGEURS', arrival: 'NADOR', trainType: 'TLR', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TLR').color },
  { departure: 'CASA VOYAGEURS', arrival: 'OUJDA', trainType: 'TLR', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TLR').color },
  { departure: 'OUJDA', arrival: 'TANGER', trainType: 'TLR', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TLR').color },
  { departure: 'OUJDA', arrival: 'CASA VOYAGEURS', trainType: 'TLR', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TLR').color },
  { departure: 'TANGER', arrival: 'OUJDA', trainType: 'TLR', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TLR').color },
  { departure: 'TANGER', arrival: 'FES', trainType: 'TLR', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TLR').color },
  { departure: 'FES', arrival: 'CASA VOYAGEURS', trainType: 'TLR', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TLR').color },
  { departure: 'NADOR', arrival: 'CASA VOYAGEURS', trainType: 'TLR', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TLR').color },
  { departure: 'TANGER', arrival: 'MARRAKECH', trainType: 'TLR', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TLR').color },
  { departure: 'MARRAKECH', arrival: 'TANGER', trainType: 'TLR', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TLR').color },
  { departure: 'KENITRA', arrival: 'TANGER', trainType: 'TL', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TL').color },
  { departure: 'TANGER', arrival: 'KENITRA', trainType: 'TL', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TL').color },
  { departure: 'SAFI', arrival: 'BENGUERIR', trainType: 'TL', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TL').color },
  { departure: 'BENGUERIR', arrival: 'SAFI', trainType: 'TL', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TL').color },
  { departure: 'CASA VOYAGEURS', arrival: 'KHOURIBGA', trainType: 'TL', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TL').color },
  { departure: 'KHOURIBGA', arrival: 'CASA VOYAGEURS', trainType: 'TL', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TL').color },
  { departure: 'OUED ZEM', arrival: 'CASA VOYAGEURS', trainType: 'TL', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TL').color },
  { departure: 'CASA VOYAGEURS', arrival: 'OUED ZEM', trainType: 'TL', departureColor: palette.green, arrivalColor: palette.orange, trainTypeColor: getTrainTypeDetails('TL').color },
];

// Get unique departures with full data
const departureOptions = Array.from(new Set(validRoutes.map(r => r.departure))).map(label => {
  const route = validRoutes.find(r => r.departure === label)!;
  return { label, code: route.trainType, color: route.departureColor };
});

const arrivalOptions = [
  { label: 'TANGER', code: 'GV', color: palette.orange },
  { label: 'CASA VOYAGEURS', code: 'GV', color: palette.orange },
  { label: 'KENITRA', code: 'TNR', color: palette.orange },
  { label: 'CASA PORT', code: 'TNR', color: palette.orange },
  { label: 'CASA PORT', code: 'TNR', color: palette.orange },
  { label: 'AEROPORT MED V', code: 'TNR', color: palette.orange },
  { label: 'CASA PORT', code: 'TNR', color: palette.orange },
  { label: 'CASA PORT', code: 'TNR', color: palette.orange },
  { label: 'SETTAT', code: 'TNR', color: palette.orange },
  { label: 'EL JADIDA', code: 'TNR', color: palette.orange },
  { label: 'CASA PORT', code: 'TNR', color: palette.orange },
  { label: 'MARRAKECH', code: 'TLR', color: palette.orange },
  { label: 'FES', code: 'TLR', color: palette.orange },
  { label: 'TANGER', code: 'TLR', color: palette.orange },
  { label: 'NADOR', code: 'TLR', color: palette.orange },
  { label: 'OUJDA', code: 'TLR', color: palette.orange },
  { label: 'TANGER', code: 'TLR', color: palette.orange },
  { label: 'OUJDA', code: 'TLR', color: palette.orange },
  { label: 'CASA VOYAGEURS', code: 'TLR', color: palette.orange },
  { label: 'FES', code: 'TLR', color: palette.orange },
  { label: 'CASA VOYAGEURS', code: 'TLR', color: palette.orange },
  { label: 'TANGER', code: 'TLR', color: palette.orange },
  { label: 'MARRAKECH', code: 'TLR', color: palette.orange },
  { label: 'MARRAKECH', code: 'TLR', color: palette.orange },
  { label: 'TANGER', code: 'TL', color: palette.orange },
  { label: 'KENITRA', code: 'TL', color: palette.orange },
  { label: 'SAFI', code: 'TL', color: palette.orange },
  { label: 'BENGUERIR', code: 'TL', color: palette.orange },
  { label: 'BENGUERIR', code: 'TL', color: palette.orange },
  { label: 'CASA VOYAGEURS', code: 'TL', color: palette.orange },
  { label: 'KHOURIBGA', code: 'TL', color: palette.orange },
  { label: 'KHOURIBGA', code: 'TL', color: palette.orange },
  { label: 'OUED ZEM', code: 'TL', color: palette.orange },
  { label: 'CASA VOYAGEURS', code: 'TL', color: palette.orange },
];

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
};

const FilterBar: React.FC<FilterBarProps> = ({ value, onChange, onSearch }) => {
  const { departure, arrival, trainType, date } = value;

  // Arrival options depend on departure
  const arrivalOptions = React.useMemo(() => {
    if (!departure) return [];
    const validArrivals = validRoutes
      .filter(r => r.departure === departure.label)
      .map(r => ({ label: r.arrival, code: r.trainType, color: r.arrivalColor }));
    return Array.from(new Set(validArrivals.map(a => a.label)))
      .map(label => validArrivals.find(a => a.label === label)!);
  }, [departure]);

  // Train type options depend on departure and arrival
  const availableTrainTypes = React.useMemo(() => {
    if (!departure || !arrival) return [];
    const matchingRoutes = validRoutes.filter(r => 
      r.departure === departure.label && r.arrival === arrival.label
    );
    const validTypes = [...new Set(matchingRoutes.map(r => r.trainType))];
    return trainTypeOptions.filter(type => validTypes.includes(type.code));
  }, [departure, arrival]);

  // Reset arrival and trainType if departure changes
  React.useEffect(() => {
    onChange({ ...value, arrival: null, trainType: null });
    // eslint-disable-next-line
  }, [departure?.label]);

  // Reset trainType if arrival changes
  React.useEffect(() => {
    onChange({ ...value, trainType: null });
    // eslint-disable-next-line
  }, [arrival?.label]);

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
          pb:1,
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
          <Paper elevation={0} sx={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', boxShadow: 'none', p: 1, width: '100%', justifyContent: 'center' }}>
            {/* Departure Station */}
            <Autocomplete
              options={departureOptions}
              value={departure}
              onChange={(_, newValue) => onChange({ ...value, departure: newValue })}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Departure Station"
                  sx={{ minWidth: 300 }}
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
              options={arrivalOptions}
              value={arrival}
              onChange={(_, newValue) => onChange({ ...value, arrival: newValue })}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Arrival Station"
                  sx={{ minWidth: 300 }}
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
              options={availableTrainTypes}
              value={trainType}
              onChange={(_, newValue) => onChange({ ...value, trainType: newValue })}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Train Type"
                  sx={{ minWidth: 300 }}
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
              slotProps={{ textField: { sx: { minWidth: 300 } } }}
            />
            <Button
              variant="contained"
              color="primary"
              sx={{ minWidth: 50, height: 50, fontWeight: 700, fontSize: 18, p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={onSearch}
            >
              <SearchIcon fontSize="large" />
            </Button>
          </Paper>
        </Toolbar>
      </AppBar>
    </LocalizationProvider>
  );
};

export default FilterBar; 