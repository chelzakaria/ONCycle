import React from 'react';
import { Box, Paper, TextField, Typography, Button } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import LocationOnIcon from '@mui/icons-material/LocationOn';
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
        p: 3,
        pb: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        alignspans: 'center',
        minWidth: '85vw',
        marginTop: 8,
        //   width: 'fit-content',s
        //   maxWidth: 2000,
        mx: 2,
        background: '#181F29',
      }}>
        <Typography variant="h5" sx={{ mb: 3, color: '#fff', fontWeight: 700 }}>
          Predict Your Trip’s Arrival Time
        </Typography>
        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: 2,
          alignspans: 'center',
          justifyContent: 'center',
          width: '100%',
        }}>
          <Autocomplete
            options={departureOptions}
            value={departure}
            onChange={(_, newValue) => handleDepartureChange(newValue)}
            getOptionLabel={option => option.label}
            renderInput={params => (
              <TextField {...params} label="Departure Station" sx={{ minWidth: 280 }} />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ display: 'flex', alignspans: 'center', gap: 1 }}>
                <LocationOnIcon sx={{ color: '#4CAF50', fontSize: 20 }} />
                {option.label}
              </Box>
            )}
            disabled={loading} />
          <Autocomplete
            options={arrivalOptions}
            value={arrival}
            onChange={(_, newValue) => handleArrivalChange(newValue)}
            getOptionLabel={option => option.label}
            renderInput={params => (
              <TextField {...params} label="Arrival Station" sx={{ minWidth: 280 }} />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ display: 'flex', alignspans: 'center', gap: 1 }}>
                <LocationOnIcon sx={{ color: '#FF9800', fontSize: 20 }} />
                {option.label}
              </Box>
            )}
            disabled={loading || !departure} />


          <DatePicker
            label="Pick a date"
            value={date}
            format="DD/MM/YYYY"
            onChange={newValue => onChange({ ...value, date: newValue })}
            slotProps={{ textField: { sx: { minWidth: 280 } } }}
            minDate={dayjs().startOf('day')} />
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 0, minWidth: 200, fontWeight: 650, fontSize: 17, minHeight: 50 }}
            onClick={onFindTrips}
          >
            Find Trip
          </Button>
          <Button
            variant="contained"
            color="secondary"
            sx={{ mt: 0, minWidth: 200, fontWeight: 650, fontSize: 17, minHeight: 50 }}
            onClick={onReset}
          >
            Reset
          </Button>
        </Box>
        {/* Trips count display */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Typography variant="body2" sx={{ color: '#ccc', fontSize: '1rem', mr: 2 }}>
            {foundTrips.length} trips found
          </Typography>
        </Box>

      </Paper>
    </LocalizationProvider>
  );
};

export default ForecastBar;
