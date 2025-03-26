import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold text-orange-600">
                Belli
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <Link to="/login" className="text-gray-700 hover:text-orange-600 px-3 py-2">
              Login
            </Link>
            <Link to="/signup" className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 