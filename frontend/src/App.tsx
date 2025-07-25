import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Status from './pages/Status';
import Statistics from './pages/Statistics';
import Forecast from './pages/Forecast';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react"
import './App.css';
import './index.css';
// import Trips from './trips';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <Router>
        <div className="App" style={{ backgroundColor: '#11161B' }}>
          <Navbar />
          <Routes>
            <Route path="/" element={<Status />} />
            <Route path="/status" element={<Status />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/forecast" element={<Forecast />} />
          </Routes>
        </div>
        <Analytics />
        <SpeedInsights />
      </Router>
    </ThemeProvider>
  );
}

export default App;