import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import './App.css';
import NumberGenerator from './NumberGenerator';
import CSVNumbers from './CSVNumbers';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-blue-600 p-4 shadow-md">
          <div className="container mx-auto flex items-center">
            <div className="text-white font-bold text-xl mr-6">Hi, Adarsh Pandey</div>
            <div className="hidden md:flex space-x-4 flex-grow">
              <NavLink to="/">Number Generator</NavLink>
              <NavLink to="/csv">CSV Numbers</NavLink>
            </div>
            <button
              className="md:hidden ml-auto text-white hover:bg-blue-700 px-3 py-2 rounded-md transition duration-300 ease-in-out"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? 'Close' : 'Menu'}
            </button>
          </div>
          {isMenuOpen && (
            <div className="md:hidden mt-2">
              <NavLink to="/" onClick={() => setIsMenuOpen(false)}>Number Generator</NavLink>
              <NavLink to="/csv" onClick={() => setIsMenuOpen(false)}>CSV Numbers</NavLink>
            </div>
          )}
        </nav>
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<NumberGenerator />} />
            <Route path="/csv" element={<CSVNumbers />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

const NavLink = ({ to, children, onClick }) => (
  <Link
    to={to}
    className="text-white bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-md transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
    onClick={onClick}
  >
    {children}
  </Link>
);

export default App;