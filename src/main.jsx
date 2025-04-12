import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import EventsPage from './pages/EventsPage.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import NotFound from './pages/NotFound.jsx'

// Create router with appropriate base URL for GitHub Pages
// Only use the basename in production on GitHub Pages
const isGitHubPages = window.location.hostname.includes('github.io');
const isDevelopment = import.meta.env.DEV;
const basePath = isGitHubPages && !isDevelopment ? '/urban-ph' : '/';

const router = createBrowserRouter([
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
], {
  basename: basePath
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);