import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Chat from './Chat';
import FileUploader from './FileUploader';

const Room = ({ currentRoom, setCurrentRoom }) => {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('user-joined', (data) => {
      setUsers(data.users);
    });

    newSocket.on('user-left', (userId) => {
      setUsers(prev => prev.filter(id => id !== userId));
    });

    return () => newSocket.close();
  }, []);

  const createRoom = () => {
    if (socket) {
      socket.emit('create-room', password, (newRoomId) => {
        setRoomId(newRoomId);
        setIsInRoom(true);
        setCurrentRoom(newRoomId);
      });
    }
  };

  const joinRoom = () => {
    if (socket) {
      socket.emit('join-room', roomId, password, (response) => {
        if (response.success) {
          setIsInRoom(true);
          setUsers(response.users);
          setCurrentRoom(roomId);
        } else {
          alert(response.message);
        }
      });
    }
  };

  if (!isInRoom) {
    return (
      <div className="room-container">
        <h1>ShareNear</h1>
        <div className="room-section">
          <input
            type="password"
            placeholder="Room Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
          <button onClick={createRoom} className="btn btn-primary">
            Create Room
          </button>
        </div>
        <div className="room-divider">or</div>
        <div className="room-section">
          <input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="input-field"
          />
          <button onClick={joinRoom} className="btn btn-secondary">
            Join Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="room-dashboard">
      <div className="room-header">
        <div className="room-info">
          <h2>Room: {currentRoom}</h2>
          <p>Connected and ready to share</p>
        </div>
        <div className="users-count">
          {users.length} user{users.length !== 1 ? 's' : ''} online
        </div>
      </div>
      <FileUploader socket={socket} roomId={currentRoom} />
      <Chat socket={socket} roomId={currentRoom} />
    </div>
  );
};

export default Room;