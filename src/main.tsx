import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import bgHome from './assets/bg-home.webp';
import { unlockAudioOnFirstInteraction } from './sound';
import './styles.css';

unlockAudioOnFirstInteraction();

// 背景画像は import して URL を受け取る(サブパス /warikan-app/ でも正しいパスになる)
document.documentElement.style.setProperty('--bg-image', `url(${bgHome})`);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
