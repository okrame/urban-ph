import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, createHashRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import EventsPage from './pages/EventsPage.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import AboutUs from './pages/AboutUs.jsx'
import NotFound from './pages/NotFound.jsx'

// Use HashRouter for GitHub Pages to avoid server-side path issues
// This eliminates the need for complex 404.html handling
const isGitHubPages = window.location.hostname.includes('github.io');
const isDevelopment = import.meta.env.DEV;

// Create routes array
const routes = [
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
];

// Use HashRouter for GitHub Pages, BrowserRouter for development
const router = isGitHubPages && !isDevelopment 
  ? createHashRouter(routes)
  : createBrowserRouter(routes, {
      basename: isDevelopment ? '/' : '/urban-ph'
    });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);