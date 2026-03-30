import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider } from 'react-redux';
import AppRoutes from './routes/AppRoutes';
import { store, persistor } from './redux/store'; // Adjust path as needed
import AuthSessionGuard from './components/AuthSessionGuard';

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <AuthSessionGuard />
          <AppRoutes />
          <ToastContainer
            position="top-right"
            autoClose={4000}
            newestOnTop
            closeOnClick
            pauseOnHover
            limit={4}
            style={{ width: 'auto', maxWidth: 'min(420px, calc(100vw - 1rem))' }}
            toastStyle={{ maxWidth: '100%' }}
          />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  );
}

export default App;
