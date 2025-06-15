// Color palette
export const palette = {
  orange: '#FB7A31',
  green: '#5DD384',
  pink: '#FF5B77',
  purple: '#6A55FF',
  darkPurple: '#422DBB',
  yellow: '#FAB902',
  grayBg: '#6A6A6A',
};

// Define train type options with proper names
export const trainTypeOptions = [
  { label: 'TGV', code: 'GV', color: palette.orange },
  { label: 'Al Atlas', code: 'TLR', color: palette.pink },
  { label: 'Navette', code: 'TNR', color: palette.purple },
  { label: 'Train de ligne', code: 'TL', color: palette.yellow },
];

// Helper function to get train type details
export const getTrainTypeDetails = (code: string) => {
  return trainTypeOptions.find(type => type.code === code) || trainTypeOptions[0];
};

// Define valid tuples with full data
export const validRoutes = [
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
export const departureOptions = Array.from(new Set(validRoutes.map(r => r.departure))).map(label => {
  const route = validRoutes.find(r => r.departure === label)!;
  return { label, code: route.trainType, color: route.departureColor };
}); 