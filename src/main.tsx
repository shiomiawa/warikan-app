import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import airplane from './assets/airplane.webp';
import bgHome from './assets/bg-home.webp';
import { unlockAudioOnFirstInteraction } from './sound';
import './styles.css';

unlockAudioOnFirstInteraction();

// 背景画像は import して URL を受け取る(サブパス /warikan-app/ でも正しいパスになる)
document.documentElement.style.setProperty('--bg-image', `url(${bgHome})`);
document.documentElement.style.setProperty('--airplane-image', `url(${airplane})`);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
