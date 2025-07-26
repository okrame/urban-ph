import React from 'react'
import ReactDOM from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import App from './App.jsx'
import './index.css'
import EventsPage from './pages/EventsPage.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import NotFound from './pages/NotFound.jsx'

// Function to handle iOS viewport resize
function handleViewportResize() {
  const vh = window.innerHeight;
  document.body.style.height = `${vh}px`;
  document.getElementById('root').style.height = `${vh}px`;
}

// PayPal initial options
const paypalOptions = {
  "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
  currency: "EUR",
  intent: "capture"
};

// For GitHub Pages, we'll use HashRouter
const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <NotFound />
  },
  {
    path: '/events',
    element: <EventsPage />,
  },
  {
    path: '/admin',
    element: <AdminPanel />,
  },
  {
    path: '*',
    element: <NotFound />
  }
]);
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PayPalScriptProvider options={paypalOptions}>
      <RouterProvider router={router} />
    </PayPalScriptProvider>
  </React.StrictMode>,
);

let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(handleViewportResize, 100);
});
window.addEventListener('orientationchange', handleViewportResize);
handleViewportResize();