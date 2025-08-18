import React from 'react'
import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center text-center px-4">
      <h1 className="text-5xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-lg text-gray-600 mb-8">Oops! The page you’re looking for doesn’t exist.</p>
      <Link 
        to="/" 
        className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        ← Back to home
      </Link>
    </div>
  )
}

export default NotFound
