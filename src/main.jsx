import React from 'react'
import ReactDOM from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import EventsPage from './pages/EventsPage.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import AboutUs from './pages/AboutUs.jsx'
import NotFound from './pages/NotFound.jsx'

// For GitHub Pages, we'll use HashRouter exclusively since it works better
// with static file servers that don't support configurable routing
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
    path: '/about',
    element: <AboutUs />,
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
    <RouterProvider router={router} />
  </React.StrictMode>,
);