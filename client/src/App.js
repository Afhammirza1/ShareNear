import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import Room from './components/Room';
import ThemeToggle from './components/ThemeToggle';

function App() {
  const [socket, setSocket] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
    const newSocket = io(serverUrl);
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Check for QR code parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    const passwordParam = urlParams.get('password');
    
    if (roomParam && passwordParam) {
      setJoinRoomId(roomParam);
      setJoinPassword(passwordParam);
    }

    return () => {
      newSocket.close();
    };
  }, []);

  const createRoom = () => {
    if (socket && password.trim()) {
      socket.emit('create-room', password, (roomId) => {
        setCurrentRoom({ roomId, password });
        setRoomId(roomId);
      });
    }
  };

  const joinRoom = () => {
    if (socket && joinRoomId.trim() && joinPassword.trim()) {
      socket.emit('join-room', joinRoomId.toUpperCase(), joinPassword, (response) => {
        if (response.success) {
          setCurrentRoom({ roomId: joinRoomId.toUpperCase(), password: joinPassword });
          setRoomId(joinRoomId.toUpperCase());
          setPassword(joinPassword);
          // Clear URL parameters after successful join
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          alert(response.message);
        }
      });
    }
  };

  // Auto-join when QR code parameters are available
  useEffect(() => {
    if (socket && isConnected && joinRoomId && joinPassword && !currentRoom) {
      joinRoom();
    }
  }, [socket, isConnected, joinRoomId, joinPassword, currentRoom]);

  const leaveRoom = () => {
    setCurrentRoom(null);
    setRoomId('');
    setPassword('');
    setJoinPassword('');
    setJoinRoomId('');
  };

  if (!isConnected) {
    return (
      <div className="App" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #3498db', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }}></div>
          <p>Connecting to server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <ThemeToggle />
      
      {!currentRoom ? (
        <div className="room-container">
          <h1>ShareNear</h1>
          
          <div className="room-section">
            <h2>Create Room</h2>
            <input
              type="password"
              placeholder="Enter room password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              onKeyPress={(e) => e.key === 'Enter' && createRoom()}
            />
            <button
              onClick={createRoom}
              disabled={!password.trim()}
              className={`btn ${password.trim() ? 'btn-primary' : ''}`}
            >
              Create Room
            </button>
          </div>

          <div className="room-divider">OR</div>

          <div className="room-section">
            <h2>Join Room</h2>
            <input
              type="text"
              placeholder="Room ID"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
              className="input-field"
            />
            <input
              type="password"
              placeholder="Room password"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              className="input-field"
              onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
            />
            <button
              onClick={joinRoom}
              disabled={!joinRoomId.trim() || !joinPassword.trim()}
              className={`btn ${joinRoomId.trim() && joinPassword.trim() ? 'btn-secondary' : ''}`}
            >
              Join Room
            </button>
          </div>
        </div>
      ) : (
        <div className="room-dashboard">
          <div className="room-header">
            <div className="room-info">
              <h2>Room: {currentRoom.roomId}</h2>
              <p>Share this room ID and password with others to let them join</p>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '15px' }}>
                <div>
                  <p><strong>Room ID:</strong> {currentRoom.roomId} 
                    <button 
                      onClick={() => navigator.clipboard.writeText(currentRoom.roomId)}
                      style={{ 
                        marginLeft: '8px', 
                        padding: '2px 6px', 
                        fontSize: '12px',
                        background: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Copy
                    </button>
                  </p>
                  <p><strong>Password:</strong> {currentRoom.password}
                    <button 
                      onClick={() => navigator.clipboard.writeText(currentRoom.password)}
                      style={{ 
                        marginLeft: '8px', 
                        padding: '2px 6px', 
                        fontSize: '12px',
                        background: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Copy
                    </button>
                  </p>
                  <button 
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}?room=${currentRoom.roomId}&password=${encodeURIComponent(currentRoom.password)}`)}
                    style={{ 
                      padding: '6px 12px', 
                      fontSize: '14px',
                      background: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      marginTop: '8px'
                    }}
                  >
                    📋 Copy Join Link
                  </button>
                </div>
                <div style={{ 
                  padding: '10px', 
                  backgroundColor: 'white', 
                  borderRadius: '8px',
                  border: '1px solid #ddd'
                }}>
                  <QRCodeSVG 
                    value={`${window.location.origin}?room=${currentRoom.roomId}&password=${encodeURIComponent(currentRoom.password)}`}
                    size={120}
                    level="M"
                  />
                  <p style={{ 
                    textAlign: 'center', 
                    fontSize: '12px', 
                    margin: '5px 0 0 0',
                    color: '#666'
                  }}>
                    Scan to join
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={leaveRoom}
              className="btn"
              style={{ 
                background: '#e74c3c', 
                color: 'white',
                width: 'auto',
                padding: '8px 16px'
              }}
            >
              Leave Room
            </button>
          </div>
          
          <Room 
            socket={socket}
            roomId={currentRoom.roomId}
            password={currentRoom.password}
          />
        </div>
      )}
    </div>
  );
}

export default App;