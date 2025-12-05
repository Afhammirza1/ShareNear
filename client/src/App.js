import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import ShareRoom from './pages/ShareRoom';
import HistoryPage from './pages/HistoryPage';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="App">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/share/:roomId" element={<ShareRoom />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
