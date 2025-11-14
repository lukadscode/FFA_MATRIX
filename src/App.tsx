import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MatrixBackground } from './components/MatrixBackground';
import { SetupPage } from './pages/SetupPage';
import { RacePage } from './pages/RacePage';
import { AdminPage } from './pages/AdminPage';
import { AdminSelectPage } from './pages/AdminSelectPage';
import { ResultsPage } from './pages/ResultsPage';
import { ErgRaceLogsPage } from './pages/ErgRaceLogsPage';
import { StopRacePage } from './pages/StopRacePage';
import { LedsLogsPage } from './pages/LedsLogsPage';

function App() {
  return (
    <BrowserRouter>
      <MatrixBackground />
      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<SetupPage />} />
          <Route path="/race/:raceId" element={<RacePage />} />
          <Route path="/admin" element={<AdminSelectPage />} />
          <Route path="/admin/:raceId" element={<AdminPage />} />
          <Route path="/results/:raceId" element={<ResultsPage />} />
          <Route path="/ergrace-logs" element={<ErgRaceLogsPage />} />
          <Route path="/stop-race" element={<StopRacePage />} />
          <Route path="/leds-logs" element={<LedsLogsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
