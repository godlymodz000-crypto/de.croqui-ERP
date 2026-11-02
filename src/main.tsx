import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './design-system/styles.css';
import './app.css';
import './ui/ds';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
