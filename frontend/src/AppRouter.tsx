import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import App from './App';
import FuelPage from './pages/FuelPage';
import MaintenancePage from './pages/MaintenancePage';
import DeadlinesPage from './pages/DeadlinesPage';
import StatisticsPage from './pages/StatisticsPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navigation />

        <div className="main-content">
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/fuel" element={<FuelPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/deadlines" element={<DeadlinesPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}