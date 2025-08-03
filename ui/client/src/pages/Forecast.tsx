import React from 'react';
import ForecastBar, { type ForecastBarValue } from '../components/ForecastBar';

const Forecast: React.FC = () => {
  const [barValue, setBarValue] = React.useState<ForecastBarValue>({
    departure: null,
    arrival: null,
    trainType: null,
    date: null
  });

  const handlePredict = () => {
    // TODO: Implement prediction logic
    alert('Predicting delay...');
  };

  return (
    <div   style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop:0 }}>
      <ForecastBar
        value={barValue}
        onChange={setBarValue}
        onPredict={handlePredict}
      />
    </div>
  );
};

export default Forecast; 