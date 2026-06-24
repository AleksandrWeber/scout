import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppPreferencesProvider } from './context/AppPreferencesContext';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppPreferencesProvider>
      <App />
    </AppPreferencesProvider>
  </React.StrictMode>
);
