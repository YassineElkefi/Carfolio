
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import MaintenancePage from './pages/MaintenancePage';
import Navigation from './components/Navigation';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Navigation />

      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
      </Routes>
    </BrowserRouter>
  );
}
