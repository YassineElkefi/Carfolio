import { lazy, Suspense } from 'react';
import { AnimatePresence, domAnimation, LazyMotion, MotionConfig, m } from 'framer-motion';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import Navigation from './components/Navigation';
import { pageVariants } from './lib/motion';

const GaragePage = lazy(() => import('./App'));
const MileagePage = lazy(() => import('./pages/MileagePage'));
const FuelPage = lazy(() => import('./pages/FuelPage'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));
const DeadlinesPage = lazy(() => import('./pages/DeadlinesPage'));
const StatisticsPage = lazy(() => import('./pages/StatisticsPage'));

export default function AppRouter() {
  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <LazyMotion features={domAnimation}>
          <AppLayout />
        </LazyMotion>
      </MotionConfig>
    </BrowserRouter>
  );
}

function AppLayout() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <Navigation />

      <div className="main-content">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={location.pathname}
            className="route-transition"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Suspense fallback={
              <div className="route-loading">
                <LoaderCircle size={20} className="spinner" />
                <span>Loading page…</span>
              </div>
            }>
              <Routes location={location}>
                <Route path="/" element={<GaragePage />} />
                <Route path="/mileage" element={<MileagePage />} />
                <Route path="/fuel" element={<FuelPage />} />
                <Route path="/maintenance" element={<MaintenancePage />} />
                <Route path="/deadlines" element={<DeadlinesPage />} />
                <Route path="/statistics" element={<StatisticsPage />} />
              </Routes>
            </Suspense>
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}