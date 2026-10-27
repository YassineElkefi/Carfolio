
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'sweetalert2/dist/sweetalert2.min.css';
import './index.css';
import AppRouter from './AppRouter';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
);
