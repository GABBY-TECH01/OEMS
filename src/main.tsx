import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with auto-update
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New Offnot Energy PWA version available, auto-updating...');
  },
  onOfflineReady() {
    console.log('Offnot Energy PWA is ready for offline work.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);

