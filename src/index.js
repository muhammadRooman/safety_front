import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css'; 
import { Provider } from 'react-redux';
import { store, persistor } from './redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import './i18n'; // 🔥 i18next
import { LoaderProvider } from './components/LoaderContext';
import { SidebarProvider } from './context/SidebarContext';  // ← Yeh line add karo

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>  {/* optional but good practice */}
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <LoaderProvider>
          <SidebarProvider>           {/* ← Yeh wrap sabse important hai */}
            <App />
          </SidebarProvider>
        </LoaderProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);