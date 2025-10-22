import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MatrixBackground } from './components/MatrixBackground';
import { SetupPage } from './pages/SetupPage';
import { RacePage } from './pages/RacePage';
import { AdminPage } from './pages/AdminPage';
import { ResultsPage } from './pages/ResultsPage';
import { ErgRaceLogsPage } from './pages/ErgRaceLogsPage';

function App() {
  return (
    <BrowserRouter>
      <MatrixBackground />
      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<SetupPage />} />
          <Route path="/race/:raceId" element={<RacePage />} />
          <Route path="/admin/:raceId" element={<AdminPage />} />
          <Route path="/results/:raceId" element={<ResultsPage />} />
          <Route path="/ergrace-logs" element={<ErgRaceLogsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
