import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { Html5QrcodeScanner } from 'html5-qrcode';

const LandingPage = () => {
  const navigate = useNavigate();
  const socket = useSocket();
  const [joinCode, setJoinCode] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  React.useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      
      scanner.render((decodedText) => {
        scanner.clear();
        setShowScanner(false);
        // Extract room ID from URL if full URL is scanned
        const urlParts = decodedText.split('/share/');
        if (urlParts.length > 1) {
          navigate(`/share/${urlParts[1]}`);
        } else {
          // Assume it's just the code
          navigate(`/share/${decodedText}`);
        }
      }, (error) => {
        // handle scan failure, usually better to ignore and keep scanning.
        // console.warn(`Code scan error = ${error}`);
      });

      return () => {
        scanner.clear().catch(error => console.error("Failed to clear scanner", error));
      };
    }
  }, [showScanner, navigate]);

  const createRoom = () => {
    if (!socket) return;
    socket.emit('create-room', (response) => {
      navigate(`/share/${response.code}`);
    });
  };

  const joinRoom = () => {
    if (joinCode.length === 6) {
      navigate(`/share/${joinCode}`);
    }
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 1 }}>
      
      <div className="animate-fade-in">
        <h1 style={{ fontSize: '5rem', fontWeight: '800', marginBottom: '1.5rem', lineHeight: 1.1 }}>
          Share<span className="gradient-text">Near</span>
        </h1>
        <p style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', marginBottom: '4rem', maxWidth: '600px', marginInline: 'auto' }} className="delay-100 animate-fade-in">
          Secure, real-time file sharing directly between devices. <br/> No cloud storage, no limits.
        </p>
      </div>
      
      <div className="glass-panel delay-200 animate-fade-in" style={{ padding: '3rem', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={createRoom} style={{ flex: 1, fontSize: '1.1rem' }}>
            Start Sharing
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/history')} style={{ flex: 1, fontSize: '1.1rem' }}>
            History
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
          <div style={{ height: '1px', background: 'var(--border-glass)', flex: 1 }}></div>
          <span>OR</span>
          <div style={{ height: '1px', background: 'var(--border-glass)', flex: 1 }}></div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Enter 6-digit code" 
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            maxLength={6}
            className="glass-input"
            style={{ 
              flex: 1,
              padding: '1rem', 
              borderRadius: '1rem', 
              fontSize: '1.1rem',
              textAlign: 'center',
              letterSpacing: '0.1em'
            }}
          />
          <button className="btn btn-secondary" onClick={joinRoom}>
            Join
          </button>
        </div>

        <button 
          className="btn" 
          onClick={() => setShowScanner(!showScanner)}
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            marginTop: '-1rem'
          }}
        >
          {showScanner ? 'Close Scanner' : 'Scan QR Code'}
        </button>

        {showScanner && (
          <div id="reader" style={{ width: '100%', borderRadius: '1rem', overflow: 'hidden' }}></div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
