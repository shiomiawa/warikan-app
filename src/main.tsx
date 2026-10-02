import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { unlockAudioOnFirstInteraction } from './sound';
import './styles.css';

unlockAudioOnFirstInteraction();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
