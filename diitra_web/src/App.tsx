import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard/Dashboard';
import Landing from './pages/Landing/Landing';
import { CommandPalette } from './components/Common/CommandPalette';

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<Landing currentTheme={theme} toggleTheme={toggleTheme} />} />
        
        {/* Internal Dashboard */}
        <Route path="/dashboard" element={
          <div className="flex h-screen w-full bg-bg-deep overflow-hidden font-sans selection:bg-text-main selection:text-bg-deep transition-colors duration-300">
            <CommandPalette />
            <Sidebar currentTheme={theme} toggleTheme={toggleTheme} />
            <Dashboard />
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
