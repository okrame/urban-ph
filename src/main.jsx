import React from 'react'
import ReactDOM from 'react-dom/client'
//import { createHashRouter, RouterProvider } from 'react-router-dom'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import App from './App.jsx'
import './index.css'
import AdminPanel from './pages/AdminPanel.jsx'
import NotFound from './pages/NotFound.jsx'

// // Function to handle iOS viewport resize
// function handleViewportResize() {
//   const vh = window.innerHeight;
//   document.body.style.height = `${vh}px`;
//   document.getElementById('root').style.height = `${vh}px`;
// }

// PayPal initial options
const paypalOptions = {
  "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
  currency: "EUR",
  intent: "capture"
};

// BrowserRouter con basename = BASE_URL (in dev è '/', su GH Pages è '/urban-ph/')
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <NotFound />
  },
  {
    // ALIAS route: render the same App at /events as well.
    path: '/events',
    element: <App />,
  },
  {
    path: '/admin',
    element: <AdminPanel />,
  },
  {
    path: '*',
    element: <NotFound />
  }
], {
  basename: import.meta.env.BASE_URL
});

// Fissa SEMPRE la quota stabile con un'istantanea in px
function freezeStableViewportHeight() {
  const h = Math.round(window.visualViewport?.height || window.innerHeight);
  const px = `${h}px`;
  const root = document.documentElement;
  root.style.setProperty('--stable-viewport-height', px);
  root.style.setProperty('--viewport-height', px);
}

// 1) Scatta la foto al primo paint
freezeStableViewportHeight();

// 2) Aggiorna solo nei casi utili (niente resize continui)
window.addEventListener('orientationchange', () => {
  // piccolo delay per lasciare all’OS il tempo di assestarsi
  setTimeout(freezeStableViewportHeight, 60);
});

// 3) Rientro da bfcache (iOS/Chromium)
window.addEventListener('pageshow', (e) => {
  if (e.persisted) freezeStableViewportHeight();
});


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PayPalScriptProvider options={paypalOptions}>
      <RouterProvider router={router} />
    </PayPalScriptProvider>
  </React.StrictMode>,
);

// let resizeTimeout;
// window.addEventListener('resize', () => {
//   clearTimeout(resizeTimeout);
//   resizeTimeout = setTimeout(handleViewportResize, 100);
// });
// window.addEventListener('orientationchange', handleViewportResize);
// handleViewportResize();